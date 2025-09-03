import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

const CheckoutRequestSchema = z.object({
  venueSlug: z.string(),
  orderId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const body = await req.json();
    const { venueSlug, orderId } = CheckoutRequestSchema.parse(body);

    console.log('[checkout-create] Request:', { venueSlug, orderId: orderId.slice(0, 8) });

    // Get order details - simplified validation
    const supabase = createServerSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_cents, status, venue_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[checkout-create] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get venue details
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, currency')
      .eq('id', order.venue_id)
      .single();

    if (venueError || !venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Create Stripe checkout session
    console.log('[checkout-create] Creating Stripe session for order:', {
      orderId: order.id.slice(0, 8),
      total: order.total_cents
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: venue.currency.toLowerCase(),
          product_data: {
            name: `Order #${order.id.slice(0, 8)}`,
          },
          unit_amount: order.total_cents,
        },
        quantity: 1,
      }],
      success_url: `${ENV.NEXT_PUBLIC_APP_URL}/d/${venueSlug}/order/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV.NEXT_PUBLIC_APP_URL}/d/${venueSlug}`,
      metadata: {
        orderId: order.id,
        venueId: venue.id,
      },
    });

    console.log('[checkout-create] Stripe session created:', session.id);

    // Return checkout URL
    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}