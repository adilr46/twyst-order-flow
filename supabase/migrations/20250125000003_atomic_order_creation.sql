-- Migration for Atomic Order Creation with Constraints
-- Adds functions and constraints to prevent duplicate orders and race conditions

-- ============================================================================
-- 1. CREATE ATOMIC ORDER CREATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_venue_id UUID,
    p_session_id UUID,
    p_subtotal_cents INTEGER,
    p_tax_cents INTEGER,
    p_total_cents INTEGER,
    p_tax_rate_bps INTEGER,
    p_service_fee_bps INTEGER,
    p_items TEXT -- JSON string of order items
)
RETURNS TABLE (
    order_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_order_id UUID;
    new_created_at TIMESTAMPTZ;
    items_json JSONB;
    item_record RECORD;
BEGIN
    -- Parse items JSON
    items_json := p_items::JSONB;
    
    -- **CONSTRAINT CHECK**: Ensure no existing 'created' orders for this session
    -- This check happens inside the transaction to prevent race conditions
    IF EXISTS (
        SELECT 1 FROM public.orders 
        WHERE session_id = p_session_id 
        AND status = 'created'
        FOR UPDATE -- Lock existing orders to prevent concurrent creation
    ) THEN
        RAISE EXCEPTION 'Session already has an open order in created status';
    END IF;
    
    -- **CONSTRAINT CHECK**: Verify session is still open and valid
    IF NOT EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE id = p_session_id 
        AND venue_id = p_venue_id 
        AND status = 'open'
        FOR UPDATE -- Lock session to prevent concurrent modifications
    ) THEN
        RAISE EXCEPTION 'Session is not open or does not exist';
    END IF;
    
    -- Create the order
    INSERT INTO public.orders (
        venue_id,
        session_id,
        status,
        subtotal_cents,
        tax_cents,
        total_cents,
        tax_rate_bps,
        service_fee_bps
    ) VALUES (
        p_venue_id,
        p_session_id,
        'created',
        p_subtotal_cents,
        p_tax_cents,
        p_total_cents,
        p_tax_rate_bps,
        p_service_fee_bps
    )
    RETURNING id, created_at INTO new_order_id, new_created_at;
    
    -- Insert order items
    FOR item_record IN 
        SELECT * FROM jsonb_to_recordset(items_json) AS x(
            item_id UUID,
            qty INTEGER,
            unit_price_cents INTEGER,
            notes TEXT,
            options_json JSONB
        )
    LOOP
        INSERT INTO public.order_items (
            order_id,
            item_id,
            qty,
            unit_price_cents,
            notes,
            options_json
        ) VALUES (
            new_order_id,
            item_record.item_id,
            item_record.qty,
            item_record.unit_price_cents,
            item_record.notes,
            COALESCE(item_record.options_json, '[]'::JSONB)
        );
    END LOOP;
    
    -- Return the created order details
    order_id := new_order_id;
    created_at := new_created_at;
    RETURN NEXT;
END;
$function$;

-- ============================================================================
-- 2. CREATE FUNCTION TO CHECK SESSION ORDER CONSTRAINTS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_session_order_constraints(
    p_session_id UUID,
    p_rate_limit_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
    can_create_order BOOLEAN,
    reason TEXT,
    existing_order_id UUID,
    minutes_since_last INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    WITH recent_orders AS (
        SELECT 
            id,
            status,
            created_at,
            EXTRACT(EPOCH FROM (now() - created_at)) / 60 AS minutes_ago
        FROM public.orders
        WHERE session_id = p_session_id
        ORDER BY created_at DESC
        LIMIT 1
    ),
    open_created_orders AS (
        SELECT 
            id,
            created_at,
            EXTRACT(EPOCH FROM (now() - created_at)) / 60 AS minutes_ago
        FROM public.orders
        WHERE session_id = p_session_id 
        AND status = 'created'
        ORDER BY created_at DESC
        LIMIT 1
    )
    SELECT 
        CASE 
            -- Check for existing 'created' orders
            WHEN oco.id IS NOT NULL THEN FALSE
            -- Check rate limiting
            WHEN ro.id IS NOT NULL AND ro.minutes_ago < p_rate_limit_minutes THEN FALSE
            ELSE TRUE
        END as can_create_order,
        CASE 
            WHEN oco.id IS NOT NULL THEN 
                'Session has an existing order in created status'
            WHEN ro.id IS NOT NULL AND ro.minutes_ago < p_rate_limit_minutes THEN 
                'Rate limit: Must wait ' || CEIL(p_rate_limit_minutes - ro.minutes_ago) || ' more minutes'
            ELSE 'OK'
        END as reason,
        COALESCE(oco.id, ro.id) as existing_order_id,
        COALESCE(oco.minutes_ago, ro.minutes_ago)::INTEGER as minutes_since_last
    FROM recent_orders ro
    FULL OUTER JOIN open_created_orders oco ON TRUE;
$function$;

-- ============================================================================
-- 3. CREATE VIEW FOR ORDER CREATION MONITORING
-- ============================================================================
CREATE OR REPLACE VIEW public.order_creation_stats AS
SELECT 
    DATE(o.created_at) as order_date,
    o.venue_id,
    v.name as venue_name,
    COUNT(*) as orders_created,
    COUNT(DISTINCT o.session_id) as unique_sessions,
    AVG(o.total_cents) as avg_order_value,
    MIN(o.created_at) as first_order,
    MAX(o.created_at) as last_order,
    -- Rate limiting stats
    COUNT(*) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM orders o2 
            WHERE o2.session_id = o.session_id 
            AND o2.created_at > o.created_at - interval '5 minutes'
            AND o2.created_at < o.created_at
        )
    ) as potentially_rate_limited
FROM public.orders o
JOIN public.venues v ON o.venue_id = v.id
WHERE o.status = 'created'
GROUP BY DATE(o.created_at), o.venue_id, v.name
ORDER BY order_date DESC, venue_name;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
-- Index for session constraint checking (one open order per session)
CREATE INDEX IF NOT EXISTS idx_orders_session_status_created 
ON public.orders (session_id, status, created_at) 
WHERE status = 'created';

-- Index for session rate limiting
CREATE INDEX IF NOT EXISTS idx_orders_session_recent 
ON public.orders (session_id, created_at DESC);

-- Composite index for venue + session constraint checks
CREATE INDEX IF NOT EXISTS idx_orders_venue_session_status 
ON public.orders (venue_id, session_id, status, created_at);

-- ============================================================================
-- 5. ADD CONSTRAINT TO PREVENT MULTIPLE CREATED ORDERS PER SESSION
-- ============================================================================
-- Create a unique partial index to enforce one 'created' order per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_created_per_session 
ON public.orders (session_id) 
WHERE status = 'created';

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.create_order_atomic(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_session_order_constraints(UUID, INTEGER) TO service_role, authenticated;

-- Grant select on view
GRANT SELECT ON public.order_creation_stats TO authenticated, service_role;

-- ============================================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION public.create_order_atomic(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT) 
IS 'Atomically creates an order with all items, enforcing session constraints to prevent duplicates';

COMMENT ON FUNCTION public.check_session_order_constraints(UUID, INTEGER) 
IS 'Checks if a session can create a new order based on existing orders and rate limits';

COMMENT ON VIEW public.order_creation_stats 
IS 'Daily statistics about order creation patterns and potential rate limiting';

COMMENT ON INDEX public.idx_orders_one_created_per_session 
IS 'Unique constraint ensuring only one order with status=created per session';

-- ============================================================================
-- 8. CREATE SAMPLE MONITORING QUERIES
-- ============================================================================
-- Uncomment to test the functions:
-- SELECT * FROM public.check_session_order_constraints('session-uuid-here'::UUID);
-- SELECT * FROM public.order_creation_stats WHERE order_date >= CURRENT_DATE - 7;

-- Migration complete
COMMENT ON MIGRATION IS 'Adds atomic order creation with session constraints and race condition prevention';



