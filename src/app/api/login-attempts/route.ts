import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/auth'

// GET - List login attempts with student info if available (admin only)
export async function GET() {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const supabase = createServerSupabaseClient()

    // Get all login attempts
    const { data: attempts, error } = await supabase
      .from('login_attempts')
      .select('*')
      .order('last_attempt_at', { ascending: false })

    if (error) {
      console.error('Error fetching login attempts:', error)
      return NextResponse.json({ error: 'Failed to fetch login attempts' }, { status: 500 })
    }

    // Get all phones to check against students
    const phones = attempts?.map(a => a.phone) || []

    // Get matching students
    const { data: students } = await supabase
      .from('students')
      .select('id, name, phone')
      .in('phone', phones)

    // Create a phone -> student map
    const studentMap = new Map(students?.map(s => [s.phone, s]) || [])

    // Combine attempts with student info
    const attemptsWithStudents = attempts?.map(attempt => ({
      ...attempt,
      student: studentMap.get(attempt.phone) || null,
      is_registered: studentMap.has(attempt.phone),
    })) || []

    return NextResponse.json({
      attempts: attemptsWithStudents,
      total: attemptsWithStudents.length,
      registered_count: attemptsWithStudents.filter(a => a.is_registered).length,
      unregistered_count: attemptsWithStudents.filter(a => !a.is_registered).length,
    })
  } catch (error) {
    console.error('Login attempts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
