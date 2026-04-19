'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createBrowserClient } from './supabase-clients'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const DEMO_USER: User = {
  id: 'demo-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@raiseready.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'demo' },
  user_metadata: { demo: true },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.includes('demo')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo] = useState(isDemoMode())
  const supabaseClient = isDemo ? null : createBrowserClient()

  useEffect(() => {
    if (isDemo) {
      // In demo mode, set a demo user immediately
      setUser(DEMO_USER)
      setSession(null)
      setLoading(false)
      return
    }

    if (!supabaseClient) {
      setLoading(false)
      return
    }

    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('Failed to get session:', error)
      setLoading(false)
    })

    // Listen for auth changes across tabs/subdomains
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabaseClient, isDemo])

  const signInWithGoogle = async () => {
    if (isDemo) {
      setUser(DEMO_USER)
      return
    }
    if (!supabaseClient) throw new Error('Supabase not initialized')
    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithEmail = async (email: string) => {
    if (isDemo) {
      setUser({ ...DEMO_USER, email })
      return
    }
    if (!supabaseClient) throw new Error('Supabase not initialized')
    await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithMagicLink = async (email: string) => {
    if (isDemo) {
      setUser({ ...DEMO_USER, email })
      return
    }
    if (!supabaseClient) throw new Error('Supabase not initialized')
    await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    if (isDemo) {
      setUser(null)
      setSession(null)
      return
    }
    if (!supabaseClient) throw new Error('Supabase not initialized')
    await supabaseClient.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithEmail, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
