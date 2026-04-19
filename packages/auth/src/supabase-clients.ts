import { createBrowserClient as createSupaBrowserClient, createServerClient as createSupaServerClient } from '@supabase/ssr'
import type { Database } from '@raiseready/db'

const isDemoMode = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('demo')
}

// Browser client - used in React components
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!url || !key || isDemoMode()) {
    // Return a mock client in demo mode that won't error on initialization
    return createSupaBrowserClient<Database>(
      url || 'https://demo.supabase.co',
      key || 'demo-key'
    )
  }

  return createSupaBrowserClient<Database>(url, key)
}

// Server client - used in Server Components, API routes, middleware
// Requires cookies from the request context
export function createServerClient(cookieStore: {
  getAll: () => { name: string; value: string }[]
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!url || !key || isDemoMode()) {
    // Return a mock client in demo mode
    return createSupaServerClient<Database>(
      url || 'https://demo.supabase.co',
      key || 'demo-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookieStore.setAll(cookiesToSet)
          },
        },
      }
    )
  }

  return createSupaServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookieStore.setAll(cookiesToSet)
      },
    },
  })
}
