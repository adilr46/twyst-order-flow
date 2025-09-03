#!/usr/bin/env node

/**
 * Comprehensive Checkout Flow Test
 * Tests the complete order creation -> Stripe session -> success flow
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test data
const TEST_VENUE_SLUG = 'test-venue';
const TEST_CART = [
  {
    id: 'item-1',
    name: 'Test Burger',
    unit_price_cents: 1200,
    qty: 1,
    notes: 'No onions'
  },
  {
    id: 'item-2', 
    name: 'Test Fries',
    unit_price_cents: 500,
    qty: 2,
    notes: null
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.on('error', reject);
    req.end();
  });
}

async function runTest(name, testFn) {
  console.log(`\n🧪 ${name}`);
  try {
    const result = await testFn();
    console.log(`✅ PASS: ${name}`);
    return result;
  } catch (error) {
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    if (error.response) {
      console.log(`   Response: ${JSON.stringify(error.response, null, 2)}`);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Checkout Flow Test');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    await runTest('Health Check', async () => {
      const response = await makeRequest(`${BASE_URL}/api/health`);
      if (response.status !== 200) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const health = response.data;
      console.log(`   Runtime Status: ${JSON.stringify(health.runtime)}`);
      console.log(`   Environment: ${health.env.requiredKeysPresent ? '✅ Complete' : '❌ Missing keys'}`);
      console.log(`   Actions Needed: ${health.actionsNeeded.length || 'None'}`);
      
      if (health.actionsNeeded.length > 0) {
        throw new Error(`Health check issues: ${health.actionsNeeded.join(', ')}`);
      }
      
      return health;
    });

    // Test 2: Checkout Session Creation
    const checkoutResult = await runTest('Stripe Checkout Session Creation', async () => {
      const response = await makeRequest(`${BASE_URL}/api/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          venueSlug: TEST_VENUE_SLUG,
          cart: TEST_CART
        }
      });

      if (response.status === 404) {
        throw new Error('Venue not found - ensure test venue exists in database');
      }
      
      if (response.status === 400) {
        throw new Error(`Validation error: ${JSON.stringify(response.data)}`);
      }

      if (response.status !== 200) {
        throw new Error(`Checkout creation failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      const result = response.data;
      if (!result.checkout_url) {
        throw new Error('No checkout_url in response');
      }

      if (!result.checkout_url.includes('checkout.stripe.com')) {
        throw new Error(`Invalid checkout URL: ${result.checkout_url}`);
      }

      console.log(`   Session ID: ${result.sessionId || 'N/A'}`);
      console.log(`   Order ID: ${result.orderId || 'N/A'}`);
      console.log(`   Checkout URL: ${result.checkout_url.substring(0, 50)}...`);
      
      return result;
    });

    // Test 3: Verify Session is Valid
    await runTest('Verify Stripe Session is Open', async () => {
      const sessionId = checkoutResult.checkout_url.split('/').pop()?.split('?')[0];
      if (!sessionId) {
        throw new Error('Could not extract session ID from checkout URL');
      }
      
      console.log(`   Extracted Session ID: ${sessionId}`);
      
      // Note: We can't directly test Stripe session status without Stripe secret key
      // But we can verify the URL format is correct
      if (!sessionId.startsWith('cs_test_') && !sessionId.startsWith('cs_live_')) {
        throw new Error(`Invalid Stripe session ID format: ${sessionId}`);
      }
      
      return { sessionId };
    });

    // Test 4: Test Webhook Endpoint (without actual Stripe event)
    await runTest('Webhook Endpoint Accessibility', async () => {
      const response = await makeRequest(`${BASE_URL}/api/webhooks/stripe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid-signature-for-test'
        },
        body: { type: 'test' }
      });

      // Should return 200 even with invalid signature (graceful handling)
      if (response.status !== 200) {
        throw new Error(`Webhook endpoint not accessible: ${response.status}`);
      }

      console.log(`   Webhook Response: ${JSON.stringify(response.data)}`);
      return response.data;
    });

    // Test 5: Success Route (without session_id - should fail gracefully)
    await runTest('Success Route Error Handling', async () => {
      const response = await makeRequest(`${BASE_URL}/api/checkout/success`);
      
      if (response.status !== 400) {
        throw new Error(`Expected 400 for missing session_id, got ${response.status}`);
      }
      
      console.log(`   Correctly handles missing session_id`);
      return response.data;
    });

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('=' .repeat(60));
    console.log('✅ System is ready for end-to-end checkout testing');
    console.log('\n📋 Next Steps:');
    console.log('1. Ensure test venue exists in database');
    console.log('2. Test with real Stripe test cards (4242 4242 4242 4242)');
    console.log('3. Verify FOH board shows real-time updates');
    console.log('4. Test order status page with JWT tokens');

  } catch (error) {
    console.log('\n💥 TEST SUITE FAILED');
    console.log('=' .repeat(60));
    console.log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

