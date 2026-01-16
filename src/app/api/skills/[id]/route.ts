import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/auth'

const ALLOWED_SKILL_FIELDS = ['name', 'description', 'icon', 'is_active']

// GET - Get a single skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data: skill, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Skill GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a skill (admin only)
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
    const skillData: Record<string, unknown> = {}
    for (const field of ALLOWED_SKILL_FIELDS) {
      if (field in rawData) {
        skillData[field] = rawData[field]
      }
    }

    skillData.updated_at = new Date().toISOString()

    const supabase = createServerSupabaseClient()
    const { data: skill, error } = await supabase
      .from('skills')
      .update(skillData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating skill:', error)
      return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
    }

    return NextResponse.json({ skill })
  } catch (error) {
    console.error('Skill PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a skill (admin only)
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

    // First delete related student_skills
    await supabase
      .from('student_skills')
      .delete()
      .eq('skill_id', id)

    // Then delete the skill
    const { error } = await supabase
      .from('skills')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting skill:', error)
      return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Skill DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
