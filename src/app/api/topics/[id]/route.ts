import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Get a single topic with its technology and course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data: topic, error } = await supabase
      .from('topics')
      .select(`
        *,
        technology:technologies(
          *,
          course:courses(*)
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      }
      console.error('Error fetching topic:', error)
      return NextResponse.json({ error: 'Failed to fetch topic' }, { status: 500 })
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Topic GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
