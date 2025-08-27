import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabaseServer'
import { captureExceptionWithVenue, addBreadcrumbWithVenue } from '@/lib/sentry'
import { ENV } from '@/env'

// Initialize Stripe with secret key (only if available)
const stripe = ENV.STRIPE_SECRET_KEY ? new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
}) : null;

const webhookSecret = ENV.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  let eventId: string | undefined

  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook processing not configured' },
        { status: 503 }
      );
    }

    // Get the raw body for Stripe signature verification
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Add Sentry breadcrumb for webhook processing
    addBreadcrumbWithVenue(
      'Stripe webhook received',
      'webhook',
      undefined,
      { signature_length: signature.length }
    )

    // Verify webhook signature using Stripe SDK
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    eventId = event.id
    console.log(`Processing webhook event: ${event.type} (${eventId})`)

    // Create Supabase client with service role for full access
    const supabaseClient = await createServiceClient()

    // Check for duplicate events by inserting event.id into stripe_events
    const { error: insertError } = await supabaseClient
      .from('stripe_events')
      .insert({ id: event.id } as any)

    if (insertError) {
      // If insert fails due to unique constraint, this is a duplicate
      if (insertError.code === '23505') { // PostgreSQL unique constraint violation
        console.log(`Duplicate event ${event.id}, returning 200`)
        return NextResponse.json({ received: true, duplicate: true })
      }
      
      // Other insert errors should be logged and handled
      console.error('Failed to insert stripe event:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabaseClient, event)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    // Log to console and capture in Sentry
    console.error('Webhook error:', {
      eventId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      details: error?.toString()
    })

    // Capture error in Sentry with event context
    captureExceptionWithVenue(
      error instanceof Error ? error : new Error(String(error)),
      undefined, // No specific venue for webhook errors
      { 
        eventId,
        endpoint: '/api/stripe-webhook'
      }
    )

    // Always return 200 after logging to avoid webhook retry loops
    // Stripe will retry failed webhooks, but we want to avoid infinite loops
    // for errors we've already processed and logged
    return NextResponse.json({ 
      received: true, 
      error: 'Internal error logged' 
    }, { status: 200 })
  }
}

async function handleCheckoutCompleted(supabaseClient: any, event: Stripe.Event) {
  try {
    const session = event.data.object as Stripe.Checkout.Session
    const stripeSessionId = session.id

    console.log(`Processing checkout completed for session: ${stripeSessionId}`)

    // Add Sentry breadcrumb for checkout completion
    addBreadcrumbWithVenue(
      'Checkout session completed',
      'payment',
      undefined,
      { stripe_session_id: stripeSessionId }
    )

    // Find the order by Stripe session ID
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('id, venue_id, status, stripe_session_id')
      .eq('stripe_session_id', stripeSessionId)
      .single()

    if (orderError || !order) {
      console.error('Order not found for stripe session:', stripeSessionId, orderError)
      
      // Capture error in Sentry with session context
      captureExceptionWithVenue(
        new Error(`Order not found for session ${stripeSessionId}`),
        undefined,
        { stripe_session_id: stripeSessionId }
      )
      
      throw new Error(`Order not found for session ${stripeSessionId}`)
    }

    // Check if order is already paid to avoid duplicate processing
    if (order.status === 'paid') {
      console.log(`Order ${order.id} already marked as paid, skipping`)
      return
    }

    // Update order status to paid and store stripe_session_id (if not already stored)
    const updateData: any = { status: 'paid' }
    if (!order.stripe_session_id) {
      updateData.stripe_session_id = stripeSessionId
    }

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData as any)
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order status:', updateError)
      
      // Capture error in Sentry with venue context
      captureExceptionWithVenue(
        new Error(`Failed to update order ${order.id}: ${updateError.message}`),
        order.venue_id,
        { 
          order_id: order.id,
          stripe_session_id: stripeSessionId
        }
      )
      
      throw new Error(`Failed to update order ${order.id}: ${updateError.message}`)
    }

    // Log the payment event to event_log
    const { error: logError } = await supabaseClient
      .from('event_log')
      .insert({
        venue_id: order.venue_id,
        order_id: order.id,
        type: 'order.paid',
        actor: 'stripe-webhook',
        payload: {
          stripe_session_id: stripeSessionId,
          stripe_event_id: event.id,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency
        }
      } as any)

    if (logError) {
      console.error('Failed to log payment event:', logError)
      // Don't throw here - the order update was successful
    }

    console.log(`Order ${order.id} marked as paid successfully`)

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error)
    throw error // Re-throw to be handled by main error handler
  }
}
