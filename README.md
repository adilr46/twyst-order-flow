# Twyst Order Flow

A modern restaurant ordering system with real-time order management, built with Next.js, Supabase, and Stripe integration.

## Project info

**URL**: https://lovable.dev/projects/d1cfab19-d3a7-4c9a-84d3-8e5e6976f492

## Environment Variables & Secrets

This Next.js project uses both client-side and server-side environment variables for secure API key management.

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Client-side variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://zbfosmwzntckdrxrfwta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Server-side variables (not exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Supabase Edge Functions Secrets

For Supabase Edge Functions, configure these secrets in your Supabase Dashboard:

| Secret Name | Description | Where to Find |
|-------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | Supabase Dashboard > Settings > API |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | Stripe Dashboard > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard > Webhooks > Endpoint |

### Setting Up Secrets

1. Navigate to your Supabase project dashboard
2. Go to Edge Functions > Settings > Secrets
3. Add each required secret with the appropriate value
4. Secrets are automatically available in Edge Functions via `Deno.env.get()`

## Database Setup

### Running Migrations

The project includes SQL migrations in the `supabase/migrations/` directory:

```bash
# Reset database (drops all data and reapplies migrations)
pnpm run supabase:reset

# Push local migrations to remote database
pnpm run supabase:push

# Or apply migrations manually via Supabase Dashboard > SQL Editor
# Copy and run each migration file in chronological order
```

### Database Schema

The system includes these main tables:
- `venues` - Restaurant/venue information
- `tables` - Physical tables with QR codes
- `sessions` - Active dining sessions
- `items` - Menu items
- `orders` - Customer orders
- `order_items` - Individual items within orders
- `event_log` - System activity tracking
- `stripe_events` - Webhook event tracking

### Seeding Test Data

For development, you can seed test data through the Supabase Dashboard:

1. Navigate to Table Editor
2. Create a test venue in the `venues` table
3. Add test tables in the `tables` table with unique tokens
4. Add sample menu items in the `items` table

## Pilot Launch Checklist

### Pre-Launch Setup
- [ ] Configure all Supabase secrets
- [ ] Verify Stripe integration (test mode)
- [ ] Set up webhook endpoints
- [ ] Create venue and table records
- [ ] Add menu items with correct pricing

### Core Functionality Tests

#### 1. Three Test Orders Flow
- [ ] **Order 1**: Single item, table service
  - Scan QR code → Browse menu → Add item → Place order
  - Verify order appears in FOH dashboard
  - Test status progression: Paid → Accepted → In‑Prep → Ready → Served
- [ ] **Order 2**: Multiple items with special instructions
  - Add 3+ different items with notes
  - Verify items display correctly in FOH popover
- [ ] **Order 3**: Large order simulation
  - 5+ items, mixed categories
  - Test payment processing end-to-end

#### 2. FOH Dashboard Verification
- [ ] Real-time order updates without refresh
- [ ] Status transitions work correctly
- [ ] Keyboard shortcuts (A/P/R/S) function
- [ ] Items popover shows correct details
- [ ] Connection status indicator works
- [ ] Auto-polling fallback activates after 15s

#### 3. Table Management
- [ ] Each table has unique QR code/token
- [ ] Session isolation (orders go to correct table)
- [ ] Multiple orders per table session
- [ ] Table labels display correctly in FOH

#### 4. Chaos Testing
- [ ] **Network interruption**: Disconnect WiFi mid-order
  - Verify graceful reconnection
  - Check "Reconnected" toast appears
  - Confirm no data loss
- [ ] **Rapid status changes**: Update order status quickly
  - Test race conditions
  - Verify final state consistency
- [ ] **Concurrent orders**: Place multiple orders simultaneously
  - Different tables, same table
  - Verify proper order isolation
- [ ] **Payment failures**: Test Stripe error scenarios
  - Declined cards, expired cards
  - Verify proper error messaging
- [ ] **Edge cases**: Empty cart, invalid sessions
  - Boundary condition testing

### Performance & UX
- [ ] Page load times < 3 seconds
- [ ] Mobile responsiveness on all pages
- [ ] Keyboard navigation works
- [ ] Toast notifications appear appropriately
- [ ] Loading states display correctly

### Production Readiness
- [ ] Switch Stripe to live mode
- [ ] Configure production webhook URLs
- [ ] Set up monitoring/alerting
- [ ] Train staff on FOH dashboard
- [ ] Create operational runbook

## Development Workflow

### Stripe Webhook Testing

To test Stripe webhooks locally:

```bash
# Install Stripe CLI and login
stripe login

# Forward webhooks to local Next.js API route
pnpm run stripe:listen

# This will output a webhook signing secret - add it to your .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Local Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm run dev

# Run type checking
pnpm run type-check

# Run linting
pnpm run lint
```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d1cfab19-d3a7-4c9a-84d3-8e5e6976f492) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & pnpm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
pnpm install

# Step 4: Start the development server with auto-reloading and an instant preview.
pnpm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Next.js 15 (App Router)
- TypeScript
- React 18
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)
- Stripe (Payments)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d1cfab19-d3a7-4c9a-84d3-8e5e6976f492) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
