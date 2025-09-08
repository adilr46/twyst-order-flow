import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log('[venue-lookup] Looking up venue:', slug);

    if (!slug) {
      return NextResponse.json({ error: 'Venue slug is required' }, { status: 400 });
    }

    // Get venue details
    const { data: venue, error: venueError } = await supabaseServer
      .from('venues')
      .select(`
        id,
        name,
        slug,
        currency,
        created_at
      `)
      .eq('slug', slug)
      .single();

    if (venueError || !venue) {
      console.error('[venue-lookup] Venue not found:', venueError);
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    console.log('[venue-lookup] Success:', { 
      venue_id: venue.id, 
      name: venue.name,
      slug: venue.slug 
    });

    const response = NextResponse.json(venue);
    
    // Cache venue data (venues rarely change)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200'); // 1hr cache, 2hr stale
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=7200'); // CDN cache for 2 hours
    
    return response;

  } catch (error) {
    console.error('[venue-lookup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



