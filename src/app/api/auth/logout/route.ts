import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withLogging } from '@/lib/api-logger'

async function logoutHandler(_request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete('session')

  return NextResponse.json({ success: true })
}

export const POST = withLogging(logoutHandler)
