import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function WelcomePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  let application: {
    first_name: string
    discord_invite_url: string | null
    created_at: string
  } | null = null

  try {
    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from('applications')
      .select('first_name, discord_invite_url, created_at')
      .eq('student_id', session.studentId)
      .maybeSingle()
    application = data
  } catch (error) {
    console.error('[welcome] could not read application:', error)
  }

  if (!application) redirect('/apply')

  return (
    <div className="min-h-screen bg-[rgb(3,7,18)] text-white flex items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(50rem 30rem at 50% 0, rgba(34,211,238,0.12), transparent 70%),' +
            'radial-gradient(40rem 24rem at 50% 100%, rgba(168,85,247,0.10), transparent 70%)',
        }}
      />

      <div className="w-full max-w-lg space-y-5">
        <div className="p-8 rounded-2xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 text-center">
          <div className="text-5xl mb-4">🌟</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
            განაცხადი მიღებულია
          </h1>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            მადლობა, {application.first_name}. შენი განაცხადი მივიღე და აუცილებლად წავიკითხავ.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50">
          <h2 className="text-lg font-semibold">შემოგვიერთდი Discord-ზე</h2>
          {application.discord_invite_url ? (
            <>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                ეს არის შენი პირადი ბმული დახურულ არხზე. ის ერთჯერადია — არავის გადაუგზავნო.
              </p>
              <a
                href={application.discord_invite_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block py-3 px-6 text-center bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/25"
              >
                Discord-ზე შესვლა
              </a>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Discord-ის ბმული ჯერ არ არის მზად. მალე გამოგიგზავნით.
            </p>
          )}
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300 transition">
            დეშბორდზე გადასვლა →
          </Link>
        </div>
      </div>
    </div>
  )
}
