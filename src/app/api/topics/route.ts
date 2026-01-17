import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - List topics, optionally filtered by technology_id
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const technologyId = searchParams.get('technology_id')

    let query = supabase
      .from('topics')
      .select(`
        *,
        technology:technologies(
          *,
          course:courses(*)
        )
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (technologyId) {
      query = query.eq('technology_id', technologyId)
    }

    const { data: topics, error } = await query

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Topics GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
