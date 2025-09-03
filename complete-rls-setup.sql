-- Complete RLS setup for all tables
BEGIN;

-- 1. venues table (already done but included for completeness)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;
DROP POLICY IF EXISTS "Service role can manage venues" ON public.venues;
CREATE POLICY "Venues are viewable by everyone" ON public.venues FOR SELECT USING (true);
CREATE POLICY "Service role can manage venues" ON public.venues FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. items table (menu items)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active items are viewable by everyone" ON public.items;
DROP POLICY IF EXISTS "Service role can manage items" ON public.items;
CREATE POLICY "Active items are viewable by everyone" ON public.items FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage items" ON public.items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. tables table
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tables are viewable by everyone" ON public.tables;
DROP POLICY IF EXISTS "Service role can manage tables" ON public.tables;
CREATE POLICY "Tables are viewable by everyone" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Service role can manage tables" ON public.tables FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions are viewable by token" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.sessions;
CREATE POLICY "Sessions are viewable by token" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Service role can manage sessions" ON public.sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orders are viewable by session" ON public.orders;
DROP POLICY IF EXISTS "Orders can be created by anyone" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
CREATE POLICY "Orders are viewable by session" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders can be created by anyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage orders" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items are viewable with orders" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be created with orders" ON public.order_items;
DROP POLICY IF EXISTS "Service role can manage order items" ON public.order_items;
CREATE POLICY "Order items are viewable with orders" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Order items can be created with orders" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage order items" ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. event_log table
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Event log is viewable by venue" ON public.event_log;
DROP POLICY IF EXISTS "Event log can be created by anyone" ON public.event_log;
DROP POLICY IF EXISTS "Service role can manage event log" ON public.event_log;
CREATE POLICY "Event log is viewable by venue" ON public.event_log FOR SELECT USING (true);
CREATE POLICY "Event log can be created by anyone" ON public.event_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage event log" ON public.event_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. processed_webhook_events table
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.processed_webhook_events;
CREATE POLICY "Service role can manage webhook events" ON public.processed_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant necessary permissions to service role for all tables
GRANT ALL ON public.venues TO service_role;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.tables TO service_role;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.event_log TO service_role;
GRANT ALL ON public.processed_webhook_events TO service_role;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure public schema access
GRANT USAGE ON SCHEMA public TO service_role;

COMMIT;

