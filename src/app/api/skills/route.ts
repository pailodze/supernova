import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/auth'

const ALLOWED_SKILL_FIELDS = ['name', 'description', 'icon', 'is_active']

// GET - List all skills (public for active, all for admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    let query = supabase
      .from('skills')
      .select('*')
      .order('name', { ascending: true })

    // If not requesting all, only return active skills
    if (!all) {
      query = query.eq('is_active', true)
    } else {
      // Verify admin access for viewing all skills
      const { isAdmin } = await verifyAdmin()
      if (!isAdmin) {
        query = query.eq('is_active', true)
      }
    }

    const { data: skills, error } = await query

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
    }

    return NextResponse.json({ skills: skills || [] })
  } catch (error) {
    console.error('Skills GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new skill (admin only)
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const rawData = await request.json()

    // Whitelist fields
    const skillData: Record<string, unknown> = {}
    for (const field of ALLOWED_SKILL_FIELDS) {
      if (field in rawData) {
        skillData[field] = rawData[field]
      }
    }

    if (!skillData.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: skill, error } = await supabase
      .from('skills')
      .insert(skillData)
      .select()
      .single()

    if (error) {
      console.error('Error creating skill:', error)
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
    }

    return NextResponse.json({ skill }, { status: 201 })
  } catch (error) {
    console.error('Skills POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
