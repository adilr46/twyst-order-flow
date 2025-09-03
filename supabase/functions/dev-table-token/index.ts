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

  // Development only endpoint
  if (Deno.env.get("NODE_ENV") === "production") {
    return new Response(
      JSON.stringify({ error: 'Development endpoint not available in production' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
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
    const { venueSlug, tableLabel } = await req.json();

    if (!venueSlug || !tableLabel) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: venueSlug and tableLabel are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with service role key
// @ts-ignore -- Deno runtime
    const supabase = createClient(
      Deno.env.get("SUPABASE_DB_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find venue by slug
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id")
      .eq("slug", venueSlug)
      .maybeSingle();

    if (venueError || !venue) {
      return new Response(
        JSON.stringify({ 
          error: `Venue not found: ${venueSlug}` 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find table by label and venue
    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select("id, token")
      .eq("venue_id", venue.id)
      .eq("label", tableLabel)
      .maybeSingle();

    if (tableError || !table) {
      return new Response(
        JSON.stringify({ 
          error: `Table not found: ${tableLabel} in venue ${venueSlug}` 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Close any existing open sessions for this table
    await supabase
      .from("sessions")
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq("table_id", table.id)
      .eq("status", 'open');

    // Create or find existing session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        venue_id: venue.id,
        table_id: table.id,
        status: 'open'
      })
      .select("id")
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create table session' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Dev token generated for ${venueSlug}/${tableLabel}:`, {
      token: table.token,
      table_session_id: session.id
    });

    return new Response(
      JSON.stringify({ 
        token: table.token,
        table_session_id: session.id,
        venue_id: venue.id,
        table_id: table.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Dev table token error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});