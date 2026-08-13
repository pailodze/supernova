import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import ApplyForm from '@/components/ApplyForm'

export const dynamic = 'force-dynamic'

export default async function ApplyPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  // One application per person — anyone who already applied goes straight to
  // their Discord link.
  try {
    const admin = createAdminSupabaseClient()
    const { data: existing } = await admin
      .from('applications')
      .select('id')
      .eq('student_id', session.studentId)
      .maybeSingle()
    if (existing) redirect('/welcome')
  } catch {
    // Missing service role key — let the form render and report the problem on
    // submit, which says something actionable instead of a blank error page.
  }

  // Returning students already exist in the database, so don't make them retype
  // what we know about them.
  const supabase = createServerSupabaseClient()
  const { data: student } = await supabase
    .from('students')
    .select('name, personal_id')
    .eq('id', session.studentId)
    .maybeSingle()

  const [firstName = '', ...rest] = (student?.name ?? '').trim().split(/\s+/)

  return (
    <div className="min-h-screen bg-[rgb(3,7,18)] text-white">
      {/* Static bloom rather than the landing page's animated canvas — a long
          form shouldn't compete with a particle animation for attention. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60rem 30rem at 50% -10rem, rgba(34,211,238,0.10), transparent 70%),' +
            'radial-gradient(40rem 24rem at 85% 10rem, rgba(168,85,247,0.10), transparent 70%)',
        }}
      />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
            განაცხადი
          </h1>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            დაწერე თავისუფლად, საკუთარი სიტყვებით. ფორმალური CV არ არის საჭირო — მინდა გავიგო
            ვინ ხარ, და არა როგორ აფორმატებ დოკუმენტს.
          </p>
        </div>

        <ApplyForm
          defaults={{
            firstName,
            lastName: rest.join(' '),
            personalId: student?.personal_id ?? '',
          }}
        />
      </main>
    </div>
  )
}
