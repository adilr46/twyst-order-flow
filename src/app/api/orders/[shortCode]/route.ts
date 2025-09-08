import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    console.log('[order-lookup] Looking up order:', shortCode);

    if (!shortCode) {
      return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
    }

    // Get order details (without updated_at)
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .select(`
        id,
        short_code,
        status,
        subtotal_cents,
        tax_cents,
        total_cents,
        created_at,
        venue_id,
        table_id
      `)
      .eq('short_code', shortCode)
      .single();

    if (orderError || !order) {
      console.error('[order-lookup] Order not found:', {
        error: orderError,
        short_code: shortCode,
        message: orderError?.message || 'Order not found'
      });
      return NextResponse.json({ 
        error: 'Order not found',
        details: orderError?.message || 'Order not found'
      }, { status: 404 });
    }

    // Get venue details
    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .select('name, slug')
      .eq('id', order.venue_id)
      .single();

    if (venueError) {
      console.error('[order-lookup] Failed to fetch venue:', venueError);
      return NextResponse.json({ error: 'Failed to fetch venue details' }, { status: 500 });
    }

    // Get table details
    const { data: table, error: tableError } = await supabaseServer
      .from('tables')
      .select('label')
      .eq('id', order.table_id)
      .single();

    if (tableError) {
      console.error('[order-lookup] Failed to fetch table:', tableError);
      return NextResponse.json({ error: 'Failed to fetch table details' }, { status: 500 });
    }

    // Get order items with menu item details using JOIN
    const { data: orderItems, error: itemsError } = await supabaseServer
      .from('order_items')
      .select(`
        id,
        qty,
        price_cents,
        item_description,
        items:menu_items(
          id,
          name,
          description,
          category
        )
      `)
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('[order-lookup] Failed to fetch order items:', {
        error: itemsError,
        orderId: order.id,
        shortCode: shortCode
      });
      return NextResponse.json({ 
        error: 'Failed to fetch order items',
        details: itemsError.message || 'Unknown error'
      }, { status: 500 });
    }

    // Transform the JOINed data
    const itemsWithDetails = orderItems?.map((item: any) => {
      const menuItem = item.items?.[0];
      return {
        id: item.id,
        qty: item.qty,
        price_cents: item.price_cents,
        item_description: item.item_description, // Use stored item name
        menu_item: {
          id: menuItem?.id || 'unknown',
          name: item.item_description || menuItem?.name || 'Unknown Item', // Prefer stored name
          description: menuItem?.description || '',
          category: menuItem?.category || 'Unknown',
        }
      };
    }) || [];

    // Format the response (without updated_at)
    const formattedOrder = {
      id: order.id,
      short_code: order.short_code,
      status: order.status,
      subtotal_cents: order.subtotal_cents,
      tax_cents: order.tax_cents,
      total_cents: order.total_cents,
      created_at: order.created_at,
      venue: {
        name: venue?.name || 'Unknown',
        slug: venue?.slug || 'unknown',
      },
      table: {
        label: table?.label || 'Unknown',
      },
      items: itemsWithDetails
    };

    console.log('[order-lookup] Success:', { 
      orderId: order.id, 
      shortCode: order.short_code,
      status: order.status 
    });

    return NextResponse.json(formattedOrder);

  } catch (error) {
    console.error('[order-lookup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
