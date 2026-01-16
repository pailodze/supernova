import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { withLogging } from '@/lib/api-logger'

async function stopImpersonateHandler(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Check if user is currently impersonating
    if (!session.isImpersonating || !session.originalAdmin) {
      return NextResponse.json(
        { error: 'Not currently impersonating anyone' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify the original admin still exists and is still an admin
    const { data: adminStudent, error: adminError } = await supabase
      .from('students')
      .select('id, name, phone, is_admin')
      .eq('id', session.originalAdmin.studentId)
      .single()

    if (adminError || !adminStudent || !adminStudent.is_admin) {
      // If original admin is no longer valid, log them out
      cookieStore.delete('session')
      return NextResponse.json(
        { error: 'Original admin session is no longer valid' },
        { status: 401 }
      )
    }

    // Restore original admin session
    const adminSession = {
      studentId: adminStudent.id,
      phone: adminStudent.phone,
      name: adminStudent.name,
      isAdmin: true,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    cookieStore.set('session', JSON.stringify(adminSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: `Returned to admin account: ${adminStudent.name}`,
      admin: {
        id: adminStudent.id,
        name: adminStudent.name,
      },
    })
  } catch (error) {
    console.error('Stop impersonate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withLogging(stopImpersonateHandler)
