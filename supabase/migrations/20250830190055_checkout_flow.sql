-- Ensure idempotency with IF NOT EXISTS
BEGIN;

-- Add payment tracking columns if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'payment_provider') THEN
        ALTER TABLE orders ADD COLUMN payment_provider text DEFAULT 'stripe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'provider_session_id') THEN
        ALTER TABLE orders ADD COLUMN provider_session_id text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'provider_payment_id') THEN
        ALTER TABLE orders ADD COLUMN provider_payment_id text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
    END IF;
END $$;

-- ✅ Use existing processed_webhook_events table (don't recreate)
-- Table already exists with schema: (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ)

-- Add indices for performance (avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_provider_session_id ON orders(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_venue_payment ON orders(venue_id, payment_status);

-- ✅ Migrate existing Stripe data (use correct field name)
UPDATE orders 
SET 
    payment_provider = 'stripe',
    provider_session_id = stripe_session_id,  -- ✅ Map legacy field
    payment_status = CASE 
        WHEN status = 'paid' THEN 'paid'
        WHEN status = 'cancelled' THEN 'failed'
        ELSE 'pending'
    END
WHERE stripe_session_id IS NOT NULL 
  AND payment_provider IS NULL;

COMMIT;

