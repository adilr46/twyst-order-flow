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
  SELECT s.id as session_id, s.venue_id, t.label as table_label
  FROM public.sessions s
  JOIN public.tables t ON s.table_id = t.id
  WHERE s.venue_id = (SELECT venue_id FROM venue_data)
  ORDER BY t.label
)
INSERT INTO public.orders (venue_id, session_id, status, total_cents, subtotal_cents, tax_cents)
SELECT 
  session_data.venue_id,
  session_data.session_id,
  order_data.status::order_status,
  order_data.total_cents,
  order_data.subtotal_cents,
  order_data.tax_cents
FROM session_data,
(VALUES 
  ('paid', 1250, 1150, 100),
  ('accepted', 1580, 1450, 130),
  ('in_prep', 980, 900, 80)
) AS order_data(status, total_cents, subtotal_cents, tax_cents)
LIMIT 3;

-- Add some order items to make the orders more realistic
WITH order_data AS (
  SELECT o.id as order_id FROM public.orders o LIMIT 3
),
item_data AS (
  SELECT i.id as item_id, i.price_cents 
  FROM public.items i 
  WHERE i.venue_id = (SELECT id FROM public.venues WHERE slug = 'demo-cafe')
  ORDER BY i.name
  LIMIT 9
)
INSERT INTO public.order_items (order_id, item_id, qty, unit_price_cents, notes)
SELECT 
  (SELECT order_id FROM order_data OFFSET (row_number() OVER () - 1) % 3 LIMIT 1),
  item_data.item_id,
  1 + (row_number() OVER () % 2), -- qty 1 or 2
  item_data.price_cents,
  CASE 
    WHEN row_number() OVER () % 3 = 0 THEN 'Extra hot'
    WHEN row_number() OVER () % 4 = 0 THEN 'No onions'
    ELSE null
  END
FROM item_data;