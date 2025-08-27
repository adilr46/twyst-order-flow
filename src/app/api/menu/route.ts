import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const venueId = searchParams.get('venueId')
    const category = searchParams.get('category')

    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId is required' },
        { status: 400 }
      )
    }

    const supabaseClient = await createServiceClient()

    let query = (supabaseClient
      .from('items') as any)
      .select(`
        id,
        name,
        description,
        price_cents,
        category,
        image_url,
        is_active,
        created_at
      `)
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (category) {
      query = query.eq('category', category)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Failed to fetch menu items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch menu items' },
        { status: 500 }
      )
    }

    // Group items by category
    const categorizedItems = items.reduce((acc: any, item: any) => {
      const category = item.category || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {})

    // Get category counts
    const categories = Object.keys(categorizedItems).map(categoryName => ({
      id: categoryName.toLowerCase().replace(/\s+/g, '-'),
      label: categoryName,
      count: categorizedItems[categoryName].length
    }))

    return NextResponse.json({
      items,
      categorizedItems,
      categories
    })

  } catch (error) {
    console.error('Get menu error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


