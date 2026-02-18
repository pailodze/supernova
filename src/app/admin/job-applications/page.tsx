'use client'

import { useState, useEffect } from 'react'

type JobApplicationItem = {
  id: string
  student_id: string
  job_id: string
  created_at: string
  student: {
    id: string
    name: string
    phone: string
    email: string | null
    group_name: string | null
  }
  job: {
    id: string
    title: string
    company: string
  }
}

type JobOption = {
  id: string
  title: string
  company: string
}

export default function AdminJobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState('')
  const [jobs, setJobs] = useState<JobOption[]>([])

  useEffect(() => {
    fetchApplications()
  }, [jobFilter])

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs?all=true')
      const data = await response.json()
      setJobs((data.jobs || []).map((j: JobOption) => ({ id: j.id, title: j.title, company: j.company })))
    } catch {
      console.error('Failed to fetch jobs')
    }
  }

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (jobFilter) params.set('job_id', jobFilter)

      const response = await fetch(`/api/admin/job-applications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch {
      console.error('Failed to fetch job applications')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ka-GE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          ვაკანსიებზე განაცხადები
        </h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          სულ: {applications.length}
        </span>
      </div>

      {/* Job Filter */}
      <div className="mb-6">
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">ყველა ვაკანსია</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} — {job.company}
            </option>
          ))}
        </select>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">
            განაცხადები არ მოიძებნა
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
                <div className="flex-1">
                  {/* Job info */}
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                    {app.job?.title || 'Unknown Job'}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    {app.job?.company}
                  </p>

                  {/* Student info */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
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
                    {app.student?.email && (
                      <>
                        <span>•</span>
                        <span>{app.student.email}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {formatDate(app.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
