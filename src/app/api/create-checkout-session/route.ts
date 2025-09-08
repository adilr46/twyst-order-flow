import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import Stripe from 'stripe';

// Runtime configuration
export const runtime = 'nodejs';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { venueSlug, tableToken, items, subtotal_cents, tax_cents, total_cents } = await req.json();

    console.log('[checkout-create] Request:', { 
      venueSlug, 
      tableToken: tableToken?.slice(0, 8), 
      total_cents 
    });

    // Validate required fields
    if (!venueSlug || !tableToken || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: venueSlug, tableToken, items' },
        { status: 400 }
      );
    }

    // 1. Parallel lookups for table and venue (FASTER!)
    const [tableResult, venueResult] = await Promise.all([
      supabaseServer
        .from('tables')
        .select('id, venue_id, label')
        .eq('token', tableToken)
        .single(),
      supabaseServer
        .from('venues')
        .select('id, name, slug, currency')
        .eq('slug', venueSlug)
        .single()
    ]);

    const { data: table, error: tableError } = tableResult;
    const { data: venue, error: venueError } = venueResult;

    if (tableError || !table) {
      console.error('[checkout-create] Table not found:', tableError);
      return NextResponse.json({ error: 'Invalid table token' }, { status: 400 });
    }

    if (venueError || !venue) {
      console.error('[checkout-create] Venue not found:', venueError);
      return NextResponse.json({ error: 'Venue not found' }, { status: 400 });
    }

    // 2. Verify table belongs to venue
    if (table.venue_id !== venue.id) {
      console.error('[checkout-create] Table does not belong to venue');
      return NextResponse.json({ error: 'Invalid table for this venue' }, { status: 400 });
    }

    // 3. Create order in database
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        venue_id: venue.id,
        table_id: table.id,
        status: 'created',
        subtotal_cents,
        tax_cents,
        total_cents,
        short_code: generateShortCode(), // Generate unique short code
      })
      .select('id, short_code')
      .single();

    if (orderError || !order) {
      console.error('[checkout-create] Order creation failed:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 5. Create order items (using existing table structure)
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      item_id: item.id,
      qty: item.qty,
      price_cents: item.price_cents,
      item_description: item.name || null, // Store item name in item_description
    }));

    const { error: orderItemsError } = await supabaseServer
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('[checkout-create] Order items creation failed:', orderItemsError);
      // Clean up the order if items fail
      await supabaseServer.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // 6. Create Stripe checkout session
    // Get the base URL from the request headers (works for both laptop and phone)
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: venue.currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.description || undefined,
          },
          unit_amount: item.price_cents,
        },
        quantity: item.qty,
      })),
      mode: 'payment',
      success_url: `${baseUrl}/o/${order.short_code}?success=true`,
      cancel_url: `${baseUrl}/d/${venueSlug}?t=${tableToken}&cancelled=true`,
      client_reference_id: order.id, // Robust fallback identifier
      metadata: {
        venueId: venue.id,
        orderId: order.id,
        tableId: table.id,
        tableLabel: table.label,
        venueName: venue.name,
      },
      customer_email: undefined, // Optional: collect customer email
      allow_promotion_codes: true,
    });

    console.log('[checkout-create] Success:', { 
      orderId: order.id, 
      shortCode: order.short_code,
      stripeSessionId: session.id 
    });

    return NextResponse.json({ 
      url: session.url,
      orderId: order.id,
      shortCode: order.short_code,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('[checkout-create] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a unique short code for the order
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
