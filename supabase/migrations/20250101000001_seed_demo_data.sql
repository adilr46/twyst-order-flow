-- Seed demo data for pilot testing
-- This creates the demo-cafe venue with tables, items, and sessions

-- Insert demo venue
INSERT INTO public.venues (id, slug, name, currency, timezone) VALUES 
('11111111-1111-1111-1111-111111111111', 'demo-cafe', 'Demo Cafe', 'GBP', 'Europe/London')
ON CONFLICT (slug) DO NOTHING;

-- Insert demo tables
INSERT INTO public.tables (id, venue_id, label, token) VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Table 1', 'demo123'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Table 2', 'demo456'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Table 3', 'demo789')
ON CONFLICT (token) DO NOTHING;

-- Insert demo items
INSERT INTO public.items (id, venue_id, name, description, price_cents, category, image_url) VALUES 
('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Cappuccino', 'Rich espresso with steamed milk and foam', 350, 'Drinks', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400'),
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Latte', 'Smooth espresso with steamed milk', 320, 'Drinks', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400'),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Americano', 'Espresso with hot water', 280, 'Drinks', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'),
('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Croissant', 'Buttery French pastry', 250, 'Food', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400'),
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Sandwich', 'Fresh deli sandwich with chips', 650, 'Food', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400')
ON CONFLICT (id) DO NOTHING;

-- Insert demo session for Table 1 (demo123 token)
INSERT INTO public.sessions (id, venue_id, table_id, status, opened_at) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'open', now())
ON CONFLICT DO NOTHING;

