'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Job, Course, Skill } from '@/lib/supabase'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-700 rounded-lg animate-pulse" />
  ),
})

const JOB_TYPES = [
  { value: 'full-time', label: 'სრული განაკვეთი' },
  { value: 'part-time', label: 'ნახევარი განაკვეთი' },
  { value: 'internship', label: 'სტაჟირება' },
  { value: 'freelance', label: 'ფრილანსი' },
]

type SkillRequirementInput = {
  skill_id: string
  required_level: number
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: '',
    salary: '',
    open_positions: '' as string | number,
    course_ids: [] as string[],
    skill_requirements: [] as SkillRequirementInput[],
    description: '',
    requirements: '',
    contact_email: '',
    contact_phone: '',
    apply_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJobs()
    fetchCourses()
    fetchSkills()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs?all=true')
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch {
      console.error('Failed to fetch jobs')
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
      company: '',
      location: '',
      type: '',
      salary: '',
      open_positions: '',
      course_ids: [],
      skill_requirements: [],
      description: '',
      requirements: '',
      contact_email: '',
      contact_phone: '',
      apply_url: '',
    })
    setEditingJob(null)
    setError('')
  }

  const handleEdit = (job: Job) => {
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location || '',
      type: job.type || '',
      salary: job.salary || '',
      open_positions: job.open_positions ?? '',
      course_ids: job.courses?.map(c => c.id) || [],
      skill_requirements: job.skill_requirements?.map(sr => ({
        skill_id: sr.skill_id,
        required_level: sr.required_level
      })) || [],
      description: job.description || '',
      requirements: job.requirements || '',
      contact_email: job.contact_email || '',
      contact_phone: job.contact_phone || '',
      apply_url: job.apply_url || '',
    })
    setEditingJob(job)
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
      const existing = prev.skill_requirements.find(sr => sr.skill_id === skillId)
      if (existing) {
        return {
          ...prev,
          skill_requirements: prev.skill_requirements.filter(sr => sr.skill_id !== skillId)
        }
      } else {
        return {
          ...prev,
          skill_requirements: [...prev.skill_requirements, { skill_id: skillId, required_level: 1 }]
        }
      }
    })
  }

  const handleSkillLevelChange = (skillId: string, level: number) => {
    setFormData(prev => ({
      ...prev,
      skill_requirements: prev.skill_requirements.map(sr =>
        sr.skill_id === skillId ? { ...sr, required_level: level } : sr
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs'
      const method = editingJob ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          open_positions: formData.open_positions === '' ? null : Number(formData.open_positions),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save job')
        return
      }

      await fetchJobs()
      setShowForm(false)
      resetForm()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return

    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      await fetchJobs()
    } catch {
      console.error('Failed to delete job')
    }
  }

  const handleToggleActive = async (job: Job) => {
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !job.is_active }),
      })
      await fetchJobs()
    } catch {
      console.error('Failed to toggle job status')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}/duplicate`, { method: 'POST' })
      if (response.ok) {
        await fetchJobs()
      }
    } catch {
      console.error('Failed to duplicate job')
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          ვაკანსიების მართვა
        </h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          + ახალი ვაკანსია
        </button>
      </div>

      {/* Job Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingJob ? 'ვაკანსიის რედაქტირება' : 'ახალი ვაკანსია'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    პოზიცია *
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
                    კომპანია *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    ლოკაცია
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="თბილისი / დისტანციური"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    დასაქმების ტიპი
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">აირჩიეთ</option>
                    {JOB_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    ანაზღაურება
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="მაგ: 1500-2500 ლარი"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    ვაკანტური ადგილები
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.open_positions}
                    onChange={(e) => setFormData({ ...formData, open_positions: e.target.value })}
                    placeholder="მაგ: 3"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Skill Requirements */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  საჭირო უნარები და დონეები
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                  {skills.length === 0 ? (
                    <p className="text-sm text-zinc-500">უნარები არ არის დამატებული</p>
                  ) : (
                    skills.filter(s => s.is_active).map((skill) => {
                      const selected = formData.skill_requirements.find(sr => sr.skill_id === skill.id)
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
                              value={selected.required_level}
                              onChange={(e) => handleSkillLevelChange(skill.id, Number(e.target.value))}
                              className="px-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            >
                              {[1, 2, 3, 4, 5].map(level => (
                                <option key={level} value={level}>დონე {level}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  აირჩიეთ რა უნარები და რა დონეები სჭირდება სტუდენტს
                </p>
              </div>

              {/* Courses */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  კურსები (რომელი სტუდენტები ნახავენ)
                </label>
                <div className="space-y-2">
                  {courses.length === 0 ? (
                    <p className="text-sm text-zinc-500">კურსები არ არის დამატებული</p>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                        თუ არცერთი არ აირჩევთ, ვაკანსია ყველა სტუდენტისთვის იქნება ხელმისაწვდომი
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  აღწერა
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="ვაკანსიის აღწერა..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  მოთხოვნები
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    საკონტაქტო ელ-ფოსტა
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    საკონტაქტო ტელეფონი
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    განაცხადის ლინკი
                  </label>
                  <input
                    type="url"
                    value={formData.apply_url}
                    onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  {submitting ? 'იტვირთება...' : editingJob ? 'შენახვა' : 'დამატება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            ვაკანსიები არ არის დამატებული
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            დაამატე პირველი ვაკანსია
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`bg-white dark:bg-zinc-800 rounded-xl shadow p-5 ${
                !job.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {job.title}
                    </h3>
                    {!job.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                        არააქტიური
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {job.company}
                    {job.location && ` • ${job.location}`}
                    {job.type && ` • ${JOB_TYPES.find((t) => t.value === job.type)?.label}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.open_positions && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {job.open_positions === 1 ? '1 ადგილი' : `${job.open_positions} ადგილი`}
                      </span>
                    )}
                    {job.skill_requirements && job.skill_requirements.length > 0 && (
                      job.skill_requirements.map((sr) => (
                        <span
                          key={sr.skill_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded"
                        >
                          {sr.skill.icon} {sr.skill.name} (დონე {sr.required_level})
                        </span>
                      ))
                    )}
                  </div>
                  {job.courses && job.courses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.courses.map((course) => (
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
                    onClick={() => handleToggleActive(job)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      job.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {job.is_active ? 'გათიშვა' : 'ჩართვა'}
                  </button>
                  <button
                    onClick={() => handleDuplicate(job.id)}
                    className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition"
                  >
                    დუბლირება
                  </button>
                  <button
                    onClick={() => handleEdit(job)}
                    className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
                  >
                    რედაქტირება
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
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
