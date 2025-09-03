const http = require('http');

const testData = JSON.stringify({
  venueSlug: 'demo-cafe',
  cart: [{
    id: 'item-1',
    name: 'Test Burger',
    unit_price_cents: 1200,
    qty: 1,
    notes: null
  }]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/checkout/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('🧪 Testing checkout creation...');
console.log('Request data:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(testData);
req.end();
