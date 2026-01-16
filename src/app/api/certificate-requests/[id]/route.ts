import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'
import { verifyAdmin } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PUT - Update certificate request status (admin only)
async function updateRequestHandler(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, rejection_reason, estimated_arrival } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'rejected', 'sent', 'delivered']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate required fields for specific statuses
    if (status === 'rejected' && !rejection_reason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    if (status === 'sent' && !estimated_arrival) {
      return NextResponse.json(
        { error: 'Estimated arrival date is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason.trim()
      updateData.estimated_arrival = null
    } else if (status === 'sent') {
      updateData.estimated_arrival = estimated_arrival
      updateData.rejection_reason = null
    } else if (status === 'delivered') {
      updateData.rejection_reason = null
    }

    const { data: updatedRequest, error } = await supabase
      .from('certificate_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating certificate request:', error)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Certificate request PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete certificate request (admin only)
async function deleteRequestHandler(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { isAdmin } = await verifyAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('certificate_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting certificate request:', error)
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Certificate request DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const PUT = withLogging(updateRequestHandler)
export const DELETE = withLogging(deleteRequestHandler)
