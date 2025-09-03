import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { venueSlug } = await req.json();
    if (!venueSlug) {
      return NextResponse.json({ error: 'venueSlug required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, created_at, total_cents,
        sessions ( tables ( label ) ),
        order_items ( quantity, unit_price_cents, items ( name ) ),
        venues!inner ( slug )
      `)
      .eq('venues.slug', venueSlug)
      .in('status', ['created', 'paid', 'accepted', 'in_prep', 'ready'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('FOH orders list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data ?? [] }, { status: 200 });
  } catch (e) {
    console.error('FOH orders list exception:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

