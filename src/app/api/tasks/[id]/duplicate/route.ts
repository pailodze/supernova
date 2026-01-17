import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

async function duplicateTaskHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data: originalTask, error: fetchError } = await supabase
      .from('tasks')
      .select(`*, task_courses (course_id), task_skill_rewards (skill_id, level_reward)`)
      .eq('id', id)
      .single()

    if (fetchError || !originalTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        title: `${originalTask.title} (ასლი)`,
        description: originalTask.description,
        coins_reward: originalTask.coins_reward,
        deadline: null, // Reset deadline for duplicates
        is_active: false,
      })
      .select()
      .single()

    if (insertError || !newTask) {
      return NextResponse.json({ error: 'Failed to duplicate task' }, { status: 500 })
    }

    if (originalTask.task_courses?.length > 0) {
      await supabase.from('task_courses').insert(
        originalTask.task_courses.map((tc: { course_id: string }) => ({
          task_id: newTask.id,
          course_id: tc.course_id,
        }))
      )
    }

    if (originalTask.task_skill_rewards?.length > 0) {
      await supabase.from('task_skill_rewards').insert(
        originalTask.task_skill_rewards.map((tsr: { skill_id: string; level_reward: number }) => ({
          task_id: newTask.id,
          skill_id: tsr.skill_id,
          level_reward: tsr.level_reward,
        }))
      )
    }

    return NextResponse.json({ task: newTask }, { status: 201 })
  } catch (error) {
    console.error('Task duplicate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(duplicateTaskHandler)
