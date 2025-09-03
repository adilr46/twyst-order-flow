import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AggregationResult {
  venues_processed: number
  metrics_updated: number
  day: string
  errors: string[]
  processing_time_ms: number
}

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const errors: string[] = []

  try {
    // Verify this is coming from Vercel Cron or authorized source
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role
    const supabaseClient = createServerSupabaseClient()

    // Parse request parameters
    const { searchParams } = new URL(req.url)
    const dayParam = searchParams.get('day')
    const venueIdParam = searchParams.get('venue_id')
    
    // Default to yesterday if no day specified
    const targetDay = dayParam ? new Date(dayParam) : new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dayString = targetDay.toISOString().split('T')[0] // YYYY-MM-DD format

    console.log(`Starting daily metrics aggregation for day: ${dayString}`)

    let venuesProcessed = 0
    let metricsUpdated = 0

    if (venueIdParam) {
      // Aggregate for specific venue
      console.log(`Aggregating metrics for specific venue: ${venueIdParam}`)
      
      const { data: result, error } = await (supabaseClient as any).rpc('upsert_daily_metrics', {
        p_venue_id: venueIdParam,
        p_day: dayString
      })

      if (error) {
        throw new Error(`Failed to aggregate metrics for venue ${venueIdParam}: ${error.message}`)
      }

      venuesProcessed = 1
      metricsUpdated = (result as any) || 0
      
      console.log(`Successfully aggregated metrics for venue ${venueIdParam}: ${metricsUpdated} records updated`)
      
    } else {
      // Aggregate for all venues that had activity
      console.log('Aggregating metrics for all venues with activity')
      
      const { data: result, error } = await (supabaseClient as any).rpc('aggregate_all_venues_daily', {
        p_day: dayString
      })

      if (error) {
        throw new Error(`Failed to aggregate metrics for all venues: ${error.message}`)
      }

      // Get count of venues that had activity
      const { data: activeVenues, error: countError } = await supabaseClient
        .from('orders')
        .select('venue_id', { count: 'exact', head: true })
        .gte('created_at', dayString)
        .lt('created_at', new Date(new Date(dayString).getTime() + 24*60*60*1000).toISOString().split('T')[0])

      if (countError) {
        console.warn('Could not get active venues count:', countError.message)
        venuesProcessed = 0
      } else {
        venuesProcessed = activeVenues?.length || 0
      }

      metricsUpdated = (result as any) || 0
      
      console.log(`Successfully aggregated metrics for all venues: ${metricsUpdated} records updated across ${venuesProcessed} venues`)
    }

    // Log the aggregation event
    await (supabaseClient.from('event_log') as any).insert({
      type: 'metrics.daily_aggregation',
      actor: 'cron-aggregator',
      payload: {
        day: dayString,
        venues_processed: venuesProcessed,
        metrics_updated: metricsUpdated,
        processing_time_ms: Date.now() - startTime,
        venue_id: venueIdParam || null
      }
    })

    const result: AggregationResult = {
      venues_processed: venuesProcessed,
      metrics_updated: metricsUpdated,
      day: dayString,
      errors: errors,
      processing_time_ms: Date.now() - startTime
    }

    console.log(`Daily metrics aggregation completed in ${result.processing_time_ms}ms`)

    return NextResponse.json({
      success: true,
      message: `Daily metrics aggregation completed for ${dayString}`,
      ...result
    })

  } catch (error: any) {
    console.error('Daily metrics aggregation error:', error)
    
    const result: AggregationResult = {
      venues_processed: 0,
      metrics_updated: 0,
      day: new Date().toISOString().split('T')[0],
      errors: [error.message || 'Unknown error'],
      processing_time_ms: Date.now() - startTime
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        ...result
      },
      { status: 500 }
    )
  }
}


