-- Drop existing order_status enum if it exists
DROP TYPE IF EXISTS order_status CASCADE;

-- Create enums using DO blocks for idempotency
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create order_status enum with correct values including 'created'
CREATE TYPE order_status AS ENUM ('created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled');

-- Drop existing tables that conflict (if any) and recreate with new schema
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;

-- Create venues table
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'GBP',
    timezone TEXT DEFAULT 'Europe/London',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tables table (physical tables in venue)
CREATE TABLE public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    nfc_uid TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create items table (menu items)
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    status session_status DEFAULT 'open',
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ NULL
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    status order_status DEFAULT 'created',
    subtotal_cents INTEGER DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    total_cents INTEGER DEFAULT 0,
    tax_rate_bps INTEGER DEFAULT 0,
    service_fee_bps INTEGER DEFAULT 0,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_price_cents INTEGER NOT NULL,
    notes TEXT,
    options_json JSONB DEFAULT '[]'
);

-- Create stripe_events table
CREATE TABLE public.stripe_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ NULL
);

-- Create event_log table
CREATE TABLE public.event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ts TIMESTAMPTZ DEFAULT now(),
    actor TEXT,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    type TEXT,
    payload JSONB
);

-- Create indexes for performance
CREATE INDEX idx_venues_slug ON public.venues(slug);
CREATE INDEX idx_items_venue_active ON public.items(venue_id, is_active);
CREATE INDEX idx_orders_venue_status_created ON public.orders(venue_id, status, created_at DESC);
CREATE INDEX idx_sessions_venue_table_status ON public.sessions(venue_id, table_id, status);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Venues: owners/staff can read/write their venue data
CREATE POLICY "Venues are viewable by everyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Venues can be managed by owners" ON public.venues FOR ALL USING (owner_id = auth.uid());

-- Tables: owners/staff can manage their venue's tables
CREATE POLICY "Tables are viewable for venue data" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Tables can be managed by venue owners" ON public.tables FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Items: diners can select active items, owners can manage
CREATE POLICY "Active items are viewable by everyone" ON public.items FOR SELECT USING (is_active = true);
CREATE POLICY "Items can be managed by venue owners" ON public.items FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Sessions: owners can manage, customers can view their sessions
CREATE POLICY "Sessions are viewable for venue operations" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Sessions can be managed by venue owners" ON public.sessions FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Orders: owners can manage their venue orders, customers can view their orders
CREATE POLICY "Orders are viewable for venue operations" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders can be inserted by everyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders can be updated by venue owners" ON public.orders FOR UPDATE USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Order items: linked to order permissions
CREATE POLICY "Order items are viewable with orders" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Order items can be inserted with orders" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items can be updated by venue owners" ON public.order_items FOR UPDATE USING (
    order_id IN (
        SELECT o.id FROM public.orders o 
        JOIN public.venues v ON o.venue_id = v.id 
        WHERE v.owner_id = auth.uid()
    )
);

-- Event log: venue owners can view their events
CREATE POLICY "Event log viewable by venue owners" ON public.event_log FOR SELECT USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);
CREATE POLICY "Event log can be inserted by everyone" ON public.event_log FOR INSERT WITH CHECK (true);

-- Trigger to enforce one open session per table
CREATE OR REPLACE FUNCTION public.enforce_one_open_session_per_table()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's already an open session for this table
    IF NEW.status = 'open' AND EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE table_id = NEW.table_id 
        AND status = 'open' 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'Table already has an open session';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_one_open_session
    BEFORE INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.enforce_one_open_session_per_table();