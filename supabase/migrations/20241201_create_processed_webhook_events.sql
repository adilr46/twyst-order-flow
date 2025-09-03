-- Create processed_webhook_events table for webhook idempotency
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created_at ON processed_webhook_events(created_at);

