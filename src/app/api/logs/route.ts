import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifyAdmin } from '@/lib/auth'

// GET - List API logs with filtering (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')
    const path = searchParams.get('path')
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabaseClient()

    let query = supabase
      .from('api_logs')
      .select(`
        *,
        students (
          id,
          name,
          phone
        )
      `, { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (method) {
      query = query.eq('method', method)
    }

    if (path) {
      query = query.ilike('path', `%${path}%`)
    }

    if (status) {
      if (status === 'success') {
        query = query.gte('status_code', 200).lt('status_code', 300)
      } else if (status === 'error') {
        query = query.gte('status_code', 400)
      } else {
        query = query.eq('status_code', parseInt(status))
      }
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (startDate) {
      query = query.gte('timestamp', startDate)
    }

    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching logs:', error)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Logs GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
