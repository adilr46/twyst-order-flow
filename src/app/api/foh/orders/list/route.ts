import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    let venueSlug;
    try {
      const body = await req.json();
      venueSlug = body.venueSlug;
    } catch (jsonError) {
      console.error('[foh-orders-list] JSON parsing error:', jsonError);
      console.error('[foh-orders-list] Request body might be empty or malformed');
      return NextResponse.json({ 
        error: 'Invalid JSON in request body. Make sure to send { venueSlug: "your-venue-slug" }' 
      }, { status: 400 });
    }
    
    console.log('[foh-orders-list v3] Request for venue:', venueSlug);

    if (!venueSlug) {
      return NextResponse.json({ error: 'venueSlug is required' }, { status: 400 });
    }

    // First get the venue ID from the slug
    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .select('id')
      .eq('slug', venueSlug)
      .single();

    if (venueError || !venue) {
      console.error('[foh-orders-list] Venue not found:', venueError);
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Get orders with related data using JOINs for efficiency
    const { data: orders, error: ordersError } = await supabaseServer
      .from('orders')
      .select(`
        id,
        short_code,
        status,
        subtotal_cents,
        tax_cents,
        total_cents,
        created_at,
        table:tables!table_id(label),
        order_items(
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
        )
      `)
      .eq('venue_id', venue.id)
      .in('status', ['paid', 'in_prep', 'ready', 'served'])
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[foh-orders-list] Failed to fetch orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Transform the JOINed data (no additional queries needed)
    const ordersWithDetails = orders?.map((order: any) => {
      // Extract table info from JOIN
      const tableLabel = order.table?.label || 'Unknown';

      // Transform order items with menu item details from JOIN
      const itemsWithDetails = order.order_items?.map((item: any) => {
        const menuItem = item.items?.[0];
        return {
          id: item.id,
          qty: item.qty,
          price_cents: item.price_cents,
          item_description: item.item_description,
          menu_item: {
            id: menuItem?.id || 'unknown',
            name: item.item_description || menuItem?.name || 'Unknown Item', // Prefer stored item_description
            description: menuItem?.description || '',
            category: menuItem?.category || 'Unknown',
          }
        };
      }) || [];

      return {
        id: order.id,
        short_code: order.short_code,
        status: order.status,
        subtotal_cents: order.subtotal_cents,
        tax_cents: order.tax_cents,
        total_cents: order.total_cents,
        created_at: order.created_at,
        table: {
          label: tableLabel,
        },
        order_items: itemsWithDetails
      };
    }) || [];

    console.log('[foh-orders-list] Success:', { 
      venue_slug: venueSlug, 
      total_orders: ordersWithDetails.length,
      statuses: [...new Set(ordersWithDetails.map(o => o.status))]
    });

    return NextResponse.json({
      venue_slug: venueSlug,
      orders: ordersWithDetails,
      total_orders: ordersWithDetails.length
    });

  } catch (error) {
    console.error('[foh-orders-list] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
