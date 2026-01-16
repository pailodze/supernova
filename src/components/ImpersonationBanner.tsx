'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  impersonatedName: string
  originalAdminName: string
}

export default function ImpersonationBanner({ impersonatedName, originalAdminName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStopImpersonating = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/stop-impersonate', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/admin')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to stop impersonating:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-500 text-amber-950">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>👁️</span>
          <span>
            ადმინი <strong>{originalAdminName}</strong> უყურებს როგორც <strong>{impersonatedName}</strong>
          </span>
        </div>
        <button
          onClick={handleStopImpersonating}
          disabled={loading}
          className="px-3 py-1 bg-amber-700 hover:bg-amber-800 disabled:bg-amber-600 text-white text-sm font-medium rounded transition"
        >
          {loading ? 'იტვირთება...' : 'დაბრუნება'}
        </button>
      </div>
    </div>
  )
}
