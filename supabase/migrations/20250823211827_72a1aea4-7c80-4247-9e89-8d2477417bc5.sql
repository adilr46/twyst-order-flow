-- Insert sample venue data
INSERT INTO public.venues (slug, name, description, categories) VALUES
('demo-restaurant', 'Demo Restaurant', 'A sample restaurant for testing the Twyst ordering system', ARRAY['Appetizers', 'Main Courses', 'Desserts', 'Beverages']);

-- Get the venue ID for menu items
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-restaurant'
)
-- Insert sample menu items
INSERT INTO public.menu_items (venue_id, name, description, price, category, available, dietary) 
SELECT 
  venue_data.venue_id,
  menu_item.name,
  menu_item.description,
  menu_item.price,
  menu_item.category,
  menu_item.available,
  menu_item.dietary
FROM venue_data,
(VALUES 
  ('Truffle Arancini', 'Crispy risotto balls stuffed with truffle and parmesan', 18.50, 'Appetizers', true, ARRAY['vegetarian']),
  ('Burrata Caprese', 'Fresh burrata with heirloom tomatoes and basil oil', 16.00, 'Appetizers', true, ARRAY['vegetarian', 'gluten-free']),
  ('Grilled Octopus', 'Mediterranean-style grilled octopus with olive tapenade', 22.00, 'Appetizers', true, ARRAY['gluten-free']),
  ('Wagyu Ribeye', 'Premium wagyu ribeye with roasted vegetables', 68.00, 'Main Courses', true, ARRAY['gluten-free']),
  ('Pan-Seared Salmon', 'Atlantic salmon with lemon herb butter and quinoa', 32.00, 'Main Courses', true, ARRAY['gluten-free']),
  ('Wild Mushroom Risotto', 'Creamy arborio rice with seasonal wild mushrooms', 28.00, 'Main Courses', true, ARRAY['vegetarian', 'gluten-free']),
  ('Chocolate Lava Cake', 'Warm chocolate cake with molten center and vanilla ice cream', 14.00, 'Desserts', true, ARRAY['vegetarian']),
  ('Tiramisu', 'Classic Italian tiramisu with mascarpone and coffee', 12.00, 'Desserts', true, ARRAY['vegetarian']),
  ('Craft Beer Selection', 'Rotating selection of local craft beers', 8.00, 'Beverages', true, ARRAY['vegan']),
  ('House Wine', 'Red or white wine by the glass', 12.00, 'Beverages', true, ARRAY['vegan'])
) AS menu_item(name, description, price, category, available, dietary);

-- Insert a sample order
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-restaurant'
)
INSERT INTO public.orders (venue_id, table_number, customer_name, items, total_amount, status, estimated_time, notes)
SELECT 
  venue_data.venue_id,
  'Table 5',
  'John Doe',
  '[
    {
      "id": "sample-1",
      "name": "Truffle Arancini",
      "quantity": 2,
      "price": 18.50,
      "specialInstructions": "Extra crispy please"
    },
    {
      "id": "sample-2", 
      "name": "Wagyu Ribeye",
      "quantity": 1,
      "price": 68.00,
      "specialInstructions": "Medium rare"
    }
  ]'::jsonb,
  105.00,
  'preparing',
  25,
  'Customer mentioned food allergy to nuts'
FROM venue_data;