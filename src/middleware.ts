import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/verify', '/api/auth/send-otp', '/api/auth/verify-otp', '/jobs', '/api/jobs']

  // Admin routes that require admin privileges
  const adminRoutes = ['/admin', '/api/admin']

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

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

  // If logged in and trying to access login/verify, redirect to dashboard
  if (sessionCookie && (pathname === '/login' || pathname === '/verify')) {
    try {
      const session = JSON.parse(sessionCookie.value)
      if (session.studentId && session.expiresAt > Date.now()) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      // Invalid session, let them proceed to login
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
