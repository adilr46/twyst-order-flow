-- Enable realtime for orders table
-- This ensures that postgres_changes events are published for order status updates

-- Add orders table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Add order_items table to supabase_realtime publication
-- This ensures that order item changes (quantity, notes, etc.) are also tracked
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Verify the publication includes both tables
-- You can check this in Supabase Dashboard > Database > Replication > Publications
