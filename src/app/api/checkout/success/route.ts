import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { ENV } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export async function GET(req: NextRequest) {
  try {
    // Get session ID from URL
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');
    const venueSlug = searchParams.get('venue');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Update order status
    const supabase = createServerSupabaseClient();
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'new',
        provider_session_id: session.id,
        provider_payment_id: session.payment_intent as string,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Redirect to order status page
    return NextResponse.redirect(
      `${ENV.NEXT_PUBLIC_APP_URL}/d/${venueSlug}/order/${orderId}`
    );

  } catch (error) {
    console.error('Success route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}