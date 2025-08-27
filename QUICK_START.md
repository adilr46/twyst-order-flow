# 🚀 Twyst MVP - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Stripe account (test mode)

## 1. Environment Setup

Create a `.env.local` file in the project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration  
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Get Your Keys:
- **Supabase**: Go to [your project settings](https://app.supabase.com/project/_/settings/api)
- **Stripe**: Go to [your dashboard](https://dashboard.stripe.com/apikeys)

## 2. Database Setup

### Option A: With Supabase CLI (Recommended)
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login and link your project
supabase login
supabase link --project-ref your-project-ref

# Apply migrations and seed data
supabase db reset
```

### Option B: Manual Setup
1. Go to your Supabase project dashboard
2. Run the SQL files from `supabase/migrations/` in order
3. Run the seed data from `supabase/seed.sql`

## 3. Stripe Webhook Setup

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
4. Copy the webhook signing secret to your `.env.local`

## 4. Run the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 5. Test the Complete Flow

1. **Visit Test Links**: http://localhost:3000/test-links
2. **Start Ordering**: Click "Test Link" for Table A1
3. **Browse Menu**: Add items to cart
4. **Checkout**: Use test card `4242 4242 4242 4242`
5. **Monitor Orders**: Open http://localhost:3000/foh/demo-cafe
6. **Update Status**: Click through order statuses in FOH

## 🎯 Key Demo URLs

- **Menu**: http://localhost:3000/d/demo-cafe?t=table-a1-demo-token
- **FOH Dashboard**: http://localhost:3000/foh/demo-cafe  
- **Test Links**: http://localhost:3000/test-links
- **Order Status**: Will be provided after checkout

## 🧪 Test Data

The seed data includes:
- **Demo Cafe** with full menu (coffee, pastries, sandwiches, etc.)
- **4 Tables** with NFC tokens for testing
- **Sample Orders** in various statuses for FOH testing

## 📱 Mobile Testing

The app is mobile-first! Test on:
- Chrome DevTools mobile view
- Your actual phone
- iOS Safari for safe-area testing

## 🔧 Troubleshooting

### "Supabase not running"
- Either install Supabase CLI and run `supabase start`
- Or use your remote Supabase project (slower but works)

### "Webhook signature verification failed"
- Make sure Stripe CLI is running with `stripe listen`
- Check that STRIPE_WEBHOOK_SECRET matches the CLI output

### "Order not found"
- Check that your Supabase tables are created
- Verify the seed data was loaded

### "Payment failed"
- Use Stripe test cards: `4242 4242 4242 4242`
- Check your Stripe secret key is correct

## 🎉 You're Ready!

The complete MVP includes:
- ✅ Mobile-first responsive design
- ✅ Real-time order management
- ✅ Stripe payment processing
- ✅ FOH dashboard with live updates
- ✅ Order status tracking
- ✅ Modern UI with smooth animations

Happy testing! 🚀



