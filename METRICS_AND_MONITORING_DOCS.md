# Metrics and Monitoring System

## Overview

This system provides comprehensive daily metrics aggregation and error monitoring with Sentry integration. It tracks venue performance metrics and provides detailed error reporting with venue-specific context.

## Daily Metrics Aggregation

### Database Schema

#### `metrics_daily` Table
```sql
CREATE TABLE metrics_daily (
    id UUID PRIMARY KEY,
    venue_id UUID REFERENCES venues(id),
    day DATE NOT NULL,
    orders_created INTEGER DEFAULT 0,
    orders_paid INTEGER DEFAULT 0,
    avg_ack_seconds NUMERIC(10,2) DEFAULT 0,
    total_revenue_cents INTEGER DEFAULT 0,
    avg_order_value_cents INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(venue_id, day)
);
```

#### Key Metrics Calculated
- **orders_created**: Total orders created on the day
- **orders_paid**: Orders that reached paid status or beyond
- **avg_ack_seconds**: Average time from order creation to acknowledgment (paid/accepted)
- **total_revenue_cents**: Total revenue from completed orders
- **avg_order_value_cents**: Average order value for completed orders
- **unique_sessions**: Number of unique sessions with orders

### Database Functions

#### `aggregate_daily_metrics(venue_id, day)`
Aggregates metrics for a specific venue and day.

#### `upsert_daily_metrics(venue_id, day)`
Upserts aggregated metrics into the metrics_daily table.

#### `aggregate_all_venues_daily(day)`
Aggregates metrics for all venues that had activity on a specific day.

### Aggregation Job

#### Supabase Edge Function
**File**: `supabase/functions/aggregate-daily-metrics/index.ts`

- Runs on-demand or via cron
- Supports single venue or all venues aggregation
- Logs aggregation events to event_log
- Returns detailed processing statistics

#### Vercel Cron Job
**File**: `src/app/api/cron/aggregate-daily-metrics/route.ts`
**Schedule**: Daily at 2:00 AM (`0 2 * * *`)

- Automatic daily aggregation
- Authorization via CRON_SECRET
- Comprehensive error handling and logging

### Usage Examples

#### Manual Aggregation
```bash
# Aggregate all venues for yesterday
curl "https://your-app.vercel.app/api/cron/aggregate-daily-metrics"

# Aggregate specific venue for specific day
curl "https://your-app.vercel.app/api/cron/aggregate-daily-metrics?venue_id=uuid&day=2025-01-24"

# Supabase function
curl -X POST "https://your-project.supabase.co/functions/v1/aggregate-daily-metrics"
```

#### Database Queries
```sql
-- Get metrics for a venue
SELECT * FROM metrics_daily WHERE venue_id = 'venue-uuid' ORDER BY day DESC;

-- Get dashboard view with calculated fields
SELECT * FROM metrics_dashboard WHERE venue_id = 'venue-uuid';

-- Get conversion rates
SELECT 
    venue_id,
    day,
    orders_created,
    orders_paid,
    ROUND((orders_paid::NUMERIC / orders_created) * 100, 2) as conversion_rate
FROM metrics_daily 
WHERE orders_created > 0;
```

## Sentry Error Monitoring

### Configuration

#### Environment Variables
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

#### Configuration Files
- `sentry.client.config.js` - Client-side configuration
- `sentry.server.config.js` - Server-side configuration  
- `sentry.edge.config.js` - Edge runtime configuration

### Venue-Specific Error Tracking

#### Sentry Utility Functions
**File**: `src/lib/sentry.ts`

```typescript
// Capture errors with venue context
captureExceptionWithVenue(error, venueId, extra)

// Capture messages with venue context
captureMessageWithVenue(message, level, venueId, extra)

// Set venue context for user
setVenueContext(venueId, venueName)

// Add breadcrumbs with venue context
addBreadcrumbWithVenue(message, category, venueId, data)
```

#### API Route Integration

##### Checkout API (`/api/checkout`)
- Breadcrumbs for checkout initiation
- Error capture with venue_id, orderId, and table context
- Comprehensive error context for debugging

##### Stripe Webhook (`/api/stripe-webhook`)
- Breadcrumbs for webhook processing
- Error capture with event context
- Venue-specific error tracking for order updates

### Error Context and Filtering

#### Venue Tags
All errors are tagged with `venue_id` for easy filtering in Sentry dashboard.

#### User Context
Venue ID is set as user ID for better error grouping and filtering.

#### Breadcrumbs
Detailed breadcrumbs track the flow through payment processing and webhook handling.

### Monitoring Queries

#### Error Analysis
```sql
-- Get error events by venue
SELECT 
    venue_id,
    COUNT(*) as error_count,
    MIN(ts) as first_error,
    MAX(ts) as last_error
FROM event_log 
WHERE type LIKE '%error%'
GROUP BY venue_id
ORDER BY error_count DESC;
```

#### Performance Metrics
```sql
-- Get acknowledgment time trends
SELECT 
    venue_id,
    day,
    avg_ack_seconds,
    avg_ack_seconds / 60 as avg_ack_minutes
FROM metrics_daily 
WHERE avg_ack_seconds > 0
ORDER BY day DESC;
```

## Deployment and Configuration

### Environment Setup
```bash
# Required for Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project

# Required for cron jobs
CRON_SECRET=your-secret-key

# Required for Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Vercel Configuration
```json
{
  "crons": [
    {
      "path": "/api/cron/reprocess-stuck-payments",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/aggregate-daily-metrics", 
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Supabase Configuration
```bash
# Deploy edge functions
supabase functions deploy aggregate-daily-metrics

# Set environment variables
supabase secrets set SENTRY_DSN=your-dsn
```

## Monitoring Dashboard

### Metrics Dashboard View
```sql
SELECT * FROM metrics_dashboard 
WHERE day >= CURRENT_DATE - 30
ORDER BY day DESC, venue_name;
```

### Key Performance Indicators
- **Conversion Rate**: `orders_paid / orders_created * 100`
- **Average Acknowledgment Time**: `avg_ack_seconds / 60` (minutes)
- **Revenue per Session**: `total_revenue_cents / unique_sessions`
- **Average Order Value**: `avg_order_value_cents`

### Alerting
- High acknowledgment times (>5 minutes)
- Low conversion rates (<80%)
- Missing daily aggregations
- High error rates by venue

## Troubleshooting

### Common Issues

#### Aggregation Job Fails
- Check database permissions for service role
- Verify venue_id exists in venues table
- Check for data consistency in orders table

#### Sentry Not Capturing Errors
- Verify NEXT_PUBLIC_SENTRY_DSN is set
- Check Sentry project configuration
- Ensure proper error handling in API routes

#### Missing Metrics
- Check if orders have proper timestamps
- Verify event_log entries for order status changes
- Run manual aggregation for specific dates

### Debug Queries
```sql
-- Check for missing metrics
SELECT 
    DATE(o.created_at) as order_date,
    COUNT(*) as orders_created
FROM orders o
WHERE o.created_at >= CURRENT_DATE - 7
GROUP BY DATE(o.created_at)
ORDER BY order_date;

-- Verify aggregation triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%metrics%';
```

This system provides comprehensive monitoring and metrics tracking for venue performance with detailed error reporting and daily aggregation capabilities.



