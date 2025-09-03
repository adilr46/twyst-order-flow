import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AggregationResult {
  venues_processed: number;
  metrics_updated: number;
  day: string;
  errors: string[];
  processing_time_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Initialize Supabase client
// @ts-ignore -- Deno runtime
    const supabase = createClient(
      Deno.env.get("SUPABASE_DB_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request parameters
    const url = new URL(req.url);
    const dayParam = url.searchParams.get('day');
    const venueIdParam = url.searchParams.get('venue_id');
    
    // Default to yesterday if no day specified
    const targetDay = dayParam ? new Date(dayParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dayString = targetDay.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`Starting daily metrics aggregation for day: ${dayString}`);

    let venuesProcessed = 0;
    let metricsUpdated = 0;

    if (venueIdParam) {
      // Aggregate for specific venue
      console.log(`Aggregating metrics for specific venue: ${venueIdParam}`);
      
      const { data: result, error } = await supabase.rpc('upsert_daily_metrics', {
        p_venue_id: venueIdParam,
        p_day: dayString
      });

      if (error) {
        throw new Error(`Failed to aggregate metrics for venue ${venueIdParam}: ${error.message}`);
      }

      venuesProcessed = 1;
      metricsUpdated = result || 0;
      
      console.log(`Successfully aggregated metrics for venue ${venueIdParam}: ${metricsUpdated} records updated`);
      
    } else {
      // Aggregate for all venues that had activity
      console.log('Aggregating metrics for all venues with activity');
      
      const { data: result, error } = await supabase.rpc('aggregate_all_venues_daily', {
        p_day: dayString
      });

      if (error) {
        throw new Error(`Failed to aggregate metrics for all venues: ${error.message}`);
      }

      // Get count of venues that had activity
      const { data: activeVenues, error: countError } = await supabase
        .from('orders')
        .select('venue_id', { count: 'exact', head: true })
        .eq('created_at::date', dayString);

      if (countError) {
        console.warn('Could not get active venues count:', countError.message);
        venuesProcessed = 0;
      } else {
        venuesProcessed = activeVenues?.length || 0;
      }

      metricsUpdated = result || 0;
      
      console.log(`Successfully aggregated metrics for all venues: ${metricsUpdated} records updated across ${venuesProcessed} venues`);
    }

    // Log the aggregation event
    await supabase.from('event_log').insert({
      type: 'metrics.daily_aggregation',
      actor: 'cron-aggregator',
      payload: {
        day: dayString,
        venues_processed: venuesProcessed,
        metrics_updated: metricsUpdated,
        processing_time_ms: Date.now() - startTime,
        venue_id: venueIdParam || null
      }
    });

    const result: AggregationResult = {
      venues_processed: venuesProcessed,
      metrics_updated: metricsUpdated,
      day: dayString,
      errors: errors,
      processing_time_ms: Date.now() - startTime
    };

    console.log(`Daily metrics aggregation completed in ${result.processing_time_ms}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily metrics aggregation completed for ${dayString}`,
        ...result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Daily metrics aggregation error:', error);
    
    const result: AggregationResult = {
      venues_processed: 0,
      metrics_updated: 0,
      day: new Date().toISOString().split('T')[0],
      errors: [error.message || 'Unknown error'],
      processing_time_ms: Date.now() - startTime
    };

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        ...result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});



