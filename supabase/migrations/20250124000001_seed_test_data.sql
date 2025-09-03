BEGIN;

-- Create demo venue
INSERT INTO public.venues (slug, name, currency, timezone) VALUES
('demo-cafe', 'Blue Door Café', 'GBP', 'Europe/London')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    currency = EXCLUDED.currency,
    timezone = EXCLUDED.timezone;

-- Get the venue ID for reference
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
)
-- Create 6 tables (A1–C2) with random tokens
INSERT INTO public.tables (venue_id, label, token)
SELECT 
  venue_data.venue_id,
  table_data.label,
  table_data.token
FROM venue_data,
(VALUES 
  ('A1', 'tok_' || substring(gen_random_uuid()::text, 1, 8)),
  ('A2', 'tok_' || substring(gen_random_uuid()::text, 1, 8)),
  ('B1', 'tok_' || substring(gen_random_uuid()::text, 1, 8)),
  ('B2', 'tok_' || substring(gen_random_uuid()::text, 1, 8)),
  ('C1', 'tok_' || substring(gen_random_uuid()::text, 1, 8)),
  ('C2', 'tok_' || substring(gen_random_uuid()::text, 1, 8))
) AS table_data(label, token)
ON CONFLICT (token) DO NOTHING;

-- Create menu items (coffee / pastries / food)
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
)
INSERT INTO public.items (venue_id, name, description, price_cents, category, is_active)
SELECT 
  venue_data.venue_id,
  item_data.name,
  item_data.description,
  item_data.price_cents,
  item_data.category,
  true
FROM venue_data,
(VALUES 
  ('Americano', 'Rich espresso topped with hot water', 350, 'coffee'),
  ('Cappuccino', 'Espresso with silky steamed milk and foam', 450, 'coffee'),
  ('Latte', 'Espresso mellowed with creamy steamed milk', 475, 'coffee'),
  ('Butter Croissant', 'Flaky, buttery French classic', 320, 'bakery'),
  ('Blueberry Muffin', 'Moist muffin with juicy wild blueberries', 380, 'bakery'),
  ('Avocado Toast', 'Sourdough topped with smashed avocado, lime & chili flakes', 850, 'food'),
  ('Club Sandwich', 'Turkey, bacon, lettuce & tomato on toasted bread', 1200, 'food'),
  ('Caesar Salad', 'Crisp romaine with parmesan, croutons & Caesar dressing', 950, 'food'),
  ('Chocolate Chip Cookie', 'Freshly baked, gooey chocolate chips', 280, 'bakery'),
  ('Green Tea', 'Light and refreshing Japanese sencha', 300, 'tea'),
  ('Orange Juice', 'Freshly pressed Valencia oranges', 420, 'juice'),
  ('Quinoa Bowl', 'Quinoa with roasted vegetables & tahini dressing', 1100, 'food')
) AS item_data(name, description, price_cents, category);

-- Create a test session for table A1
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
),
table_data AS (
  SELECT id as table_id FROM public.tables WHERE label = 'A1' AND venue_id = (SELECT venue_id FROM venue_data)
)
INSERT INTO public.sessions (venue_id, table_id, status)
SELECT venue_data.venue_id, table_data.table_id, 'open'
FROM venue_data, table_data
ON CONFLICT DO NOTHING;

COMMIT;