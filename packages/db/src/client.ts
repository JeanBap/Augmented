import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import type { Database } from './types'

// All 3 apps (www, app, finance) share the same Supabase project.
// Each app passes its own env vars but they all point to the same instance.
// This means: one user table, one auth system, one set of data.

export function createClient(url?: string, anonKey?: string) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Add them to .env.local in your app directory.'
    )
  }

  return supabaseCreateClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

// Default singleton for convenience
export const supabase = typeof window !== 'undefined'
  ? createClient()
  : null // Don't create on server without explicit env vars
