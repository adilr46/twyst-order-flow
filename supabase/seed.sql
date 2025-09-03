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
INSERT INTO venues (id, name, slug, currency, timezone) VALUES
('11111111-1111-1111-1111-111111111111', 'Blue Door Café', 'demo-cafe', 'GBP', 'Europe/London');

-- Insert tables
INSERT INTO tables (id, venue_id, label, token, nfc_uid) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'A1', 'demo123', 'nfc-a1-uid'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'A2', 'demo456', 'nfc-a2-uid'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'B1', 'demo789', 'nfc-b1-uid'),
('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'B2', 'table-b2-demo-token', 'nfc-b2-uid');

-- Insert active sessions
INSERT INTO sessions (id, venue_id, table_id, status, opened_at) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'open', NOW() - INTERVAL '1 hour'),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'open', NOW() - INTERVAL '30 minutes'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 'open', NOW() - INTERVAL '45 minutes');

-- Insert menu items
INSERT INTO items (id, venue_id, name, description, price_cents, category, is_active) VALUES
-- Coffee
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Espresso', 'Rich, full-bodied espresso shot', 250, 'drinks', true),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Cappuccino', 'Espresso with steamed milk and foam', 450, 'drinks', true),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Latte', 'Espresso with steamed milk and light foam', 475, 'drinks', true),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Americano', 'Espresso with hot water', 325, 'drinks', true),
('44444444-4444-4444-4444-444444444445', '11111111-1111-1111-1111-111111111111', 'Green Tea', 'Premium sencha green tea', 300, 'drinks', true),

-- Pastries
('44444444-4444-4444-4444-444444444446', '11111111-1111-1111-1111-111111111111', 'Croissant', 'Buttery, flaky French pastry', 320, 'pastries', true),
('44444444-4444-4444-4444-444444444447', '11111111-1111-1111-1111-111111111111', 'Blueberry Muffin', 'Fresh baked with wild blueberries', 380, 'pastries', true),
('44444444-4444-4444-4444-444444444448', '11111111-1111-1111-1111-111111111111', 'Chocolate Chip Cookie', 'Warm, gooey, made fresh daily', 280, 'pastries', true),

-- Food
('44444444-4444-4444-4444-444444444450', '11111111-1111-1111-1111-111111111111', 'Avocado Toast', 'Sourdough with smashed avocado, lime, chili', 850, 'food', true),
('44444444-4444-4444-4444-444444444451', '11111111-1111-1111-1111-111111111111', 'Club Sandwich', 'Triple-decker with turkey, bacon, lettuce, tomato', 1200, 'food', true),
('44444444-4444-4444-4444-444444444452', '11111111-1111-1111-1111-111111111111', 'Caesar Salad', 'Romaine, parmesan, croutons, caesar dressing', 950, 'food', true),
('44444444-4444-4444-4444-444444444453', '11111111-1111-1111-1111-111111111111', 'Quinoa Bowl', 'Quinoa, roasted vegetables, tahini dressing', 1100, 'food', true);

-- Basic setup complete - venue, tables, sessions, and menu items are ready for testing



