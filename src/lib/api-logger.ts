import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse>

async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie) return null
    const session = JSON.parse(sessionCookie.value)
    if (session.studentId && session.expiresAt > Date.now()) {
      return session.studentId
    }
    return null
  } catch {
    return null
  }
}

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const startTime = performance.now()
    const path = new URL(request.url).pathname
    const method = request.method
    const userId = await getUserIdFromSession()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = request.headers.get('user-agent')

    // Clone request and read body for logging (only for methods that have body)
    let requestBody: Record<string, unknown> | null = null
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const clonedRequest = request.clone()
        requestBody = await clonedRequest.json()
        // Remove sensitive fields from logged body
        if (requestBody) {
          const sanitized = { ...requestBody }
          if ('password' in sanitized) sanitized.password = '[REDACTED]'
          if ('code' in sanitized) sanitized.code = '[REDACTED]'
          if ('otp' in sanitized) sanitized.otp = '[REDACTED]'
          requestBody = sanitized
        }
      } catch {
        // Body might not be JSON or empty
        requestBody = null
      }
    }

    let response: NextResponse
    let errorMessage: string | null = null

    try {
      response = await handler(request, context)
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }

    const duration = Math.round(performance.now() - startTime)

    // Log after handler completes - must await to ensure it completes before serverless function terminates
    try {
      await createServerSupabaseClient()
        .from('api_logs')
        .insert({
          method,
          path,
          status_code: response.status,
          duration_ms: duration,
          user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
          error_message: errorMessage,
          request_body: requestBody,
        })
    } catch (err) {
      console.error('Failed to log API request:', err)
    }

    return response
  }
}
