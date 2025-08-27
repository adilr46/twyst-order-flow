import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/integrations/supabase/types'
import { ENV } from '@/env'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// For server-side usage with service role (when needed)
export const createServiceClient = async () => {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    ENV.NEXT_PUBLIC_SUPABASE_URL,
    ENV.SUPABASE_SERVICE_ROLE || '', // This should be server-only
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        }
      },
    }
  )
}

