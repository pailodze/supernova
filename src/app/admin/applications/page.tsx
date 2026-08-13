'use client'

import { useState, useEffect } from 'react'

type Application = {
  id: string
  first_name: string
  last_name: string
  personal_id: string
  education: string
  interests: string
  work_experience: string
  why_supernova: string
  status: string
  created_at: string
  student: { phone: string; is_pre_registration: boolean; status: string | null } | null
}

type OriginFilter = 'all' | 'new' | 'existing'

function formatDate(value: string) {
  return new Date(value).toLocaleString('ka-GE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  )
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<OriginFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/applications')
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'ჩატვირთვა ვერ მოხერხდა')
          return
        }
        setApplications(data.applications || [])
      } catch {
        setError('ქსელის შეცდომა')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const isNew = (application: Application) => application.student?.is_pre_registration === true

  const visible = applications.filter(application => {
    if (filter === 'new') return isNew(application)
    if (filter === 'existing') return !isNew(application)
    return true
  })

  const newCount = applications.filter(isNew).length

  const filters: { key: OriginFilter; label: string; count: number }[] = [
    { key: 'all', label: 'ყველა', count: applications.length },
    { key: 'new', label: 'ახალი', count: newCount },
    { key: 'existing', label: 'არსებული სტუდენტი', count: applications.length - newCount },
  ]

  if (loading) {
    return <div className="p-8 text-zinc-500">იტვირთება...</div>
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">რეგისტრაციები</h1>
        {applications.length > 0 && (
          <a
            href="/api/admin/applications?format=csv"
            className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
          >
            CSV-ის ჩამოტვირთვა
          </a>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              filter === item.key
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">განაცხადები ჯერ არ არის.</p>
      ) : (
        <ul className="space-y-4">
          {visible.map(application => (
            <li
              key={application.id}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {application.first_name} {application.last_name}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400" dir="ltr">
                    {application.student?.phone} · {application.personal_id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      isNew(application)
                        ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isNew(application) ? 'ახალი' : 'არსებული სტუდენტი'}
                  </span>
                  <span className="text-xs text-zinc-400">{formatDate(application.created_at)}</span>
                </div>
              </div>

              <button
                onClick={() => setExpanded(expanded === application.id ? null : application.id)}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {expanded === application.id ? 'დახურვა' : 'სრულად ნახვა'}
              </button>

              {expanded === application.id && (
                <dl className="mt-4 space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                  <Field label="განათლება" value={application.education} />
                  <Field label="ინტერესები და ჰობი" value={application.interests} />
                  <Field label="სამუშაო გამოცდილება" value={application.work_experience} />
                  <Field label="რატომ supernova" value={application.why_supernova} />
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
