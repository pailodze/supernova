import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/auth'

const ALLOWED_TOPIC_FIELDS = [
  'technology_id',
  'name',
  'slug',
  'description',
  'duration',
  'theory_video',
  'miro_link',
  'order_index',
  'is_active',
]

// GET - List topics, optionally filtered by technology_id
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const technologyId = searchParams.get('technology_id')
    const all = searchParams.get('all') === 'true'

    let query = supabase
      .from('topics')
      .select(`
        *,
        technology:technologies(
          *,
          course:courses(*)
        )
      `)
      .order('order_index', { ascending: true })

    // Only filter by is_active if not requesting all (admin view)
    if (!all) {
      query = query.eq('is_active', true)
    }

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

// POST - Create a new topic (admin only)
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const rawData = await request.json()

    // Whitelist fields
    const topicData: Record<string, unknown> = {}
    for (const field of ALLOWED_TOPIC_FIELDS) {
      if (field in rawData) {
        topicData[field] = rawData[field]
      }
    }

    // Validate required fields
    if (!topicData.technology_id || !topicData.name || !topicData.slug) {
      return NextResponse.json({ error: 'technology_id, name, and slug are required' }, { status: 400 })
    }

    // Set default duration if not provided
    if (topicData.duration === undefined) {
      topicData.duration = 0
    }

    const supabase = createServerSupabaseClient()
    const { data: topic, error } = await supabase
      .from('topics')
      .insert(topicData)
      .select(`
        *,
        technology:technologies(
          *,
          course:courses(*)
        )
      `)
      .single()

    if (error) {
      console.error('Error creating topic:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Topic with this slug already exists in this technology' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    return NextResponse.json({ topic }, { status: 201 })
  } catch (error) {
    console.error('Topic POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
