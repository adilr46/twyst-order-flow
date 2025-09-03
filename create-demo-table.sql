-- Create demo table with token
BEGIN;

-- First, get the venue ID
WITH venue AS (
  SELECT id FROM public.venues WHERE slug = 'demo-cafe'
)
INSERT INTO public.tables (venue_id, label, token)
SELECT id, 'A1', 'demo123'
FROM venue
ON CONFLICT (token) DO NOTHING;

COMMIT;

