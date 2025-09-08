import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    console.log('[webhook-test] Testing order update:', { orderId, status });

    // Test updating an order
    const { data, error } = await supabaseServer
      .from('orders')
      .update({
        status: status || 'paid',
        payment_intent: 'test_payment_intent_' + Date.now(),
      })
      .eq('id', orderId)
      .select('id, status, payment_intent');

    if (error) {
      console.error('[webhook-test] Update failed:', error);
      return NextResponse.json({ error: 'Update failed', details: error }, { status: 500 });
    }

    console.log('[webhook-test] Update successful:', data);

    return NextResponse.json({
      success: true,
      updated: data,
      message: 'Order updated successfully'
    });

  } catch (error) {
    console.error('[webhook-test] Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
