import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/integrations/supabase/types'
import { ENV } from '@/env'

export const createClient = () =>
  createBrowserClient<Database>(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

// For client-side usage
export const supabase = createClient()

