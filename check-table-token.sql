-- Check if the demo table token exists
SELECT t.id, t.label, t.token, v.name, v.slug
FROM public.tables t
JOIN public.venues v ON t.venue_id = v.id
WHERE t.token = 'demo123';

