-- Twyst MVP Seed Data
-- This file contains sample data for testing the full-stack application

-- Clear existing data (in correct order to respect foreign keys)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM items;
DELETE FROM sessions;
DELETE FROM tables;
DELETE FROM venues;

-- Insert demo venue
INSERT INTO venues (id, name, slug, description, address, phone, email, currency, timezone, settings) VALUES
('11111111-1111-1111-1111-111111111111', 'Demo Cafe', 'demo-cafe', 'A modern cafe serving artisan coffee and fresh food', '123 Main Street, City, State 12345', '+1-555-0123', 'hello@democafe.com', 'USD', 'America/New_York', '{"tax_rate": 0.0875, "service_fee": 0.03}');

-- Insert tables
INSERT INTO tables (id, venue_id, label, token, nfc_uid, location_description) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'A1', 'table-a1-demo-token', 'nfc-a1-uid', 'Window seat, 2-person table'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'A2', 'table-a2-demo-token', 'nfc-a2-uid', 'Corner booth, 4-person table'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'B1', 'table-b1-demo-token', 'nfc-b1-uid', 'Bar seating, 2-person table'),
('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'B2', 'table-b2-demo-token', 'nfc-b2-uid', 'Patio table, 4-person table');

-- Insert active sessions
INSERT INTO sessions (id, venue_id, table_id, status, opened_at) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'open', NOW() - INTERVAL '1 hour'),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'open', NOW() - INTERVAL '30 minutes'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'open', NOW() - INTERVAL '45 minutes');

-- Insert menu items
INSERT INTO items (id, venue_id, name, description, price_cents, category, image_url, available, allergens, dietary_info, prep_time_minutes) VALUES
-- Coffee
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Espresso', 'Rich, full-bodied espresso shot', 250, 'Coffee', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 2),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Cappuccino', 'Espresso with steamed milk and foam', 450, 'Coffee', '/api/placeholder/300/200', true, '["milk"]', '["vegetarian"]', 3),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Latte', 'Espresso with steamed milk and light foam', 475, 'Coffee', '/api/placeholder/300/200', true, '["milk"]', '["vegetarian"]', 3),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Americano', 'Espresso with hot water', 325, 'Coffee', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 2),
('44444444-4444-4444-4444-444444444445', '11111111-1111-1111-1111-111111111111', 'Mocha', 'Espresso with chocolate and steamed milk', 525, 'Coffee', '/api/placeholder/300/200', true, '["milk"]', '["vegetarian"]', 4),

-- Pastries
('44444444-4444-4444-4444-444444444446', '11111111-1111-1111-1111-111111111111', 'Croissant', 'Buttery, flaky French pastry', 350, 'Pastries', '/api/placeholder/300/200', true, '["wheat", "butter", "eggs"]', '["vegetarian"]', 0),
('44444444-4444-4444-4444-444444444447', '11111111-1111-1111-1111-111111111111', 'Chocolate Croissant', 'Croissant filled with premium dark chocolate', 425, 'Pastries', '/api/placeholder/300/200', true, '["wheat", "butter", "eggs"]', '["vegetarian"]', 0),
('44444444-4444-4444-4444-444444444448', '11111111-1111-1111-1111-111111111111', 'Almond Croissant', 'Croissant with almond cream and sliced almonds', 475, 'Pastries', '/api/placeholder/300/200', true, '["wheat", "butter", "eggs", "nuts"]', '["vegetarian"]', 0),
('44444444-4444-4444-4444-444444444449', '11111111-1111-1111-1111-111111111111', 'Blueberry Muffin', 'Fresh blueberry muffin with streusel topping', 375, 'Pastries', '/api/placeholder/300/200', true, '["wheat", "eggs", "milk"]', '["vegetarian"]', 0),

-- Sandwiches
('44444444-4444-4444-4444-444444444450', '11111111-1111-1111-1111-111111111111', 'Avocado Toast', 'Multigrain bread with smashed avocado, cherry tomatoes, and everything seasoning', 850, 'Sandwiches', '/api/placeholder/300/200', true, '["wheat"]', '["vegan"]', 5),
('44444444-4444-4444-4444-444444444451', '11111111-1111-1111-1111-111111111111', 'Grilled Cheese', 'Classic grilled cheese with artisan cheddar on sourdough', 750, 'Sandwiches', '/api/placeholder/300/200', true, '["wheat", "milk"]', '["vegetarian"]', 8),
('44444444-4444-4444-4444-444444444452', '11111111-1111-1111-1111-111111111111', 'Turkey Club', 'Roasted turkey, bacon, lettuce, tomato, and mayo on toasted bread', 1250, 'Sandwiches', '/api/placeholder/300/200', true, '["wheat", "eggs"]', '[]', 10),
('44444444-4444-4444-4444-444444444453', '11111111-1111-1111-1111-111111111111', 'Veggie Wrap', 'Hummus, cucumber, sprouts, tomato, and mixed greens in a spinach wrap', 925, 'Sandwiches', '/api/placeholder/300/200', true, '["wheat"]', '["vegan"]', 5),

-- Salads
('44444444-4444-4444-4444-444444444454', '11111111-1111-1111-1111-111111111111', 'Caesar Salad', 'Crisp romaine lettuce, parmesan cheese, croutons, and house-made caesar dressing', 950, 'Salads', '/api/placeholder/300/200', true, '["wheat", "milk", "eggs", "fish"]', '["vegetarian"]', 7),
('44444444-4444-4444-4444-444444444455', '11111111-1111-1111-1111-111111111111', 'Greek Salad', 'Mixed greens, feta cheese, olives, tomatoes, cucumbers, and red onion', 875, 'Salads', '/api/placeholder/300/200', true, '["milk"]', '["vegetarian", "gluten-free"]', 5),
('44444444-4444-4444-4444-444444444456', '11111111-1111-1111-1111-111111111111', 'Quinoa Bowl', 'Quinoa with roasted vegetables, chickpeas, and tahini dressing', 1050, 'Salads', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 8),

-- Beverages
('44444444-4444-4444-4444-444444444457', '11111111-1111-1111-1111-111111111111', 'Fresh Orange Juice', 'Freshly squeezed Valencia oranges', 425, 'Beverages', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 2),
('44444444-4444-4444-4444-444444444458', '11111111-1111-1111-1111-111111111111', 'Iced Tea', 'House-brewed black tea, served chilled', 275, 'Beverages', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 1),
('44444444-4444-4444-4444-444444444459', '11111111-1111-1111-1111-111111111111', 'Sparkling Water', 'San Pellegrino sparkling mineral water', 325, 'Beverages', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 0),
('44444444-4444-4444-4444-444444444460', '11111111-1111-1111-1111-111111111111', 'Green Smoothie', 'Spinach, banana, apple, and coconut water', 575, 'Beverages', '/api/placeholder/300/200', true, '[]', '["vegan", "gluten-free"]', 3),

-- Desserts
('44444444-4444-4444-4444-444444444461', '11111111-1111-1111-1111-111111111111', 'Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream', 650, 'Desserts', '/api/placeholder/300/200', true, '["wheat", "eggs", "milk"]', '["vegetarian"]', 0),
('44444444-4444-4444-4444-444444444462', '11111111-1111-1111-1111-111111111111', 'Chocolate Brownie', 'Rich, fudgy brownie with walnuts', 525, 'Desserts', '/api/placeholder/300/200', true, '["wheat", "eggs", "milk", "nuts"]', '["vegetarian"]', 0),
('44444444-4444-4444-4444-444444444463', '11111111-1111-1111-1111-111111111111', 'Cheesecake Slice', 'New York style cheesecake with berry compote', 575, 'Desserts', '/api/placeholder/300/200', true, '["wheat", "eggs", "milk"]', '["vegetarian"]', 0);

-- Insert sample orders with different statuses
INSERT INTO orders (id, venue_id, session_id, status, total_cents, subtotal_cents, tax_cents, stripe_session_id, created_at, updated_at) VALUES
-- Recent paid order ready for acceptance
('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'paid', 1200, 1100, 100, 'cs_test_paid_1', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
-- Order being prepared
('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 'in_prep', 875, 800, 75, 'cs_test_prep_1', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes'),
-- Order ready for pickup
('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'ready', 1575, 1450, 125, 'cs_test_ready_1', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '2 minutes'),
-- Recently accepted order
('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'accepted', 650, 600, 50, 'cs_test_accepted_1', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '7 minutes');

-- Insert order items
INSERT INTO order_items (id, order_id, item_id, qty, unit_price_cents, notes) VALUES
-- Order 1 items (paid)
('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444442', 2, 450, null), -- 2x Cappuccino
('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555551', '44444444-6666-6666-6666-444444444447', 1, 425, null), -- 1x Chocolate Croissant

-- Order 2 items (in_prep)
('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444454', 1, 950, 'No croutons please'), -- 1x Caesar Salad

-- Order 3 items (ready)
('66666666-6666-6666-6666-666666666664', '55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444452', 1, 1250, null), -- 1x Turkey Club
('66666666-6666-6666-6666-666666666665', '55555555-5555-5555-5555-555555555553', '44444444-4444-4444-4444-444444444457', 1, 425, null), -- 1x Fresh Orange Juice

-- Order 4 items (accepted)
('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555554', '44444444-4444-4444-4444-444444444461', 1, 650, 'Extra cocoa powder on top'); -- 1x Tiramisu

-- Insert event log entries
INSERT INTO event_log (venue_id, order_id, type, actor, payload, ts) VALUES
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 'order.created', 'customer', '{"table": "A1", "total_cents": 1200}', NOW() - INTERVAL '5 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 'checkout.initiated', 'api', '{"stripe_session_id": "cs_test_paid_1"}', NOW() - INTERVAL '5 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555551', 'order.paid', 'stripe', '{"stripe_session_id": "cs_test_paid_1"}', NOW() - INTERVAL '5 minutes'),

('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'order.created', 'customer', '{"table": "A2", "total_cents": 875}', NOW() - INTERVAL '15 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'order.paid', 'stripe', '{"stripe_session_id": "cs_test_prep_1"}', NOW() - INTERVAL '15 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'order.accepted', 'foh', '{"staff_id": "demo-staff"}', NOW() - INTERVAL '12 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555552', 'order.in_prep', 'kitchen', '{"staff_id": "demo-kitchen"}', NOW() - INTERVAL '10 minutes'),

('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555553', 'order.created', 'customer', '{"table": "B1", "total_cents": 1575}', NOW() - INTERVAL '25 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555553', 'order.paid', 'stripe', '{"stripe_session_id": "cs_test_ready_1"}', NOW() - INTERVAL '25 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555553', 'order.accepted', 'foh', '{"staff_id": "demo-staff"}', NOW() - INTERVAL '20 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555553', 'order.in_prep', 'kitchen', '{"staff_id": "demo-kitchen"}', NOW() - INTERVAL '15 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555553', 'order.ready', 'kitchen', '{"staff_id": "demo-kitchen"}', NOW() - INTERVAL '2 minutes'),

('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555554', 'order.created', 'customer', '{"table": "A1", "total_cents": 650}', NOW() - INTERVAL '8 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555554', 'order.paid', 'stripe', '{"stripe_session_id": "cs_test_accepted_1"}', NOW() - INTERVAL '8 minutes'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555554', 'order.accepted', 'foh', '{"staff_id": "demo-staff"}', NOW() - INTERVAL '7 minutes');

-- Fix order_items references (correcting item IDs)
UPDATE order_items SET item_id = '44444444-4444-4444-4444-444444444447' WHERE id = '66666666-6666-6666-6666-666666666662';



