// Server and browser client setup for Supabase
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Use the direct URL and key (Lovable doesn't support VITE_ env variables)
const SUPABASE_URL = "https://zbfosmwzntckdrxrfwta.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZm9zbXd6bnRja2RyeHJmd3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMxOTQsImV4cCI6MjA3MTU1OTE5NH0.Kes4OLAxuy6-V0ZiPbW0KvSurICa7ismfvI4qpa-BGE";

// Browser client (for client-side operations)
export const supabaseBrowser = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Server client (for server-side operations - same config for now since this is a client-side app)
export const supabaseServer = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Default export for backward compatibility
export { supabaseBrowser as supabase };