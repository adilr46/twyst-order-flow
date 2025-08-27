-- Create sample table tokens for demo-restaurant and demo-cafe
UPDATE public.tables 
SET token = 'demo-table-' || label || '-' || EXTRACT(EPOCH FROM now())::text
WHERE venue_id IN (SELECT id FROM public.venues WHERE slug IN ('demo-restaurant', 'demo-cafe'));