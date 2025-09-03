-- Quick seed script to add demo-cafe for testing
-- Run this in Supabase SQL Editor

-- First, let's see what's in the venues table
SELECT * FROM venues;

-- Insert demo-cafe if it doesn't exist
INSERT INTO venues (id, name, slug, currency, timezone) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Blue Door Café', 'demo-cafe', 'GBP', 'Europe/London')
ON CONFLICT (id) DO NOTHING;

-- Insert demo tables
INSERT INTO tables (id, venue_id, label, token, nfc_uid) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'A1', 'demo123', 'nfc-a1-uid'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'A2', 'demo456', 'nfc-a2-uid'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'B1', 'demo789', 'nfc-b1-uid')
ON CONFLICT (id) DO NOTHING;

-- Insert demo menu items
INSERT INTO items (id, venue_id, name, description, price_cents, category, is_active) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Espresso', 'Rich, full-bodied espresso shot', 250, 'drinks', true),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Cappuccino', 'Espresso with steamed milk and foam', 450, 'drinks', true),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Latte', 'Espresso with steamed milk and light foam', 475, 'drinks', true),
('44444444-4444-4444-4444-444444444450', '11111111-1111-1111-1111-111111111111', 'Avocado Toast', 'Sourdough with smashed avocado, lime, chili', 850, 'food', true),
('44444444-4444-4444-4444-444444444451', '11111111-1111-1111-1111-111111111111', 'Club Sandwich', 'Triple-decker with turkey, bacon, lettuce, tomato', 1200, 'food', true)
ON CONFLICT (id) DO NOTHING;

-- Create demo sessions
INSERT INTO sessions (id, venue_id, table_id, status, opened_at) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'open', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT 'Venues' as table_name, count(*) as count FROM venues
UNION ALL
SELECT 'Tables' as table_name, count(*) as count FROM tables
UNION ALL
SELECT 'Items' as table_name, count(*) as count FROM items
UNION ALL
SELECT 'Sessions' as table_name, count(*) as count FROM sessions;
