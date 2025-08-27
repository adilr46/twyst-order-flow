#!/usr/bin/env node

/**
 * 🚀 Twyst MVP - Complete Setup and Run Guide
 * This script will guide you through setting up and running the application
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Twyst MVP - Setup and Run Guide\n');

// Step 1: Check environment variables
console.log('📋 STEP 1: Environment Setup');
console.log('═══════════════════════════════════════════════════════════════');

const envPath = '.env.local';
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('⚠️  No .env.local file found. Creating template...\n');
  
  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Optional: Cron job security
CRON_SECRET=your_cron_secret_here

# Optional: Sentry (for error monitoring)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000`;

  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env.local template file');
  } catch (error) {
    console.log('❌ Could not create .env.local file automatically');
    console.log('📝 Please create .env.local manually with the following content:\n');
    console.log(envTemplate);
  }
  
  console.log('\n🔧 REQUIRED: Please update .env.local with your actual values:');
  console.log('   1. Get Supabase keys from: https://app.supabase.com/project/_/settings/api');
  console.log('   2. Get Stripe keys from: https://dashboard.stripe.com/apikeys');
  console.log('   3. Set up Stripe webhook endpoint for: http://localhost:3000/api/stripe-webhook');
  console.log('\n⏸️  Setup paused - please update .env.local and run this script again.\n');
  process.exit(0);
}

console.log('✅ Found .env.local file');

// Check if environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY'
];

const envContent = fs.readFileSync(envPath, 'utf8');
const missingVars = requiredEnvVars.filter(envVar => {
  return !envContent.includes(envVar) || envContent.includes(`${envVar}=your_`);
});

if (missingVars.length > 0) {
  console.log('⚠️  Please update these environment variables in .env.local:');
  missingVars.forEach(envVar => {
    console.log(`   - ${envVar}`);
  });
  console.log('\n📝 Get your keys from:');
  console.log('   • Supabase: https://app.supabase.com/project/_/settings/api');
  console.log('   • Stripe: https://dashboard.stripe.com/apikeys');
  console.log('\n⏸️  Please update .env.local and run this script again.\n');
  process.exit(0);
}

console.log('✅ Environment variables configured\n');

// Step 2: Database setup
console.log('📋 STEP 2: Database Setup');
console.log('═══════════════════════════════════════════════════════════════');

// Check if Supabase CLI is available
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI found');
  
  try {
    console.log('🔍 Checking Supabase status...');
    execSync('supabase status', { stdio: 'pipe' });
    console.log('✅ Supabase is running');
    
    console.log('🗄️  Applying database migrations and seed data...');
    execSync('supabase db reset', { stdio: 'inherit' });
    console.log('✅ Database setup complete');
    
  } catch (error) {
    console.log('⚠️  Supabase not running locally. Using remote database...');
    console.log('💡 Make sure your Supabase project has the necessary tables.');
    console.log('   You can apply the migrations manually from the supabase/migrations/ folder');
  }
  
} catch (error) {
  console.log('⚠️  Supabase CLI not found - using remote database');
  console.log('💡 Make sure your Supabase project is set up with:');
  console.log('   • All migrations from supabase/migrations/ applied');
  console.log('   • Seed data from supabase/seed.sql loaded');
}

console.log('');

// Step 3: Start the application
console.log('📋 STEP 3: Starting Application');
console.log('═══════════════════════════════════════════════════════════════');

console.log('🚀 Starting Next.js development server...\n');

// Start Next.js
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start development server');
  process.exit(1);
}



