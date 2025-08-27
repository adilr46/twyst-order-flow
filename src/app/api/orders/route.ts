import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabaseServer'
import { captureExceptionWithVenue, addBreadcrumbWithVenue } from '@/lib/sentry'

// Create order request schema
const CreateOrderSchema = z.object({
  sessionId: z.string().uuid(),
  venueId: z.string().uuid(),
  items: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPriceCents: z.number().int().min(0),
    notes: z.string().optional()
  })).min(1)
})

// Update order status schema
const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['created', 'paid', 'accepted', 'in_prep', 'ready', 'served', 'cancelled']),
  venueId: z.string().uuid()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, venueId, items } = CreateOrderSchema.parse(body)

    addBreadcrumbWithVenue(
      'Order creation started',
      'order',
      venueId,
      { sessionId, itemCount: items.length }
    )

    const supabaseClient = await createServiceClient()

    // Use the atomic order creation RPC function
    // Calculate total
    const totalCents = items.reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0)

    // Create order - using type assertion to bypass strict typing
    const { data: order, error: orderError } = await (supabaseClient
      .from('orders') as any)
      .insert({
        session_id: sessionId,
        venue_id: venueId,
        status: 'created',
        total_cents: totalCents,
        subtotal_cents: totalCents
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      
      captureExceptionWithVenue(
        new Error(`Order creation failed: ${orderError?.message}`),
        venueId,
        { sessionId, error: orderError?.message }
      )

      return NextResponse.json(
        { error: orderError?.message || 'Failed to create order' },
        { status: 400 }
      )
    }

    console.log('Order created successfully:', order)

    return NextResponse.json({
      orderId: order.id,
      status: 'created',
      totalCents: totalCents
    })

  } catch (error) {
    console.error('Order creation error:', error)
    
    captureExceptionWithVenue(
      error,
      undefined,
      { endpoint: '/api/orders' }
    )

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const venueId = searchParams.get('venueId')
    const sessionId = searchParams.get('sessionId')
    const orderId = searchParams.get('orderId')

    if (!venueId) {
      return NextResponse.json(
        { error: 'venueId is required' },
        { status: 400 }
      )
    }

    const supabaseClient = await createServiceClient()

    let query = (supabaseClient
      .from('orders') as any)
      .select(`
        id,
        status,
        total_cents,
        created_at,
        updated_at,
        stripe_session_id,
        sessions (
          id,
          tables (
            label,
            token
          )
        ),
        order_items (
          id,
          qty,
          unit_price_cents,
          notes,
          items (
            id,
            name,
            description,
            image_url
          )
        )
      `)
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    if (orderId) {
      query = query.eq('id', orderId).single()
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders: orderId ? [data] : data })

  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, status, venueId } = UpdateOrderStatusSchema.parse(body)

    addBreadcrumbWithVenue(
      'Order status update',
      'order',
      venueId,
      { orderId, newStatus: status }
    )

    const supabaseClient = await createServiceClient()

    // Update order status
    const { data, error } = await (supabaseClient
      .from('orders') as any)
      .update({ status })
      .eq('id', orderId)
      .eq('venue_id', venueId)
      .select('id, status, venue_id')
      .single()

    if (error) {
      console.error('Failed to update order status:', error)
      
      captureExceptionWithVenue(
        new Error(`Failed to update order ${orderId}: ${error.message}`),
        venueId,
        { orderId, status, error: error.message }
      )

      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    // Log the status change
    await (supabaseClient
      .from('event_log') as any)
      .insert({
        venue_id: venueId,
        order_id: orderId,
        type: `order.${status}`,
        actor: 'api',
        payload: { previous_status: data?.status, new_status: status }
      })

    return NextResponse.json({
      orderId: data?.id,
      status: data?.status
    })

  } catch (error) {
    console.error('Update order status error:', error)
    
    captureExceptionWithVenue(
      error,
      undefined,
      { endpoint: '/api/orders PATCH' }
    )

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


