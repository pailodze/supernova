'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Technology, Course } from '@/lib/supabase'

type TechnologyWithCourse = Technology & { course?: Course }

export default function AdminLearningPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [technologies, setTechnologies] = useState<TechnologyWithCourse[]>([])
  const [loading, setLoading] = useState(true)

  // Technology form state
  const [showTechForm, setShowTechForm] = useState(false)
  const [editingTech, setEditingTech] = useState<TechnologyWithCourse | null>(null)
  const [techFormData, setTechFormData] = useState({
    course_id: '',
    name: '',
    slug: '',
    description: '',
    icon: '',
    order_index: 0,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesRes, techRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/technologies?all=true'),
      ])

      const coursesData = await coursesRes.json()
      const techData = await techRes.json()

      setCourses(coursesData.courses || [])
      setTechnologies(techData.technologies || [])
    } catch {
      console.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const resetTechForm = () => {
    setTechFormData({
      course_id: '',
      name: '',
      slug: '',
      description: '',
      icon: '',
      order_index: 0,
    })
    setEditingTech(null)
    setError('')
  }

  const handleEditTech = (tech: TechnologyWithCourse, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTechFormData({
      course_id: tech.course_id,
      name: tech.name,
      slug: tech.slug,
      description: tech.description || '',
      icon: tech.icon || '',
      order_index: tech.order_index,
    })
    setEditingTech(tech)
    setShowTechForm(true)
  }

  const handleTechSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const url = editingTech ? `/api/technologies/${editingTech.id}` : '/api/technologies'
      const method = editingTech ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save technology')
        return
      }

      await fetchData()
      setShowTechForm(false)
      resetTechForm()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTech = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('დარწმუნებული ხართ? ეს წაშლის ყველა თემას ამ ტექნოლოგიაში.')) return

    try {
      await fetch(`/api/technologies/${id}`, { method: 'DELETE' })
      await fetchData()
    } catch {
      console.error('Failed to delete technology')
    }
  }

  const handleToggleTechActive = async (tech: TechnologyWithCourse, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await fetch(`/api/technologies/${tech.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !tech.is_active }),
      })
      await fetchData()
    } catch {
      console.error('Failed to toggle technology status')
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u10D0-\u10FF]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          სასწავლო მასალების მართვა
        </h2>
        <button
          onClick={() => {
            resetTechForm()
            setShowTechForm(true)
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          + ახალი ტექნოლოგია
        </button>
      </div>

      {/* Technology Form Modal */}
      {showTechForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingTech ? 'ტექნოლოგიის რედაქტირება' : 'ახალი ტექნოლოგია'}
              </h2>
            </div>

            <form onSubmit={handleTechSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  კურსი *
                </label>
                <select
                  value={techFormData.course_id}
                  onChange={(e) => setTechFormData({ ...techFormData, course_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">აირჩიეთ კურსი</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  დასახელება *
                </label>
                <input
                  type="text"
                  value={techFormData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setTechFormData({
                      ...techFormData,
                      name,
                      slug: editingTech ? techFormData.slug : generateSlug(name),
                    })
                  }}
                  placeholder="მაგ: HTML & CSS"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={techFormData.slug}
                  onChange={(e) => setTechFormData({ ...techFormData, slug: e.target.value })}
                  placeholder="მაგ: html-css"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  აღწერა
                </label>
                <textarea
                  value={techFormData.description}
                  onChange={(e) => setTechFormData({ ...techFormData, description: e.target.value })}
                  rows={3}
                  placeholder="ტექნოლოგიის მოკლე აღწერა..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    იკონი (emoji)
                  </label>
                  <input
                    type="text"
                    value={techFormData.icon}
                    onChange={(e) => setTechFormData({ ...techFormData, icon: e.target.value })}
                    placeholder="მაგ: 🌐"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    რიგითობა
                  </label>
                  <input
                    type="number"
                    value={techFormData.order_index}
                    onChange={(e) => setTechFormData({ ...techFormData, order_index: parseInt(e.target.value) || 0 })}
                    min="0"
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
                    setShowTechForm(false)
                    resetTechForm()
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
                  {submitting ? 'იტვირთება...' : editingTech ? 'შენახვა' : 'დამატება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technologies List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      ) : technologies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            ტექნოლოგიები არ არის დამატებული
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const courseTechs = technologies.filter((t) => t.course_id === course.id)
            if (courseTechs.length === 0) return null

            return (
              <div key={course.id} className="bg-white dark:bg-zinc-800 rounded-xl shadow overflow-hidden">
                <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{course.name}</h3>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {courseTechs.map((tech) => (
                    <Link
                      key={tech.id}
                      href={`/admin/learning/${tech.id}`}
                      className={`p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition ${!tech.is_active ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {tech.icon && <span className="text-2xl">{tech.icon}</span>}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-900 dark:text-white">{tech.name}</span>
                            <span className="text-xs text-zinc-500">({tech.slug})</span>
                            {!tech.is_active && (
                              <span className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                                არააქტიური
                              </span>
                            )}
                          </div>
                          {tech.description && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-1">
                              {tech.description}
                            </p>
                          )}
                          <p className="text-xs text-zinc-500 mt-1">
                            {tech.topics?.length || 0} თემა | რიგითობა: {tech.order_index}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleTechActive(tech, e)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition ${
                            tech.is_active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {tech.is_active ? 'გათიშვა' : 'ჩართვა'}
                        </button>
                        <button
                          onClick={(e) => handleEditTech(tech, e)}
                          className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
                        >
                          რედაქტირება
                        </button>
                        <button
                          onClick={(e) => handleDeleteTech(tech.id, e)}
                          className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition"
                        >
                          წაშლა
                        </button>
                        <span className="text-zinc-400 ml-2">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
