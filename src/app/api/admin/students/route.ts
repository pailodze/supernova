import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

const ALLOWED_STUDENT_FIELDS = [
  'name', 'phone', 'personal_id', 'email', 'status', 'group_name',
  'intake', 'birth_date', 'profession', 'attendance_type', 'bank',
  'payment_method', 'debt', 'paid', 'total_amount', 'next_payment',
  'payer', 'personal_info', 'comment', 'source', 'discord', 'contract',
  'parent_phone', 'parent_name', 'sales_manager', 'coins', 'is_admin'
]

async function getStudentsHandler(request: NextRequest) {
  try {
    // Verify admin access against database (not just cookie)
    const { isAdmin } = await verifyAdmin()

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get search query from URL params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const id = searchParams.get('id')

    // If ID is provided, fetch single student with all fields and courses
    if (id) {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching student:', error)
        return NextResponse.json(
          { error: 'Failed to fetch student' },
          { status: 500 }
        )
      }

      // Fetch student's courses
      const { data: studentCourses } = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('student_id', id)

      const course_ids = studentCourses?.map(sc => sc.course_id) || []

      return NextResponse.json({ student: { ...student, course_ids } })
    }

    let query = supabase
      .from('students')
      .select('id, name, phone, email, group_name, is_admin')
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: students, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      students: students || [],
    })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new student (admin only)
async function createStudentHandler(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    // Extract course_ids from body
    const { course_ids, ...rest } = body

    // Whitelist allowed fields
    const studentData: Record<string, unknown> = {}
    for (const field of ALLOWED_STUDENT_FIELDS) {
      if (field in rest && rest[field] !== undefined) {
        studentData[field] = rest[field]
      }
    }

    const supabase = createServerSupabaseClient()

    // Check if phone already exists
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('phone', body.phone.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Student with this phone number already exists' },
        { status: 400 }
      )
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating student:', error)
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      )
    }

    // Add course relations if provided
    if (course_ids && course_ids.length > 0) {
      const studentCourses = course_ids.map((courseId: string) => ({
        student_id: student.id,
        course_id: courseId,
      }))

      const { error: courseError } = await supabase
        .from('student_courses')
        .insert(studentCourses)

      if (courseError) {
        console.error('Error adding course relations:', courseError)
      }
    }

    return NextResponse.json({ student: { ...student, course_ids: course_ids || [] } }, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a student (admin only)
async function updateStudentHandler(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Extract course_ids from body
    const { course_ids, id, ...rest } = body

    // Whitelist allowed fields
    const studentData: Record<string, unknown> = {}
    for (const field of ALLOWED_STUDENT_FIELDS) {
      if (field in rest && rest[field] !== undefined) {
        studentData[field] = rest[field]
      }
    }

    const supabase = createServerSupabaseClient()

    // If phone is being updated, check it's not already taken by another student
    if (studentData.phone) {
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('phone', studentData.phone)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'Another student with this phone number already exists' },
          { status: 400 }
        )
      }
    }

    // Update student data if there are fields to update
    let student = null
    if (Object.keys(studentData).length > 0) {
      const { data, error } = await supabase
        .from('students')
        .update(studentData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating student:', error)
        return NextResponse.json(
          { error: 'Failed to update student' },
          { status: 500 }
        )
      }
      student = data
    } else {
      // Fetch current student data if no fields to update
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()
      student = data
    }

    // Update course relations if course_ids is provided
    if (course_ids !== undefined) {
      // Delete existing relations
      await supabase
        .from('student_courses')
        .delete()
        .eq('student_id', id)

      // Add new relations
      if (course_ids && course_ids.length > 0) {
        const studentCourses = course_ids.map((courseId: string) => ({
          student_id: id,
          course_id: courseId,
        }))

        const { error: courseError } = await supabase
          .from('student_courses')
          .insert(studentCourses)

        if (courseError) {
          console.error('Error updating course relations:', courseError)
        }
      }
    }

    return NextResponse.json({ student: { ...student, course_ids: course_ids || [] } })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withLogging(getStudentsHandler)
export const POST = withLogging(createStudentHandler)
export const PUT = withLogging(updateStudentHandler)
