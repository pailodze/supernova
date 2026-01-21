'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import type { Technology, Topic, Course } from '@/lib/supabase'

type TechnologyWithCourse = Technology & { course?: Course; topics?: Topic[] }

export default function AdminTechnologyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [technology, setTechnology] = useState<TechnologyWithCourse | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  // Topic form state
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicFormData, setTopicFormData] = useState({
    name: '',
    slug: '',
    description: '',
    duration: 0,
    theory_video: '',
    miro_link: '',
    order_index: 0,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/technologies/${id}`)
      const data = await response.json()

      if (data.technology) {
        setTechnology(data.technology)
        setTopics(data.technology.topics || [])
      }
    } catch {
      console.error('Failed to fetch technology')
    } finally {
      setLoading(false)
    }
  }

  const resetTopicForm = () => {
    setTopicFormData({
      name: '',
      slug: '',
      description: '',
      duration: 0,
      theory_video: '',
      miro_link: '',
      order_index: topics.length,
    })
    setEditingTopic(null)
    setError('')
  }

  const handleEditTopic = (topic: Topic) => {
    setTopicFormData({
      name: topic.name,
      slug: topic.slug,
      description: topic.description || '',
      duration: topic.duration,
      theory_video: topic.theory_video || '',
      miro_link: topic.miro_link || '',
      order_index: topic.order_index,
    })
    setEditingTopic(topic)
    setShowTopicForm(true)
  }

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const url = editingTopic ? `/api/topics/${editingTopic.id}` : '/api/topics'
      const method = editingTopic ? 'PUT' : 'POST'

      const payload = {
        ...topicFormData,
        technology_id: id,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save topic')
        return
      }

      await fetchData()
      setShowTopicForm(false)
      resetTopicForm()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ თემის წაშლა?')) return

    try {
      await fetch(`/api/topics/${topicId}`, { method: 'DELETE' })
      await fetchData()
    } catch {
      console.error('Failed to delete topic')
    }
  }

  const handleToggleTopicActive = async (topic: Topic) => {
    try {
      await fetch(`/api/topics/${topic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !topic.is_active }),
      })
      await fetchData()
    } catch {
      console.error('Failed to toggle topic status')
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u10D0-\u10FF]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      </main>
    )
  }

  if (!technology) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">ტექნოლოგია ვერ მოიძებნა</p>
          <Link
            href="/admin/learning"
            className="text-blue-600 hover:text-blue-700"
          >
            დაბრუნება
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/learning"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2 inline-block"
        >
          ← უკან სასწავლო მასალებზე
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {technology.icon && <span className="text-3xl">{technology.icon}</span>}
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {technology.name}
              </h1>
              <p className="text-sm text-zinc-500">
                {technology.course?.name} • {topics.length} თემა
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetTopicForm()
              setShowTopicForm(true)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            + ახალი თემა
          </button>
        </div>
        {technology.description && (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">{technology.description}</p>
        )}
      </div>

      {/* Topic Form Modal */}
      {showTopicForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingTopic ? 'თემის რედაქტირება' : 'ახალი თემა'}
              </h2>
            </div>

            <form onSubmit={handleTopicSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  დასახელება *
                </label>
                <input
                  type="text"
                  value={topicFormData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setTopicFormData({
                      ...topicFormData,
                      name,
                      slug: editingTopic ? topicFormData.slug : generateSlug(name),
                    })
                  }}
                  placeholder="მაგ: HTML საწყისები"
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
                  value={topicFormData.slug}
                  onChange={(e) => setTopicFormData({ ...topicFormData, slug: e.target.value })}
                  placeholder="მაგ: html-basics"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  აღწერა
                </label>
                <textarea
                  value={topicFormData.description}
                  onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                  rows={3}
                  placeholder="თემის მოკლე აღწერა..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  ვიდეო (YouTube URL)
                </label>
                <input
                  type="url"
                  value={topicFormData.theory_video}
                  onChange={(e) => setTopicFormData({ ...topicFormData, theory_video: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Miro ბორდის ლინკი
                </label>
                <input
                  type="url"
                  value={topicFormData.miro_link}
                  onChange={(e) => setTopicFormData({ ...topicFormData, miro_link: e.target.value })}
                  placeholder="https://miro.com/app/board/..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    ხანგრძლივობა (წუთი)
                  </label>
                  <input
                    type="number"
                    value={topicFormData.duration}
                    onChange={(e) => setTopicFormData({ ...topicFormData, duration: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    რიგითობა
                  </label>
                  <input
                    type="number"
                    value={topicFormData.order_index}
                    onChange={(e) => setTopicFormData({ ...topicFormData, order_index: parseInt(e.target.value) || 0 })}
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
                    setShowTopicForm(false)
                    resetTopicForm()
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
                  {submitting ? 'იტვირთება...' : editingTopic ? 'შენახვა' : 'დამატება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl shadow">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            თემები არ არის დამატებული
          </p>
          <button
            onClick={() => {
              resetTopicForm()
              setShowTopicForm(true)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            დაამატე პირველი თემა
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow overflow-hidden">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                className={`p-4 flex items-center justify-between ${!topic.is_active ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/30' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-white">{topic.name}</span>
                      {!topic.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                          არააქტიური
                        </span>
                      )}
                    </div>
                    {topic.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {topic.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>{topic.duration} წუთი</span>
                      {topic.theory_video && (
                        <span className="flex items-center gap-1">
                          <span className="text-red-500">▶</span> ვიდეო
                        </span>
                      )}
                      {topic.miro_link && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">◉</span> Miro
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleTopicActive(topic)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      topic.is_active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {topic.is_active ? 'გათიშვა' : 'ჩართვა'}
                  </button>
                  <button
                    onClick={() => handleEditTopic(topic)}
                    className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
                  >
                    რედაქტირება
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(topic.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition"
                  >
                    წაშლა
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
