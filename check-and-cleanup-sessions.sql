-- Check and clean up sessions
BEGIN;

-- First, let's see what sessions exist
SELECT 
    s.id as session_id,
    s.status,
    s.opened_at,
    s.closed_at,
    t.token as table_token,
    t.label as table_label,
    v.slug as venue_slug
FROM public.sessions s
JOIN public.tables t ON s.table_id = t.id
JOIN public.venues v ON s.venue_id = v.id
WHERE t.token = 'demo123'
ORDER BY s.opened_at DESC;

-- Close any open sessions that are older than 24 hours
UPDATE public.sessions s
SET 
    status = 'closed',
    closed_at = NOW()
FROM public.tables t
WHERE s.table_id = t.id
AND t.token = 'demo123'
AND s.status = 'open'
AND s.opened_at < NOW() - INTERVAL '24 hours';

-- Show sessions after cleanup
SELECT 
    s.id as session_id,
    s.status,
    s.opened_at,
    s.closed_at,
    t.token as table_token,
    t.label as table_label,
    v.slug as venue_slug
FROM public.sessions s
JOIN public.tables t ON s.table_id = t.id
JOIN public.venues v ON s.venue_id = v.id
WHERE t.token = 'demo123'
ORDER BY s.opened_at DESC;

COMMIT;

