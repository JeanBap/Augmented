import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from './supabase-clients'

// Shared middleware for protecting routes across all 3 apps
// Usage in each app's middleware.ts:
//   import { withAuth } from '@raiseready/auth'
//   export default withAuth
//   export const config = { matcher: ['/dashboard/:path*', '/api/user/:path*'] }

export function withAuth(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient({
    getAll() {
      return request.cookies.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value)
        response.cookies.set(name, value, options)
      })
    },
  })

  // Refresh session if expired
  // This is critical for cross-subdomain auth to stay alive
  return supabase.auth.getUser().then(({ data: { user } }) => {
    // If user is not authenticated and trying to access protected routes
    const isProtected = request.nextUrl.pathname.startsWith('/dashboard') ||
                        request.nextUrl.pathname.startsWith('/api/user')

    if (!user && isProtected) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  })
}
