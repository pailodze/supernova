import { cookies } from 'next/headers'
import { createServerSupabaseClient } from './supabase-server'

export type Session = {
  studentId: string
  phone: string
  name: string
  isAdmin: boolean
  isImpersonating?: boolean
  originalAdmin?: {
    studentId: string
    phone: string
    name: string
  }
  expiresAt: number
}

/**
 * Get the current session from cookies
 * Returns null if no valid session exists
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return null
    }

    const session = JSON.parse(sessionCookie.value) as Session

    // Check if session is expired
    if (!session.studentId || session.expiresAt <= Date.now()) {
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Check if the current user is an admin
 * Verifies against the database to prevent session tampering
 */
export async function verifyAdmin(): Promise<{ isAdmin: boolean; session: Session | null }> {
  const session = await getSession()

  if (!session) {
    return { isAdmin: false, session: null }
  }

  // Get the actual admin ID to verify against database
  // If impersonating, check the original admin; otherwise check current user
  const adminIdToVerify = session.isImpersonating && session.originalAdmin
    ? session.originalAdmin.studentId
    : session.studentId

  // Only verify against database if the session claims to be admin
  const claimsAdmin = session.isAdmin || (session.isImpersonating && session.originalAdmin)

  if (!claimsAdmin) {
    return { isAdmin: false, session }
  }

  // Verify admin status against database to prevent session tampering
  const supabase = createServerSupabaseClient()
  const { data: student, error } = await supabase
    .from('students')
    .select('is_admin')
    .eq('id', adminIdToVerify)
    .single()

  if (error || !student || !student.is_admin) {
    return { isAdmin: false, session }
  }

  return { isAdmin: true, session }
}

/**
 * Require admin access - returns error response if not admin
 */
export async function requireAdmin(): Promise<{ error: Response } | { session: Session }> {
  const { isAdmin, session } = await verifyAdmin()

  if (!session) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  if (!isAdmin) {
    return {
      error: new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    }
  }

  return { session }
}
