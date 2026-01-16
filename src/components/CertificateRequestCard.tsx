'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CertificateRequest } from '@/lib/supabase'

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center">
      <span className="text-zinc-500">რუკა იტვირთება...</span>
    </div>
  ),
})

type Props = {
  studentId: string
}

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = GEORGIAN_MONTHS[date.getMonth()]
  return `${day} ${month}`
}

export default function CertificateRequestCard({ studentId }: Props) {
  const [request, setRequest] = useState<CertificateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    address: '',
    latitude: 41.7151,
    longitude: 44.8271,
    additional_info: '',
  })

  useEffect(() => {
    fetchRequest()
  }, [studentId])

  const fetchRequest = async () => {
    try {
      const response = await fetch('/api/certificate-requests')
      if (response.ok) {
        const data = await response.json()
        setRequest(data.request || null)
      }
    } catch {
      console.error('Failed to fetch certificate request')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.address.trim()) {
      setError('მისამართი სავალდებულოა')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/certificate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'შეცდომა მოხდა')
        return
      }

      const data = await response.json()
      setRequest(data.request)
      setShowModal(false)
      setFormData({
        address: '',
        latitude: 41.7151,
        longitude: 44.8271,
        additional_info: '',
      })
    } catch {
      setError('ქსელის შეცდომა')
    } finally {
      setSubmitting(false)
    }
  }

  const canRequest = !request || request.status === 'rejected' || request.status === 'delivered'

  const getStatusBadge = () => {
    if (!request) return null

    switch (request.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            მოლოდინში
          </span>
        )
      case 'rejected':
        return (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              უარყოფილია
            </span>
            {request.rejection_reason && (
              <p className="text-sm text-red-600 dark:text-red-400">
                მიზეზი: {request.rejection_reason}
              </p>
            )}
          </div>
        )
      case 'sent':
        return (
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              გაგზავნილია
            </span>
            {request.estimated_arrival && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                სავარაუდო მიწოდება: {formatDate(request.estimated_arrival)}
              </p>
            )}
          </div>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            მიწოდებულია
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 mb-8 animate-pulse">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">სერტიფიკატის მიწოდება</h3>
            <p className="text-indigo-100 text-sm">
              {canRequest
                ? 'მოითხოვე შენი სერტიფიკატის მიწოდება სახლში'
                : 'თქვენი მოთხოვნა დამუშავების პროცესშია'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {request && !canRequest && getStatusBadge()}
            {canRequest && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition"
              >
                {request?.status === 'rejected' || request?.status === 'delivered'
                  ? 'ახალი მოთხოვნა'
                  : 'მოთხოვნა'
                }
              </button>
            )}
          </div>
        </div>
        {request && request.status !== 'pending' && (
          <div className="mt-3 pt-3 border-t border-white/20">
            {getStatusBadge()}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                სერტიფიკატის მიწოდების მოთხოვნა
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                აირჩიე მდებარეობა რუკაზე და შეავსე მისამართი
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Map */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  აირჩიე მდებარეობა რუკაზე
                </label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={handleLocationSelect}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  დააკლიკე რუკაზე მდებარეობის ასარჩევად
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  მისამართი *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="მაგ: ვაკე, ჭავჭავაძის 12"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  დამატებითი ინფორმაცია
                </label>
                <textarea
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder="მაგ: სადარბაზო კოდი, სართული, ტელეფონი და ა.შ."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                    setShowModal(false)
                    setError('')
                  }}
                  className="px-4 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium transition"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition"
                >
                  {submitting ? 'იგზავნება...' : 'გაგზავნა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
