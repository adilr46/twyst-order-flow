import { createClient } from '@supabase/supabase-js';

// Shared Supabase client for server-side API routes
// This avoids recreating the client on every request
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
