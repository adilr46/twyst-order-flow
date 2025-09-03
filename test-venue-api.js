const http = require('http');

const testData = JSON.stringify({
  slug: 'demo-cafe'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/venues',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('🚀 Testing venue lookup for demo-cafe...');

const req = http.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('🔍 Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('❌ Could not parse as JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.write(testData);
req.end();

