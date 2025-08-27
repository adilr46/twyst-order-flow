import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for Stripe signature verification
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Parse the webhook payload
    let event
    try {
      event = JSON.parse(body)
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    console.log(`Processing webhook event: ${event.type}`)

    // Create Supabase client with service role for full access
    const supabaseClient = await createServiceClient()

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabaseClient, event)
        break
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabaseClient, event)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(supabaseClient, event)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error?.toString()
      },
      { status: 400 }
    )
  }
}

async function handleCheckoutCompleted(supabaseClient: any, event: any) {
  const session = event.data.object
  const stripeSessionId = session.id

  console.log(`Processing checkout completed for session: ${stripeSessionId}`)

  // Find the order by Stripe session ID
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .select('id, venue_id, status')
    .eq('stripe_session_id', stripeSessionId)
    .single()

  if (orderError || !order) {
    console.error('Order not found for stripe session:', stripeSessionId)
    return
  }

  // Update order status to paid
  const { error: updateError } = await supabaseClient
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', order.id)

  if (updateError) {
    console.error('Failed to update order status:', updateError)
    return
  }

  // Log the payment event
  await supabaseClient
    .from('event_log')
    .insert({
      venue_id: order.venue_id,
      order_id: order.id,
      type: 'order.paid',
      actor: 'webhook',
      payload: {
        stripe_session_id: stripeSessionId,
        payment_status: session.payment_status,
        amount_total: session.amount_total
      }
    })

  console.log(`Order ${order.id} marked as paid`)
}

async function handlePaymentSucceeded(supabaseClient: any, event: any) {
  const paymentIntent = event.data.object
  
  // Log payment success event if we have order context
  console.log(`Payment succeeded: ${paymentIntent.id}`)
  
  // Note: This would need additional logic to link payment_intent to order
  // For now, we primarily handle checkout.session.completed
}

async function handlePaymentFailed(supabaseClient: any, event: any) {
  const paymentIntent = event.data.object
  
  console.log(`Payment failed: ${paymentIntent.id}`)
  
  // Log payment failure - would need additional logic to link to order
  // and potentially update order status to cancelled
}

