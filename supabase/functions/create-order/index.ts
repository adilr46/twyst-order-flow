import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Order status transition definitions
type OrderStatus = 'created' | 'paid' | 'accepted' | 'in_prep' | 'ready' | 'served' | 'cancelled';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['paid', 'cancelled'],
  paid: ['accepted', 'cancelled'],
  accepted: ['in_prep', 'cancelled'],
  in_prep: ['ready', 'cancelled'],
  ready: ['served'],
  served: [], // Terminal state
  cancelled: [] // Terminal state
};

/**
 * Validates if a status transition is allowed
 */
function assertAllowedTransition(currentStatus: OrderStatus | null, nextStatus: OrderStatus): void {
  // Allow creation (null -> created)
  if (!currentStatus && nextStatus === 'created') {
    return;
  }

  if (!currentStatus) {
    throw new Error(`Cannot transition from null to ${nextStatus}`);
  }

  const allowedNextStates = VALID_TRANSITIONS[currentStatus];
  if (!allowedNextStates.includes(nextStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${nextStatus}. Allowed: ${allowedNextStates.join(', ')}`);
  }
}

/**
 * Validates price is a positive integer (cents)
 */
function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 0;
}

interface CreateOrderRequest {
  venue_id: string;
  session_id: string;
  items: Array<{
    item_id: string;
    qty: number;
    unit_price_cents: number;
    notes?: string | null;
    options_json?: any[];
  }>;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  tax_rate_bps: number;
  service_fee_bps: number;
}

// Rate limiting storage (in-memory for this function instance)
const ipRateLimit = new Map<string, number>();
const SESSION_ORDER_LIMIT_MINUTES = 5; // Allow one order per session every 5 minutes
const IP_RATE_LIMIT_MINUTES = 1; // Allow one order per IP per minute

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const orderData: CreateOrderRequest = await req.json();
    
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Validate required fields
    if (!orderData.venue_id) throw new Error('venue_id is required');
    if (!orderData.session_id) throw new Error('session_id is required');
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('items array is required and must not be empty');
    }

    // Validate all prices are valid (positive integers)
    if (!isValidPrice(orderData.subtotal_cents)) throw new Error('invalid subtotal_cents');
    if (!isValidPrice(orderData.tax_cents)) throw new Error('invalid tax_cents');
    if (!isValidPrice(orderData.total_cents)) throw new Error('invalid total_cents');

    // Validate each item
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      if (!item.item_id) throw new Error(`Item ${i + 1}: item_id is required`);
      if (!item.qty || item.qty <= 0) throw new Error(`Item ${i + 1}: qty must be greater than 0`);
      if (!isValidPrice(item.unit_price_cents)) throw new Error(`Item ${i + 1}: invalid unit_price_cents`);
    }

    console.log('Creating order with data:', {
      venue_id: orderData.venue_id,
      session_id: orderData.session_id,
      item_count: orderData.items.length,
      total_cents: orderData.total_cents
    });

    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, venue_id, table_id, status')
      .eq('id', orderData.session_id)
      .eq('venue_id', orderData.venue_id)
      .single();

    if (sessionError || !session) {
      throw new Error('Invalid session_id or session not found');
    }

    if (session.status !== 'open') {
      throw new Error(`Session is ${session.status}, cannot create order`);
    }

    // **CONSTRAINT 1: One open created order per session**
    const { data: existingOrders, error: existingOrdersError } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('session_id', orderData.session_id)
      .in('status', ['created'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingOrdersError) {
      throw new Error(`Failed to check existing orders: ${existingOrdersError.message}`);
    }

    if (existingOrders && existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      const timeSinceLastOrder = Date.now() - new Date(existingOrder.created_at).getTime();
      const minutesSince = Math.floor(timeSinceLastOrder / (1000 * 60));
      
      throw new Error(`Session already has an open order (${existingOrder.id}) created ${minutesSince} minutes ago. Please complete or cancel the existing order first.`);
    }

    // **CONSTRAINT 2: Optional IP rate limiting (1/min per IP)**
    const now = Date.now();
    const ipLastOrder = ipRateLimit.get(clientIP);
    
    if (ipLastOrder) {
      const timeSinceLastIP = now - ipLastOrder;
      const minutesSinceIP = timeSinceLastIP / (1000 * 60);
      
      if (minutesSinceIP < IP_RATE_LIMIT_MINUTES) {
        const waitTime = Math.ceil(IP_RATE_LIMIT_MINUTES - minutesSinceIP);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} minute(s) before creating another order.`);
      }
    }

    // Additional session-based rate limiting check in database
    const { data: recentSessionOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('session_id', orderData.session_id)
      .gte('created_at', new Date(now - SESSION_ORDER_LIMIT_MINUTES * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentOrdersError) {
      throw new Error(`Failed to check recent orders: ${recentOrdersError.message}`);
    }

    if (recentSessionOrders && recentSessionOrders.length > 0) {
      const recentOrder = recentSessionOrders[0];
      const timeSinceRecent = now - new Date(recentOrder.created_at).getTime();
      const minutesSinceRecent = Math.floor(timeSinceRecent / (1000 * 60));
      const waitTime = SESSION_ORDER_LIMIT_MINUTES - minutesSinceRecent;
      
      if (waitTime > 0) {
        throw new Error(`Session rate limit: Please wait ${waitTime} more minute(s) before creating another order.`);
      }
    }

    // Verify items exist and are active, get current prices for validation
    const itemIds = orderData.items.map(item => item.item_id);
    const { data: dbItems, error: itemsError } = await supabase
      .from('items')
      .select('id, name, price_cents, is_active')
      .eq('venue_id', orderData.venue_id)
      .eq('is_active', true)
      .in('id', itemIds);

    if (itemsError) throw itemsError;

    if (!dbItems || dbItems.length !== itemIds.length) {
      const foundIds = dbItems?.map(item => item.id) || [];
      const missingIds = itemIds.filter(id => !foundIds.includes(id));
      throw new Error(`Items not found or inactive: ${missingIds.join(', ')}`);
    }

    // Create item lookup for price validation
    const itemMap = new Map(dbItems.map(item => [item.id, item]));

    // Validate submitted prices match current database prices
    let calculatedSubtotal = 0;
    for (const orderItem of orderData.items) {
      const dbItem = itemMap.get(orderItem.item_id);
      if (!dbItem) throw new Error(`Item ${orderItem.item_id} not found`);
      
      if (orderItem.unit_price_cents !== dbItem.price_cents) {
        throw new Error(`Price mismatch for item ${dbItem.name}: submitted ${orderItem.unit_price_cents}, current ${dbItem.price_cents}`);
      }

      calculatedSubtotal += dbItem.price_cents * orderItem.qty;
    }

    // Validate totals match calculations
    if (calculatedSubtotal !== orderData.subtotal_cents) {
      throw new Error(`Subtotal mismatch: calculated ${calculatedSubtotal}, submitted ${orderData.subtotal_cents}`);
    }

    const expectedTax = Math.round((calculatedSubtotal * orderData.tax_rate_bps) / 10000);
    if (expectedTax !== orderData.tax_cents) {
      throw new Error(`Tax calculation mismatch: expected ${expectedTax}, submitted ${orderData.tax_cents}`);
    }

    const expectedTotal = calculatedSubtotal + orderData.tax_cents;
    if (expectedTotal !== orderData.total_cents) {
      throw new Error(`Total mismatch: expected ${expectedTotal}, submitted ${orderData.total_cents}`);
    }

    // Validate transition (null -> created is allowed)
    assertAllowedTransition(null, 'created');

    // **SERVER TRANSACTION: Prevent race conditions**
    // Use a database transaction to ensure atomicity
    const { data: transactionResult, error: transactionError } = await supabase.rpc('create_order_atomic', {
      p_venue_id: orderData.venue_id,
      p_session_id: orderData.session_id,
      p_subtotal_cents: orderData.subtotal_cents,
      p_tax_cents: orderData.tax_cents,
      p_total_cents: orderData.total_cents,
      p_tax_rate_bps: orderData.tax_rate_bps,
      p_service_fee_bps: orderData.service_fee_bps,
      p_items: JSON.stringify(orderData.items)
    });

    if (transactionError) {
      console.error('Atomic order creation failed:', transactionError);
      throw new Error(`Failed to create order atomically: ${transactionError.message}`);
    }

    if (!transactionResult || !transactionResult.order_id) {
      throw new Error('Order creation returned no result');
    }

    const order = {
      id: transactionResult.order_id,
      status: 'created',
      created_at: transactionResult.created_at || new Date().toISOString()
    };

    console.log('Order created successfully via transaction:', order.id);

    // **UPDATE IP RATE LIMITING**: Track successful order creation
    ipRateLimit.set(clientIP, now);

    // Log the order creation event
    await supabase.from('event_log').insert({
      venue_id: orderData.venue_id,
      order_id: order.id,
      type: 'order.created',
      actor: 'diner',
      payload: {
        total_cents: orderData.total_cents,
        item_count: orderData.items.length,
        session_id: orderData.session_id,
        table_id: session.table_id,
        client_ip: clientIP !== 'unknown' ? clientIP : undefined
      }
    });

    // Emit realtime event for order status change
    await supabase.channel(`venue:${orderData.venue_id}`)
      .send({
        type: 'broadcast',
        event: 'order_status_changed',
        payload: {
          order_id: order.id,
          status: 'created',
          previous_status: null,
          venue_id: orderData.venue_id,
          session_id: orderData.session_id,
          total_cents: orderData.total_cents,
          timestamp: order.created_at
        }
      });

    console.log('Order creation completed successfully:', {
      order_id: order.id,
      status: order.status,
      total_cents: orderData.total_cents
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        orderId: order.id, // Backward compatibility
        status: order.status,
        total_cents: orderData.total_cents,
        session_id: orderData.session_id,
        created_at: order.created_at,
        metadata: {
          venue_id: orderData.venue_id,
          table_id: session.table_id,
          item_count: orderData.items.length
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create order error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});