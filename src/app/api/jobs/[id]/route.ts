import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

// Allowed fields for job updates (whitelist to prevent mass assignment)
const ALLOWED_JOB_FIELDS = [
  'title',
  'company',
  'location',
  'type',
  'salary',
  'open_positions',
  'description',
  'requirements',
  'contact_email',
  'contact_phone',
  'apply_url',
  'is_active',
]

// GET - Get a single job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a job (admin only)
async function updateJobHandler(
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

    // Extract course_ids and skill_requirements from body if present
    const { course_ids, skill_requirements, ...rawJobData } = body

    // Whitelist fields to prevent mass assignment attacks
    const jobData: Record<string, unknown> = {}
    for (const field of ALLOWED_JOB_FIELDS) {
      if (field in rawJobData) {
        jobData[field] = rawJobData[field]
      }
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .update({
        ...jobData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job:', error)
      return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
    }

    // Update course relations if course_ids is provided
    if (course_ids !== undefined) {
      // Delete existing relations
      await supabase
        .from('job_courses')
        .delete()
        .eq('job_id', id)

      // Add new relations
      if (course_ids && course_ids.length > 0) {
        const jobCourses = course_ids.map((courseId: string) => ({
          job_id: id,
          course_id: courseId,
        }))

        const { error: courseError } = await supabase
          .from('job_courses')
          .insert(jobCourses)

        if (courseError) {
          console.error('Error updating course relations:', courseError)
        }
      }
    }

    // Update skill requirements if skill_requirements is provided
    if (skill_requirements !== undefined) {
      // Delete existing requirements
      await supabase
        .from('job_skill_requirements')
        .delete()
        .eq('job_id', id)

      // Add new requirements
      if (skill_requirements && skill_requirements.length > 0) {
        const jobSkillReqs = skill_requirements.map((sr: { skill_id: string; required_level: number }) => ({
          job_id: id,
          skill_id: sr.skill_id,
          required_level: sr.required_level || 1,
        }))

        const { error: skillError } = await supabase
          .from('job_skill_requirements')
          .insert(jobSkillReqs)

        if (skillError) {
          console.error('Error updating skill requirements:', skillError)
        }
      }
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Job PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withLogging(updateJobHandler)

// DELETE - Soft delete a job (admin only)
async function deleteJobHandler(
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

    const { error } = await supabase
      .from('jobs')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting job:', error)
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const DELETE = withLogging(deleteJobHandler)
