import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { getSession, verifyAdmin } from '@/lib/auth'

// GET - Get current user's certificate request or all requests for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const supabase = createServerSupabaseClient()

    // Admin can get all requests
    if (all) {
      const { isAdmin } = await verifyAdmin()
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { data: requests, error } = await supabase
        .from('certificate_requests')
        .select(`
          *,
          students (
            id,
            name,
            phone,
            email,
            group_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching certificate requests:', error)
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
      }

      const transformedRequests = requests?.map(req => ({
        ...req,
        student: req.students,
        students: undefined,
      }))

      return NextResponse.json({ requests: transformedRequests })
    }

    // Regular user gets their own request
    const { data: certRequest, error } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('student_id', session.studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching certificate request:', error)
      return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
    }

    return NextResponse.json({ request: certRequest })
  } catch (error) {
    console.error('Certificate requests GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new certificate request
async function createRequestHandler(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { address, latitude, longitude, additional_info } = body

    if (!address || !address.trim()) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Location coordinates are required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if user already has a pending or sent request
    const { data: existingRequest } = await supabase
      .from('certificate_requests')
      .select('id, status')
      .eq('student_id', session.studentId)
      .in('status', ['pending', 'sent'])
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have an active certificate request' },
        { status: 400 }
      )
    }

    // Create new request
    const { data: newRequest, error } = await supabase
      .from('certificate_requests')
      .insert({
        student_id: session.studentId,
        address: address.trim(),
        latitude,
        longitude,
        additional_info: additional_info?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating certificate request:', error)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ request: newRequest }, { status: 201 })
  } catch (error) {
    console.error('Certificate requests POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(createRequestHandler)
