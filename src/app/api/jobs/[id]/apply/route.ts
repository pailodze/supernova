import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'

// POST - Apply to a job (checks skill requirements)
async function applyToJobHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
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

    const studentId = session.studentId
    const supabase = createServerSupabaseClient()

    // Get the job and its skill requirements
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        is_active,
        job_skill_requirements (
          skill_id,
          required_level
        )
      `)
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.is_active) {
      return NextResponse.json({ error: 'This job is no longer active' }, { status: 400 })
    }

    // Check if student already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('job_id', jobId)
      .single()

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 })
    }

    // Check skill requirements if any
    const skillRequirements = job.job_skill_requirements || []

    if (skillRequirements.length > 0) {
      // Get student's skills
      const { data: studentSkills } = await supabase
        .from('student_skills')
        .select('skill_id, proficiency_level')
        .eq('student_id', studentId)

      const studentSkillMap = new Map(
        (studentSkills || []).map(ss => [ss.skill_id, ss.proficiency_level])
      )

      // Check if all requirements are met
      const unmetRequirements = skillRequirements.filter(sr => {
        const studentLevel = studentSkillMap.get(sr.skill_id) || 0
        return studentLevel < sr.required_level
      })

      if (unmetRequirements.length > 0) {
        return NextResponse.json(
          { error: 'არ აკმაყოფილებთ ყველა საჭირო უნარის მოთხოვნას' },
          { status: 400 }
        )
      }
    }

    // Create application record
    const { data: application, error: applicationError } = await supabase
      .from('job_applications')
      .insert({
        student_id: studentId,
        job_id: jobId,
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating application:', applicationError)
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error('Job application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(applyToJobHandler)

// GET - Check if student has applied to this job and get their skills
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ applied: false, studentSkills: [] })
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ applied: false, studentSkills: [] })
    }

    if (!session.studentId || session.expiresAt < Date.now()) {
      return NextResponse.json({ applied: false, studentSkills: [] })
    }

    const supabase = createServerSupabaseClient()

    // Get application status and student skills in parallel
    const [applicationResult, skillsResult] = await Promise.all([
      supabase
        .from('job_applications')
        .select('id, created_at')
        .eq('student_id', session.studentId)
        .eq('job_id', jobId)
        .single(),
      supabase
        .from('student_skills')
        .select('skill_id, proficiency_level')
        .eq('student_id', session.studentId)
    ])

    return NextResponse.json({
      applied: !!applicationResult.data,
      application: applicationResult.data,
      studentSkills: skillsResult.data || [],
    })
  } catch (error) {
    console.error('Check application error:', error)
    return NextResponse.json({ applied: false, studentSkills: [] })
  }
}
