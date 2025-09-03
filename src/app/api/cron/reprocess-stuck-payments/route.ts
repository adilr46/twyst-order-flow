import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ENV } from '@/env'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Initialize Stripe with secret key (only if available)
const stripe = ENV.STRIPE_SECRET_KEY ? new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null;

interface StuckOrder {
  id: string
  venue_id: string
  stripe_session_id: string
  status: string
  created_at: string
  total_cents: number
}

interface ProcessingResult {
  processed: number
  errors: number
  stuck_orders: StuckOrder[]
  error_details: string[]
}

export async function GET(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    // Verify this is coming from Vercel Cron or authorized source
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting stuck payment reprocessing job...')

    // Create Supabase client with service role
    const supabaseClient = createServerSupabaseClient()

    // Find potentially stuck orders using the database function
    const { data: stuckOrders, error: queryError } = await supabaseClient
      .rpc('find_stuck_orders', {
        min_age_minutes: 10,
        max_age_hours: 24
      } as any)

    if (queryError) {
      throw new Error(`Failed to query stuck orders: ${queryError.message}`)
    }

    if (!stuckOrders || (stuckOrders as any[])?.length === 0) {
      console.log('No stuck orders found')
      return NextResponse.json({
        message: 'No stuck orders found',
        processed: 0,
        errors: 0
      })
    }

    console.log(`Found ${(stuckOrders as any[])?.length} potentially stuck orders`)

    const result: ProcessingResult = {
      processed: 0,
      errors: 0,
      stuck_orders: [],
      error_details: []
    }

    // Process each stuck order
    for (const order of (stuckOrders as any[])) {
      try {
        await processStuckOrder(supabaseClient, order, result)
      } catch (error: any) {
        console.error(`Error processing order ${order.id}:`, error)
        result.errors++
        result.error_details.push(`Order ${order.id}: ${error.message}`)
      }
    }

    console.log(`Reprocessing complete. Processed: ${result.processed}, Errors: ${result.errors}`)

    return NextResponse.json({
      message: 'Stuck payment reprocessing completed',
      ...result
    })

  } catch (error: any) {
    console.error('Stuck payment reprocessing error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

async function processStuckOrder(
  supabaseClient: any,
  order: StuckOrder,
  result: ProcessingResult
) {
  console.log(`Processing potentially stuck order: ${order.id} (Stripe: ${order.stripe_session_id})`)

  // Update attempt tracking
  await supabaseClient.rpc('increment_stripe_event_attempts', {
    event_id: `reprocess_${order.stripe_session_id}`,
    increment_by: 1
  })

  try {
    // Check the actual status in Stripe
    const stripeSession = await stripe?.checkout.sessions.retrieve(order.stripe_session_id)

    if (!stripeSession) {
      throw new Error('Failed to retrieve Stripe session')
    }

    console.log(`Stripe session ${order.stripe_session_id} status: ${stripeSession.payment_status}`)

    // If Stripe shows it as paid but our DB shows created, fix it
    if (stripeSession.payment_status === 'paid' && order.status === 'created') {
      console.log(`Found stuck order ${order.id} - Stripe paid but DB shows created`)

      result.stuck_orders.push(order)

      // Use the database function to recover the order
      const { data: recoverySuccess, error: recoveryError } = await supabaseClient
        .rpc('recover_stuck_order', {
          order_id: order.id,
          stripe_session_id: order.stripe_session_id,
          stripe_payment_status: stripeSession.payment_status,
          stripe_amount_total: stripeSession.amount_total
        })

      if (recoveryError) {
        throw new Error(`Failed to recover order: ${recoveryError.message}`)
      }

      if (recoverySuccess) {
        // Trigger realtime notification to FOH by updating status
        await supabaseClient
          .from('orders')
          .update({
            status: 'paid' // This triggers the realtime subscription
          })
          .eq('id', order.id)

        console.log(`Successfully recovered stuck order ${order.id}`)
        result.processed++
      }

    } else if (stripeSession.payment_status === 'unpaid' || stripeSession.payment_status === 'no_payment_required') {
      // Payment is legitimately not completed yet, this is not stuck
      console.log(`Order ${order.id} is not stuck - Stripe shows: ${stripeSession.payment_status}`)

    } else {
      console.log(`Order ${order.id} has unexpected status combination - Stripe: ${stripeSession.payment_status}, DB: ${order.status}`)
    }

  } catch (stripeError: any) {
    if (stripeError.code === 'resource_missing') {
      console.log(`Stripe session ${order.stripe_session_id} not found - may be expired`)

      // Log that we couldn't find the Stripe session
      await supabaseClient
        .from('event_log')
        .insert({
          venue_id: order.venue_id,
          order_id: order.id,
          type: 'order.stripe_session_missing',
          actor: 'cron-reprocessor',
          payload: {
            stripe_session_id: order.stripe_session_id,
            error: 'stripe_session_not_found',
            checked_at: new Date().toISOString()
          }
        })

    } else {
      throw stripeError // Re-throw other Stripe errors
    }
  }
}
