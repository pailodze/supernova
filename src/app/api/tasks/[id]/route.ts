import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

// Allowed fields for task updates (whitelist to prevent mass assignment)
const ALLOWED_TASK_FIELDS = [
  'title',
  'description',
  'deadline',
  'is_active',
]

// GET - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_courses (
          course_id,
          courses (
            id,
            name,
            slug
          )
        ),
        task_skill_rewards (
          skill_id,
          level_reward,
          skills (
            id,
            name,
            icon
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const transformedTask = {
      ...task,
      courses: task.task_courses?.map((tc: { courses: unknown }) => tc.courses).filter(Boolean) || [],
      skill_rewards: task.task_skill_rewards?.map((tsr: { skill_id: string; level_reward: number; skills: unknown }) => ({
        skill_id: tsr.skill_id,
        level_reward: tsr.level_reward,
        skill: tsr.skills
      })).filter((sr: { skill: unknown }) => sr.skill) || [],
      task_courses: undefined,
      task_skill_rewards: undefined
    }

    return NextResponse.json({ task: transformedTask })
  } catch (error) {
    console.error('Task GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a task (admin only)
async function updateTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = createServerSupabaseClient()

    const { course_ids, skill_rewards, ...rawTaskData } = body

    // Whitelist fields to prevent mass assignment attacks
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of ALLOWED_TASK_FIELDS) {
      if (field in rawTaskData) {
        updateData[field] = rawTaskData[field]
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Update course relations if provided
    if (course_ids !== undefined) {
      // Delete existing relations
      await supabase.from('task_courses').delete().eq('task_id', id)

      // Add new relations
      if (course_ids.length > 0) {
        const taskCourses = course_ids.map((courseId: string) => ({
          task_id: id,
          course_id: courseId,
        }))

        await supabase.from('task_courses').insert(taskCourses)
      }
    }

    // Update skill rewards if provided
    if (skill_rewards !== undefined) {
      // Delete existing rewards
      await supabase.from('task_skill_rewards').delete().eq('task_id', id)

      // Add new rewards
      if (skill_rewards.length > 0) {
        const taskSkillRewards = skill_rewards.map((sr: { skill_id: string; level_reward: number }) => ({
          task_id: id,
          skill_id: sr.skill_id,
          level_reward: sr.level_reward || 1,
        }))

        await supabase.from('task_skill_rewards').insert(taskSkillRewards)
      }
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Task PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withLogging(updateTaskHandler)

// DELETE - Delete a task (admin only)
async function deleteTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const DELETE = withLogging(deleteTaskHandler)
