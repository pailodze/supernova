import { cookies } from 'next/headers'
import Link from 'next/link'
import ImpersonationBanner from '@/components/ImpersonationBanner'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  let isImpersonating = false
  let impersonatedName = ''
  let originalAdminName = ''

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      if (session.isImpersonating && session.originalAdmin) {
        isImpersonating = true
        impersonatedName = session.name || 'Unknown'
        originalAdminName = session.originalAdmin.name || 'Admin'
      }
    } catch {
      // Invalid session, ignore
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {isImpersonating && (
        <ImpersonationBanner
          impersonatedName={impersonatedName}
          originalAdminName={originalAdminName}
        />
      )}
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="text-xl font-bold text-zinc-900 dark:text-white">
              ადმინ პანელი
            </Link>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg transition"
              >
                სტუდენტები
              </Link>
              <Link
                href="/admin/jobs"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                ვაკანსიები
              </Link>
              <Link
                href="/admin/tasks"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
              >
                დავალებები
              </Link>
              <Link
                href="/admin/skills"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
              >
                უნარები
              </Link>
              <Link
                href="/admin/logs"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
              >
                ლოგები
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 text-zinc-700 dark:text-zinc-200 font-medium rounded-lg transition"
              >
                დაბრუნება
              </Link>
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
