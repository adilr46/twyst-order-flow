-- Test the order transition enforcement trigger
-- This should work (valid transition: created → paid)
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

  -- Test valid transition: created → paid
  UPDATE public.orders SET status = 'paid'::order_status WHERE id = test_order_id;
  
  -- Test valid transition: paid → accepted  
  UPDATE public.orders SET status = 'accepted'::order_status WHERE id = test_order_id;
  
  -- Clean up test order
  DELETE FROM public.orders WHERE id = test_order_id;
  
  RAISE NOTICE 'Order transition trigger test passed: Valid transitions work correctly';
END $$;