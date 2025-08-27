# Demo Mode Setup

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Demo Mode Configuration
DEMO_MODE=true
DEMO_PIN=1234

# Required for the app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Environment
NODE_ENV=development
```

## Demo Access

1. **Development**: Visit `/dev-launch` → enter PIN → access demo cockpit
2. **Production**: Only accessible when `DEMO_MODE=true` is set

## Security Features

- ✅ Production blocking unless `DEMO_MODE=true`
- ✅ PIN authentication required
- ✅ HttpOnly cookies (2-hour expiry)
- ✅ Hidden from search engines (`robots.txt`)
- ✅ Not included in sitemap
- ✅ Middleware protection

## Demo Cockpit Features

- Quick links to all demo flows
- Diner menu with demo token
- Order status tracking
- FOH kitchen board
- Test deep links
- Secure logout

## Production Deployment

For production demos:
1. Set `DEMO_MODE=true`
2. Use a strong `DEMO_PIN`
3. Ensure HTTPS is enabled
4. Demo access expires after 2 hours



