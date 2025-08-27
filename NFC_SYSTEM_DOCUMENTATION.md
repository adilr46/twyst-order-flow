# NFC Token System Documentation

## Overview

The Twyst order flow system uses an NFC token-based approach where customers scan NFC tags or QR codes at their table to access the menu. The system enforces strict table-based sessions and provides a seamless ordering experience.

## Database Schema

### Tables Structure

```sql
-- Physical tables in venues
CREATE TABLE public.tables (
    id UUID PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    label TEXT NOT NULL,                    -- e.g., "Table 5"
    token TEXT UNIQUE NOT NULL,             -- 32-char hex token (opaque)
    nfc_uid TEXT UNIQUE,                    -- Optional NFC tag UID
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer sessions at tables
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    table_id UUID REFERENCES tables(id),
    status session_status DEFAULT 'open',   -- 'open' | 'closed'
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Customer orders linked to sessions
CREATE TABLE public.orders (
    id UUID PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    session_id UUID REFERENCES sessions(id), -- FK to session (not direct table)
    status order_status DEFAULT 'created',   -- Status transition enforcement
    stripe_session_id TEXT,
    subtotal_cents INTEGER DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    total_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event logging for audit trail
CREATE TABLE public.event_log (
    id UUID PRIMARY KEY,
    ts TIMESTAMPTZ DEFAULT now(),
    actor TEXT,                             -- 'customer', 'staff', 'webhook', etc.
    venue_id UUID REFERENCES venues(id),
    order_id UUID REFERENCES orders(id),
    type TEXT,                              -- 'order.created', 'order.paid', etc.
    payload JSONB                           -- Event-specific data
);
```

### Enums

```sql
CREATE TYPE session_status AS ENUM ('open', 'closed');
CREATE TYPE order_status AS ENUM ('created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled');
```

## NFC Token Flow

### 1. Token Generation
- Each table has a unique 32-character hex token (128 bits entropy)
- Generated using `generate_table_token()` function
- Tokens are opaque and don't reveal table information

### 2. Customer Scan Process
```
Customer scans NFC/QR → URL: /d/{venueSlug}?t={opaqueToken}
                     ↓
            Token Resolution (server-side)
                     ↓
         Find table by token → Create/attach session
                     ↓
              Render menu for table
```

### 3. Session Management
- **One open session per table** (enforced by trigger)
- Previous open sessions are automatically closed
- Sessions track `last_seen_at` for activity monitoring
- Stale sessions (24+ hours) are automatically closed

### 4. Order Status Transitions
Legal transitions enforced by trigger:
```
created → paid → accepted → in_prep → ready → served
   ↓        ↓        ↓         ↓        ↓
cancelled ← cancelled ← cancelled ← cancelled ← cancelled
```

## Code Implementation

### Token Resolution (`src/lib/session-manager.ts`)

```typescript
export async function resolveTableToken(token: string): Promise<TableSession | null> {
  // 1. Validate token format (32-char hex)
  if (!validateToken(token)) return null;

  // 2. Find table by token
  const { data: table } = await supabase
    .from('tables')
    .select('id, label, venue_id, venues!inner(slug, name)')
    .eq('token', token)
    .maybeSingle();

  if (!table) return null;

  // 3. Close existing open sessions for this table
  await supabase
    .from('sessions')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('table_id', table.id)
    .eq('status', 'open');

  // 4. Create new session
  const { data: session } = await supabase
    .from('sessions')
    .insert({
      venue_id: table.venue_id,
      table_id: table.id,
      status: 'open',
      last_seen_at: new Date().toISOString()
    })
    .select('id')
    .single();

  return {
    sessionId: session.id,
    venue: table.venues.slug,
    venueId: table.venue_id,
    table: table.label,
    token
  };
}
```

### Session Guard (`src/components/guards/TableTokenGuard.tsx`)

```typescript
// 3-step token resolution:
// 1. Check URL for ?t= parameter
// 2. Try sessionStorage recovery
// 3. Redirect to scan-again if no token

const token = getTokenFromUrl() || getStoredSessionData()?.token;
if (!token) {
  router.replace(`/scan-again?slug=${venueSlug}&reason=missing_token`);
}
```

### Session Context (`src/contexts/SessionContext.tsx`)

```typescript
// Provides session data throughout the app
const { session, loading, error } = useSession();

// session contains:
// {
//   sessionId: string,
//   venue: string,      // venue slug
//   venueId: string,
//   table: string,      // table label
//   token: string       // opaque token
// }
```

## Database Triggers

### 1. Order Status Transitions
```sql
CREATE TRIGGER enforce_order_transitions_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION enforce_order_transitions();
```

### 2. One Open Session Per Table
```sql
CREATE TRIGGER enforce_one_open_session_trigger
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_one_open_session_per_table();
```

### 3. Automatic Timestamps
```sql
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_last_seen
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_seen();
```

## API Endpoints

### `/api/checkout`
- Validates order status is 'created'
- Creates Stripe checkout session
- Stores session metadata for webhook processing

### `/api/stripe-webhook`
- Verifies Stripe webhook signatures
- Deduplicates events using `stripe_events` table
- Updates order status to 'paid' on successful payment
- Logs events to `event_log`

## Security Features

1. **Opaque Tokens**: Table tokens don't reveal venue/table information
2. **Server-side Resolution**: Token → table mapping happens server-side only
3. **Session Enforcement**: One active session per table maximum
4. **Status Validation**: Legal order transitions enforced at database level
5. **Webhook Deduplication**: Prevents duplicate payment processing
6. **Activity Tracking**: Sessions track last activity for cleanup

## Performance Optimizations

- Indexed token lookups: `idx_tables_token`
- Session queries: `idx_sessions_table_status`
- Order queries: `idx_orders_session_status`
- Venue queries: `idx_venues_slug`
- Event log queries: `idx_event_log_venue_type`

## Error Handling

- **Invalid Token**: Redirect to scan-again page
- **Expired Session**: Automatic cleanup and new session creation
- **Duplicate Sessions**: Automatic closure of previous sessions
- **Invalid Transitions**: Database-level rejection with error messages
- **Webhook Failures**: Comprehensive logging with retry prevention

## Monitoring & Logging

All significant events are logged to `event_log`:
- `session.opened` - New table session created
- `order.created` - Customer places order
- `checkout.initiated` - Payment process started
- `order.paid` - Payment completed (via webhook)
- `order.status_changed` - Status transitions
- `session.closed` - Session ended

This provides complete audit trail for debugging and analytics.



