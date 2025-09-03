-- Fix table permissions for Edge Function
BEGIN;

-- Grant permissions to service role
GRANT ALL ON public.tables TO service_role;
GRANT ALL ON public.venues TO service_role;
GRANT ALL ON public.sessions TO service_role;

-- Ensure RLS is enabled but service role can bypass
ALTER TABLE public.tables FORCE ROW LEVEL SECURITY;
ALTER TABLE public.venues FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role bypass for tables" ON public.tables;
DROP POLICY IF EXISTS "Service role bypass for venues" ON public.venues;
DROP POLICY IF EXISTS "Service role bypass for sessions" ON public.sessions;

-- Create bypass policies for service role
CREATE POLICY "Service role bypass for tables"
ON public.tables FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass for venues"
ON public.venues FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass for sessions"
ON public.sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create public read policies
CREATE POLICY "Tables are viewable by everyone"
ON public.tables FOR SELECT
USING (true);

CREATE POLICY "Venues are viewable by everyone"
ON public.venues FOR SELECT
USING (true);

CREATE POLICY "Sessions are viewable by everyone"
ON public.sessions FOR SELECT
USING (true);

-- Verify the demo table exists
SELECT t.id, t.label, t.token, v.slug as venue_slug
FROM public.tables t
JOIN public.venues v ON t.venue_id = v.id
WHERE t.token = 'demo123';

COMMIT;

