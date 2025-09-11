import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ENV } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize Stripe only if secret key is available
const stripe = ENV.STRIPE_SECRET_KEY ? new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
}) : null;

export async function GET() {
  return NextResponse.json({ ok: true });
}

// Optional: helps avoid 405 on CORS preflight from some tools
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type,stripe-signature",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !ENV.STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe-webhook] Stripe not configured:', {
        hasStripe: !!stripe,
        hasWebhookSecret: !!ENV.STRIPE_WEBHOOK_SECRET
      });
      return new Response('Stripe not configured', { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      ENV.STRIPE_WEBHOOK_SECRET
    );

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      // Accept snake_case → camelCase → client_reference_id fallback
      const orderId =
        (session.metadata?.order_id as string) ||
        (session.metadata?.orderId as string) ||
        (session.client_reference_id as string);

      console.log('[stripe-webhook] Processing payment completion:', {
        orderId: orderId ? orderId.slice(0, 8) : undefined,
        stripeSessionId: session.id,
        hasMetadata: !!session.metadata?.order_id,
        hasClientRef: !!session.client_reference_id,
      });

      if (!orderId) {
        console.error('[stripe-webhook] Missing orderId in metadata & client_reference_id', {
          metadata: session.metadata,
          client_reference_id: session.client_reference_id
        });
        // No-op: return 200 to keep Stripe happy; nothing to do without an order id
        return new Response(null, { status: 200 });
      }

      // Get order - simplified validation
      const supabase = createServerSupabaseClient();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, payment_intent')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('[stripe-webhook] Order not found:', orderError);
        return new Response('Order not found', { status: 404 });
      }

      // Only advance created -> paid; idempotent otherwise
      if (order.status !== 'created') {
        console.log('[stripe-webhook] No-op for status:', order.status);
        return new Response(null, { status: 200 });
      }

      const now = new Date().toISOString();

      // Update order status using columns that actually exist
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_intent: session.payment_intent as string,
          // Using payment_intent column instead of paid_at
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[stripe-webhook] Failed to update order:', updateError);
        return new Response('Failed to update order', { status: 500 });
      }

      console.log('[stripe-webhook] Order updated successfully:', {
        orderId: orderId.slice(0, 8),
        status: 'paid'
      });
    }

    return new Response(null, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Unknown error',
      { status: 400 }
    );
  }
}
