import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get a single technology with its topics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data: technology, error } = await supabase
      .from('technologies')
      .select(`
        *,
        course:courses(*),
        topics(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Technology not found' }, { status: 404 })
      }
      console.error('Error fetching technology:', error)
      return NextResponse.json({ error: 'Failed to fetch technology' }, { status: 500 })
    }

    // Sort topics by order_index
    const sortedTechnology = {
      ...technology,
      topics: technology.topics?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index) || []
    }

    return NextResponse.json({ technology: sortedTechnology })
  } catch (error) {
    console.error('Technology GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
