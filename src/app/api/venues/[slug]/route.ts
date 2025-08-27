import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabaseServer'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const supabaseClient = await createServiceClient()

    const { data: venue, error } = await (supabaseClient
      .from('venues') as any)
      .select(`
        id,
        name,
        slug,
        currency,
        timezone,
        created_at,
        owner_id
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Failed to fetch venue:', error)
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ venue })

  } catch (error) {
    console.error('Get venue error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
