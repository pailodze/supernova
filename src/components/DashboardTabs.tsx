'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Job, Task } from '@/lib/supabase'

const JOB_TYPES: Record<string, string> = {
  'full-time': 'სრული განაკვეთი',
  'part-time': 'ნახევარი განაკვეთი',
  internship: 'სტაჟირება',
  freelance: 'ფრილანსი',
}

type ApplicationStatus = 'in_progress' | 'paused' | 'done' | 'approved' | 'rejected'

interface TaskApplication {
  task_id: string
  status: ApplicationStatus
}

interface DashboardTabsProps {
  jobs: Job[]
  tasks: Task[]
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; icon: string; bgClass: string; textClass: string; borderClass: string }> = {
  in_progress: {
    label: 'მიმდინარეობს',
    icon: '🔄',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  paused: {
    label: 'შეჩერებული',
    icon: '⏸️',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
    textClass: 'text-yellow-700 dark:text-yellow-300',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
  },
  done: {
    label: 'დასრულებული',
    icon: '✅',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  approved: {
    label: 'დამტკიცებული',
    icon: '🎉',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    label: 'უარყოფილი',
    icon: '❌',
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800',
  },
}

export default function DashboardTabs({ jobs, tasks }: DashboardTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = tabParam === 'tasks' ? 'tasks' : 'jobs'

  const [taskApplications, setTaskApplications] = useState<Map<string, ApplicationStatus>>(new Map())
  const [loadingApplications, setLoadingApplications] = useState(true)

  const setActiveTab = (tab: 'jobs' | 'tasks') => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false })
  }

  useEffect(() => {
    fetchTaskApplications()
  }, [tasks])

  const fetchTaskApplications = async () => {
    if (tasks.length === 0) {
      setLoadingApplications(false)
      return
    }

    try {
      // Fetch all task applications for current user
      const promises = tasks.map(task =>
        fetch(`/api/tasks/${task.id}/apply`).then(res => res.json())
      )
      const results = await Promise.all(promises)

      const applicationsMap = new Map<string, ApplicationStatus>()
      results.forEach((result, index) => {
        if (result.applied && result.application) {
          applicationsMap.set(tasks[index].id, result.application.status)
        }
      })
      setTaskApplications(applicationsMap)
    } catch (error) {
      console.error('Failed to fetch task applications:', error)
    } finally {
      setLoadingApplications(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'დღეს'
    if (diffDays === 1) return 'გუშინ'
    if (diffDays < 7) return `${diffDays} დღის წინ`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} კვირის წინ`
    return date.toLocaleDateString('ka-GE')
  }

  // Sort tasks: applied tasks first, then by created_at
  const sortedTasks = [...tasks].sort((a, b) => {
    const aApplied = taskApplications.has(a.id)
    const bApplied = taskApplications.has(b.id)

    if (aApplied && !bApplied) return -1
    if (!aApplied && bApplied) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const appliedTasksCount = taskApplications.size
  const availableTasksCount = tasks.length - appliedTasksCount

  // Split tasks into applied and available
  const appliedTasks = sortedTasks.filter(task => taskApplications.has(task.id))
  const availableTasks = sortedTasks.filter(task => !taskApplications.has(task.id))

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'jobs'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          💼 ვაკანსიები
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          ✅ დავალებები
          {appliedTasksCount > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              activeTab === 'tasks'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
            }`}>
              {appliedTasksCount}
            </span>
          )}
        </button>
      </div>

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div>
          {jobs.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-zinc-600 dark:text-zinc-400">
                ვაკანსიები ჯერ არ არის დამატებული
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-white dark:bg-zinc-800 rounded-xl shadow hover:shadow-lg transition p-5"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {job.company}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.location && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                            📍 {job.location}
                          </span>
                        )}
                        {job.type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            🕐 {JOB_TYPES[job.type] || job.type}
                          </span>
                        )}
                        {job.salary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            💰 {job.salary}
                          </span>
                        )}
                        {/* Skill Requirements */}
                        {job.skill_requirements && job.skill_requirements.length > 0 && job.skill_requirements.map((sr) => (
                          <span
                            key={sr.skill_id}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                          >
                            {sr.skill.icon && <span>{sr.skill.icon}</span>}
                            {sr.skill.name} Lv.{sr.required_level}
                          </span>
                        ))}
                        {job.open_positions && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            {job.open_positions === 1 ? '👤' : '👥'} {job.open_positions} ადგილი
                          </span>
                        )}
                        {job.courses && job.courses.length > 0 && job.courses.map((course) => (
                          <span
                            key={course.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          >
                            {course.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-4">
                      {formatDate(job.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-zinc-600 dark:text-zinc-400">
                დავალებები ჯერ არ არის დამატებული
              </p>
            </div>
          ) : loadingApplications ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl shadow p-5 animate-pulse">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Applied Tasks Section */}
              {appliedTasksCount > 0 && (
                <>
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    ჩემი დავალებები ({appliedTasksCount})
                  </h3>
                  {appliedTasks.map((task) => {
                    const applicationStatus = taskApplications.get(task.id)
                    const statusConfig = applicationStatus ? STATUS_CONFIG[applicationStatus] : null

                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className={`block rounded-xl shadow hover:shadow-lg transition p-5 border-2 ${
                          statusConfig
                            ? `${statusConfig.bgClass} ${statusConfig.borderClass}`
                            : 'bg-white dark:bg-zinc-800 border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {statusConfig && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${statusConfig.textClass} ${statusConfig.bgClass}`}>
                                {statusConfig.icon} {statusConfig.label}
                              </span>
                            )}
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                              {task.title}
                            </h3>

                            <div className="flex flex-wrap gap-2 mt-2">
                              {/* Skill Rewards */}
                              {task.skill_rewards && task.skill_rewards.length > 0 && task.skill_rewards.map((sr) => (
                                <span
                                  key={sr.skill_id}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                                >
                                  {sr.skill.icon && <span>{sr.skill.icon}</span>}
                                  {sr.skill.name} +{sr.level_reward}
                                </span>
                              ))}
                              {task.deadline && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                  new Date(task.deadline) < new Date()
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                }`}>
                                  ⏰ {formatDeadline(task.deadline)}
                                </span>
                              )}
                              {!task.deadline && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  ⏰ უვადო
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-4">
                            {formatDate(task.created_at)}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </>
              )}

              {/* Available Tasks Section */}
              {availableTasksCount > 0 && (
                <>
                  <h3 className={`text-sm font-medium text-zinc-500 dark:text-zinc-400 ${appliedTasksCount > 0 ? 'mt-6' : ''}`}>
                    ხელმისაწვდომი დავალებები ({availableTasksCount})
                  </h3>
                  {availableTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block bg-white dark:bg-zinc-800 rounded-xl shadow hover:shadow-lg transition p-5 border-2 border-transparent"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                            {task.title}
                          </h3>

                          <div className="flex flex-wrap gap-2 mt-2">
                            {/* Skill Rewards */}
                            {task.skill_rewards && task.skill_rewards.length > 0 && task.skill_rewards.map((sr) => (
                              <span
                                key={sr.skill_id}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                              >
                                {sr.skill.icon && <span>{sr.skill.icon}</span>}
                                {sr.skill.name} +{sr.level_reward}
                              </span>
                            ))}
                            {task.deadline && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                new Date(task.deadline) < new Date()
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                              }`}>
                                ⏰ {formatDeadline(task.deadline)}
                              </span>
                            )}
                            {!task.deadline && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                ⏰ უვადო
                              </span>
                            )}
                            {task.courses && task.courses.length > 0 && task.courses.map((course) => (
                              <span
                                key={course.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              >
                                {course.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-4">
                          {formatDate(task.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

function formatDeadline(deadline: string): string {
  const date = new Date(deadline)
  const now = new Date()
  const isPast = date < now

  // Calculate time difference
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

  // Format date: "25 დეკემბერი, 14:00"
  const day = date.getDate()
  const month = GEORGIAN_MONTHS[date.getMonth()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const dateStr = `${day} ${month}, ${hours}:${minutes}`

  if (isPast) {
    return `${dateStr} (ვადაგასული)`
  }

  // Add relative time for upcoming deadlines
  if (diffHours < 24) {
    return `${dateStr} (${diffHours} საათში)`
  } else if (diffDays <= 7) {
    return `${dateStr} (${diffDays} დღეში)`
  }

  return dateStr
}
