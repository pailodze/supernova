import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

type Row = {
  id: string
  first_name: string
  last_name: string
  personal_id: string
  education: string
  interests: string
  work_experience: string
  why_supernova: string
  status: string
  created_at: string
  student: { phone: string; is_pre_registration: boolean; status: string | null } | null
}

function toCsv(rows: Row[]): string {
  const headers = [
    'created_at', 'first_name', 'last_name', 'personal_id', 'phone', 'origin',
    'education', 'interests', 'work_experience', 'why_supernova', 'status',
  ]
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

  const lines = rows.map(row =>
    [
      row.created_at,
      row.first_name,
      row.last_name,
      row.personal_id,
      row.student?.phone ?? '',
      row.student?.is_pre_registration ? 'new' : 'existing-student',
      row.education,
      row.interests,
      row.work_experience,
      row.why_supernova,
      row.status,
    ]
      .map(escape)
      .join(',')
  )

  return [headers.join(','), ...lines].join('\n')
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('applications')
      .select('*, student:students(phone, is_pre_registration, status)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/applications] query failed:', error)
      return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 })
    }

    const rows = (data ?? []) as unknown as Row[]

    if (request.nextUrl.searchParams.get('format') === 'csv') {
      return new NextResponse(toCsv(rows), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="supernova-applications.csv"',
          'Cache-Control': 'no-store',
        },
      })
    }

    return NextResponse.json(
      { applications: rows },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[admin/applications] failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
