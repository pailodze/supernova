import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// PUT - Admin approves or rejects a task application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params
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
    const { data: adminStudent, error: adminError } = await supabase
      .from('students')
      .select('is_admin')
      .eq('id', session.studentId)
      .single()

    if (adminError || !adminStudent?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status - admin can only set approved or rejected
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Use approved or rejected.' }, { status: 400 })
    }

    // Get the application with task details
    const { data: application, error: appError } = await supabase
      .from('task_applications')
      .select(`
        *,
        task:tasks (
          id,
          title,
          skill_rewards:task_skill_rewards (
            skill_id,
            level_reward
          )
        )
      `)
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Don't allow re-processing already processed applications
    if (['approved', 'rejected'].includes(application.status)) {
      return NextResponse.json({ error: 'Application has already been processed' }, { status: 400 })
    }

    // Update the application status
    const { error: updateError } = await supabase
      .from('task_applications')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    // If approved, award skill levels to the student
    if (status === 'approved' && application.task?.skill_rewards) {
      for (const reward of application.task.skill_rewards) {
        // Check if student already has this skill
        const { data: existingSkill } = await supabase
          .from('student_skills')
          .select('id, proficiency_level')
          .eq('student_id', application.student_id)
          .eq('skill_id', reward.skill_id)
          .single()

        if (existingSkill) {
          // Update existing skill level
          await supabase
            .from('student_skills')
            .update({
              proficiency_level: existingSkill.proficiency_level + reward.level_reward,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSkill.id)
        } else {
          // Create new skill for student
          await supabase
            .from('student_skills')
            .insert({
              student_id: application.student_id,
              skill_id: reward.skill_id,
              proficiency_level: reward.level_reward
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'approved'
        ? 'Application approved and skills awarded'
        : 'Application rejected'
    })
  } catch (error) {
    console.error('Update task application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
