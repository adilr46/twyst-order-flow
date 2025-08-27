-- Quick Database Setup for Twyst MVP
-- Run this in your Supabase SQL editor: https://app.supabase.com/project/zbfosmwzntckdrxrfwta/sql

-- Create core tables
CREATE TABLE IF NOT EXISTS venues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    address text,
    phone text,
    email text,
    currency text DEFAULT 'USD',
    timezone text DEFAULT 'UTC',
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
    label text NOT NULL,
    token text UNIQUE NOT NULL,
    nfc_uid text,
    location_description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
    table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
    status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    opened_at timestamptz DEFAULT now(),
    closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price_cents integer NOT NULL,
    category text,
    image_url text,
    available boolean DEFAULT true,
    allergens jsonb DEFAULT '[]',
    dietary_info jsonb DEFAULT '[]',
    prep_time_minutes integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
    session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
    status text DEFAULT 'created' CHECK (status IN ('created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled')),
    total_cents integer NOT NULL DEFAULT 0,
    subtotal_cents integer NOT NULL DEFAULT 0,
    tax_cents integer NOT NULL DEFAULT 0,
    stripe_session_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    item_id uuid REFERENCES items(id) ON DELETE CASCADE,
    qty integer NOT NULL DEFAULT 1,
    unit_price_cents integer NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id uuid REFERENCES venues(id) ON DELETE CASCADE,
    order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
    type text NOT NULL,
    actor text NOT NULL,
    payload jsonb DEFAULT '{}',
    ts timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_events (
    id text PRIMARY KEY,
    processed_at timestamptz DEFAULT now()
);

-- Insert demo data
INSERT INTO venues (id, name, slug, description, address, phone, email, currency, timezone, settings) VALUES
('11111111-1111-1111-1111-111111111111', 'Demo Cafe', 'demo-cafe', 'A modern cafe serving artisan coffee and fresh food', '123 Main Street, City, State 12345', '+1-555-0123', 'hello@democafe.com', 'USD', 'America/New_York', '{"tax_rate": 0.0875, "service_fee": 0.03}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tables (id, venue_id, label, token, nfc_uid, location_description) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'A1', 'table-a1-demo-token', 'nfc-a1-uid', 'Window seat, 2-person table'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'A2', 'table-a2-demo-token', 'nfc-a2-uid', 'Corner booth, 4-person table'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'B1', 'table-b1-demo-token', 'nfc-b1-uid', 'Bar seating, 2-person table'),
('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'B2', 'table-b2-demo-token', 'nfc-b2-uid', 'Patio table, 4-person table')
ON CONFLICT (token) DO NOTHING;

-- Insert menu items
INSERT INTO items (id, venue_id, name, description, price_cents, category, available) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Espresso', 'Rich, full-bodied espresso shot', 250, 'Coffee', true),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Cappuccino', 'Espresso with steamed milk and foam', 450, 'Coffee', true),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Latte', 'Espresso with steamed milk and light foam', 475, 'Coffee', true),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Americano', 'Espresso with hot water', 325, 'Coffee', true),
('44444444-4444-4444-4444-444444444446', '11111111-1111-1111-1111-111111111111', 'Croissant', 'Buttery, flaky French pastry', 350, 'Pastries', true),
('44444444-4444-4444-4444-444444444447', '11111111-1111-1111-1111-111111111111', 'Chocolate Croissant', 'Croissant filled with premium dark chocolate', 425, 'Pastries', true),
('44444444-4444-4444-4444-444444444450', '11111111-1111-1111-1111-111111111111', 'Avocado Toast', 'Multigrain bread with smashed avocado, cherry tomatoes', 850, 'Sandwiches', true),
('44444444-4444-4444-4444-444444444451', '11111111-1111-1111-1111-111111111111', 'Grilled Cheese', 'Classic grilled cheese with artisan cheddar on sourdough', 750, 'Sandwiches', true),
('44444444-4444-4444-4444-444444444454', '11111111-1111-1111-1111-111111111111', 'Caesar Salad', 'Crisp romaine lettuce, parmesan cheese, croutons', 950, 'Salads', true),
('44444444-4444-4444-4444-444444444455', '11111111-1111-1111-1111-111111111111', 'Greek Salad', 'Mixed greens, feta cheese, olives, tomatoes, cucumbers', 875, 'Salads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for demo)
CREATE POLICY "Allow all for demo" ON venues FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON items FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all for demo" ON event_log FOR ALL USING (true);

SELECT 'Database setup complete! 🎉' as message;



