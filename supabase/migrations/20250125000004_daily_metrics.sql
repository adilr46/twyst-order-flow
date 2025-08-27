-- Migration for Daily Metrics Aggregation System
-- Adds metrics tracking and aggregation for venue performance monitoring

-- ============================================================================
-- 1. CREATE METRICS_DAILY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    day DATE NOT NULL,
    orders_created INTEGER DEFAULT 0,
    orders_paid INTEGER DEFAULT 0,
    avg_ack_seconds NUMERIC(10,2) DEFAULT 0,
    total_revenue_cents INTEGER DEFAULT 0,
    avg_order_value_cents INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one record per venue per day
    UNIQUE(venue_id, day)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_metrics_daily_venue_day 
ON public.metrics_daily (venue_id, day DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_daily_day 
ON public.metrics_daily (day DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_daily_venue_created 
ON public.metrics_daily (venue_id, created_at DESC);

-- ============================================================================
-- 3. CREATE FUNCTION TO AGGREGATE DAILY METRICS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics(
    p_venue_id UUID DEFAULT NULL,
    p_day DATE DEFAULT CURRENT_DATE - 1
)
RETURNS TABLE (
    venue_id UUID,
    day DATE,
    orders_created INTEGER,
    orders_paid INTEGER,
    avg_ack_seconds NUMERIC,
    total_revenue_cents INTEGER,
    avg_order_value_cents INTEGER,
    unique_sessions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    venue_filter TEXT;
    day_start TIMESTAMPTZ;
    day_end TIMESTAMPTZ;
BEGIN
    -- Set time boundaries for the day
    day_start := p_day::DATE;
    day_end := (p_day::DATE + INTERVAL '1 day') - INTERVAL '1 microsecond';
    
    -- Build venue filter
    IF p_venue_id IS NOT NULL THEN
        venue_filter := 'AND o.venue_id = ' || quote_literal(p_venue_id);
    ELSE
        venue_filter := '';
    END IF;
    
    -- Return aggregated metrics
    RETURN QUERY EXECUTE format('
        WITH daily_orders AS (
            SELECT 
                o.venue_id,
                o.id as order_id,
                o.status,
                o.total_cents,
                o.created_at,
                o.session_id,
                -- Calculate acknowledgment time (time from created to paid/accepted)
                CASE 
                    WHEN o.status IN (''paid'', ''accepted'', ''in_prep'', ''ready'', ''served'') THEN
                        EXTRACT(EPOCH FROM (
                            COALESCE(
                                (SELECT MIN(el.ts) 
                                 FROM event_log el 
                                 WHERE el.order_id = o.id 
                                 AND el.type IN (''order.paid'', ''order.accepted'')
                                 AND el.ts >= o.created_at),
                                o.updated_at
                            ) - o.created_at
                        ))
                    ELSE NULL
                END as ack_seconds
            FROM public.orders o
            WHERE o.created_at >= %L::TIMESTAMPTZ 
            AND o.created_at <= %L::TIMESTAMPTZ
            %s
        ),
        venue_metrics AS (
            SELECT 
                venue_id,
                COUNT(*) as orders_created,
                COUNT(*) FILTER (WHERE status IN (''paid'', ''accepted'', ''in_prep'', ''ready'', ''served'')) as orders_paid,
                AVG(ack_seconds) FILTER (WHERE ack_seconds IS NOT NULL) as avg_ack_seconds,
                SUM(total_cents) FILTER (WHERE status IN (''paid'', ''accepted'', ''in_prep'', ''ready'', ''served'')) as total_revenue_cents,
                AVG(total_cents) FILTER (WHERE status IN (''paid'', ''accepted'', ''in_prep'', ''ready'', ''served'')) as avg_order_value_cents,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM daily_orders
            GROUP BY venue_id
        )
        SELECT 
            vm.venue_id,
            %L::DATE as day,
            COALESCE(vm.orders_created, 0) as orders_created,
            COALESCE(vm.orders_paid, 0) as orders_paid,
            COALESCE(vm.avg_ack_seconds, 0) as avg_ack_seconds,
            COALESCE(vm.total_revenue_cents, 0) as total_revenue_cents,
            COALESCE(vm.avg_order_value_cents, 0) as avg_order_value_cents,
            COALESCE(vm.unique_sessions, 0) as unique_sessions
        FROM venue_metrics vm
    ', day_start, day_end, venue_filter, p_day);
END;
$function$;

-- ============================================================================
-- 4. CREATE FUNCTION TO UPSERT DAILY METRICS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_daily_metrics(
    p_venue_id UUID DEFAULT NULL,
    p_day DATE DEFAULT CURRENT_DATE - 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    metrics_record RECORD;
    upsert_count INTEGER := 0;
BEGIN
    -- Aggregate metrics for the specified day(s)
    FOR metrics_record IN 
        SELECT * FROM public.aggregate_daily_metrics(p_venue_id, p_day)
    LOOP
        -- Upsert the metrics
        INSERT INTO public.metrics_daily (
            venue_id,
            day,
            orders_created,
            orders_paid,
            avg_ack_seconds,
            total_revenue_cents,
            avg_order_value_cents,
            unique_sessions,
            updated_at
        ) VALUES (
            metrics_record.venue_id,
            metrics_record.day,
            metrics_record.orders_created,
            metrics_record.orders_paid,
            metrics_record.avg_ack_seconds,
            metrics_record.total_revenue_cents,
            metrics_record.avg_order_value_cents,
            metrics_record.unique_sessions,
            now()
        )
        ON CONFLICT (venue_id, day) 
        DO UPDATE SET
            orders_created = EXCLUDED.orders_created,
            orders_paid = EXCLUDED.orders_paid,
            avg_ack_seconds = EXCLUDED.avg_ack_seconds,
            total_revenue_cents = EXCLUDED.total_revenue_cents,
            avg_order_value_cents = EXCLUDED.avg_order_value_cents,
            unique_sessions = EXCLUDED.unique_sessions,
            updated_at = now();
            
        upsert_count := upsert_count + 1;
    END LOOP;
    
    RETURN upsert_count;
END;
$function$;

-- ============================================================================
-- 5. CREATE FUNCTION TO AGGREGATE ALL VENUES FOR A DAY
-- ============================================================================
CREATE OR REPLACE FUNCTION public.aggregate_all_venues_daily(
    p_day DATE DEFAULT CURRENT_DATE - 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    venue_record RECORD;
    total_upserts INTEGER := 0;
BEGIN
    -- Get all venues that had activity on the specified day
    FOR venue_record IN 
        SELECT DISTINCT venue_id 
        FROM public.orders 
        WHERE DATE(created_at) = p_day
    LOOP
        total_upserts := total_upserts + public.upsert_daily_metrics(venue_record.venue_id, p_day);
    END LOOP;
    
    RETURN total_upserts;
END;
$function$;

-- ============================================================================
-- 6. CREATE VIEW FOR METRICS DASHBOARD
-- ============================================================================
CREATE OR REPLACE VIEW public.metrics_dashboard AS
SELECT 
    md.venue_id,
    v.name as venue_name,
    v.slug as venue_slug,
    md.day,
    md.orders_created,
    md.orders_paid,
    md.avg_ack_seconds,
    md.total_revenue_cents,
    md.avg_order_value_cents,
    md.unique_sessions,
    -- Conversion rate
    CASE 
        WHEN md.orders_created > 0 THEN 
            ROUND((md.orders_paid::NUMERIC / md.orders_created) * 100, 2)
        ELSE 0 
    END as conversion_rate_percent,
    -- Average acknowledgment time in minutes
    ROUND(md.avg_ack_seconds / 60, 2) as avg_ack_minutes,
    md.created_at,
    md.updated_at
FROM public.metrics_daily md
JOIN public.venues v ON md.venue_id = v.id
ORDER BY md.day DESC, v.name;

-- ============================================================================
-- 7. CREATE TRIGGER TO UPDATE METRICS ON ORDER STATUS CHANGES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_metrics_on_order_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Update metrics for the order's day when status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Schedule metrics update for the order's creation day
        PERFORM public.upsert_daily_metrics(
            NEW.venue_id, 
            DATE(NEW.created_at)
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_update_metrics_on_order_change ON public.orders;
CREATE TRIGGER trigger_update_metrics_on_order_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_metrics_on_order_change();

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.aggregate_daily_metrics(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_daily_metrics(UUID, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.aggregate_all_venues_daily(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_metrics_on_order_change() TO service_role;

-- Grant select on views
GRANT SELECT ON public.metrics_dashboard TO authenticated, service_role;

-- Grant insert/update on metrics table
GRANT INSERT, UPDATE, SELECT ON public.metrics_daily TO service_role;

-- ============================================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.metrics_daily 
IS 'Daily aggregated metrics for venue performance tracking';

COMMENT ON FUNCTION public.aggregate_daily_metrics(UUID, DATE) 
IS 'Aggregates daily metrics for a specific venue and day';

COMMENT ON FUNCTION public.upsert_daily_metrics(UUID, DATE) 
IS 'Upserts daily metrics into the metrics_daily table';

COMMENT ON FUNCTION public.aggregate_all_venues_daily(DATE) 
IS 'Aggregates metrics for all venues that had activity on a specific day';

COMMENT ON VIEW public.metrics_dashboard 
IS 'Dashboard view for venue performance metrics with calculated fields';

-- ============================================================================
-- 10. CREATE SAMPLE MONITORING QUERIES
-- ============================================================================
-- Uncomment to test the functions:
-- SELECT * FROM public.aggregate_daily_metrics(NULL, CURRENT_DATE - 1);
-- SELECT public.upsert_daily_metrics(NULL, CURRENT_DATE - 1);
-- SELECT * FROM public.metrics_dashboard WHERE day >= CURRENT_DATE - 7;

-- Migration complete
COMMENT ON MIGRATION IS 'Adds daily metrics aggregation system for venue performance tracking';



