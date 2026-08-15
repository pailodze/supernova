import { createServerSupabaseClient } from '@/lib/supabase-server'

// Registration is open to anyone, which means /api/auth/send-otp can be used to
// spend real SMS credit on arbitrary numbers. These limits are the only thing
// standing between an open endpoint and someone else's phone bill.
const RESEND_COOLDOWN_SECONDS = 60
const MAX_PER_PHONE_PER_HOUR = 5

export type RateLimit =
  | { ok: true }
  | { ok: false; reason: 'cooldown' | 'hourly'; retryAfter: number }

export async function checkOtpRateLimit(phone: string): Promise<RateLimit> {
  const supabase = createServerSupabaseClient()
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('otp_codes')
    .select('created_at')
    .eq('phone', phone)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false })

  // Fail open on an infrastructure error: a Supabase blip shouldn't lock
  // everyone out of signing in.
  if (error || !data) {
    console.error('[otp] rate limit check failed, allowing request:', error)
    return { ok: true }
  }

  if (data.length > 0) {
    const elapsed = (Date.now() - new Date(data[0].created_at).getTime()) / 1000
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        reason: 'cooldown',
        retryAfter: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
      }
    }
  }

  if (data.length >= MAX_PER_PHONE_PER_HOUR) {
    return { ok: false, reason: 'hourly', retryAfter: 3600 }
  }

  return { ok: true }
}
