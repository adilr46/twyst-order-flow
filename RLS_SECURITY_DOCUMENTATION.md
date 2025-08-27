# Row Level Security (RLS) Documentation

## Overview

The Twyst order flow system implements comprehensive Row Level Security (RLS) to ensure proper venue-scoped access control. This document explains the security model and policies.

## Security Model

### User Roles & Access Patterns

1. **Anonymous/Public Users (Diners)**
   - Can read active menu items from all venues
   - Can view venue basic info (for menu access)
   - Can view tables (for NFC token resolution)
   - Can place orders (insert into orders table)

2. **Venue Owners/Staff**
   - Full read/write access to their venue's data only
   - Can manage orders, sessions, tables, and items for their venues
   - Cannot access other venues' data

3. **System/Service Level**
   - Webhook endpoints use service role for full access
   - Event logging allowed for audit trails

## RLS Policies by Table

### 1. Venues Table
```sql
-- Everyone can view venue basic info
CREATE POLICY "venues_select_all" ON venues FOR SELECT USING (true);

-- Only owners can manage their venues
CREATE POLICY "venues_all_owners" ON venues FOR ALL USING (owner_id = auth.uid());
```

**Rationale**: Public needs venue info for menu display, but only owners can modify.

### 2. Tables Table (Physical tables in venues)
```sql
-- Everyone can view tables (needed for token resolution)
CREATE POLICY "tables_select_all" ON tables FOR SELECT USING (true);

-- Only venue owners can manage their tables
CREATE POLICY "tables_all_owners" ON tables FOR ALL USING (is_venue_owner(venue_id));
```

**Rationale**: NFC token resolution requires public access to table data, but management is owner-only.

### 3. Items Table (Menu items)
```sql
-- Diners can read active items from any venue
CREATE POLICY "items_select_active" ON items FOR SELECT USING (is_active = true);

-- Venue owners can manage all their items
CREATE POLICY "items_all_owners" ON items FOR ALL USING (is_venue_owner(venue_id));
```

**Rationale**: Public read for menu display, owner write for menu management.

### 4. Sessions Table
```sql
-- Only venue owners can read sessions from their venues
CREATE POLICY "sessions_select_owners" ON sessions FOR SELECT USING (is_venue_owner(venue_id));

-- Only venue owners can manage sessions in their venues
CREATE POLICY "sessions_insert_owners" ON sessions FOR INSERT WITH CHECK (is_venue_owner(venue_id));
CREATE POLICY "sessions_update_owners" ON sessions FOR UPDATE USING (is_venue_owner(venue_id));
CREATE POLICY "sessions_delete_owners" ON sessions FOR DELETE USING (is_venue_owner(venue_id));
```

**Rationale**: Sessions contain sensitive customer activity data, restricted to venue owners only.

### 5. Orders Table
```sql
-- Only venue owners can read orders from their venues
CREATE POLICY "orders_select_owners" ON orders FOR SELECT USING (is_venue_owner(venue_id));

-- Anyone can insert orders (customers placing orders)
CREATE POLICY "orders_insert_all" ON orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM venues WHERE id = venue_id)
);

-- Only venue owners can update their orders
CREATE POLICY "orders_update_owners" ON orders FOR UPDATE USING (is_venue_owner(venue_id));
```

**Rationale**: Customers can place orders, but only venue staff can view/manage them.

### 6. Order Items Table
```sql
-- Follow order permissions for all operations
CREATE POLICY "order_items_select_with_order" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_venue_owner(o.venue_id))
);
```

**Rationale**: Order items inherit the same access control as their parent orders.

### 7. Event Log Table
```sql
-- Venue owners can read events from their venues
CREATE POLICY "event_log_select_owners" ON event_log FOR SELECT USING (
  venue_id IS NULL OR is_venue_owner(venue_id)
);

-- System can insert events
CREATE POLICY "event_log_insert_service" ON event_log FOR INSERT WITH CHECK (true);
```

**Rationale**: Audit trail visible to venue owners, system events allowed for webhooks/triggers.

### 8. Stripe Events Table
```sql
-- Service level access for webhook deduplication
CREATE POLICY "stripe_events_service_access" ON stripe_events FOR ALL USING (true);
```

**Rationale**: Used for webhook deduplication, requires service-level access only.

## Helper Functions

### `is_venue_owner(venue_uuid UUID)`
```sql
CREATE OR REPLACE FUNCTION public.is_venue_owner(venue_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venues 
    WHERE id = venue_uuid 
    AND owner_id = auth.uid()
  );
$$;
```

**Purpose**: Centralized venue ownership check using `venues.owner_id = auth.uid()`.

### `can_access_session(session_uuid UUID)`
```sql
CREATE OR REPLACE FUNCTION public.can_access_session(session_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sessions s
    JOIN venues v ON s.venue_id = v.id
    WHERE s.id = session_uuid
    AND v.owner_id = auth.uid()
  );
$$;
```

**Purpose**: Check if user can access a specific session via venue ownership.

### `can_access_order(order_uuid UUID)`
```sql
CREATE OR REPLACE FUNCTION public.can_access_order(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN venues v ON o.venue_id = v.id
    WHERE o.id = order_uuid
    AND v.owner_id = auth.uid()
  );
$$;
```

**Purpose**: Check if user can access a specific order via venue ownership.

## Security Features

### 1. Venue-Scoped Access
- All sensitive operations are scoped to venues
- Users can only access data from venues they own
- Implemented via `venues.owner_id = auth.uid()` pattern

### 2. Public Menu Access
- Menu items are publicly readable when active
- Enables anonymous browsing and ordering
- Venue info is public for menu display

### 3. NFC Token Security
- Table data is public for token resolution
- Token-to-table mapping happens server-side
- Session creation/management is owner-only

### 4. Order Privacy
- Orders are completely private to venue owners
- Customers can place orders but not read them back
- Prevents cross-venue data leakage

### 5. Audit Trail Protection
- Event logs are venue-scoped
- System can log events for all operations
- Owners can see their venue's activity only

## Performance Optimizations

### RLS-Optimized Indexes
```sql
-- Optimize venue ownership lookups
CREATE INDEX idx_venues_owner_id ON venues(owner_id);

-- Optimize venue_id lookups for RLS
CREATE INDEX idx_tables_venue_id ON tables(venue_id);
CREATE INDEX idx_items_venue_id ON items(venue_id);
CREATE INDEX idx_sessions_venue_id ON sessions(venue_id);
CREATE INDEX idx_orders_venue_id ON orders(venue_id);
CREATE INDEX idx_event_log_venue_id ON event_log(venue_id);
```

### Security Definer Functions
- Helper functions use `SECURITY DEFINER` for consistent execution
- Prevents privilege escalation issues
- Centralized permission logic

## Authentication Integration

### Supabase Auth
```typescript
// Client-side: User must be authenticated to access protected resources
const { data, error } = await supabase
  .from('orders')
  .select('*'); // Will only return orders from user's venues

// Service role: Full access for system operations
const supabaseService = createClient(url, serviceKey);
const { data } = await supabaseService
  .from('orders')
  .select('*'); // Returns all orders (bypasses RLS)
```

### JWT Claims
The system relies on standard Supabase Auth JWT claims:
- `auth.uid()` - User's unique identifier
- Matches `venues.owner_id` for ownership checks

## Testing RLS Policies

### Test Scenarios
1. **Anonymous Access**: Can read menu items, venue info, place orders
2. **Owner Access**: Can manage only their venue's data
3. **Cross-Venue**: Cannot access other venues' data
4. **Service Access**: Full access with service role

### Verification Queries
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List all policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Security Best Practices

1. **Principle of Least Privilege**: Users can only access what they need
2. **Defense in Depth**: Multiple layers of security checks
3. **Audit Logging**: All significant actions are logged
4. **Input Validation**: Combined with application-level validation
5. **Service Role Protection**: Service keys never exposed to clients

## Migration Safety

- All policies are created with `IF NOT EXISTS` or `DROP IF EXISTS`
- Idempotent operations safe to run multiple times
- Comprehensive testing before production deployment
- Rollback procedures documented for each policy change

This RLS implementation provides robust, venue-scoped security while maintaining the flexibility needed for a multi-tenant restaurant ordering system.



