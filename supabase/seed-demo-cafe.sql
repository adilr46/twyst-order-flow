-- Seed demo cafe data for MVP testing

-- Insert demo venue
INSERT INTO venues (id, name, slug, currency, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Cafe', 'demo-cafe', 'GBP', now());

-- Insert demo tables
INSERT INTO tables (id, venue_id, label, token, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Table 1', 'demo123', now()),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Table 2', 'demo456', now()),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Table 3', 'demo789', now());

-- Insert demo menu items - Appetizers (5 items)
INSERT INTO menu_items (id, venue_id, name, description, price_cents, category, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Garlic Bread', 'Fresh baked bread with garlic butter and herbs', 280, 'Appetizers', true, now()),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Bruschetta', 'Toasted bread topped with tomatoes, basil, and olive oil', 320, 'Appetizers', true, now()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Soup of the Day', 'Chef''s daily soup selection', 380, 'Appetizers', true, now()),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', 'Calamari', 'Crispy fried squid with lemon aioli', 580, 'Appetizers', true, now()),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', 'Caprese Salad', 'Fresh mozzarella, tomatoes, and basil', 420, 'Appetizers', true, now());

-- Insert demo menu items - Mains (5 items)
INSERT INTO menu_items (id, venue_id, name, description, price_cents, category, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', 'Grilled Chicken Sandwich', 'Grilled chicken breast with lettuce, tomato, and mayo', 850, 'Mains', true, now()),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', 'Beef Burger', 'Angus beef patty with cheese, bacon, and special sauce', 920, 'Mains', true, now()),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', 'Caesar Salad', 'Romaine lettuce, parmesan, croutons, and caesar dressing', 680, 'Mains', true, now()),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440000', 'Pasta Carbonara', 'Spaghetti with eggs, cheese, pancetta, and black pepper', 780, 'Mains', true, now()),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440000', 'Fish & Chips', 'Beer-battered cod with crispy chips and mushy peas', 950, 'Mains', true, now());

-- Insert demo menu items - Desserts (5 items)
INSERT INTO menu_items (id, venue_id, name, description, price_cents, category, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'Chocolate Cake', 'Rich chocolate layer cake with ganache', 580, 'Desserts', true, now()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 620, 'Desserts', true, now()),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'Apple Pie', 'Warm apple pie with vanilla ice cream', 520, 'Desserts', true, now()),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440000', 'Cheesecake', 'New York style cheesecake with berry compote', 580, 'Desserts', true, now()),
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440000', 'Ice Cream Sundae', 'Three scoops with chocolate sauce and sprinkles', 480, 'Desserts', true, now());

-- Insert demo menu items - Drinks (5 items)
INSERT INTO menu_items (id, venue_id, name, description, price_cents, category, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', 'Cappuccino', 'Rich espresso with steamed milk and foam', 350, 'Drinks', true, now()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', 'Latte', 'Smooth espresso with steamed milk', 320, 'Drinks', true, now()),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', 'Americano', 'Espresso with hot water', 280, 'Drinks', true, now()),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440000', 'Hot Chocolate', 'Rich hot chocolate with whipped cream', 380, 'Drinks', true, now()),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440000', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 280, 'Drinks', true, now());
