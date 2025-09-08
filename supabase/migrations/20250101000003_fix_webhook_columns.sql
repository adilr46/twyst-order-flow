-- Fix webhook columns for orders table
-- This migration adds the payment_intent column needed for the Stripe webhook to work properly

-- Add payment_intent column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_intent IS 'Stripe payment intent ID for tracking payments';
