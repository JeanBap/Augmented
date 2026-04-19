// @raiseready/db - Shared Supabase client used by all 3 apps
// This ensures one Supabase project handles auth + data for the entire platform

export { createClient, supabase } from './client'
export type { Database } from './types'
export type { User, Session } from './types'
