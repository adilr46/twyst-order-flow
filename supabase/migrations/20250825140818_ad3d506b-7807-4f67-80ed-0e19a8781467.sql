-- Test that invalid transitions are blocked
-- This should fail with an error
DO $$
DECLARE
  test_order_id UUID;
BEGIN
  -- Create a test order
  INSERT INTO public.orders (venue_id, session_id, status, total_cents, subtotal_cents, tax_cents)
  SELECT 
    v.id,
    s.id,
    'created'::order_status,
    1000,
    900,
    100
  FROM venues v
  JOIN sessions s ON s.venue_id = v.id
  WHERE v.slug = 'demo-restaurant'
  LIMIT 1
  RETURNING id INTO test_order_id;

  -- This should raise an exception (invalid transition: created → served)
  BEGIN
    UPDATE public.orders SET status = 'served'::order_status WHERE id = test_order_id;
    RAISE EXCEPTION 'ERROR: Invalid transition should have been blocked!';
  EXCEPTION 
    WHEN OTHERS THEN
      IF SQLSTATE = 'P0001' AND SQLERRM LIKE '%Invalid order status transition%' THEN
        RAISE NOTICE 'SUCCESS: Invalid transition correctly blocked: %', SQLERRM;
      ELSE
        RAISE;
      END IF;
  END;
  
  -- Clean up test order
  DELETE FROM public.orders WHERE id = test_order_id;
  
  RAISE NOTICE 'Order transition trigger validation test completed successfully';
END $$;