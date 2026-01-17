import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'

// POST - Apply to participate in a task
async function applyToTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
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

    // Get the task to verify it exists and is active
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, is_active, deadline')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!task.is_active) {
      return NextResponse.json({ error: 'This task is no longer active' }, { status: 400 })
    }

    // Check if deadline has passed
    if (task.deadline && new Date(task.deadline) < new Date()) {
      return NextResponse.json({ error: 'The deadline for this task has passed' }, { status: 400 })
    }

    // Check if student already applied
    const { data: existingApplication } = await supabase
      .from('task_applications')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('task_id', taskId)
      .single()

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this task' }, { status: 400 })
    }

    // Create application record with 'in_progress' status
    const { data: application, error: applicationError } = await supabase
      .from('task_applications')
      .insert({
        student_id: studentId,
        task_id: taskId,
        status: 'in_progress',
      })
      .select()
      .single()

    if (applicationError) {
      console.error('Error creating task application:', applicationError)
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error('Task application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(applyToTaskHandler)

// GET - Check if student has applied to this task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return NextResponse.json({ applied: false })
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ applied: false })
    }

    if (!session.studentId || session.expiresAt < Date.now()) {
      return NextResponse.json({ applied: false })
    }

    const supabase = createServerSupabaseClient()

    const { data: application } = await supabase
      .from('task_applications')
      .select('id, status, created_at')
      .eq('student_id', session.studentId)
      .eq('task_id', taskId)
      .single()

    return NextResponse.json({
      applied: !!application,
      application,
    })
  } catch (error) {
    console.error('Check task application error:', error)
    return NextResponse.json({ applied: false })
  }
}

// PUT - Update application status (student can update their progress)
async function updateTaskApplicationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
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

    const body = await request.json()
    const { status, submission } = body

    // Validate status - students can only set these statuses
    const allowedStatuses = ['in_progress', 'paused', 'done']
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Require submission when marking as done
    if (status === 'done' && (!submission || !submission.trim())) {
      return NextResponse.json({ error: 'Submission is required when marking task as done' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if application exists and belongs to this student
    const { data: existingApplication } = await supabase
      .from('task_applications')
      .select('id, status')
      .eq('student_id', session.studentId)
      .eq('task_id', taskId)
      .single()

    if (!existingApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Don't allow updates if already approved or rejected by admin
    if (['approved', 'rejected'].includes(existingApplication.status)) {
      return NextResponse.json({ error: 'Cannot update approved or rejected application' }, { status: 400 })
    }

    // Update the application status
    const updateData: { status: string; updated_at: string; submission?: string } = {
      status,
      updated_at: new Date().toISOString()
    }

    // Include submission if provided (when marking as done)
    if (submission) {
      updateData.submission = submission.trim()
    }

    const { data: application, error: updateError } = await supabase
      .from('task_applications')
      .update(updateData)
      .eq('id', existingApplication.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task application:', updateError)
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      application,
    })
  } catch (error) {
    console.error('Update task application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withLogging(updateTaskApplicationHandler)

// DELETE - Cancel application
async function cancelTaskApplicationHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
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

    // Check if application exists and belongs to this student
    const { data: existingApplication } = await supabase
      .from('task_applications')
      .select('id, status')
      .eq('student_id', session.studentId)
      .eq('task_id', taskId)
      .single()

    if (!existingApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Don't allow cancellation if already approved (completed by admin)
    if (existingApplication.status === 'approved') {
      return NextResponse.json({ error: 'Cannot cancel approved application' }, { status: 400 })
    }

    // Delete the application
    const { error: deleteError } = await supabase
      .from('task_applications')
      .delete()
      .eq('id', existingApplication.id)

    if (deleteError) {
      console.error('Error deleting task application:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel application' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Delete task application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const DELETE = withLogging(cancelTaskApplicationHandler)
