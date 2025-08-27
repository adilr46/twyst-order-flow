-- Create demo-restaurant venue with sample data
INSERT INTO public.venues (slug, name, currency, timezone)
VALUES ('demo-restaurant', 'Demo Restaurant', 'GBP', 'Europe/London');

-- Create tables for demo-restaurant
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-restaurant'
)
INSERT INTO public.tables (venue_id, label, token)
SELECT 
  venue_data.venue_id,
  table_label,
  'table-' || table_label || '-' || EXTRACT(EPOCH FROM now())::text
FROM venue_data,
(VALUES ('Table 1'), ('Table 2'), ('Table 3'), ('Table 4'), ('Table 5')) AS tables(table_label);

-- Add menu items for demo-restaurant
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-restaurant'
)
INSERT INTO public.items (venue_id, name, description, price_cents, category, image_url, is_active)
SELECT 
  venue_data.venue_id,
  item_name,
  item_description,
  item_price_cents,
  item_category,
  item_image_url,
  true
FROM venue_data,
(VALUES
  ('House Burger', 'Signature beef burger with special sauce and crispy fries', 1299, 'mains', null),
  ('Caesar Salad', 'Fresh romaine lettuce with house-made caesar dressing', 899, 'appetizers', null),
  ('Grilled Salmon', 'Atlantic salmon with seasonal vegetables', 1899, 'mains', null),
  ('Craft Beer', 'Local brewery selection on tap', 599, 'drinks', null),
  ('Chocolate Cake', 'Rich chocolate cake with vanilla cream', 749, 'desserts', null),
  ('Iced Coffee', 'Cold brew coffee with your choice of milk', 449, 'drinks', null),
  ('Chicken Wings', 'Buffalo wings with blue cheese dip', 1099, 'appetizers', null),
  ('Pasta Carbonara', 'Traditional Italian carbonara with pancetta', 1399, 'mains', null)
) AS items(item_name, item_description, item_price_cents, item_category, item_image_url);

-- Create sample sessions for demo-restaurant
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-restaurant'
),
table_data AS (
  SELECT id as table_id, label FROM public.tables 
  WHERE venue_id = (SELECT venue_id FROM venue_data)
  ORDER BY label
  LIMIT 3
)
INSERT INTO public.sessions (venue_id, table_id, status)
SELECT venue_data.venue_id, table_data.table_id, 'open'
FROM venue_data, table_data;

-- Create sample orders for demo-restaurant
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-restaurant'
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
    ELSE 'ready'::order_status
  END,
  CASE 
    WHEN session_data.rn = 1 THEN 1599
    WHEN session_data.rn = 2 THEN 2299
    ELSE 1399
  END,
  CASE 
    WHEN session_data.rn = 1 THEN 1450
    WHEN session_data.rn = 2 THEN 2099
    ELSE 1299
  END,
  CASE 
    WHEN session_data.rn = 1 THEN 149
    WHEN session_data.rn = 2 THEN 200
    ELSE 100
  END
FROM session_data;