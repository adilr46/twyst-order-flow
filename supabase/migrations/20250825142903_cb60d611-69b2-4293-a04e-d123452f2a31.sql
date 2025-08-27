-- Create a function to increment attempt count for stripe events
CREATE OR REPLACE FUNCTION increment_stripe_event_attempts(processed_count integer)
RETURNS void AS $$
BEGIN
  -- Update attempt count for recent stripe events that were just processed
  UPDATE stripe_events 
  SET attempt_count = attempt_count + 1,
      last_attempt_at = now()
  WHERE last_attempt_at >= now() - interval '2 minutes';
  
  -- Also update any events with matching timestamps
  UPDATE stripe_events 
  SET attempt_count = COALESCE(attempt_count, 0) + 1
  WHERE last_attempt_at IS NULL 
    AND created_at >= now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;