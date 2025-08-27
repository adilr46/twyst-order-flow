import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Development only endpoint
  if (Deno.env.get("NODE_ENV") === "production") {
    return new Response(
      JSON.stringify({ error: 'Development endpoint not available in production' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: orderId' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the order and validate it's in 'created' status
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, venue_id, session_id, total_cents")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ 
          error: `Order not found: ${orderId}` 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (order.status !== 'created') {
      return new Response(
        JSON.stringify({ 
          error: `Order ${orderId} is not in 'created' status. Current status: ${order.status}` 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update order status to 'paid'
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select("id, status, venue_id, session_id, total_cents")
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update order status' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the payment event
    try {
      await supabase
        .from("event_log")
        .insert({
          actor: 'dev:mock-checkout',
          venue_id: order.venue_id,
          order_id: order.id,
          type: 'order.paid',
          payload: { 
            previous_status: 'created',
            new_status: 'paid',
            payment_method: 'mock',
            amount_cents: order.total_cents
          }
        });
    } catch (logError) {
      console.warn('Failed to log payment event:', logError);
    }

    console.log(`Mock payment completed for order ${orderId}: created → paid`);

    return new Response(
      JSON.stringify({ 
        success: true,
        order: updatedOrder,
        message: 'Mock payment completed successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Dev checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});