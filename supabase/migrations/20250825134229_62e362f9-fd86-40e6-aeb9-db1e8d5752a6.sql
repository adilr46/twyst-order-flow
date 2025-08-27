-- Create sample sessions and orders for demo
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
),
table_data AS (
  SELECT id as table_id, label FROM public.tables 
  WHERE venue_id = (SELECT venue_id FROM venue_data)
  ORDER BY label
  LIMIT 3
)
-- Create sample sessions for 3 tables
INSERT INTO public.sessions (venue_id, table_id, status)
SELECT venue_data.venue_id, table_data.table_id, 'open'
FROM venue_data, table_data;

-- Create sample orders with different statuses
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
),
session_data AS (
  SELECT s.id as session_id, s.venue_id, t.label as table_label,
         ROW_NUMBER() OVER (ORDER BY t.label) as rn
  FROM public.sessions s
  JOIN public.tables t ON s.table_id = t.id
  WHERE s.venue_id = (SELECT venue_id FROM venue_data)
  ORDER BY t.label
)
INSERT INTO public.orders (venue_id, session_id, status, total_cents, subtotal_cents, tax_cents)
SELECT 
  session_data.venue_id,
  session_data.session_id,
  CASE 
    WHEN session_data.rn = 1 THEN 'paid'::order_status
    WHEN session_data.rn = 2 THEN 'accepted'::order_status
    ELSE 'in_prep'::order_status
  END,
  CASE 
    WHEN session_data.rn = 1 THEN 1250
    WHEN session_data.rn = 2 THEN 1580
    ELSE 980
  END,
  CASE 
    WHEN session_data.rn = 1 THEN 1150
    WHEN session_data.rn = 2 THEN 1450
    ELSE 900
  END,
  CASE 
    WHEN session_data.rn = 1 THEN 100
    WHEN session_data.rn = 2 THEN 130
    ELSE 80
  END
FROM session_data;