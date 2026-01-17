'use client'

import { useState, useEffect } from 'react'

type SkillReward = {
  skill_id: string
  level_reward: number
  skill: {
    id: string
    name: string
    icon: string | null
  }
}

type TaskApplication = {
  id: string
  task_id: string
  student_id: string
  status: 'in_progress' | 'paused' | 'done' | 'cancelled' | 'approved' | 'rejected'
  submission: string | null
  created_at: string
  updated_at: string
  student: {
    id: string
    name: string
    phone: string
    email: string | null
    group_name: string | null
  }
  task: {
    id: string
    title: string
    description: string | null
    deadline: string | null
    skill_rewards: SkillReward[]
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'მიმდინარე', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  paused: { label: 'შეჩერებული', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  done: { label: 'დასრულებული', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'გაუქმებული', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300' },
  approved: { label: 'დადასტურებული', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: 'უარყოფილი', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

export default function AdminSubmissionsPage() {
  const [applications, setApplications] = useState<TaskApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('done')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)

      const response = await fetch(`/api/admin/task-applications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch {
      console.error('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (applicationId: string) => {
    if (!confirm('დარწმუნებული ხარ რომ გინდა დადასტურება? სტუდენტს მიენიჭება უნარის დონეები.')) return

    setProcessingId(applicationId)
    try {
      const response = await fetch(`/api/admin/task-applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      if (response.ok) {
        await fetchApplications()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve')
      }
    } catch {
      alert('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (applicationId: string) => {
    if (!confirm('დარწმუნებული ხარ რომ გინდა უარყოფა?')) return

    setProcessingId(applicationId)
    try {
      const response = await fetch(`/api/admin/task-applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })

      if (response.ok) {
        await fetchApplications()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reject')
      }
    } catch {
      alert('Network error')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ka-GE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          შესრულებული დავალებები
        </h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('done')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'done'
              ? 'bg-green-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}
        >
          დასრულებული
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'in_progress'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}
        >
          მიმდინარე
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'approved'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}
        >
          დადასტურებული
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}
        >
          უარყოფილი
        </button>
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === ''
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
          }`}
        >
          ყველა
        </button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">
            {filter ? `${STATUS_LABELS[filter]?.label || filter} დავალებები არ მოიძებნა` : 'დავალებები არ მოიძებნა'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-zinc-800 rounded-xl shadow p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left side - Application info */}
                <div className="flex-1">
                  {/* Task title */}
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    {app.task?.title || 'Unknown Task'}
                  </h3>

                  {/* Student info */}
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {app.student?.name || 'Unknown'}
                    </span>
                    {app.student?.group_name && (
                      <>
                        <span>•</span>
                        <span>{app.student.group_name}</span>
                      </>
                    )}
                    {app.student?.phone && (
                      <>
                        <span>•</span>
                        <span>{app.student.phone}</span>
                      </>
                    )}
                  </div>

                  {/* Status and dates */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_LABELS[app.status]?.color || 'bg-zinc-100 text-zinc-700'}`}>
                      {STATUS_LABELS[app.status]?.label || app.status}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      განახლდა: {formatDate(app.updated_at)}
                    </span>
                  </div>

                  {/* Skill rewards */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 p-2 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">მისანიჭებელი უნარები:</span>
                    {app.task?.skill_rewards && app.task.skill_rewards.length > 0 ? (
                      app.task.skill_rewards.map((sr) => (
                        <span
                          key={sr.skill_id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg font-medium"
                        >
                          {sr.skill?.icon || '⭐'} {sr.skill?.name || 'Unknown'} <span className="text-cyan-500">+{sr.level_reward} lvl</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">უნარები არ არის მინიჭებული</span>
                    )}
                  </div>

                  {/* Submission text */}
                  {app.submission && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">სტუდენტის პასუხი:</p>
                      <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap break-words">
                        {app.submission}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right side - Actions */}
                {(app.status === 'done' || app.status === 'in_progress' || app.status === 'paused') && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={processingId === app.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition"
                    >
                      {processingId === app.id ? '...' : 'დადასტურება'}
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={processingId === app.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition"
                    >
                      {processingId === app.id ? '...' : 'უარყოფა'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
