import { cookies } from 'next/headers'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import AdminSidebar from '@/components/AdminSidebar'

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
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
