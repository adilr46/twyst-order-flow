import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ENV } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      ENV.STRIPE_WEBHOOK_SECRET || ''
    );

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      console.log('[stripe-webhook] Processing payment completion:', {
        orderId: orderId?.slice(0, 8),
        stripeSessionId: session.id
      });

      if (!orderId) {
        console.error('[stripe-webhook] Missing orderId in session metadata');
        return new Response('Invalid session metadata - missing orderId', { status: 400 });
      }

      // Get order - simplified validation
      const supabase = createServerSupabaseClient();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, payment_status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('[stripe-webhook] Order not found:', orderError);
        return new Response('Order not found', { status: 404 });
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid', // Changed from 'new' to 'paid' for FOH clarity
          provider_session_id: session.id,
          provider_payment_id: session.payment_intent as string,
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
