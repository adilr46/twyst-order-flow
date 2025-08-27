import * as Sentry from '@sentry/nextjs'

// Initialize Sentry if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    
    // Configure beforeSend to add venue_id context
    beforeSend(event, hint) {
      // Extract venue_id from error context if available
            const venueId = (hint as any)?.contexts?.venue_id ||
                      (hint as any)?.extra?.venue_id ||
                     event?.extra?.venue_id
      
      if (venueId) {
        event.tags = {
          ...event.tags,
          venue_id: venueId
        }
        
        // Add venue_id to user context for better filtering
        event.user = {
          ...event.user,
          id: venueId
        }
      }
      
      return event
    }
  })
}

// Helper function to capture errors with venue context
export function captureExceptionWithVenue(
  error: Error | string,
  venueId?: string,
  extra?: Record<string, any>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.error('Sentry not configured, logging to console:', error)
    return
  }

  Sentry.captureException(error, {
    tags: venueId ? { venue_id: venueId } : undefined,
    extra: {
      ...extra,
      venue_id: venueId
    }
  })
}

// Helper function to capture messages with venue context
export function captureMessageWithVenue(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  venueId?: string,
  extra?: Record<string, any>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`, extra)
    return
  }

  Sentry.captureMessage(message, {
    level,
    tags: venueId ? { venue_id: venueId } : undefined,
    extra: {
      ...extra,
      venue_id: venueId
    }
  })
}

// Helper function to set user context for a venue
export function setVenueContext(venueId: string, venueName?: string) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  Sentry.setUser({
    id: venueId,
    username: venueName || venueId
  })

  Sentry.setTag('venue_id', venueId)
}

// Helper function to add breadcrumb with venue context
export function addBreadcrumbWithVenue(
  message: string,
  category: string,
  venueId?: string,
  data?: Record<string, any>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return

  Sentry.addBreadcrumb({
    message,
    category,
    data: {
      ...data,
      venue_id: venueId
    }
  })
}

export default Sentry


