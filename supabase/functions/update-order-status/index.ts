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
function assertAllowedTransition(currentStatus: OrderStatus, nextStatus: OrderStatus): void {
  const allowedNextStates = VALID_TRANSITIONS[currentStatus];
  if (!allowedNextStates.includes(nextStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${nextStatus}. Allowed: ${allowedNextStates.join(', ')}`);
  }
}

interface UpdateOrderStatusRequest {
  order_id: string;
  status: OrderStatus;
  actor?: string;
}

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

    const { order_id, status: nextStatus, actor = 'system' }: UpdateOrderStatusRequest = await req.json();

    // Validate required fields
    if (!order_id) throw new Error('order_id is required');
    if (!nextStatus) throw new Error('status is required');

    console.log('Updating order status:', { order_id, nextStatus, actor });

    // Get current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, venue_id, session_id, total_cents')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const currentStatus = order.status as OrderStatus;

    // Validate transition is allowed
    assertAllowedTransition(currentStatus, nextStatus);

    // Skip update if status is already correct
    if (currentStatus === nextStatus) {
      console.log('Order status already correct:', { order_id, status: nextStatus });
      return new Response(
        JSON.stringify({
          success: true,
          order_id,
          status: nextStatus,
          previous_status: currentStatus,
          changed: false
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      console.error('Failed to update order status:', updateError);
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    console.log('Order status updated successfully:', {
      order_id,
      from: currentStatus,
      to: nextStatus
    });

    // Log the status change event
    await supabase.from('event_log').insert({
      venue_id: order.venue_id,
      order_id: order.id,
      type: `order.${nextStatus}`,
      actor,
      payload: {
        previous_status: currentStatus,
        new_status: nextStatus,
        total_cents: order.total_cents,
        session_id: order.session_id
      }
    });

    // Emit realtime event for order status change
    await supabase.channel(`venue:${order.venue_id}`)
      .send({
        type: 'broadcast',
        event: 'order_status_changed',
        payload: {
          order_id: order.id,
          status: nextStatus,
          previous_status: currentStatus,
          venue_id: order.venue_id,
          session_id: order.session_id,
          total_cents: order.total_cents,
          timestamp: updatedOrder.updated_at,
          actor
        }
      });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        status: nextStatus,
        previous_status: currentStatus,
        changed: true,
        updated_at: updatedOrder.updated_at,
        metadata: {
          venue_id: order.venue_id,
          session_id: order.session_id,
          actor
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update order status error:', error);
    
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