import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Initialize Supabase with SERVICE ROLE KEY (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for full access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Define valid status transitions - strict progression only
const VALID_TRANSITIONS: Record<string, string> = {
  'paid': 'in_prep',
  'in_prep': 'ready',
  'ready': 'served',
  'served': 'served', // Terminal state
};

export async function POST(req: NextRequest) {
  try {
    // Check staff authentication (placeholder for now)
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return NextResponse.json(
        { error: 'Staff authentication required' },
        { status: 401 }
      );
    }

    const { orderId, newStatus } = await req.json();

    console.log('[foh-update] Request:', { orderId, newStatus });

    // Validate required fields
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, newStatus' },
        { status: 400 }
      );
    }

    // Validate status is one of the allowed values
    const allowedStatuses = ['paid', 'in_prep', 'ready', 'served'];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + allowedStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Get current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, venue_id, table_id, short_code')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[foh-update] Order not found:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Enforce strict status transitions
    const currentStatus = order.status;
    const expectedNextStatus = VALID_TRANSITIONS[currentStatus];
    
    if (newStatus !== expectedNextStatus) {
      return NextResponse.json(
        { 
          error: `Invalid status transition. Current: '${currentStatus}', expected next: '${expectedNextStatus}', received: '${newStatus}'` 
        },
        { status: 400 }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[foh-update] Failed to update order status:', updateError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    console.log('[foh-update] Success:', { 
      orderId: orderId, 
      oldStatus: currentStatus, 
      newStatus: newStatus 
    });

    return NextResponse.json({ 
      ok: true,
      orderId: orderId,
      oldStatus: currentStatus,
      newStatus: newStatus,
      shortCode: order.short_code
    });

  } catch (error) {
    console.error('[foh-update] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
