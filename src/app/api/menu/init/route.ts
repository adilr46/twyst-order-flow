import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const venueSlug = searchParams.get('venueSlug');
    const tableToken = searchParams.get('tableToken');

    console.log('[menu-init] Request for venue:', venueSlug, 'table:', tableToken);

    if (!venueSlug || !tableToken) {
      return NextResponse.json({ error: 'venueSlug and tableToken are required' }, { status: 400 });
    }

    // Get venue and table in parallel first
    const [venueResult, tableResult] = await Promise.all([
      supabaseServer
        .from('venues')
        .select('id, name, slug, currency, created_at')
        .eq('slug', venueSlug)
        .single(),
      
      supabaseServer
        .from('tables')
        .select('id, venue_id, label, token, created_at')
        .eq('token', tableToken)
        .single()
    ]);

    if (venueResult.error || !venueResult.data) {
      console.error('[menu-init] Venue not found:', venueResult.error);
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    if (tableResult.error || !tableResult.data) {
      console.error('[menu-init] Table not found:', tableResult.error);
      return NextResponse.json({ error: 'Invalid table token' }, { status: 404 });
    }

    // Verify table belongs to venue
    if (tableResult.data.venue_id !== venueResult.data.id) {
      return NextResponse.json({ error: 'Invalid table for this venue' }, { status: 400 });
    }

    // Get menu items in parallel with the validation
    const { data: menuItems, error: menuError } = await supabaseServer
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price_cents,
        category,
        is_active
      `)
      .eq('venue_id', venueResult.data.id)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (menuError) {
      console.error('[menu-init] Failed to fetch menu items:', menuError);
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }

    // Group items by category
    const menuByCategory = menuItems?.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item.id,
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        category: item.category,
      });
      return acc;
    }, {} as Record<string, any[]>) || {};

    console.log('[menu-init] Success:', { 
      venue_id: venueResult.data.id, 
      table_id: tableResult.data.id,
      total_items: menuItems?.length || 0,
      categories: Object.keys(menuByCategory)
    });

    const response = NextResponse.json({
      venue: venueResult.data,
      table: tableResult.data,
      menu: menuByCategory,
      total_items: menuItems?.length || 0
    });
    
    // Cache the combined response
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600'); // 30min cache, 1hr stale
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600'); // CDN cache for 1 hour
    
    return response;

  } catch (error) {
    console.error('[menu-init] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
