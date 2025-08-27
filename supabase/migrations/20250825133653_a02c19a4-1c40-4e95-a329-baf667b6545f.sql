-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_venues_slug ON public.venues(slug);
CREATE INDEX IF NOT EXISTS idx_items_venue_active ON public.items(venue_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_venue_status_created ON public.orders(venue_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_venue_table_status ON public.sessions(venue_id, table_id, status);

-- Enable RLS on all tables
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
DROP POLICY IF EXISTS "Venues can be managed by owners" ON public.venues;
DROP POLICY IF EXISTS "Tables are viewable for venue data" ON public.tables;
DROP POLICY IF EXISTS "Tables can be managed by venue owners" ON public.tables;
DROP POLICY IF EXISTS "Active items are viewable by everyone" ON public.items;
DROP POLICY IF EXISTS "Items can be managed by venue owners" ON public.items;
DROP POLICY IF EXISTS "Sessions are viewable for venue operations" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be managed by venue owners" ON public.sessions;
DROP POLICY IF EXISTS "Orders are viewable for venue operations" ON public.orders;
DROP POLICY IF EXISTS "Orders can be inserted by everyone" ON public.orders;
DROP POLICY IF EXISTS "Orders can be updated by venue owners" ON public.orders;
DROP POLICY IF EXISTS "Order items are viewable with orders" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be inserted with orders" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be updated by venue owners" ON public.order_items;
DROP POLICY IF EXISTS "Event log viewable by venue owners" ON public.event_log;
DROP POLICY IF EXISTS "Event log can be inserted by everyone" ON public.event_log;

-- RLS Policies
-- Venues: everyone can view, owners can manage
CREATE POLICY "Venues are viewable by everyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Venues can be managed by owners" ON public.venues FOR ALL USING (owner_id = auth.uid());

-- Tables: everyone can view, owners can manage their venue's tables
CREATE POLICY "Tables are viewable for venue data" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Tables can be managed by venue owners" ON public.tables FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Items: diners can select active items, owners can manage
CREATE POLICY "Active items are viewable by everyone" ON public.items FOR SELECT USING (is_active = true);
CREATE POLICY "Items can be managed by venue owners" ON public.items FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Sessions: everyone can view, owners can manage
CREATE POLICY "Sessions are viewable for venue operations" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Sessions can be managed by venue owners" ON public.sessions FOR ALL USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);

-- Orders: everyone can view and insert, owners can update
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

-- Event log: venue owners can view their events, everyone can insert
CREATE POLICY "Event log viewable by venue owners" ON public.event_log FOR SELECT USING (
    venue_id IN (SELECT id FROM public.venues WHERE owner_id = auth.uid())
);
CREATE POLICY "Event log can be inserted by everyone" ON public.event_log FOR INSERT WITH CHECK (true);

-- Stripe events: service-level access only (no user policies needed)
CREATE POLICY "Stripe events are accessible by service" ON public.stripe_events FOR ALL USING (true);

-- Create or replace trigger function to enforce one open session per table
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_enforce_one_open_session ON public.sessions;
CREATE TRIGGER trigger_enforce_one_open_session
    BEFORE INSERT OR UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.enforce_one_open_session_per_table();