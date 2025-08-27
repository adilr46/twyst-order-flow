-- Ensure triggers are properly created and enabled
-- Check if triggers exist, if not create them

-- 1. Ensure order transition trigger exists and is enabled
DROP TRIGGER IF EXISTS enforce_order_transitions_trigger ON orders;
CREATE TRIGGER enforce_order_transitions_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION enforce_order_transitions();

-- 2. Ensure one open session per table trigger exists and is enabled  
DROP TRIGGER IF EXISTS enforce_one_open_session_trigger ON sessions;
CREATE TRIGGER enforce_one_open_session_trigger
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_one_open_session_per_table();

-- 3. Ensure updated_at triggers exist
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Add missing columns if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Ensure proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_venue_status ON orders(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_table_status ON sessions(table_id, status);
CREATE INDEX IF NOT EXISTS idx_tables_token ON tables(token);
CREATE INDEX IF NOT EXISTS idx_tables_venue ON tables(venue_id);

-- 6. Enable realtime for orders table
ALTER TABLE orders REPLICA IDENTITY FULL;
-- Add table to realtime publication
SELECT 'ALTER PUBLICATION supabase_realtime ADD TABLE orders' WHERE NOT EXISTS (
  SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
);