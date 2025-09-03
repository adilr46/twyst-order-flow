-- Fix service role permissions for order creation
BEGIN;

-- Grant table permissions
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;
GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.items TO service_role;
GRANT ALL ON public.venues TO service_role;
GRANT ALL ON public.event_log TO service_role;

-- Grant sequence permissions (needed for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant function execution
GRANT EXECUTE ON FUNCTION public.create_order_atomic TO service_role;

-- Ensure RLS is bypassed for service role
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.venues FORCE ROW LEVEL SECURITY;
ALTER TABLE public.event_log FORCE ROW LEVEL SECURITY;

-- Create service role bypass policies
CREATE POLICY "Service role bypass for orders"
ON public.orders FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass for order_items"
ON public.order_items FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass for sessions"
ON public.sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass for items"
ON public.items FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass for venues"
ON public.venues FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass for event_log"
ON public.event_log FOR ALL TO service_role
USING (true) WITH CHECK (true);

COMMIT;

