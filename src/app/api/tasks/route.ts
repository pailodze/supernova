import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

// GET - List tasks (all for admin, active only for students)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const supabase = createServerSupabaseClient()

    // If requesting all tasks (including inactive), verify admin
    if (all) {
      const { isAdmin } = await verifyAdmin()
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }
    }

    let query = supabase
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
      .order('deadline', { ascending: true, nullsFirst: false })

    if (!all) {
      query = query.eq('is_active', true)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const transformedTasks = tasks?.map(task => ({
      ...task,
      courses: task.task_courses?.map((tc: { courses: unknown }) => tc.courses).filter(Boolean) || [],
      skill_rewards: task.task_skill_rewards?.map((tsr: { skill_id: string; level_reward: number; skills: unknown }) => ({
        skill_id: tsr.skill_id,
        level_reward: tsr.level_reward,
        skill: tsr.skills
      })).filter((sr: { skill: unknown }) => sr.skill) || [],
      task_courses: undefined,
      task_skill_rewards: undefined
    }))

    return NextResponse.json({ tasks: transformedTasks })
  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new task (admin only)
async function createTaskHandler(request: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    const {
      title,
      description,
      deadline,
      course_ids,
      skill_rewards, // Array of { skill_id, level_reward }
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: description || null,
        deadline: deadline || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // Add course relations if provided
    if (course_ids && course_ids.length > 0) {
      const taskCourses = course_ids.map((courseId: string) => ({
        task_id: task.id,
        course_id: courseId,
      }))

      const { error: courseError } = await supabase
        .from('task_courses')
        .insert(taskCourses)

      if (courseError) {
        console.error('Error adding course relations:', courseError)
      }
    }

    // Add skill rewards if provided
    if (skill_rewards && skill_rewards.length > 0) {
      const taskSkillRewards = skill_rewards.map((sr: { skill_id: string; level_reward: number }) => ({
        task_id: task.id,
        skill_id: sr.skill_id,
        level_reward: sr.level_reward || 1,
      }))

      const { error: skillError } = await supabase
        .from('task_skill_rewards')
        .insert(taskSkillRewards)

      if (skillError) {
        console.error('Error adding skill rewards:', skillError)
      }
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(createTaskHandler)
