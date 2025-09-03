import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    console.log('[orders-api] Getting order:', orderId.slice(0, 8));

    const supabase = createServerSupabaseClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        session_id,
        status,
        payment_status,
        total_cents,
        created_at,
        venue_id,
        provider_session_id,
        provider_payment_id,
        order_items (
          id,
          quantity,
          unit_price_cents,
          name
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('[orders-api] Order lookup error:', error);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order) {
      console.error('[orders-api] Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('[orders-api] Order found:', {
      orderId: order.id.slice(0, 8),
      sessionId: order.session_id?.slice(0, 8),
      status: order.status,
      paymentStatus: order.payment_status
    });

    return NextResponse.json(order);

  } catch (error) {
    console.error('[orders-api] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

