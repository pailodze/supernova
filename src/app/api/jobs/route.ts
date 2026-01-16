import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

// GET - List jobs (all for admin, active only for students)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const supabase = createServerSupabaseClient()

    // If requesting all jobs (including inactive), verify admin
    if (all) {
      const { isAdmin } = await verifyAdmin()
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
      }
    }

    // Fetch jobs with their related courses and skill requirements
    let query = supabase
      .from('jobs')
      .select(`
        *,
        job_courses (
          course_id,
          courses (
            id,
            name,
            slug
          )
        ),
        job_skill_requirements (
          skill_id,
          required_level,
          skills (
            id,
            name,
            icon
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Only filter by is_active if not requesting all jobs (admin)
    if (!all) {
      query = query.eq('is_active', true)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Transform the data to flatten courses and skill requirements
    const transformedJobs = jobs?.map(job => ({
      ...job,
      courses: job.job_courses?.map((jc: { courses: unknown }) => jc.courses).filter(Boolean) || [],
      skill_requirements: job.job_skill_requirements?.map((jsr: { skill_id: string; required_level: number; skills: unknown }) => ({
        skill_id: jsr.skill_id,
        required_level: jsr.required_level,
        skill: jsr.skills
      })).filter((sr: { skill: unknown }) => sr.skill) || [],
      job_courses: undefined,
      job_skill_requirements: undefined
    }))

    return NextResponse.json({ jobs: transformedJobs })
  } catch (error) {
    console.error('Jobs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new job (admin only)
async function createJobHandler(request: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    const {
      title,
      company,
      location,
      type,
      salary,
      course_ids, // Array of course IDs
      skill_requirements, // Array of { skill_id, required_level }
      description,
      requirements,
      contact_email,
      contact_phone,
      apply_url,
    } = body

    if (!title || !company) {
      return NextResponse.json(
        { error: 'Title and company are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Create the job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title,
        company,
        location: location || null,
        type: type || null,
        salary: salary || null,
        description: description || null,
        requirements: requirements || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        apply_url: apply_url || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating job:', error)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    // Add course relations if provided
    if (course_ids && course_ids.length > 0) {
      const jobCourses = course_ids.map((courseId: string) => ({
        job_id: job.id,
        course_id: courseId,
      }))

      const { error: courseError } = await supabase
        .from('job_courses')
        .insert(jobCourses)

      if (courseError) {
        console.error('Error adding course relations:', courseError)
      }
    }

    // Add skill requirements if provided
    if (skill_requirements && skill_requirements.length > 0) {
      const jobSkillReqs = skill_requirements.map((sr: { skill_id: string; required_level: number }) => ({
        job_id: job.id,
        skill_id: sr.skill_id,
        required_level: sr.required_level || 1,
      }))

      const { error: skillError } = await supabase
        .from('job_skill_requirements')
        .insert(jobSkillReqs)

      if (skillError) {
        console.error('Error adding skill requirements:', skillError)
      }
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Jobs POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(createJobHandler)
