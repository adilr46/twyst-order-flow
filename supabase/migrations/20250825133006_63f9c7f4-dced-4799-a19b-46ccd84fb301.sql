-- Update the sample order data to match new status values first
UPDATE orders SET status = 'pending' WHERE status = 'preparing';

-- Now update order status enum to match new FOH requirements
ALTER TYPE order_status RENAME TO order_status_old;

CREATE TYPE order_status AS ENUM ('paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled');

-- Update the orders table to use new enum
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING 
  CASE 
    WHEN status::text = 'pending' THEN 'paid'::order_status
    WHEN status::text = 'preparing' THEN 'in_prep'::order_status
    WHEN status::text = 'ready' THEN 'ready'::order_status
    WHEN status::text = 'completed' THEN 'served'::order_status
    WHEN status::text = 'cancelled' THEN 'cancelled'::order_status
    ELSE 'paid'::order_status
  END;

ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'paid'::order_status;

-- Drop the old enum
DROP TYPE order_status_old;