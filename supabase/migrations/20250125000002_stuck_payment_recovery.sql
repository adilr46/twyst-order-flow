-- Migration for Stuck Payment Recovery System
-- Adds functions and optimizations for the cron job that reprocesses stuck Stripe events

-- ============================================================================
-- 1. CREATE FUNCTION TO INCREMENT STRIPE EVENT ATTEMPTS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_stripe_event_attempts(
    event_id TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert or update the stripe event attempt count
    INSERT INTO public.stripe_events (id, attempt_count, last_attempt_at)
    VALUES (event_id, increment_by, now())
    ON CONFLICT (id) 
    DO UPDATE SET 
        attempt_count = stripe_events.attempt_count + increment_by,
        last_attempt_at = now();
END;
$function$;

-- ============================================================================
-- 2. CREATE FUNCTION TO FIND STUCK ORDERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.find_stuck_orders(
    min_age_minutes INTEGER DEFAULT 10,
    max_age_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    id UUID,
    venue_id UUID,
    stripe_session_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    total_cents INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT 
        o.id,
        o.venue_id,
        o.stripe_session_id,
        o.status::TEXT,
        o.created_at,
        o.total_cents
    FROM public.orders o
    WHERE o.status = 'created'
        AND o.stripe_session_id IS NOT NULL
        AND o.created_at >= now() - (max_age_hours || ' hours')::interval
        AND o.created_at <= now() - (min_age_minutes || ' minutes')::interval
    ORDER BY o.created_at ASC;
$function$;

-- ============================================================================
-- 3. CREATE FUNCTION TO RECOVER STUCK ORDER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recover_stuck_order(
    order_id UUID,
    stripe_session_id TEXT,
    stripe_payment_status TEXT,
    stripe_amount_total INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    order_record RECORD;
    recovery_successful BOOLEAN := FALSE;
BEGIN
    -- Get the order details
    SELECT id, venue_id, status INTO order_record
    FROM public.orders 
    WHERE id = order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', order_id;
    END IF;
    
    -- Only recover if order is still in 'created' status
    IF order_record.status = 'created' THEN
        -- Update order to paid
        UPDATE public.orders 
        SET status = 'paid', updated_at = now()
        WHERE id = order_id;
        
        -- Log the recovery event
        INSERT INTO public.event_log (
            venue_id, 
            order_id, 
            type, 
            actor, 
            payload
        ) VALUES (
            order_record.venue_id,
            order_id,
            'order.recovered',
            'cron-reprocessor',
            jsonb_build_object(
                'stripe_session_id', stripe_session_id,
                'stripe_payment_status', stripe_payment_status,
                'stripe_amount_total', stripe_amount_total,
                'recovery_reason', 'stuck_payment_detected',
                'original_status', 'created',
                'recovered_at', now()
            )
        );
        
        recovery_successful := TRUE;
        
        RAISE NOTICE 'Successfully recovered stuck order: %', order_id;
    ELSE
        RAISE NOTICE 'Order % status changed to % during recovery, skipping', order_id, order_record.status;
    END IF;
    
    RETURN recovery_successful;
END;
$function$;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- Index for finding stuck orders efficiently
CREATE INDEX IF NOT EXISTS idx_orders_stuck_payment_lookup 
ON public.orders (status, stripe_session_id, created_at) 
WHERE status = 'created' AND stripe_session_id IS NOT NULL;

-- Index for stripe_events attempt tracking
CREATE INDEX IF NOT EXISTS idx_stripe_events_attempts 
ON public.stripe_events (last_attempt_at, attempt_count);

-- Index for event_log recovery tracking
CREATE INDEX IF NOT EXISTS idx_event_log_recovery 
ON public.event_log (type, ts) 
WHERE type LIKE 'order.recovered%';

-- ============================================================================
-- 5. CREATE VIEW FOR MONITORING STUCK PAYMENT RECOVERY
-- ============================================================================
CREATE OR REPLACE VIEW public.stuck_payment_recovery_stats AS
SELECT 
    DATE(el.ts) as recovery_date,
    COUNT(*) as orders_recovered,
    COUNT(DISTINCT el.venue_id) as venues_affected,
    AVG(EXTRACT(EPOCH FROM el.ts - o.created_at) / 60) as avg_recovery_time_minutes,
    MIN(el.ts) as first_recovery,
    MAX(el.ts) as last_recovery
FROM public.event_log el
JOIN public.orders o ON el.order_id = o.id
WHERE el.type = 'order.recovered'
    AND el.actor = 'cron-reprocessor'
GROUP BY DATE(el.ts)
ORDER BY recovery_date DESC;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.increment_stripe_event_attempts(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_stuck_orders(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.recover_stuck_order(UUID, TEXT, TEXT, INTEGER) TO service_role;

-- Grant select on view
GRANT SELECT ON public.stuck_payment_recovery_stats TO authenticated, service_role;

-- ============================================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION public.increment_stripe_event_attempts(TEXT, INTEGER) 
IS 'Increments attempt count for reprocessing stuck Stripe events';

COMMENT ON FUNCTION public.find_stuck_orders(INTEGER, INTEGER) 
IS 'Finds orders that may be stuck (created status but have stripe_session_id)';

COMMENT ON FUNCTION public.recover_stuck_order(UUID, TEXT, TEXT, INTEGER) 
IS 'Recovers a stuck order by updating status to paid and logging the recovery';

COMMENT ON VIEW public.stuck_payment_recovery_stats 
IS 'Statistics about stuck payment recovery operations for monitoring';

-- ============================================================================
-- 8. CREATE SAMPLE MONITORING QUERY
-- ============================================================================
-- Uncomment to test the functions:
-- SELECT * FROM public.find_stuck_orders(10, 24);
-- SELECT * FROM public.stuck_payment_recovery_stats;

-- Migration complete
COMMENT ON MIGRATION IS 'Adds functions and optimizations for stuck payment recovery system';



