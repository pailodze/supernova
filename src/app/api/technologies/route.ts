import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - List technologies, optionally filtered by course_id
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    let query = supabase
      .from('technologies')
      .select(`
        *,
        course:courses(*),
        topics(*)
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: technologies, error } = await query

    if (error) {
      console.error('Error fetching technologies:', error)
      return NextResponse.json({ error: 'Failed to fetch technologies' }, { status: 500 })
    }

    // Sort topics within each technology
    const sortedTechnologies = technologies?.map(tech => ({
      ...tech,
      topics: tech.topics?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) || []
    }))

    return NextResponse.json({ technologies: sortedTechnologies })
  } catch (error) {
    console.error('Technologies GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
