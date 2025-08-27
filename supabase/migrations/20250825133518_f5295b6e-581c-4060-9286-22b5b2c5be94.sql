-- Create enums using DO blocks for idempotency
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('open', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing conflicting tables and recreate with new schema
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;

-- Create venues table
CREATE TABLE public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'GBP',
    timezone TEXT DEFAULT 'Europe/London',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create venue_tables table (physical tables in venue)
CREATE TABLE public.venue_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    nfc_uid TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create items table (menu items)
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sessions table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.venue_tables(id) ON DELETE CASCADE,
    status session_status DEFAULT 'open',
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ NULL
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    status order_status DEFAULT 'created',
    subtotal_cents INTEGER DEFAULT 0,
    tax_cents INTEGER DEFAULT 0,
    total_cents INTEGER DEFAULT 0,
    tax_rate_bps INTEGER DEFAULT 0,
    service_fee_bps INTEGER DEFAULT 0,
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_price_cents INTEGER NOT NULL,
    notes TEXT,
    options_json JSONB DEFAULT '[]'
);

-- Create stripe_events table
CREATE TABLE public.stripe_events (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ NULL
);

-- Create event_log table
CREATE TABLE public.event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ts TIMESTAMPTZ DEFAULT now(),
    actor TEXT,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    type TEXT,
    payload JSONB
);