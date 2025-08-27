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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token }: ResolveSessionRequest = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid token', reason: 'invalid_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (32-char hex)
    if (!/^[a-f0-9]{32}$/i.test(token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format', reason: 'invalid_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resolving token:', token);

    // Look up table by token
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select(`
        id,
        label,
        venue_id,
        venues!inner (
          id,
          slug,
          name
        )
      `)
      .eq('token', token)
      .single();

    if (tableError || !table) {
      console.log('Table not found for token:', token, tableError);
      return new Response(
        JSON.stringify({ error: 'Table not found', reason: 'unknown_token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found table:', table);

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
      venue_slug: table.venues.slug,
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