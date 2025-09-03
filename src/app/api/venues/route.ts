import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { devLog } from '@/lib/devLog';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VenueRequestSchema = z.object({
  slug: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request
    const body = await req.json();
    const { slug } = VenueRequestSchema.parse(body);
    
    devLog('venues-api:request', { slug: slug?.slice(0, 10) });

    // 2. Get venue details
    const supabase = createServerSupabaseClient();
    const { data: venue, error: lookupError } = await supabase
      .from('venues')
      .select('id, slug, name, currency, timezone')
      .eq('slug', slug)
      .single();

    if (lookupError) {
      devLog('venues-api:lookup-error', { error: lookupError.message });
      console.error('Venue lookup error:', lookupError);
      return NextResponse.json({ 
        error: 'Venue not found',
        debug: lookupError.message
      }, { status: 404 });
    }

    if (!venue) {
      devLog('venues-api:not-found', { slug });
      return NextResponse.json({ 
        error: 'Venue not found',
        debug: { searchedSlug: slug }
      }, { status: 404 });
    }

    devLog('venues-api:success', { 
      venueId: venue.id?.slice(0, 8), 
      slug: venue.slug 
    });
    
    return NextResponse.json({ venue });

  } catch (error) {
    devLog('venues-api:exception', { error: error instanceof Error ? error.message : String(error) });
    console.error('Unhandled error in venue lookup:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}