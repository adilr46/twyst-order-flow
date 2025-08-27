import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabaseServer'
import { captureExceptionWithVenue, addBreadcrumbWithVenue } from '@/lib/sentry'
import { ENV } from '@/env'

// Initialize Stripe with secret key (only if available)
const stripe = ENV.STRIPE_SECRET_KEY ? new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

// Request validation schema
const CheckoutRequestSchema = z.object({
  orderId: z.string().uuid(),
  venueId: z.string().uuid(),
  table: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await req.json()
    const { orderId, venueId, table } = CheckoutRequestSchema.parse(body)

    // Add Sentry breadcrumb for checkout initiation
    addBreadcrumbWithVenue(
      'Checkout initiated',
      'payment',
      venueId,
      { orderId, table }
    )

    // Create Supabase client with service role
    const supabaseClient = await createServiceClient()

    // Fetch order and validate status
    const { data: order, error: orderError } = await (supabaseClient
      .from('orders') as any)
      .select(`
        id,
        status,
        venue_id,
        venues (
          slug,
          name,
          currency
        ),
        order_items (
          id,
          qty,
          unit_price_cents,
          items (
            name
          )
        )
      `)
      .eq('id', orderId)
      .eq('venue_id', venueId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Type assertion for the complex query result
    const typedOrder = order as {
      id: string
      status: string
      venue_id: string
      venues: {
        slug: string
        name: string
        currency: string
      } | null
      order_items: Array<{
        id: string
        qty: number
        unit_price_cents: number
        items: {
          name: string
        } | null
      }>
    }

    // Assert order status is 'created'
    if (typedOrder.status !== 'created') {
      return NextResponse.json(
        { error: `Order status is '${typedOrder.status}', expected 'created'` },
        { status: 400 }
      )
    }

    // Recompute line items from DB (order_items.unit_price_cents * qty)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = typedOrder.order_items.map((item) => ({
      price_data: {
        currency: typedOrder.venues?.currency || 'usd',
        product_data: {
          name: item.items?.name || 'Menu Item',
        },
        unit_amount: item.unit_price_cents,
      },
      quantity: item.qty,
    }))

    // Calculate total for validation
    const totalCents = typedOrder.order_items.reduce(
      (sum: number, item) => sum + (item.unit_price_cents * item.qty),
      0
    )

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Order has no items' },
        { status: 400 }
      )
    }

    // Get venue slug for success URL
    const venueSlug = typedOrder.venues?.slug
    if (!venueSlug) {
      return NextResponse.json(
        { error: 'Venue slug not found' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/d/${venueSlug}/order?orderId=${orderId}`,
      cancel_url: `${req.nextUrl.origin}/d/${venueSlug}`,
      metadata: {
        orderId,
        venueId,
        table,
      },
    })

    // Update order with Stripe session ID
    const { error: updateError } = await (supabaseClient
      .from('orders') as any)
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to update order with Stripe session ID:', updateError)
      // Continue anyway since the session was created successfully
    }

    // Log checkout event
    await supabaseClient
      .from('event_log')
      .insert({
        venue_id: venueId,
        order_id: orderId,
        type: 'checkout.initiated',
        actor: 'api',
        payload: {
          stripe_session_id: session.id,
          table,
          total_cents: totalCents,
        }
      } as any)

    // Return only the checkout URL
    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Checkout error:', error)

    // Capture error in Sentry with venue context
    captureExceptionWithVenue(
      error,
      undefined,
      { 
        endpoint: '/api/checkout'
      }
    )

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Payment processing error', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error?.toString()
      },
      { status: 500 }
    )
  }
}
