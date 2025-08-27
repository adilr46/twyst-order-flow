-- Fix order_status enum - remove 'ready' and align with TypeScript types
ALTER TYPE order_status RENAME TO order_status_old;

CREATE TYPE order_status AS ENUM ('created', 'paid', 'accepted', 'in_prep', 'served', 'cancelled');

-- Update orders table to use new enum
ALTER TABLE orders 
ALTER COLUMN status TYPE order_status USING status::text::order_status;

-- Drop old enum
DROP TYPE order_status_old;

-- Update RLS policies on orders table - restrict SELECT to venue owners only
DROP POLICY IF EXISTS "Orders are viewable for venue operations" ON orders;

CREATE POLICY "Orders are viewable by venue owners only" 
ON orders 
FOR SELECT 
USING (venue_id IN (
  SELECT venues.id 
  FROM venues 
  WHERE venues.owner_id = auth.uid()
));