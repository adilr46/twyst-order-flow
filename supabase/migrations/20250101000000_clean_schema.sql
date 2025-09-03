-- Clean Twyst Schema - Simplified for Pilot
-- Removes redundant tables: event_log, processed_webhook_events, stripe_events
-- Proper foreign key relationships

-- Drop redundant tables if they exist
DROP TABLE IF EXISTS public.event_log CASCADE;
DROP TABLE IF EXISTS public.processed_webhook_events CASCADE;
DROP TABLE IF EXISTS public.stripe_events CASCADE;

-- Drop existing tables to recreate with proper foreign keys
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;

-- Drop enums to recreate
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;

-- Drop existing functions to recreate with different signatures
DROP FUNCTION IF EXISTS upsert_daily_metrics();
DROP FUNCTION IF EXISTS aggregate_all_venues_daily();
DROP FUNCTION IF EXISTS increment_stripe_event_attempts(TEXT, INTEGER);
DROP FUNCTION IF EXISTS recover_stuck_order(UUID, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS cleanup_stale_sessions();

-- Create enums
CREATE TYPE order_status AS ENUM ('created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled');
CREATE TYPE session_status AS ENUM ('open', 'closed');

-- Core tables with proper foreign keys
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'GBP',
    timezone TEXT DEFAULT 'Europe/London',
    stripe_account_id TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    nfc_uid TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    status session_status DEFAULT 'open',
    opened_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    status order_status DEFAULT 'created',
    payment_status TEXT DEFAULT 'pending',
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    tax_rate_bps INTEGER DEFAULT 2000,
    service_fee_cents INTEGER DEFAULT 0,
    service_fee_bps INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'GBP',
    payment_provider TEXT DEFAULT 'stripe',
    provider_session_id TEXT,
    provider_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal_cents INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_venues_slug ON public.venues(slug);
CREATE INDEX idx_tables_token ON public.tables(token);
CREATE INDEX idx_tables_venue_id ON public.tables(venue_id);
CREATE INDEX idx_items_venue_id ON public.items(venue_id);
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_sessions_table_id ON public.sessions(table_id);
CREATE INDEX idx_sessions_venue_id ON public.sessions(venue_id);
CREATE INDEX idx_orders_session_id ON public.orders(session_id);
CREATE INDEX idx_orders_venue_id ON public.orders(venue_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_item_id ON public.order_items(item_id);

-- Disable RLS for pilot (enable later for production)
ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- Grant comprehensive permissions to anon role for all checkout flow operations
-- This covers: Edge Functions, API routes, client-side operations

-- Table permissions (SELECT, INSERT, UPDATE, DELETE)
GRANT ALL ON public.venues TO anon;
GRANT ALL ON public.tables TO anon;
GRANT ALL ON public.items TO anon;
GRANT ALL ON public.sessions TO anon;
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.order_items TO anon;

-- Sequence permissions (for auto-incrementing IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Function permissions (for Edge Functions)
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Schema permissions (for general access)
GRANT USAGE ON SCHEMA public TO anon;

-- Specific permissions for checkout flow operations:

-- 1. Venue lookup by slug (for menu display)
GRANT SELECT ON public.venues TO anon;

-- 2. Items lookup by venue (for menu display)
GRANT SELECT ON public.items TO anon;

-- 3. Session resolution (for table tokens)
GRANT SELECT ON public.sessions TO anon;
GRANT SELECT ON public.tables TO anon;

-- 4. Order creation (Edge Function)
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;

-- 5. Order lookup (for checkout API)
GRANT SELECT ON public.orders TO anon;

-- 6. Order status updates (for webhooks and FOH)
GRANT UPDATE ON public.orders TO anon;

-- 7. FOH order listing
GRANT SELECT ON public.order_items TO anon;

-- Create stub RPC functions (for cron jobs that reference them)
CREATE OR REPLACE FUNCTION upsert_daily_metrics()
RETURNS void AS $$
BEGIN
  -- Stub function for cron jobs
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aggregate_all_venues_daily()
RETURNS void AS $$
BEGIN
  -- Stub function for cron jobs
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_stripe_event_attempts(event_id TEXT, increment_by INTEGER)
RETURNS void AS $$
BEGIN
  -- Stub function for cron jobs
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recover_stuck_order(order_id UUID, stripe_session_id TEXT, stripe_payment_status TEXT, stripe_amount_total INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Stub function for cron jobs
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
BEGIN
  -- Stub function for cron jobs
  NULL;
END;
$$ LANGUAGE plpgsql;
