// Test database connection and venue lookup
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these manually for testing
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', url ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? 'SET' : 'MISSING');

if (!url || !serviceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    const { data, error } = await supabase.from('venues').select('count');
    if (error) {
      console.error('Connection error:', error);
      return;
    }
    console.log('✅ Connection successful');

    console.log('\n2. Listing all venues...');
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('id, slug, name, currency, timezone');
    
    if (venuesError) {
      console.error('Venues query error:', venuesError);
      return;
    }
    
    console.log('Found venues:', venues);
    
    console.log('\n3. Looking for demo-cafe specifically...');
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, slug, name, currency, timezone')
      .eq('slug', 'demo-cafe')
      .single();
    
    if (venueError) {
      console.error('Demo-cafe lookup error:', venueError);
      return;
    }
    
    if (venue) {
      console.log('✅ Found demo-cafe:', venue);
    } else {
      console.log('❌ demo-cafe not found');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection();
