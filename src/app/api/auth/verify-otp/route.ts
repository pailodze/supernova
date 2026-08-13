import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'
import { withLogging } from '@/lib/api-logger'

/**
 * Has this person already submitted a pre-registration application?
 *
 * Reads a table the anon key can't see, so it needs the service role. If the
 * key is missing we say "no application" — the apply page then reports the
 * misconfiguration properly instead of the login blowing up here.
 */
async function hasApplication(studentId: string): Promise<boolean> {
  try {
    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle()
    return Boolean(data)
  } catch (error) {
    console.error('[verify-otp] could not check application status:', error)
    return false
  }
}

async function verifyOtpHandler(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').trim()
    const supabase = createServerSupabaseClient()

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'კოდი არასწორია ან ვადაგასულია' }, { status: 400 })
    }

    // Mark OTP as used
    await supabase.from('otp_codes').update({ used: true }).eq('id', otpRecord.id)

    // Get student data
    const { data: existing } = await supabase
      .from('students')
      .select('id, name, phone, is_admin, status, is_pre_registration')
      .eq('phone', cleanPhone)
      .maybeSingle()

    let student = existing

    // No record yet? This is a self-registration. Create the account now — the
    // name arrives with the application, so it stays empty until then.
    if (!student) {
      const { data: created, error: createError } = await supabase
        .from('students')
        .insert({
          phone: cleanPhone,
          name: '',
          status: 'applicant',
          source: 'pre-registration',
          // Permanent marker separating newcomers from the imported Novatori
          // student database — `status` will change later, this won't.
          is_pre_registration: true,
          is_admin: false,
          registration_date: new Date().toISOString().slice(0, 10),
        })
        .select('id, name, phone, is_admin, status, is_pre_registration')
        .single()

      if (createError || !created) {
        console.error('Error creating student:', createError)
        return NextResponse.json({ error: 'რეგისტრაცია ვერ მოხერხდა' }, { status: 500 })
      }

      student = created
    }

    // Applicants must complete the form before they get anywhere else. Existing
    // students are left alone — they can apply from the dashboard whenever they
    // like, rather than being locked out of a course they're already taking.
    const needsApplication =
      student.is_pre_registration === true && !(await hasApplication(student.id))

    // Create session cookie
    const sessionData = {
      studentId: student.id,
      phone: student.phone,
      name: student.name,
      isAdmin: student.is_admin || false,
      needsApplication,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    const cookieStore = await cookies()
    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      needsApplication,
      student: {
        id: student.id,
        name: student.name,
      },
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(verifyOtpHandler)
