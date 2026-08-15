import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Server-only Supabase client that bypasses RLS.
 *
 * Needed for `applications`, which holds personal ID numbers and therefore has
 * RLS enabled with no policies — the anon key (public in the browser) cannot
 * touch it. Never import this into a client component.
 *
 * Throws when the key is missing rather than quietly falling back to the anon
 * client, because that fallback would mean storing personal IDs in a table the
 * whole internet can read.
 */
export function createAdminSupabaseClient() {
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. It is required to read or write applications. ' +
        'Copy it from Supabase → Project Settings → API → service_role.'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
