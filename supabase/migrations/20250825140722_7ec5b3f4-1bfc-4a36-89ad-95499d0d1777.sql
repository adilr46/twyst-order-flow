-- Fix search path security issue for enforce_order_transitions function
CREATE OR REPLACE FUNCTION public.enforce_order_transitions()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only check status transitions if status is being changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Define valid transitions
    IF NOT (
      -- Normal flow: created → paid → accepted → in_prep → ready → served
      (OLD.status = 'created' AND NEW.status = 'paid') OR
      (OLD.status = 'paid' AND NEW.status = 'accepted') OR
      (OLD.status = 'accepted' AND NEW.status = 'in_prep') OR
      (OLD.status = 'in_prep' AND NEW.status = 'ready') OR
      (OLD.status = 'ready' AND NEW.status = 'served') OR
      
      -- Cancellation paths
      (OLD.status = 'created' AND NEW.status = 'cancelled') OR
      (OLD.status = 'paid' AND NEW.status = 'cancelled')
    ) THEN
      RAISE EXCEPTION 'Invalid order status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;