import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for full access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the request body
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Parse the webhook payload
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      throw new Error("Invalid JSON payload");
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle different webhook events
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabaseClient, event);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(supabaseClient, event);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(supabaseClient, event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

async function handleCheckoutCompleted(supabaseClient: any, event: any) {
  const session = event.data.object;
  const stripeSessionId = session.id;

  console.log(`Processing checkout completed for session: ${stripeSessionId}`);

  // Find the order by Stripe session ID
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .select("id, venue_id, status")
    .eq("stripe_session_id", stripeSessionId)
    .single();

  if (orderError || !order) {
    console.error("Order not found for stripe session:", stripeSessionId);
    return;
  }

  // Update order status to paid
  const { error: updateError } = await supabaseClient
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id);

  if (updateError) {
    console.error("Failed to update order status:", updateError);
    return;
  }

  // Log the payment event
  await supabaseClient
    .from("event_log")
    .insert({
      venue_id: order.venue_id,
      order_id: order.id,
      type: "order.paid",
      actor: "webhook",
      payload: {
        stripe_session_id: stripeSessionId,
        payment_status: session.payment_status,
        amount_total: session.amount_total
      }
    });

  console.log(`Order ${order.id} marked as paid`);
}

async function handlePaymentSucceeded(supabaseClient: any, event: any) {
  const paymentIntent = event.data.object;
  
  // Log payment success event if we have order context
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  // Note: This would need additional logic to link payment_intent to order
  // For now, we primarily handle checkout.session.completed
}

async function handlePaymentFailed(supabaseClient: any, event: any) {
  const paymentIntent = event.data.object;
  
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  // Log payment failure - would need additional logic to link to order
  // and potentially update order status to cancelled
}