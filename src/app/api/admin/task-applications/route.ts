import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get all task applications for admin
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (!session.studentId || session.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Verify admin status
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('is_admin')
      .eq('id', session.studentId)
      .single()

    if (studentError || !student?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('task_applications')
      .select(`
        *,
        student:students (
          id,
          name,
          phone,
          email,
          group_name
        ),
        task:tasks (
          id,
          title,
          description,
          deadline,
          skill_rewards:task_skill_rewards (
            skill_id,
            level_reward,
            skill:skills (
              id,
              name,
              icon
            )
          )
        )
      `)
      .order('updated_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching task applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Get task applications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
