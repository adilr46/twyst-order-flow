-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.enforce_one_open_session_per_table()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's already an open session for this table
    IF NEW.status = 'open' AND EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE table_id = NEW.table_id 
        AND status = 'open' 
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'Table already has an open session';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Clear existing data
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.sessions;
DELETE FROM public.items;
DELETE FROM public.tables;
DELETE FROM public.venues;

-- Seed data: Create demo venue
INSERT INTO public.venues (slug, name, currency, timezone) VALUES
('demo-cafe', 'Blue Door Café', 'GBP', 'Europe/London');

-- Get the venue ID for reference
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
)
-- Seed data: Create 6 tables (A1-C2) with random tokens
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
) AS table_data(label, token);

-- Seed data: Create 12 menu items (coffee/pastry/sandwich/salad)
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
)
INSERT INTO public.items (venue_id, name, description, price_cents, is_active)
SELECT 
  venue_data.venue_id,
  item_data.name,
  item_data.description,
  item_data.price_cents,
  true
FROM venue_data,
(VALUES 
  -- Coffee items
  ('Espresso', 'Rich, full-bodied espresso shot', 280),
  ('Cappuccino', 'Espresso with steamed milk and foam', 380),
  ('Flat White', 'Double espresso with microfoam milk', 420),
  
  -- Pastry items
  ('Croissant', 'Buttery, flaky French pastry', 320),
  ('Blueberry Muffin', 'Fresh blueberries in vanilla muffin', 380),
  ('Danish Pastry', 'Sweet pastry with fruit filling', 420),
  
  -- Sandwich items
  ('Club Sandwich', 'Triple-decker with turkey, bacon, lettuce', 850),
  ('Grilled Cheese', 'Melted cheese on sourdough bread', 680),
  ('BLT', 'Bacon, lettuce, tomato on toasted bread', 720),
  
  -- Salad items
  ('Caesar Salad', 'Romaine lettuce with caesar dressing', 780),
  ('Garden Salad', 'Mixed greens with seasonal vegetables', 650),
  ('Greek Salad', 'Feta, olives, tomatoes, cucumber', 820)
) AS item_data(name, description, price_cents);