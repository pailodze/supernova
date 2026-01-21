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

// PUT - Update a topic (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const rawData = await request.json()

    // Whitelist fields
    const topicData: Record<string, unknown> = {}
    for (const field of ALLOWED_TOPIC_FIELDS) {
      if (field in rawData) {
        topicData[field] = rawData[field]
      }
    }

    topicData.updated_at = new Date().toISOString()

    const supabase = createServerSupabaseClient()
    const { data: topic, error } = await supabase
      .from('topics')
      .update(topicData)
      .eq('id', id)
      .select(`
        *,
        technology:technologies(
          *,
          course:courses(*)
        )
      `)
      .single()

    if (error) {
      console.error('Error updating topic:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Topic with this slug already exists in this technology' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Topic PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a topic (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting topic:', error)
      return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Topic DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
