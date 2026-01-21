import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/auth'

const ALLOWED_TECHNOLOGY_FIELDS = [
  'course_id',
  'name',
  'slug',
  'description',
  'icon',
  'order_index',
  'is_active',
]

// GET - List technologies, optionally filtered by course_id
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    const all = searchParams.get('all') === 'true'

    let query = supabase
      .from('technologies')
      .select(`
        *,
        course:courses(*),
        topics(*)
      `)
      .order('order_index', { ascending: true })

    // Only filter by is_active if not requesting all (admin view)
    if (!all) {
      query = query.eq('is_active', true)
    }

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: technologies, error } = await query

    if (error) {
      console.error('Error fetching technologies:', error)
      return NextResponse.json({ error: 'Failed to fetch technologies' }, { status: 500 })
    }

    // Sort topics within each technology
    const sortedTechnologies = technologies?.map((tech: { topics?: { order_index: number }[] }) => ({
      ...tech,
      topics: tech.topics?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) || []
    }))

    return NextResponse.json({ technologies: sortedTechnologies })
  } catch (error) {
    console.error('Technologies GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new technology (admin only)
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const rawData = await request.json()

    // Whitelist fields
    const technologyData: Record<string, unknown> = {}
    for (const field of ALLOWED_TECHNOLOGY_FIELDS) {
      if (field in rawData) {
        technologyData[field] = rawData[field]
      }
    }

    // Validate required fields
    if (!technologyData.course_id || !technologyData.name || !technologyData.slug) {
      return NextResponse.json({ error: 'course_id, name, and slug are required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: technology, error } = await supabase
      .from('technologies')
      .insert(technologyData)
      .select(`
        *,
        course:courses(*)
      `)
      .single()

    if (error) {
      console.error('Error creating technology:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Technology with this slug already exists in this course' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to create technology' }, { status: 500 })
    }

    return NextResponse.json({ technology }, { status: 201 })
  } catch (error) {
    console.error('Technology POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
