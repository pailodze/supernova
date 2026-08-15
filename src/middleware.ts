import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')

  // Public routes that don't require authentication.
  // NOTE: '/' is matched exactly and must NOT go in this list — these are
  // prefix matches, and startsWith('/') is true for every path on the site.
  const publicRoutes = [
    '/login',
    '/verify',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/jobs',
    '/api/jobs',
    '/tasks',
    '/api/tasks',
  ]

  // Admin routes that require admin privileges
  const adminRoutes = ['/admin', '/api/admin']

  // The landing page is the front door of the site — it has to render for
  // people who have never signed in. It used to fall through to the "not
  // public" branch below, so every logged-out visitor was bounced to /login
  // and the landing page was effectively unreachable.
  const isLanding = pathname === '/'

  // Check if current path is public
  const isPublicRoute = isLanding || publicRoutes.some(route => pathname.startsWith(route))

  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // If trying to access protected route without session, redirect to login
  if (!isPublicRoute && !isAdminRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Handle admin routes - require authentication AND admin privileges
  if (isAdminRoute) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const session = JSON.parse(sessionCookie.value)

      // Check if session is valid
      if (!session.studentId || session.expiresAt <= Date.now()) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check if user is admin (either directly or has originalAdmin from impersonation)
      const isAdmin = session.isAdmin || (session.isImpersonating && session.originalAdmin)

      if (!isAdmin) {
        // Not an admin, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      // Invalid session, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      const validSession = session.studentId && session.expiresAt > Date.now()

      // A self-registered applicant has an account but hasn't told us who they
      // are yet, so the application is the only page they can reach. Existing
      // students are never in this state — they keep using the site as before
      // and can apply from the dashboard whenever they want.
      if (validSession && session.needsApplication) {
        // '/welcome' has to be allowed even though the flag says "not applied".
        // The flag lives in the cookie and the application lives in the
        // database, so they can disagree — and without this, /apply would send
        // an already-applied user to /welcome while this rule sent them back,
        // looping forever. Both pages verify against the database themselves.
        const allowed =
          pathname.startsWith('/apply') ||
          pathname.startsWith('/welcome') ||
          pathname.startsWith('/api/application') ||
          pathname.startsWith('/api/auth')

        if (!allowed) {
          return NextResponse.redirect(new URL('/apply', request.url))
        }
      }

      // If logged in and trying to access login/verify, skip straight ahead
      if (validSession && (pathname === '/login' || pathname === '/verify')) {
        return NextResponse.redirect(
          new URL(session.needsApplication ? '/apply' : '/dashboard', request.url)
        )
      }
    } catch {
      // Invalid session, let them proceed
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
