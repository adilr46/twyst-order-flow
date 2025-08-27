#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  VENUE_ID: process.env.CHAOS_VENUE_ID || '550e8400-e29b-41d4-a716-446655440000',
  SESSION_ID: process.env.CHAOS_SESSION_ID || '550e8400-e29b-41d4-a716-446655440001',
  ITEM_ID: process.env.CHAOS_ITEM_ID || '550e8400-e29b-41d4-a716-446655440002',
}

// Initialize client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY)

async function setupChaosTest() {
  console.log('🔧 Setting up Chaos Test Data...')

  try {
    // 1. Create test venue if it doesn't exist
    console.log('📍 Creating test venue...')
    const { error: venueError } = await supabase
      .from('venues')
      .upsert({
        id: CONFIG.VENUE_ID,
        name: 'Chaos Test Venue',
        slug: 'chaos-test',
        currency: 'usd',
        owner_id: '00000000-0000-0000-0000-000000000000', // System user
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (venueError && venueError.code !== '23505') { // Ignore unique constraint violations
      throw new Error(`Failed to create venue: ${venueError.message}`)
    }

    // 2. Create test table if it doesn't exist
    console.log('🪑 Creating test table...')
    const { error: tableError } = await supabase
      .from('tables')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440003',
        venue_id: CONFIG.VENUE_ID,
        name: 'Chaos Test Table',
        token: 'chaos-test-token',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (tableError && tableError.code !== '23505') {
      throw new Error(`Failed to create table: ${tableError.message}`)
    }

    // 3. Create test session if it doesn't exist
    console.log('🪑 Creating test session...')
    const { error: sessionError } = await supabase
      .from('sessions')
      .upsert({
        id: CONFIG.SESSION_ID,
        venue_id: CONFIG.VENUE_ID,
        table_id: '550e8400-e29b-41d4-a716-446655440003',
        status: 'open',
        opened_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (sessionError && sessionError.code !== '23505') {
      throw new Error(`Failed to create session: ${sessionError.message}`)
    }

    // 4. Create test item if it doesn't exist
    console.log('🍔 Creating test item...')
    const { error: itemError } = await supabase
      .from('items')
      .upsert({
        id: CONFIG.ITEM_ID,
        venue_id: CONFIG.VENUE_ID,
        name: 'Chaos Test Burger',
        description: 'A delicious burger for chaos testing',
        price_cents: 1500,
        category: 'Main Course',
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (itemError && itemError.code !== '23505') {
      throw new Error(`Failed to create item: ${itemError.message}`)
    }

    // 5. Clean up any existing test orders
    console.log('🧹 Cleaning up existing test orders...')
    const { error: cleanupError } = await supabase
      .from('orders')
      .delete()
      .eq('venue_id', CONFIG.VENUE_ID)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (cleanupError) {
      console.warn(`Warning: Failed to cleanup orders: ${cleanupError.message}`)
    }

    // 6. Clean up any existing test stripe events
    console.log('🧹 Cleaning up existing test stripe events...')
    const { error: stripeCleanupError } = await supabase
      .from('stripe_events')
      .delete()
      .like('id', 'evt_chaos_%')

    if (stripeCleanupError) {
      console.warn(`Warning: Failed to cleanup stripe events: ${stripeCleanupError.message}`)
    }

    // 7. Clean up any existing test event logs
    console.log('🧹 Cleaning up existing test event logs...')
    const { error: logCleanupError } = await supabase
      .from('event_log')
      .delete()
      .eq('actor', 'chaos-test')

    if (logCleanupError) {
      console.warn(`Warning: Failed to cleanup event logs: ${logCleanupError.message}`)
    }

    console.log('✅ Chaos test setup complete!')
    console.log()
    console.log('📋 Test Configuration:')
    console.log(`   Venue ID: ${CONFIG.VENUE_ID}`)
    console.log(`   Session ID: ${CONFIG.SESSION_ID}`)
    console.log(`   Item ID: ${CONFIG.ITEM_ID}`)
    console.log()
    console.log('🚀 Ready to run chaos tests:')
    console.log('   npm run chaos:quick    # Quick test (3 orders, 20% failure rate)')
    console.log('   npm run chaos          # Standard test (5 orders, 30% failure rate)')
    console.log('   npm run chaos:stress   # Stress test (10 orders, 50% failure rate)')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  setupChaosTest()
}

export { setupChaosTest }



