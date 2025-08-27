-- Add last_seen_at column to sessions table for activity tracking
ALTER TABLE public.sessions 
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing sessions to have current timestamp  
UPDATE public.sessions 
SET last_seen_at = now() 
WHERE last_seen_at IS NULL;

-- Create function to close stale sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Close sessions that haven't been seen in 24+ hours
  UPDATE public.sessions 
  SET status = 'closed',
      closed_at = now(),
      updated_at = now()
  WHERE status = 'open' 
    AND last_seen_at < now() - interval '24 hours';
    
  -- Log cleanup activity
  INSERT INTO public.event_log (
    actor, 
    type, 
    payload,
    venue_id
  )
  SELECT 
    'system:cleanup',
    'session.cleanup',
    jsonb_build_object(
      'closed_count', count(*),
      'cleanup_threshold', '24 hours'
    ),
    venue_id
  FROM public.sessions 
  WHERE status = 'closed' 
    AND closed_at >= now() - interval '1 minute'
  GROUP BY venue_id;
END;
$function$;

-- Create trigger to automatically update last_seen_at when sessions are accessed
CREATE OR REPLACE FUNCTION public.update_session_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if it's been more than 5 minutes since last update
  -- to avoid too frequent updates
  IF OLD.last_seen_at IS NULL OR OLD.last_seen_at < now() - interval '5 minutes' THEN
    NEW.last_seen_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for last_seen_at updates
CREATE TRIGGER update_sessions_last_seen
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_last_seen();