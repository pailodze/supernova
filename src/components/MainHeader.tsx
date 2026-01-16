import { cookies } from 'next/headers'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default async function MainHeader() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  let isAdmin = false
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value)
      isAdmin = session.isAdmin || (session.isImpersonating && session.originalAdmin)
    } catch {
      // Invalid session
    }
  }

  return (
    <header className="bg-white dark:bg-zinc-800 shadow">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <span>🚀</span> supernova.guru
        </Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
            >
              ადმინი
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
