import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    console.log('[webhook-debug] Debug endpoint called');
    
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    };

    // Test Supabase connection
    let supabaseTest: { connected: boolean; error: string | null } = { connected: false, error: null };
    try {
      const { data, error } = await supabaseServer
        .from('orders')
        .select('id, status, payment_intent, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      supabaseTest = { connected: !error, error: error?.message || null };
    } catch (err) {
      supabaseTest = { connected: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }

    // Get recent orders
    let recentOrders: any[] = [];
    try {
      const { data, error } = await supabaseServer
        .from('orders')
        .select('id, short_code, status, payment_intent, created_at, total_cents')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        recentOrders = data.map(order => ({
          id: order.id.slice(0, 8),
          short_code: order.short_code,
          status: order.status,
          payment_intent: order.payment_intent ? order.payment_intent.slice(0, 20) + '...' : null,
          created_at: order.created_at,
          total_cents: order.total_cents
        }));
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseTest,
      recent_orders: recentOrders,
      message: 'Webhook debug endpoint working'
    });

  } catch (error) {
    console.error('[webhook-debug] Error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
