-- Add sample menu items for demo-cafe
WITH venue_data AS (
  SELECT id as venue_id FROM public.venues WHERE slug = 'demo-cafe'
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
  ('Flat White', 'Rich espresso with steamed milk and microfoam', 420, 'drinks', null),
  ('Cappuccino', 'Traditional Italian coffee with espresso, steamed milk and foam', 380, 'drinks', null),
  ('Iced Latte', 'Smooth espresso with cold milk over ice', 450, 'drinks', null),
  ('Fresh Croissant', 'Buttery, flaky pastry baked fresh daily', 320, 'appetizers', null),
  ('Avocado Toast', 'Smashed avocado on sourdough with lime and sea salt', 890, 'appetizers', null),
  ('Club Sandwich', 'Triple-decker with chicken, bacon, lettuce, tomato and mayo', 1250, 'mains', null),
  ('Caesar Salad', 'Crisp romaine with parmesan, croutons and caesar dressing', 980, 'mains', null),
  ('Fish & Chips', 'Beer-battered cod with hand-cut chips and mushy peas', 1580, 'mains', null),
  ('Chocolate Brownie', 'Warm fudge brownie with vanilla ice cream', 680, 'desserts', null),
  ('Lemon Tart', 'Tangy lemon curd in a crisp pastry shell', 620, 'desserts', null)
) AS items(item_name, item_description, item_price_cents, item_category, item_image_url);