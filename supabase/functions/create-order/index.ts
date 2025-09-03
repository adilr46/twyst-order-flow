// @ts-ignore -- Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateOrderRequest {
  venue_id: string;
  session_id: string;
  items: Array<{
    item_id: string;
    quantity: number;
    unit_price_cents: number;
    notes?: string | null;
  }>;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  tax_rate_bps: number;
  service_fee_bps: number;
}

// @ts-ignore -- Deno runtime
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for database operations
    // @ts-ignore -- Deno runtime
    const supabaseUrl = Deno.env.get('DATABASE_URL');
    // @ts-ignore -- Deno runtime
    const supabaseServiceKey = Deno.env.get('DATABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      throw new Error('Missing required environment variables: DATABASE_URL or DATABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parse request
    const request: CreateOrderRequest = await req.json();

    // Validate request
    if (!request.venue_id || !request.session_id || !request.items || request.items.length === 0) {
      throw new Error('Invalid request: missing venue_id, session_id, or items');
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        venue_id: request.venue_id,
        session_id: request.session_id,
        status: 'created',
        payment_status: 'pending',
        subtotal_cents: request.subtotal_cents,
        tax_cents: request.tax_cents,
        tax_rate_bps: request.tax_rate_bps,
        service_fee_cents: Math.round((request.subtotal_cents * request.service_fee_bps) / 10000),
        service_fee_bps: request.service_fee_bps,
        total_cents: request.total_cents,
        currency: 'GBP',
        payment_provider: 'stripe'
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error('Failed to create order');
    }

    // Create order items
    const orderItems = request.items.map(item => ({
      order_id: order.id,
      item_id: item.item_id,
      name: '', // Will be populated from items table
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity,
      subtotal_cents: item.unit_price_cents * item.quantity,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error('Failed to create order items');
    }

    return new Response(
      JSON.stringify({ 
        orderId: order.id,
        total: request.total_cents
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});