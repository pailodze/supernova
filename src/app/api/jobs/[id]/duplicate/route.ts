import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

async function duplicateJobHandler(
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

    const { data: originalJob, error: fetchError } = await supabase
      .from('jobs')
      .select(`*, job_courses (course_id), job_skill_requirements (skill_id, required_level)`)
      .eq('id', id)
      .single()

    if (fetchError || !originalJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { data: newJob, error: insertError } = await supabase
      .from('jobs')
      .insert({
        title: `${originalJob.title} (ასლი)`,
        company: originalJob.company,
        location: originalJob.location,
        type: originalJob.type,
        salary: originalJob.salary,
        open_positions: originalJob.open_positions,
        category: originalJob.category,
        description: originalJob.description,
        requirements: originalJob.requirements,
        contact_email: originalJob.contact_email,
        contact_phone: originalJob.contact_phone,
        apply_url: originalJob.apply_url,
        is_active: false,
      })
      .select()
      .single()

    if (insertError || !newJob) {
      return NextResponse.json({ error: 'Failed to duplicate job' }, { status: 500 })
    }

    if (originalJob.job_courses?.length > 0) {
      await supabase.from('job_courses').insert(
        originalJob.job_courses.map((jc: { course_id: string }) => ({
          job_id: newJob.id,
          course_id: jc.course_id,
        }))
      )
    }

    if (originalJob.job_skill_requirements?.length > 0) {
      await supabase.from('job_skill_requirements').insert(
        originalJob.job_skill_requirements.map((jsr: { skill_id: string; required_level: number }) => ({
          job_id: newJob.id,
          skill_id: jsr.skill_id,
          required_level: jsr.required_level,
        }))
      )
    }

    return NextResponse.json({ job: newJob }, { status: 201 })
  } catch (error) {
    console.error('Job duplicate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(duplicateJobHandler)
