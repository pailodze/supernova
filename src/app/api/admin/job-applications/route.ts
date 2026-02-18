import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get all job applications for admin
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
    const jobId = searchParams.get('job_id')

    // Build query
    let query = supabase
      .from('job_applications')
      .select(`
        *,
        student:students (
          id,
          name,
          phone,
          email,
          group_name
        ),
        job:jobs (
          id,
          title,
          company
        )
      `)
      .order('created_at', { ascending: false })

    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error fetching job applications:', error)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error) {
    console.error('Get job applications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
