# Environment Configuration

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=pk_...

# Supabase Service Role Key (server-side only)
SUPABASE_SERVICE_ROLE=sr_...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_or_test...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Demo Mode Configuration (optional)
DEMO_MODE=true
DEMO_PIN=1234

# Sentry Configuration (optional)
SENTRY_DSN=your_sentry_dsn
```

## Environment Validation

The app uses Zod schema validation in `src/env.ts` to:
- ✅ Validate all required environment variables at startup
- ✅ Provide type safety for environment variables
- ✅ Fail fast with clear error messages if variables are missing
- ✅ Ensure URLs are valid format
- ✅ Provide default values where appropriate

## Usage

Instead of using `process.env` directly, import the validated environment:

```typescript
import { ENV } from '@/env';

// Type-safe and validated
const supabaseUrl = ENV.NEXT_PUBLIC_SUPABASE_URL;
const stripeKey = ENV.STRIPE_SECRET_KEY;
```

## Production Deployment

1. Set all required environment variables in your deployment platform
2. Use strong values for sensitive keys (STRIPE_SECRET_KEY, DEMO_PIN)
3. Set NEXT_PUBLIC_APP_URL to your production domain
4. Configure NODE_ENV=production
5. Optional: Set DEMO_MODE=false to disable demo access



