'use client'

import { useState, useEffect } from 'react'
import type { Task, Course, Skill } from '@/lib/supabase'

type SkillRewardInput = {
  skill_id: string
  level_reward: number
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    course_ids: [] as string[],
    skill_rewards: [] as SkillRewardInput[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTasks()
    fetchCourses()
    fetchSkills()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?all=true')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch {
      console.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()
      setCourses(data.courses || [])
    } catch {
      console.error('Failed to fetch courses')
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills?all=true')
      const data = await response.json()
      setSkills(data.skills || [])
    } catch {
      console.error('Failed to fetch skills')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
      course_ids: [],
      skill_rewards: [],
    })
    setEditingTask(null)
    setError('')
  }

  const handleEdit = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      course_ids: task.courses?.map(c => c.id) || [],
      skill_rewards: task.skill_rewards?.map(sr => ({
        skill_id: sr.skill_id,
        level_reward: sr.level_reward
      })) || [],
    })
    setEditingTask(task)
    setShowForm(true)
  }

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId]
    }))
  }

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => {
      const existing = prev.skill_rewards.find(sr => sr.skill_id === skillId)
      if (existing) {
        return {
          ...prev,
          skill_rewards: prev.skill_rewards.filter(sr => sr.skill_id !== skillId)
        }
      } else {
        return {
          ...prev,
          skill_rewards: [...prev.skill_rewards, { skill_id: skillId, level_reward: 1 }]
        }
      }
    })
  }

  const handleSkillLevelChange = (skillId: string, level: number) => {
    setFormData(prev => ({
      ...prev,
      skill_rewards: prev.skill_rewards.map(sr =>
        sr.skill_id === skillId ? { ...sr, level_reward: level } : sr
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save task')
        return
      }

      await fetchTasks()
      setShowForm(false)
      resetForm()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      await fetchTasks()
    } catch {
      console.error('Failed to delete task')
    }
  }

  const handleToggleActive = async (task: Task) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !task.is_active }),
      })
      await fetchTasks()
    } catch {
      console.error('Failed to toggle task status')
    }
  }

  const GEORGIAN_MONTHS = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ]

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'უვადო'
    const date = new Date(deadline)
    const now = new Date()
    const isPast = date < now

    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

    const day = date.getDate()
    const month = GEORGIAN_MONTHS[date.getMonth()]
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    let text = `${day} ${month}, ${hours}:${minutes}`

    if (isPast) {
      text += ' (ვადაგასული)'
    } else if (diffHours < 24) {
      text += ` (${diffHours} საათში)`
    } else if (diffDays <= 7) {
      text += ` (${diffDays} დღეში)`
    }

    return (
      <span className={isPast ? 'text-red-500' : ''}>
        {text}
      </span>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          დავალებების მართვა
        </h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          + ახალი დავალება
        </button>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingTask ? 'დავალების რედაქტირება' : 'ახალი დავალება'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  სათაური *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  აღწერა
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  დედლაინი
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Skill Rewards */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  უნარების ჯილდოები
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                  {skills.length === 0 ? (
                    <p className="text-sm text-zinc-500">უნარები არ არის დამატებული</p>
                  ) : (
                    skills.filter(s => s.is_active).map((skill) => {
                      const selected = formData.skill_rewards.find(sr => sr.skill_id === skill.id)
                      return (
                        <div key={skill.id} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => handleSkillToggle(skill.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-zinc-700 dark:text-zinc-300">
                            {skill.icon && <span className="mr-1">{skill.icon}</span>}
                            {skill.name}
                          </span>
                          {selected && (
                            <select
                              value={selected.level_reward}
                              onChange={(e) => handleSkillLevelChange(skill.id, Number(e.target.value))}
                              className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            >
                              {[1, 2, 3, 4, 5].map(level => (
                                <option key={level} value={level}>+{level} დონე</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  აირჩიეთ რა უნარებში და რამდენ დონეს მიიღებს სტუდენტი
                </p>
              </div>

              {/* Courses */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  კურსები (რომელი სტუდენტები მონაწილეობენ)
                </label>
                <div className="space-y-2">
                  {courses.length === 0 ? (
                    <p className="text-sm text-zinc-500">კურსები არ არის დამატებული</p>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                        თუ არცერთი არ აირჩევთ, დავალება ყველა სტუდენტისთვის იქნება ხელმისაწვდომი
                      </p>
                      {courses.map((course) => (
                        <label
                          key={course.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.course_ids.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {course.name}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium transition"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                >
                  {submitting ? 'იტვირთება...' : editingTask ? 'შენახვა' : 'დამატება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            დავალებები არ არის დამატებული
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            დაამატე პირველი დავალება
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white dark:bg-zinc-800 rounded-xl shadow p-5 ${
                !task.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {task.title}
                    </h3>
                    {!task.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                        არააქტიური
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">
                      {formatDeadline(task.deadline)}
                    </span>
                    {task.skill_rewards && task.skill_rewards.length > 0 && (
                      task.skill_rewards.map((sr) => (
                        <span
                          key={sr.skill_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                        >
                          {sr.skill.icon} {sr.skill.name} (+{sr.level_reward})
                        </span>
                      ))
                    )}
                  </div>
                  {task.courses && task.courses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.courses.map((course) => (
                        <span
                          key={course.id}
                          className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                        >
                          {course.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(task)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      task.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {task.is_active ? 'გათიშვა' : 'ჩართვა'}
                  </button>
                  <button
                    onClick={() => handleEdit(task)}
                    className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
                  >
                    რედაქტირება
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition"
                  >
                    წაშლა
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
