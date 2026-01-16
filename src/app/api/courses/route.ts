import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - List all courses
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Courses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
