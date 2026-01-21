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

// PUT - Update a technology (admin only)
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
    const technologyData: Record<string, unknown> = {}
    for (const field of ALLOWED_TECHNOLOGY_FIELDS) {
      if (field in rawData) {
        technologyData[field] = rawData[field]
      }
    }

    technologyData.updated_at = new Date().toISOString()

    const supabase = createServerSupabaseClient()
    const { data: technology, error } = await supabase
      .from('technologies')
      .update(technologyData)
      .eq('id', id)
      .select(`
        *,
        course:courses(*)
      `)
      .single()

    if (error) {
      console.error('Error updating technology:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Technology with this slug already exists in this course' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to update technology' }, { status: 500 })
    }

    return NextResponse.json({ technology })
  } catch (error) {
    console.error('Technology PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a technology (admin only)
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

    // First delete related topics
    await supabase
      .from('topics')
      .delete()
      .eq('technology_id', id)

    // Then delete the technology
    const { error } = await supabase
      .from('technologies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting technology:', error)
      return NextResponse.json({ error: 'Failed to delete technology' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Technology DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
