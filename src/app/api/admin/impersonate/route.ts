import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

async function impersonateHandler(request: NextRequest) {
  try {
    // Verify admin access against database (not just cookie)
    const { isAdmin, session } = await verifyAdmin()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get the target student
    const { data: targetStudent, error: studentError } = await supabase
      .from('students')
      .select('id, name, phone, is_admin')
      .eq('id', studentId)
      .single()

    if (studentError || !targetStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Create impersonation session - store original admin info for returning later
    const impersonatedSession = {
      studentId: targetStudent.id,
      phone: targetStudent.phone,
      name: targetStudent.name,
      isAdmin: false, // When impersonating, act as regular user
      isImpersonating: true,
      originalAdmin: {
        studentId: session.studentId,
        phone: session.phone,
        name: session.name,
      },
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    const cookieStore = await cookies()
    cookieStore.set('session', JSON.stringify(impersonatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: `Now impersonating ${targetStudent.name}`,
      student: {
        id: targetStudent.id,
        name: targetStudent.name,
      },
    })
  } catch (error) {
    console.error('Impersonate error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withLogging(impersonateHandler)
