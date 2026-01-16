'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  name: string
  phone: string
  email: string | null
  group_name: string | null
  is_admin: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [search])

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/admin/students?${params}`)

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data.students || [])
    } catch (err) {
      console.error('Failed to fetch students:', err)
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async (student: Student) => {
    setImpersonating(student.id)
    setError('')

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to impersonate')
        return
      }

      // Redirect to dashboard as the impersonated user
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setImpersonating(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            სტუდენტის სახელით შესვლა
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
            აირჩიეთ სტუდენტი, რომლის სახელითაც გსურთ სისტემის ნახვა. თქვენ შეძლებთ დაბრუნებას ადმინ ანგარიშზე.
          </p>

          {/* Search Input */}
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="მოძებნეთ სახელით, ტელეფონით ან ელ-ფოსტით..."
              className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Students List */}
          {loading ? (
            <div className="text-center py-8 text-zinc-500">იტვირთება...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
              {search ? 'სტუდენტები არ მოიძებნა' : 'სტუდენტები არ არის'}
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {student.name || 'უსახელო'}
                      </span>
                      {student.is_admin && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          ადმინი
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {student.phone}
                      {student.email && ` • ${student.email}`}
                      {student.group_name && ` • ${student.group_name}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleImpersonate(student)}
                    disabled={impersonating === student.id}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition"
                  >
                    {impersonating === student.id ? 'იტვირთება...' : 'შესვლა'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
    </main>
  )
}
