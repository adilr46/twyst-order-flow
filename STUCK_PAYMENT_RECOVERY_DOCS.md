# Stuck Payment Recovery System

## Overview

This system automatically detects and recovers orders that are stuck in "created" status despite being successfully paid in Stripe. It runs as a cron job every 15 minutes to ensure no orders are lost due to webhook failures or processing issues.

## Problem Statement

Sometimes orders can get "stuck" when:
- Stripe webhook fails to deliver
- Webhook processing encounters an error
- Network issues during payment confirmation
- Race conditions in concurrent processing

This results in orders showing as "created" in the database while Stripe shows them as "paid", causing confusion for restaurant staff and potentially lost orders.

## Solution Components

### 1. Supabase Edge Function
**File**: `supabase/functions/reprocess-stuck-payments/index.ts`

- Runs as a serverless function
- Can be triggered via HTTP or Supabase cron
- Uses Supabase service role for database access

### 2. Vercel Cron Job
**File**: `src/app/api/cron/reprocess-stuck-payments/route.ts`
**Config**: `vercel.json`

- Runs every 15 minutes (`*/15 * * * *`)
- Alternative to Supabase function
- Integrates with Vercel's cron system

### 3. Database Functions
**File**: `supabase/migrations/20250125000002_stuck_payment_recovery.sql`

- `find_stuck_orders()` - Efficiently finds potentially stuck orders
- `recover_stuck_order()` - Safely recovers a stuck order
- `increment_stripe_event_attempts()` - Tracks processing attempts

## How It Works

### Detection Criteria
Orders are considered "potentially stuck" if:
- Status is `created` (not paid in database)
- Has a `stripe_session_id` (payment was initiated)
- Created 10+ minutes ago (allows normal processing time)
- Created less than 24 hours ago (avoids very old orders)

### Recovery Process
1. **Find Stuck Orders**: Query database for orders matching criteria
2. **Check Stripe Status**: Retrieve actual payment status from Stripe API
3. **Compare States**: If Stripe shows "paid" but DB shows "created"
4. **Recover Order**: Update order status to "paid"
5. **Log Recovery**: Record event in `event_log` table
6. **Notify FOH**: Trigger realtime update for front-of-house staff
7. **Track Attempts**: Update `stripe_events` with attempt counts

### Safety Measures
- **Idempotent**: Safe to run multiple times
- **Atomic Operations**: Database functions ensure consistency
- **Attempt Tracking**: Prevents infinite retry loops
- **Comprehensive Logging**: Full audit trail of all actions
- **Error Handling**: Graceful handling of Stripe API errors

## Database Schema

### Enhanced `stripe_events` Table
```sql
CREATE TABLE stripe_events (
    id TEXT PRIMARY KEY,                    -- Event identifier
    created_at TIMESTAMPTZ DEFAULT now(),  -- When first seen
    attempt_count INTEGER DEFAULT 0,       -- Processing attempts
    last_attempt_at TIMESTAMPTZ NULL       -- Last processing time
);
```

### Recovery Tracking in `event_log`
```sql
-- Recovery events logged with type 'order.recovered'
{
  "venue_id": "uuid",
  "order_id": "uuid", 
  "type": "order.recovered",
  "actor": "cron-reprocessor",
  "payload": {
    "stripe_session_id": "cs_...",
    "stripe_payment_status": "paid",
    "stripe_amount_total": 2500,
    "recovery_reason": "stuck_payment_detected",
    "original_status": "created",
    "recovered_at": "2025-01-25T10:30:00Z"
  }
}
```

## Configuration

### Environment Variables
```bash
# Required for both implementations
STRIPE_SECRET_KEY=sk_...                    # Stripe API key
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Database access

# Optional for Vercel cron security
CRON_SECRET=your-secret-key                # Prevents unauthorized access
```

### Vercel Cron Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/reprocess-stuck-payments",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### Supabase Cron Configuration
```sql
-- Enable pg_cron extension
SELECT cron.schedule('reprocess-stuck-payments', '*/15 * * * *', 
  'SELECT net.http_post(url := ''https://your-project.supabase.co/functions/v1/reprocess-stuck-payments'')');
```

## Monitoring & Analytics

### Recovery Statistics View
```sql
SELECT * FROM stuck_payment_recovery_stats;
```

Returns:
- Daily recovery counts
- Venues affected
- Average recovery time
- Recovery trends

### Manual Monitoring Queries
```sql
-- Find currently stuck orders
SELECT * FROM find_stuck_orders(10, 24);

-- Recent recovery events
SELECT * FROM event_log 
WHERE type = 'order.recovered' 
ORDER BY ts DESC LIMIT 10;

-- Attempt tracking
SELECT id, attempt_count, last_attempt_at 
FROM stripe_events 
WHERE id LIKE 'reprocess_%'
ORDER BY last_attempt_at DESC;
```

## Deployment Options

### Option 1: Vercel Cron (Recommended)
1. Deploy the Next.js app to Vercel
2. Vercel automatically reads `vercel.json` and sets up cron
3. Add environment variables in Vercel dashboard
4. Cron runs automatically every 15 minutes

### Option 2: Supabase Edge Function
1. Deploy function: `supabase functions deploy reprocess-stuck-payments`
2. Set up environment variables in Supabase dashboard
3. Configure cron trigger (manual or via pg_cron)
4. Function runs on Supabase infrastructure

### Option 3: External Cron Service
1. Use services like GitHub Actions, AWS Lambda, or other cron providers
2. Make HTTP GET request to either endpoint
3. Include authorization header if `CRON_SECRET` is set

## Testing

### Manual Testing
```bash
# Test Vercel endpoint
curl -X GET "https://your-app.vercel.app/api/cron/reprocess-stuck-payments" \
  -H "Authorization: Bearer your-cron-secret"

# Test Supabase function
curl -X POST "https://your-project.supabase.co/functions/v1/reprocess-stuck-payments" \
  -H "Authorization: Bearer your-anon-key"
```

### Database Testing
```sql
-- Test finding stuck orders
SELECT * FROM find_stuck_orders(5, 48);

-- Test recovery function (with real order ID)
SELECT recover_stuck_order(
  'order-uuid-here'::UUID,
  'cs_stripe_session_id',
  'paid',
  2500
);
```

## Performance Considerations

### Optimized Queries
- Custom indexes for stuck order detection
- Efficient Stripe API calls (only when needed)
- Batch processing with proper error handling

### Resource Usage
- Runs every 15 minutes (96 times/day)
- Typically processes 0-5 orders per run
- Low impact on database and API quotas

### Scaling
- Handles high-volume restaurants (100+ orders/day)
- Efficient even with thousands of historical orders
- Minimal overhead when no stuck orders exist

## Error Handling

### Stripe API Errors
- **Resource Missing**: Session expired or deleted
- **Rate Limits**: Automatic retry with backoff
- **Authentication**: Logs error and continues

### Database Errors
- **Connection Issues**: Retry mechanism
- **Constraint Violations**: Safe to ignore (already processed)
- **Permission Errors**: Detailed logging

### Recovery Failures
- **Concurrent Updates**: Safe race condition handling
- **Status Changes**: Detects and skips if order already updated
- **Partial Failures**: Continues processing other orders

## Security

### Access Control
- Service role required for database operations
- Optional cron secret for endpoint protection
- Stripe API key securely stored in environment

### Audit Trail
- All actions logged in `event_log`
- Attempt tracking prevents abuse
- Comprehensive error logging

### Data Privacy
- No sensitive data in logs
- Stripe API calls use minimal required data
- Recovery events include only necessary metadata

## Maintenance

### Regular Monitoring
- Check recovery statistics weekly
- Monitor error rates and patterns
- Verify cron job execution logs

### Troubleshooting
- High error rates: Check Stripe API status
- No recoveries: Verify webhook configuration
- Missing orders: Check detection criteria

### Updates
- Keep Stripe API version current
- Monitor for new Stripe webhook events
- Update detection logic as needed

This system provides robust, automated recovery of stuck payments while maintaining full visibility and control over the process.



