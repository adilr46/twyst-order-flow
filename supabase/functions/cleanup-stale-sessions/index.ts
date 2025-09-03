import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client with service role key
// @ts-ignore -- Deno runtime
    const supabase = createClient(
      Deno.env.get("SUPABASE_DB_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('Starting cleanup of stale sessions...');

    // Call the cleanup function
    const { error: cleanupError } = await supabase
      .rpc('cleanup_stale_sessions');

    if (cleanupError) {
      console.error('Cleanup function failed:', cleanupError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to run cleanup function',
          details: cleanupError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get statistics about what was cleaned up
    const { data: recentCleanup, error: statsError } = await supabase
      .from('event_log')
      .select('payload')
      .eq('type', 'session.cleanup')
      .gte('ts', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order('ts', { ascending: false })
      .limit(10);

    if (statsError) {
      console.warn('Failed to get cleanup stats:', statsError);
    }

    const totalClosed = recentCleanup?.reduce((sum, event) => {
      return sum + (event.payload?.closed_count || 0);
    }, 0) || 0;

    console.log(`Cleanup completed. Sessions closed: ${totalClosed}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Stale session cleanup completed',
        sessions_closed: totalClosed,
        cleanup_time: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});