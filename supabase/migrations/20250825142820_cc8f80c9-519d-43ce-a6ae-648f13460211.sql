-- Create a function to increment attempt count for stripe events
CREATE OR REPLACE FUNCTION increment_stripe_event_attempts(processed_count integer)
RETURNS void AS $$
BEGIN
  -- Update attempt count for recent stripe events
  UPDATE stripe_events 
  SET attempt_count = attempt_count + 1,
      last_attempt_at = now()
  WHERE last_attempt_at >= now() - interval '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cron job to run the retry function every 15 minutes
-- This requires the pg_cron extension to be enabled
SELECT cron.schedule(
  'retry-stripe-events',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://zbfosmwzntckdrxrfwta.supabase.co/functions/v1/retry-stripe-events',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZm9zbXd6bnRja2RyeHJmd3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMxOTQsImV4cCI6MjA3MTU1OTE5NH0.Kes4OLAxuy6-V0ZiPbW0KvSurICa7ismfvI4qpa-BGE"}'::jsonb,  
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Enable the required extensions if not already enabled
-- Note: These may need to be enabled by Supabase support for some projects
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;