import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createDiscordInvite } from '@/lib/discord'
import { normalizeApplication, validateApplication } from '@/lib/application'
import { withLogging } from '@/lib/api-logger'

/** Re-issues the session cookie with needsApplication cleared. */
async function clearNeedsApplication(name: string) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('session')
  if (!raw) return

  try {
    const session = JSON.parse(raw.value)
    const updated = { ...session, name, needsApplication: false }
    cookieStore.set('session', JSON.stringify(updated), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
  } catch {
    // Malformed cookie — the next sign-in will rebuild it correctly.
  }
}

async function submitApplicationHandler(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'ავტორიზაცია საჭიროა' }, { status: 401 })
  }

  let raw: Record<string, unknown>
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const input = normalizeApplication(raw)
  const fieldErrors = validateApplication(input)
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ fieldErrors }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminSupabaseClient()
  } catch (error) {
    console.error('[application]', error)
    return NextResponse.json(
      { error: 'სერვერი არასწორად არის კონფიგურირებული. დაგვიკავშირდი.' },
      { status: 500 }
    )
  }

  try {
    const { data: existing } = await admin
      .from('applications')
      .select('id, discord_invite_url')
      .eq('student_id', session.studentId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'განაცხადი უკვე გაგზავნილია', discordUrl: existing.discord_invite_url },
        { status: 409 }
      )
    }

    // Mint the invite first so it can be stored with the application — one
    // applicant, one durable link they can come back to.
    const invite = await createDiscordInvite()
    if (!invite.ok) {
      console.error(`[discord] no invite for student ${session.studentId}: ${invite.error}`)
    }

    const { error: insertError } = await admin.from('applications').insert({
      student_id: session.studentId,
      first_name: input.firstName,
      last_name: input.lastName,
      personal_id: input.personalId,
      education: input.education,
      interests: input.interests,
      work_experience: input.workExperience,
      why_supernova: input.whySupernova,
      discord_invite_url: invite.ok ? invite.url : null,
      discord_invite_created_at: invite.ok ? new Date().toISOString() : null,
    })

    if (insertError) {
      console.error('[application] insert failed:', insertError)
      return NextResponse.json({ error: 'განაცხადის შენახვა ვერ მოხერხდა' }, { status: 500 })
    }

    // Mirror the name and personal ID onto the student record so the rest of
    // the LMS (dashboard, certificates, admin) shows a real person.
    const fullName = `${input.firstName} ${input.lastName}`.trim()
    const supabase = createServerSupabaseClient()
    await supabase
      .from('students')
      .update({ name: fullName, personal_id: input.personalId })
      .eq('id', session.studentId)

    await clearNeedsApplication(fullName)

    return NextResponse.json({
      success: true,
      discordUrl: invite.ok ? invite.url : null,
    })
  } catch (error) {
    console.error('[application] submit failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getApplicationHandler() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'ავტორიზაცია საჭიროა' }, { status: 401 })
  }

  try {
    const admin = createAdminSupabaseClient()
    // personal_id is deliberately not selected — the applicant doesn't need it
    // echoed back, and it keeps PII out of a response that's easy to forget.
    const { data } = await admin
      .from('applications')
      .select('first_name, last_name, status, discord_invite_url, created_at')
      .eq('student_id', session.studentId)
      .maybeSingle()

    return NextResponse.json({ application: data ?? null })
  } catch (error) {
    console.error('[application] read failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(submitApplicationHandler)
export const GET = getApplicationHandler
