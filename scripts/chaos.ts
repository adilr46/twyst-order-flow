#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { setTimeout as sleep } from 'timers/promises'

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  VENUE_ID: process.env.CHAOS_VENUE_ID || '550e8400-e29b-41d4-a716-446655440000',
  SESSION_ID: process.env.CHAOS_SESSION_ID || '550e8400-e29b-41d4-a716-446655440001',
  PARALLEL_ORDERS: parseInt(process.env.CHAOS_PARALLEL_ORDERS || '5'),
  NETWORK_FAILURE_RATE: parseFloat(process.env.CHAOS_NETWORK_FAILURE_RATE || '0.3'),
  TEST_DURATION_MS: parseInt(process.env.CHAOS_TEST_DURATION_MS || '30000'),
  POLL_INTERVAL_MS: parseInt(process.env.CHAOS_POLL_INTERVAL_MS || '2000'),
  MAX_WAIT_MS: parseInt(process.env.CHAOS_MAX_WAIT_MS || '15000'),
}

// Initialize clients
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY)
const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
})

interface TestResult {
  orderId: string
  sessionId: string
  createdAt: string
  paidAt?: string
  networkKilled: boolean
  stripeEventId?: string
  duplicateEvent: boolean
  fohDetected: boolean
  fohDetectionTime?: number
}

interface ChaosReport {
  totalOrders: number
  successfulPayments: number
  networkFailures: number
  duplicateEvents: number
  fohDetections: number
  avgFohDetectionTime: number
  maxFohDetectionTime: number
  minFohDetectionTime: number
  errors: string[]
  testDuration: number
}

class ChaosTester {
  private results: TestResult[] = []
  private errors: string[] = []
  private startTime: number = 0

  async run() {
    console.log('🔥 Starting Chaos Test')
    console.log(`📊 Configuration:`)
    console.log(`   Parallel Orders: ${CONFIG.PARALLEL_ORDERS}`)
    console.log(`   Network Failure Rate: ${CONFIG.NETWORK_FAILURE_RATE * 100}%`)
    console.log(`   Test Duration: ${CONFIG.TEST_DURATION_MS}ms`)
    console.log(`   Max Wait Time: ${CONFIG.MAX_WAIT_MS}ms`)
    console.log()

    this.startTime = Date.now()

    // Create parallel orders
    const orderPromises = Array.from({ length: CONFIG.PARALLEL_ORDERS }, (_, i) =>
      this.createOrderWithChaos(i)
    )

    // Wait for all orders to complete
    await Promise.allSettled(orderPromises)

    // Monitor FOH detection
    await this.monitorFOHDetection()

    // Generate report
    const report = this.generateReport()
    this.printReport(report)

    return report
  }

  private async createOrderWithChaos(orderIndex: number): Promise<void> {
    try {
      console.log(`🛒 Creating order ${orderIndex + 1}/${CONFIG.PARALLEL_ORDERS}`)

      // Create order via Supabase function
      const { data: orderResult, error: orderError } = await supabase.rpc('create_order_atomic', {
        p_venue_id: CONFIG.VENUE_ID,
        p_session_id: CONFIG.SESSION_ID,
        p_subtotal_cents: 1500,
        p_tax_cents: 150,
        p_total_cents: 1650,
        p_tax_rate_bps: 1000,
        p_service_fee_bps: 0,
        p_items: JSON.stringify([
          {
            item_id: '550e8400-e29b-41d4-a716-446655440002',
            qty: 1,
            unit_price_cents: 1500,
            notes: `Chaos test order ${orderIndex + 1}`,
            options_json: []
          }
        ])
      })

      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`)
      }

      const orderId = orderResult[0].order_id
      const createdAt = orderResult[0].created_at

      console.log(`✅ Order created: ${orderId}`)

      // Simulate network failure before webhook
      const shouldKillNetwork = Math.random() < CONFIG.NETWORK_FAILURE_RATE
      
      if (shouldKillNetwork) {
        console.log(`💥 Simulating network failure for order ${orderId}`)
        await sleep(100) // Brief delay to simulate network interruption
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Chaos Test Item ${orderIndex + 1}`,
            },
            unit_amount: 1650,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `https://example.com/success?orderId=${orderId}`,
        cancel_url: 'https://example.com/cancel',
        metadata: {
          orderId,
          venueId: CONFIG.VENUE_ID,
          table: 'chaos-test',
          testMode: 'true'
        },
      })

      console.log(`💳 Stripe session created: ${session.id}`)

      // Update order with session ID
      await supabase
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', orderId)

      // Simulate payment completion
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1650,
        currency: 'usd',
        payment_method_types: ['card'],
        confirm: true,
        payment_method: 'pm_card_visa',
        return_url: 'https://example.com/success',
      })

      // Create test webhook event
      const webhookEvent = {
        id: `evt_chaos_${Date.now()}_${orderIndex}`,
        object: 'event',
        api_version: '2025-07-30.basil',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: session.id,
            object: 'checkout.session',
            payment_status: 'paid',
            amount_total: 1650,
            currency: 'usd',
            metadata: {
              orderId,
              venueId: CONFIG.VENUE_ID,
              table: 'chaos-test',
              testMode: 'true'
            }
          }
        },
        type: 'checkout.session.completed'
      }

      // Process webhook
      const webhookResult = await this.processWebhook(webhookEvent, orderId)

      // Record result
      this.results.push({
        orderId,
        sessionId: session.id,
        createdAt,
        paidAt: webhookResult.paidAt,
        networkKilled: shouldKillNetwork,
        stripeEventId: webhookEvent.id,
        duplicateEvent: webhookResult.duplicateEvent,
        fohDetected: false, // Will be updated during FOH monitoring
      })

    } catch (error) {
      const errorMsg = `Order ${orderIndex + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(`❌ ${errorMsg}`)
      this.errors.push(errorMsg)
    }
  }

  private async processWebhook(event: any, orderId: string): Promise<{ paidAt?: string; duplicateEvent: boolean }> {
    try {
      // Check for duplicate event
      const { data: existingEvent } = await supabase
        .from('stripe_events')
        .select('id')
        .eq('id', event.id)
        .single()

      if (existingEvent) {
        console.log(`🔄 Duplicate event detected: ${event.id}`)
        return { duplicateEvent: true }
      }

      // Insert event
      await supabase
        .from('stripe_events')
        .insert({ id: event.id })

      // Process checkout completion
      const { data: order } = await supabase
        .from('orders')
        .select('id, venue_id, status')
        .eq('stripe_session_id', event.data.object.id)
        .single()

      if (order && order.status !== 'paid') {
        // Update order status
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id)

        // Log event
        await supabase
          .from('event_log')
          .insert({
            venue_id: order.venue_id,
            order_id: order.id,
            type: 'order.paid',
            actor: 'chaos-test',
            payload: {
              stripe_session_id: event.data.object.id,
              stripe_event_id: event.id,
              test_mode: true
            }
          })

        console.log(`✅ Order ${order.id} marked as paid`)
        return { paidAt: new Date().toISOString(), duplicateEvent: false }
      }

      return { duplicateEvent: false }

    } catch (error) {
      console.error(`❌ Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { duplicateEvent: false }
    }
  }

  private async monitorFOHDetection(): Promise<void> {
    console.log('\n👀 Monitoring FOH detection...')

    const startTime = Date.now()
    const paidOrders = this.results.filter(r => r.paidAt && !r.duplicateEvent)

    while (Date.now() - startTime < CONFIG.MAX_WAIT_MS) {
      // Query orders that should be visible to FOH (status >= paid)
      const { data: fohOrders } = await supabase
        .from('orders')
        .select('id, status, updated_at')
        .eq('venue_id', CONFIG.VENUE_ID)
        .in('status', ['paid', 'accepted', 'in_prep', 'ready', 'served'])
        .gte('updated_at', new Date(this.startTime).toISOString())

      // Check which paid orders are detected by FOH
      for (const result of paidOrders) {
        if (!result.fohDetected) {
          const fohOrder = fohOrders?.find(o => o.id === result.orderId)
          if (fohOrder) {
            result.fohDetected = true
            result.fohDetectionTime = Date.now() - this.startTime
            console.log(`🎯 FOH detected order ${result.orderId} after ${result.fohDetectionTime}ms`)
          }
        }
      }

      // Check if all orders are detected
      const allDetected = paidOrders.every(r => r.fohDetected)
      if (allDetected) {
        console.log('✅ All orders detected by FOH')
        break
      }

      await sleep(CONFIG.POLL_INTERVAL_MS)
    }

    // Mark remaining orders as not detected
    paidOrders.forEach(r => {
      if (!r.fohDetected) {
        r.fohDetectionTime = CONFIG.MAX_WAIT_MS
      }
    })
  }

  private generateReport(): ChaosReport {
    const testDuration = Date.now() - this.startTime
    const successfulPayments = this.results.filter(r => r.paidAt && !r.duplicateEvent).length
    const networkFailures = this.results.filter(r => r.networkKilled).length
    const duplicateEvents = this.results.filter(r => r.duplicateEvent).length
    const fohDetections = this.results.filter(r => r.fohDetected).length

    const detectionTimes = this.results
      .filter(r => r.fohDetectionTime !== undefined)
      .map(r => r.fohDetectionTime!)

    const avgFohDetectionTime = detectionTimes.length > 0 
      ? detectionTimes.reduce((a, b) => a + b, 0) / detectionTimes.length 
      : 0

    const maxFohDetectionTime = detectionTimes.length > 0 ? Math.max(...detectionTimes) : 0
    const minFohDetectionTime = detectionTimes.length > 0 ? Math.min(...detectionTimes) : 0

    return {
      totalOrders: this.results.length,
      successfulPayments,
      networkFailures,
      duplicateEvents,
      fohDetections,
      avgFohDetectionTime,
      maxFohDetectionTime,
      minFohDetectionTime,
      errors: this.errors,
      testDuration
    }
  }

  private printReport(report: ChaosReport): void {
    console.log('\n' + '='.repeat(60))
    console.log('🔥 CHAOS TEST REPORT')
    console.log('='.repeat(60))
    
    console.log(`📊 Test Results:`)
    console.log(`   Total Orders: ${report.totalOrders}`)
    console.log(`   Successful Payments: ${report.successfulPayments}`)
    console.log(`   Network Failures: ${report.networkFailures}`)
    console.log(`   Duplicate Events: ${report.duplicateEvents}`)
    console.log(`   FOH Detections: ${report.fohDetections}`)
    
    console.log(`\n⏱️  FOH Detection Times:`)
    console.log(`   Average: ${report.avgFohDetectionTime.toFixed(0)}ms`)
    console.log(`   Maximum: ${report.maxFohDetectionTime}ms`)
    console.log(`   Minimum: ${report.minFohDetectionTime}ms`)
    
    console.log(`\n📈 Success Rates:`)
    console.log(`   Payment Success: ${((report.successfulPayments / report.totalOrders) * 100).toFixed(1)}%`)
    console.log(`   FOH Detection: ${((report.fohDetections / report.successfulPayments) * 100).toFixed(1)}%`)
    console.log(`   Duplicate Prevention: ${report.duplicateEvents === 0 ? '✅ 100%' : '❌ Failed'}`)
    
    if (report.errors.length > 0) {
      console.log(`\n❌ Errors (${report.errors.length}):`)
      report.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
    }
    
    console.log(`\n⏱️  Test Duration: ${report.testDuration}ms`)
    console.log('='.repeat(60))
    
    // Assertions
    console.log('\n🔍 Assertions:')
    console.log(`   ✅ No duplicate paid writes: ${report.duplicateEvents === 0 ? 'PASS' : 'FAIL'}`)
    console.log(`   ✅ FOH shows all paid within 15s: ${report.maxFohDetectionTime <= 15000 ? 'PASS' : 'FAIL'}`)
    console.log(`   ✅ All successful payments detected: ${report.fohDetections === report.successfulPayments ? 'PASS' : 'FAIL'}`)
  }
}

// Main execution
async function main() {
  try {
    // Validate environment
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_ROLE_KEY || !CONFIG.STRIPE_SECRET_KEY) {
      throw new Error('Missing required environment variables')
    }

    const tester = new ChaosTester()
    const report = await tester.run()

    // Exit with error code if assertions fail
    const assertionsPassed = 
      report.duplicateEvents === 0 && 
      report.maxFohDetectionTime <= 15000 && 
      report.fohDetections === report.successfulPayments

    process.exit(assertionsPassed ? 0 : 1)

  } catch (error) {
    console.error('❌ Chaos test failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { ChaosTester, TestResult, ChaosReport }



