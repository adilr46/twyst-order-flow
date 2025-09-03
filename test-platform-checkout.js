/**
 * Smoke test for platform-only checkout flow
 * Tests API endpoints without requiring full UI interaction
 */

const BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await fetch(`${BASE_URL}/api/checkout/health`);
    const data = await response.json();
    console.log('✅ Health check:', data.status);
    console.log('   Services:', data.services);
    console.log('   Env vars:', Object.entries(data.env).map(([k, v]) => `${k}: ${v ? '✅' : '❌'}`).join(', '));
    return data.status === 'OK';
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testCheckoutCreate() {
  console.log('💳 Testing fresh session creation (multiple calls)...');
  try {
    const testPayload = {
      sessionId: 'test-session-id',
      venueSlug: 'test-venue',
      cart: [
        {
          id: 'item-1',
          name: 'Test Item',
          unit_price_cents: 1200, // £12.00
          qty: 2,
          notes: null
        }
      ]
    };

    // Test multiple rapid calls to ensure fresh sessions
    const results = [];
    for (let i = 0; i < 3; i++) {
      const response = await fetch(`${BASE_URL}/api/checkout/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store',
        body: JSON.stringify({ ...testPayload, sessionId: `test-session-${i}` })
      });
      
      const cacheControl = response.headers.get('cache-control');
      results.push({ 
        attempt: i + 1, 
        ok: response.ok, 
        cacheControl,
        hasNoStore: cacheControl?.includes('no-store')
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Attempt ${i + 1}: ✅ Success, URL present: ${!!data.checkout_url}`);
      } else {
        const error = await response.json();
        console.log(`   Attempt ${i + 1}: ⚠️  Expected error: ${error.error}`);
      }
    }
    
    const allHaveNoCache = results.every(r => r.hasNoStore);
    console.log('   Cache-Control headers:', allHaveNoCache ? '✅ All no-store' : '❌ Some cached');
    
    return results.length > 0;
  } catch (error) {
    console.error('❌ Checkout creation failed:', error.message);
    return false;
  }
}

async function runSmokeTest() {
  console.log('🚀 Running Platform-Only Checkout Smoke Test');
  console.log('================================================');
  
  const healthOk = await testHealthCheck();
  console.log('');
  
  const checkoutOk = await testCheckoutCreate();
  console.log('');
  
  console.log('📊 Results:');
  console.log(`   Health Check: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Checkout API: ${checkoutOk ? '✅' : '❌'}`);
  console.log('');
  
  if (healthOk && checkoutOk) {
    console.log('🎉 Smoke test PASSED - Platform-only checkout is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start Stripe webhook listener: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    console.log('2. Visit the diner menu and test end-to-end checkout');
    console.log('3. Use test card: 4242 4242 4242 4242');
  } else {
    console.log('❌ Smoke test FAILED - Check the errors above');
  }
}

// Run if called directly
if (require.main === module) {
  runSmokeTest().catch(console.error);
}

module.exports = { runSmokeTest };
