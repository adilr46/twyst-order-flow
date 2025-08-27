import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StuckOrder {
  id: string;
  venue_id: string;
  stripe_session_id: string;
  status: string;
  created_at: string;
  total_cents: number;
}

interface ProcessingResult {
  processed: number;
  errors: number;
  stuck_orders: StuckOrder[];
  error_details: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-12-18.acacia",
    });

    console.log("Starting stuck payment reprocessing job...");

    // Find orders that might be stuck:
    // 1. Status is 'created' (not paid in our DB)
    // 2. Has a stripe_session_id (payment was initiated)
    // 3. Created more than 10 minutes ago (allow time for normal processing)
    // 4. Less than 24 hours old (don't process very old orders)
    const { data: stuckOrders, error: queryError } = await supabaseClient
      .from('orders')
      .select('id, venue_id, stripe_session_id, status, created_at, total_cents')
      .eq('status', 'created')
      .not('stripe_session_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .lte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // At least 10 minutes old

    if (queryError) {
      throw new Error(`Failed to query stuck orders: ${queryError.message}`);
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      console.log("No stuck orders found");
      return new Response(
        JSON.stringify({ 
          message: "No stuck orders found", 
          processed: 0, 
          errors: 0 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Found ${stuckOrders.length} potentially stuck orders`);

    const result: ProcessingResult = {
      processed: 0,
      errors: 0,
      stuck_orders: [],
      error_details: []
    };

    // Process each stuck order
    for (const order of stuckOrders) {
      try {
        await processStuckOrder(supabaseClient, stripe, order, result);
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error);
        result.errors++;
        result.error_details.push(`Order ${order.id}: ${error.message}`);
      }
    }

    console.log(`Reprocessing complete. Processed: ${result.processed}, Errors: ${result.errors}`);

    return new Response(
      JSON.stringify({
        message: "Stuck payment reprocessing completed",
        ...result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Stuck payment reprocessing error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function processStuckOrder(
  supabaseClient: any, 
  stripe: Stripe, 
  order: StuckOrder, 
  result: ProcessingResult
) {
  console.log(`Processing potentially stuck order: ${order.id} (Stripe: ${order.stripe_session_id})`);

  // Update attempt tracking
  await updateAttemptCount(supabaseClient, order.stripe_session_id);

  try {
    // Check the actual status in Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    
    console.log(`Stripe session ${order.stripe_session_id} status: ${stripeSession.payment_status}`);

    // If Stripe shows it as paid but our DB shows created, fix it
    if (stripeSession.payment_status === 'paid' && order.status === 'created') {
      console.log(`Found stuck order ${order.id} - Stripe paid but DB shows created`);
      
      result.stuck_orders.push(order);
      
      // Update order status to paid
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        throw new Error(`Failed to update order status: ${updateError.message}`);
      }

      // Log the recovery event
      await supabaseClient
        .from('event_log')
        .insert({
          venue_id: order.venue_id,
          order_id: order.id,
          type: 'order.recovered',
          actor: 'cron-reprocessor',
          payload: {
            stripe_session_id: order.stripe_session_id,
            stripe_payment_status: stripeSession.payment_status,
            stripe_amount_total: stripeSession.amount_total,
            recovery_reason: 'stuck_payment_detected',
            original_status: order.status,
            recovered_at: new Date().toISOString()
          }
        });

      // Notify FOH via realtime (this will trigger the useOrders subscription)
      await supabaseClient
        .from('orders')
        .update({ 
          updated_at: new Date().toISOString() // Trigger realtime update
        })
        .eq('id', order.id);

      console.log(`Successfully recovered stuck order ${order.id}`);
      result.processed++;
      
    } else if (stripeSession.payment_status === 'unpaid' || stripeSession.payment_status === 'no_payment_required') {
      // Payment is legitimately not completed yet, this is not stuck
      console.log(`Order ${order.id} is not stuck - Stripe shows: ${stripeSession.payment_status}`);
      
    } else {
      console.log(`Order ${order.id} has unexpected status combination - Stripe: ${stripeSession.payment_status}, DB: ${order.status}`);
    }

  } catch (stripeError: any) {
    if (stripeError.code === 'resource_missing') {
      console.log(`Stripe session ${order.stripe_session_id} not found - may be expired`);
      
      // Log that we couldn't find the Stripe session
      await supabaseClient
        .from('event_log')
        .insert({
          venue_id: order.venue_id,
          order_id: order.id,
          type: 'order.stripe_session_missing',
          actor: 'cron-reprocessor',
          payload: {
            stripe_session_id: order.stripe_session_id,
            error: 'stripe_session_not_found',
            checked_at: new Date().toISOString()
          }
        });
        
    } else {
      throw stripeError; // Re-throw other Stripe errors
    }
  }
}

async function updateAttemptCount(supabaseClient: any, stripeSessionId: string) {
  // Update or insert attempt tracking
  const { error } = await supabaseClient
    .from('stripe_events')
    .upsert({
      id: `reprocess_${stripeSessionId}`,
      attempt_count: 1,
      last_attempt_at: new Date().toISOString()
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    });

  if (error) {
    // If upsert failed, try to increment existing record
    await supabaseClient.rpc('increment_stripe_event_attempts', {
      event_id: `reprocess_${stripeSessionId}`,
      increment_by: 1
    });
  }
}



