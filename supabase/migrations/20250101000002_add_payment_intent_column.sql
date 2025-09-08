-- Add payment_intent column to orders table
-- This is needed for the Stripe webhook to store payment information

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_intent IS 'Stripe payment intent ID for tracking payments';



