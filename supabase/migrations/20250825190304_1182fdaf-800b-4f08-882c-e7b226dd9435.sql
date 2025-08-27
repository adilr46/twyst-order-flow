-- Enable pg_cron and pg_net extensions for scheduled functions
SELECT cron.schedule(
  'cleanup-stale-sessions-daily',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://zbfosmwzntckdrxrfwta.supabase.co/functions/v1/cleanup-stale-sessions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZm9zbXd6bnRja2RyeHJmd3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMxOTQsImV4cCI6MjA3MTU1OTE5NH0.Kes4OLAxuy6-V0ZiPbW0KvSurICa7ismfvI4qpa-BGE"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);