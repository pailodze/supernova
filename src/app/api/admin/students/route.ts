import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

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

export const GET = withLogging(getStudentsHandler)
