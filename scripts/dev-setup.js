#!/usr/bin/env node

/**
 * Development Setup Script for Twyst MVP
 * This script helps set up and run the complete full-stack application
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Twyst MVP Development Setup\n');

// Check if we're in the right directory
const packagePath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

console.log('🔍 Checking environment variables...');
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log('⚠️  Missing environment variables:');
  missingEnvVars.forEach(envVar => {
    console.log(`   - ${envVar}`);
  });
  console.log('\n📝 Please add these to your .env.local file\n');
}

// Check if Supabase is running
console.log('🔍 Checking Supabase status...');
try {
  execSync('supabase status', { stdio: 'pipe' });
  console.log('✅ Supabase is running');
} catch (error) {
  console.log('⚠️  Supabase not running, attempting to start...');
  try {
    execSync('supabase start', { stdio: 'inherit' });
    console.log('✅ Supabase started successfully');
  } catch (startError) {
    console.error('❌ Failed to start Supabase:', startError.message);
    console.log('\nPlease run: supabase start');
    process.exit(1);
  }
}

// Apply migrations and seed data
console.log('\n🗄️  Setting up database...');
try {
  console.log('   Applying migrations...');
  execSync('supabase db reset', { stdio: 'inherit' });
  
  console.log('   Loading seed data...');
  execSync('supabase db reset --with-seed', { stdio: 'inherit' });
  
  console.log('✅ Database setup complete');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}

// Install dependencies if needed
console.log('\n📦 Checking dependencies...');
if (!fs.existsSync('node_modules')) {
  console.log('   Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} else {
  console.log('✅ Dependencies already installed');
}

console.log('\n🎉 Setup complete! Starting development server...\n');

// Start the Next.js development server
console.log('🌐 Starting Next.js development server on http://localhost:3000\n');

const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

console.log('📋 Available routes:');
console.log('   🏠 Home: http://localhost:3000');
console.log('   🍽️  Demo Menu: http://localhost:3000/d/demo-cafe?t=table-a1-demo-token');
console.log('   📊 FOH Dashboard: http://localhost:3000/foh/demo-cafe');
console.log('   🔗 Test Links: http://localhost:3000/test-links');
console.log('\n💡 Tips:');
console.log('   - Use the demo token "table-a1-demo-token" for testing');
console.log('   - FOH dashboard shows real-time order updates');
console.log('   - Check the console for any errors');
console.log('   - Press Ctrl+C to stop the server');
console.log('\n🚀 Happy coding!');



