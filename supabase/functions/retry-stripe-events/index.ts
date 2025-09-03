import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting Stripe events retry job");

    // Create Supabase client with service role for full access
// @ts-ignore -- Deno runtime
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_DB_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find orders that are stuck in 'created' status but might have been paid
    // Look for orders created more than 5 minutes ago to avoid processing too early
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: stuckOrders, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, stripe_session_id, venue_id, status, created_at")
      .eq("status", "created")
      .not("stripe_session_id", "is", null)
      .lt("created_at", fiveMinutesAgo)
      .limit(50); // Process in batches

    if (ordersError) {
      console.error("Error fetching stuck orders:", ordersError);
      throw ordersError;
    }

    if (!stuckOrders || stuckOrders.length === 0) {
      console.log("No stuck orders found");
      return new Response(
        JSON.stringify({ message: "No stuck orders found", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Found ${stuckOrders.length} potentially stuck orders`);

    let processedCount = 0;
    let updatedCount = 0;

    for (const order of stuckOrders) {
      try {
        console.log(`Processing order ${order.id} with Stripe session ${order.stripe_session_id}`);
        
        // Check the Stripe session status
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        
        console.log(`Stripe session ${session.id} status: ${session.payment_status}`);

        // Update attempt tracking in stripe_events table
        const eventId = `retry_${order.id}_${Date.now()}`;
        await supabaseClient
          .from("stripe_events")
          .upsert({
            id: eventId,
            attempt_count: 1, // This will be incremented if already exists
            last_attempt_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        // If the Stripe session shows payment is complete, update the order
        if (session.payment_status === "paid") {
          console.log(`Updating order ${order.id} to paid status`);
          
          // Update order status to paid
          const { error: updateError } = await supabaseClient
            .from("orders")
            .update({ status: "paid" })
            .eq("id", order.id);

          if (updateError) {
            console.error(`Error updating order ${order.id}:`, updateError);
            continue;
          }

          // Log the retry success event
          await supabaseClient
            .from("event_log")
            .insert({
              venue_id: order.venue_id,
              order_id: order.id,
              type: "order.paid.retry",
              actor: "system",
              payload: {
                stripe_session_id: order.stripe_session_id,
                payment_status: session.payment_status,
                retry_reason: "stuck_order_recovery",
                original_created_at: order.created_at
              }
            });

          updatedCount++;
          console.log(`Successfully updated order ${order.id} from created to paid`);
        } else {
          console.log(`Order ${order.id} Stripe session not yet paid: ${session.payment_status}`);
          
          // Log that we checked but no action was needed
          await supabaseClient
            .from("event_log")
            .insert({
              venue_id: order.venue_id,
              order_id: order.id,
              type: "order.retry.checked",
              actor: "system",
              payload: {
                stripe_session_id: order.stripe_session_id,
                payment_status: session.payment_status,
                retry_reason: "payment_not_complete"
              }
            });
        }

        processedCount++;

      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
        
        // Log the retry failure
        await supabaseClient
          .from("event_log")
          .insert({
            venue_id: order.venue_id,
            order_id: order.id,
            type: "order.retry.failed",
            actor: "system",
            payload: {
              stripe_session_id: order.stripe_session_id,
              error: orderError.message,
              retry_reason: "processing_error"
            }
          });
      }
    }

    // Update attempt count for processed events
    if (processedCount > 0) {
      // Increment attempt count for all events we just processed
      await supabaseClient.rpc('increment_stripe_event_attempts', {
        processed_count: processedCount
      }).catch(err => {
        console.warn("Failed to increment attempt counts:", err);
      });
    }

    const result = {
      message: "Stripe events retry job completed",
      total_found: stuckOrders.length,
      processed: processedCount,
      updated: updatedCount,
      timestamp: new Date().toISOString()
    };

    console.log("Retry job completed:", result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },  
        status: 200,
      }
    );

  } catch (error) {
    console.error("Stripe retry job error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});