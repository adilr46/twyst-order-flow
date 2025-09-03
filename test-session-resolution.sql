-- Test the complete session resolution flow
BEGIN;

-- 1. Check if the table exists with correct venue
WITH venue_check AS (
  SELECT v.id as venue_id, v.slug, t.id as table_id, t.label, t.token
  FROM public.venues v
  JOIN public.tables t ON t.venue_id = v.id
  WHERE t.token = 'demo123'
)
SELECT * FROM venue_check;

-- 2. Try to create a test session
WITH venue_data AS (
  SELECT v.id as venue_id, t.id as table_id
  FROM public.venues v
  JOIN public.tables t ON t.venue_id = v.id
  WHERE t.token = 'demo123'
)
INSERT INTO public.sessions (venue_id, table_id, status)
SELECT venue_id, table_id, 'open'
FROM venue_data
RETURNING id, venue_id, table_id, status, opened_at;

-- 3. Check all sessions for this table
WITH table_data AS (
  SELECT t.id as table_id
  FROM public.tables t
  WHERE t.token = 'demo123'
)
SELECT s.id, s.status, s.opened_at, s.closed_at
FROM public.sessions s
JOIN table_data t ON s.table_id = t.table_id
ORDER BY s.opened_at DESC;

ROLLBACK; -- Use ROLLBACK to not actually create the test session

