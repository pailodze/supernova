import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { withLogging } from '@/lib/api-logger'

async function sendOtpHandler(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '').trim()

    if (!cleanPhone || cleanPhone.length < 9) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
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

    // Check if phone exists in students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, phone')
      .eq('phone', cleanPhone)
      .single()

    // SECURITY: Always return the same response regardless of whether phone is registered
    // This prevents user enumeration attacks
    if (studentError || !student) {
      // Still return success to prevent enumeration, but don't send SMS
      return NextResponse.json({
        success: true,
        message: 'If this phone is registered, an OTP will be sent',
        phone: cleanPhone,
      })
    }

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
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        phone: cleanPhone,
        code: otp,
        expires_at: expiresAt,
        used: false,
      })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      // Return same success message to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If this phone is registered, an OTP will be sent',
        phone: cleanPhone,
      })
    }

    // Send SMS via sender.ge
    const smsApiKey = process.env.SMS_API_KEY
    const message = encodeURIComponent(`Your verification code is: ${otp}`)
    const smsUrl = `https://sender.ge/api/send.php?apikey=${smsApiKey}&smsno=1&destination=${cleanPhone}&content=${message}`

    try {
      const smsResponse = await fetch(smsUrl)
      const smsResult = await smsResponse.text()
      console.log('SMS API response:', smsResult)
    } catch (smsError) {
      console.error('SMS sending error:', smsError)
      // Don't fail the request if SMS fails - for testing purposes
    }

    // Return same response for registered users (prevents enumeration)
    return NextResponse.json({
      success: true,
      message: 'If this phone is registered, an OTP will be sent',
      phone: cleanPhone,
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withLogging(sendOtpHandler)
