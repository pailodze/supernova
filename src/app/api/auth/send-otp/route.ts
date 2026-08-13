import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkOtpRateLimit } from '@/lib/otp-rate-limit'
import { withLogging } from '@/lib/api-logger'

async function sendOtpHandler(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '').trim()

    if (!cleanPhone || cleanPhone.length < 9) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Registration is open, so this endpoint now sends to numbers we've never
    // seen. Rate limit before doing anything that costs money.
    const limit = await checkOtpRateLimit(cleanPhone)
    if (!limit.ok) {
      return NextResponse.json(
        {
          error:
            limit.reason === 'cooldown'
              ? `ახალი კოდის მოთხოვნა შესაძლებელია ${limit.retryAfter} წამში`
              : 'ამ ნომრისთვის ლიმიტი ამოიწურა. სცადე ერთი საათის შემდეგ.',
          retryAfter: limit.retryAfter,
        },
        { status: 429 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Track this login attempt (upsert to only store unique numbers)
    await supabase
      .from('login_attempts')
      .upsert(
        { phone: cleanPhone, last_attempt_at: new Date().toISOString() },
        { onConflict: 'phone' }
      )

    // NOTE: this used to bail out unless the number was already in `students`,
    // which made self-registration impossible. Pre-registration is open to
    // everyone, so we now send to any number and create the account on verify.
    // That deliberately gives up the old user-enumeration protection — it was
    // moot the moment anyone could register with any number anyway.

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Mark any existing unused OTPs for this phone as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('phone', cleanPhone)
      .eq('used', false)

    // Store OTP in database
    const { error: otpError } = await supabase.from('otp_codes').insert({
      phone: cleanPhone,
      code: otp,
      expires_at: expiresAt,
      used: false,
    })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      return NextResponse.json({ error: 'კოდის გაგზავნა ვერ მოხერხდა' }, { status: 500 })
    }

    // Send SMS via sender.ge
    const smsApiKey = process.env.SMS_API_KEY
    const message = encodeURIComponent(`supernova.guru კოდი: ${otp}`)
    const smsUrl = `https://sender.ge/api/send.php?apikey=${smsApiKey}&smsno=1&destination=${cleanPhone}&content=${message}`

    try {
      const smsResponse = await fetch(smsUrl)
      const smsResult = await smsResponse.text()
      console.log('SMS API response:', smsResult)
    } catch (smsError) {
      console.error('SMS sending error:', smsError)
      // Don't fail the request if SMS fails - for testing purposes
    }

    return NextResponse.json({
      success: true,
      message: 'კოდი გაიგზავნა',
      phone: cleanPhone,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withLogging(sendOtpHandler)
