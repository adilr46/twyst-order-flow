// @ts-ignore -- Deno runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveSessionRequest {
  token: string;
}

interface ResolveSessionResponse {
  token: string;
  table_session_id: string;
  venue_id: string;
  venue_slug: string;
  table_label: string;
}

// @ts-ignore -- Deno runtime
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Debug environment variables
    const supabaseUrl = Deno.env.get('DATABASE_URL');
    const supabaseKey = Deno.env.get('DATABASE_SERVICE_ROLE_KEY');
    
    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseKey?.length
    });
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing environment variables', reason: 'server_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📝 Request body:', requestBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON', reason: 'invalid_request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { token } = requestBody;

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid token', reason: 'invalid_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (32-char hex or demo tokens)
    if (!/^(?:[a-f0-9]{32}|demo[0-9]{3})$/i.test(token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format', reason: 'invalid_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resolving token:', token);

    // Look up table by token
    console.log('🔍 Querying database for token:', token);
    
    let table;
    try {
      const { data, error: tableError } = await supabase
        .from('tables')
        .select('id, label, venue_id, token')
        .eq('token', token)
        .single();

      console.log('📊 Database query result:', { data, tableError });
      
      if (tableError) {
        console.error('❌ Table query error:', tableError);
        return new Response(
          JSON.stringify({ error: 'Database error', reason: 'database_error', details: tableError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        console.log('❌ No table found for token:', token);
        return new Response(
          JSON.stringify({ error: 'Table not found', reason: 'unknown_token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      table = data;
      console.log('✅ Found table:', table);
      
    } catch (queryError) {
      console.error('❌ Database query exception:', queryError);
      return new Response(
        JSON.stringify({ error: 'Database query failed', reason: 'server_error', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get venue info
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, slug, name')
      .eq('id', table.venue_id)
      .single();

    if (venueError || !venue) {
      console.error('Venue lookup error:', venueError);
      return new Response(
        JSON.stringify({ error: 'Venue not found', reason: 'invalid_venue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found venue:', venue);

    // Find or create an open session for this table
    let { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status, last_seen_at')
      .eq('table_id', table.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Session lookup error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Session lookup failed', reason: 'server_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no session exists, create one
    if (!session) {
      console.log('Creating new session for table:', table.id);
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert({
          table_id: table.id,
          venue_id: table.venue_id,
          status: 'open'
        })
        .select('id, status, last_seen_at')
        .single();

      if (createError || !newSession) {
        console.error('Session creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session', reason: 'server_error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      session = newSession;
    }

    // Check if session is expired (24+ hours old)
    if (session.last_seen_at) {
      const lastSeen = new Date(session.last_seen_at);
      const now = new Date();
      const hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSeen >= 24) {
        console.log('Session expired, closing and creating new one');
        
        // Close the expired session
        await supabase
          .from('sessions')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', session.id);

        // Create a new session
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            table_id: table.id,
            venue_id: table.venue_id,
            status: 'open'
          })
          .select('id, status, last_seen_at')
          .single();

        if (createError || !newSession) {
          console.error('New session creation error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create new session', reason: 'server_error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        session = newSession;
      }
    }

    // Update last_seen_at
    await supabase
      .from('sessions')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', session.id);

    const response: ResolveSessionResponse = {
      token,
      table_session_id: session.id,
      venue_id: table.venue_id,
      venue_slug: venue.slug,
      table_label: table.label
    };

    console.log('Session resolved successfully:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Resolve session error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', reason: 'server_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});