-- Add atomic order creation function
BEGIN;

-- Create function for atomic order creation
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_venue_id UUID,
    p_session_id UUID,
    p_subtotal_cents INTEGER,
    p_tax_cents INTEGER,
    p_total_cents INTEGER,
    p_tax_rate_bps INTEGER,
    p_service_fee_bps INTEGER,
    p_items JSONB
) RETURNS TABLE (
    order_id UUID,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
    v_created_at TIMESTAMPTZ;
    v_item JSONB;
BEGIN
    -- Create the order first
    INSERT INTO public.orders (
        venue_id,
        session_id,
        subtotal_cents,
        tax_cents,
        total_cents,
        tax_rate_bps,
        service_fee_bps,
        status,
        payment_status
    ) VALUES (
        p_venue_id,
        p_session_id,
        p_subtotal_cents,
        p_tax_cents,
        p_total_cents,
        p_tax_rate_bps,
        p_service_fee_bps,
        'created'::order_status,
        'pending'
    )
    RETURNING id, created_at INTO v_order_id, v_created_at;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            item_id,
            qty,
            unit_price_cents,
            notes,
            options_json
        ) VALUES (
            v_order_id,
            (v_item->>'item_id')::UUID,
            (v_item->>'qty')::INTEGER,
            (v_item->>'unit_price_cents')::INTEGER,
            v_item->>'notes',
            COALESCE(v_item->>'options_json', '[]')::JSONB
        );
    END LOOP;

    -- Return the order details
    RETURN QUERY SELECT v_order_id, v_created_at;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.create_order_atomic TO service_role;

COMMIT;

