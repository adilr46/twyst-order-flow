-- Check and fix session table permissions
BEGIN;

-- First, check if the table exists and has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'sessions';

-- Check existing RLS policies
SELECT polname, polcmd, polpermissive, polroles::text[], polqual::text
FROM pg_policy
WHERE polrelid = 'public.sessions'::regclass;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Sessions are viewable for venue operations" ON public.sessions;
DROP POLICY IF EXISTS "Sessions can be managed by venue owners" ON public.sessions;
DROP POLICY IF EXISTS "Service role bypass for sessions" ON public.sessions;

-- Create fresh policies
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role bypass for sessions"
ON public.sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public to view sessions
CREATE POLICY "Sessions are viewable by anyone"
ON public.sessions FOR SELECT
USING (true);

-- Allow public to create sessions
CREATE POLICY "Sessions can be created by anyone"
ON public.sessions FOR INSERT
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.sessions TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Check if we have any open sessions for our demo table
SELECT s.id, s.status, s.opened_at, t.label, t.token
FROM public.sessions s
JOIN public.tables t ON s.table_id = t.id
WHERE t.token = 'demo123'
ORDER BY s.opened_at DESC;

COMMIT;

