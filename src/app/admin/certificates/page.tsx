'use client'

import { useState, useEffect } from 'react'
import type { CertificateRequest } from '@/lib/supabase'

type RequestWithStudent = CertificateRequest & {
  student?: {
    id: string
    name: string
    phone: string
    email: string
    group_name: string
  }
}

type StatusFilter = 'all' | 'pending' | 'rejected' | 'sent' | 'delivered'

export default function AdminCertificatesPage() {
  const [requests, setRequests] = useState<RequestWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RequestWithStudent | null>(null)
  const [modalAction, setModalAction] = useState<'reject' | 'send' | 'deliver' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [estimatedArrival, setEstimatedArrival] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/certificate-requests?all=true')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch {
      console.error('Failed to fetch certificate requests')
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true
    return req.status === filter
  })

  const openModal = (request: RequestWithStudent, action: 'reject' | 'send' | 'deliver') => {
    setSelectedRequest(request)
    setModalAction(action)
    setRejectionReason('')
    setEstimatedArrival('')
    setError('')
    setShowModal(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !modalAction) return

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      setError('მიზეზის მითითება სავალდებულოა')
      return
    }

    if (modalAction === 'send' && !estimatedArrival) {
      setError('სავარაუდო მიწოდების თარიღის მითითება სავალდებულოა')
      return
    }

    setSubmitting(true)
    setError('')

    const statusMap = {
      reject: 'rejected',
      send: 'sent',
      deliver: 'delivered',
    }

    try {
      const response = await fetch(`/api/certificate-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusMap[modalAction],
          rejection_reason: modalAction === 'reject' ? rejectionReason : undefined,
          estimated_arrival: modalAction === 'send' ? estimatedArrival : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'შეცდომა მოხდა')
        return
      }

      await fetchRequests()
      setShowModal(false)
    } catch {
      setError('ქსელის შეცდომა')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return

    try {
      await fetch(`/api/certificate-requests/${id}`, { method: 'DELETE' })
      await fetchRequests()
    } catch {
      console.error('Failed to delete request')
    }
  }

  const GEORGIAN_MONTHS = [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = GEORGIAN_MONTHS[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month}, ${year}`
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = GEORGIAN_MONTHS[date.getMonth()]
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day} ${month}, ${hours}:${minutes}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
            მოლოდინში
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            უარყოფილი
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            გაგზავნილი
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            მიწოდებული
          </span>
        )
      default:
        return null
    }
  }

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    sent: requests.filter(r => r.status === 'sent').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          სერტიფიკატების მოთხოვნები
        </h2>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'rejected', 'sent', 'delivered'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
            }`}
          >
            {status === 'all' && `ყველა (${statusCounts.all})`}
            {status === 'pending' && `მოლოდინში (${statusCounts.pending})`}
            {status === 'rejected' && `უარყოფილი (${statusCounts.rejected})`}
            {status === 'sent' && `გაგზავნილი (${statusCounts.sent})`}
            {status === 'delivered' && `მიწოდებული (${statusCounts.delivered})`}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">
            {filter === 'all' ? 'მოთხოვნები არ არის' : 'ამ სტატუსით მოთხოვნები არ არის'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-zinc-800 rounded-xl shadow p-5"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Student Info */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {request.student?.name || 'Unknown'}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    <span>{request.student?.phone}</span>
                    {request.student?.group_name && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{request.student.group_name}</span>
                      </>
                    )}
                  </div>

                  {/* Address */}
                  <div className="mb-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">მისამართი: </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{request.address}</span>
                  </div>

                  {/* Additional Info */}
                  {request.additional_info && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">დამატებითი: </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{request.additional_info}</span>
                    </div>
                  )}

                  {/* Map Link */}
                  <div className="mb-2">
                    <a
                      href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      რუკაზე ნახვა
                    </a>
                  </div>

                  {/* Status-specific info */}
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-900/20">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">უარყოფის მიზეზი: </span>
                      <span className="text-sm text-red-600 dark:text-red-400">{request.rejection_reason}</span>
                    </div>
                  )}

                  {request.status === 'sent' && request.estimated_arrival && (
                    <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">სავარაუდო მიწოდება: </span>
                      <span className="text-sm text-blue-600 dark:text-blue-400">{formatDate(request.estimated_arrival)}</span>
                    </div>
                  )}

                  {/* Created date */}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                    შექმნილია: {formatDateTime(request.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openModal(request, 'send')}
                        className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition"
                      >
                        გაგზავნილია
                      </button>
                      <button
                        onClick={() => openModal(request, 'reject')}
                        className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition"
                      >
                        უარყოფა
                      </button>
                    </>
                  )}
                  {request.status === 'sent' && (
                    <button
                      onClick={() => openModal(request, 'deliver')}
                      className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition"
                    >
                      მიწოდებულია
                    </button>
                  )}
                  {request.status === 'rejected' && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
                    >
                      წაშლა
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {modalAction === 'reject' && 'მოთხოვნის უარყოფა'}
                {modalAction === 'send' && 'მიწოდების დაწყება'}
                {modalAction === 'deliver' && 'მიწოდების დადასტურება'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                სტუდენტი: {selectedRequest.student?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {modalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    უარყოფის მიზეზი *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="მაგ: სერტიფიკატი ჯერ არ არის მზად"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              {modalAction === 'send' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    სავარაუდო მიწოდების თარიღი *
                  </label>
                  <input
                    type="date"
                    value={estimatedArrival}
                    onChange={(e) => setEstimatedArrival(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}

              {modalAction === 'deliver' && (
                <p className="text-zinc-600 dark:text-zinc-400">
                  დაადასტურეთ რომ სერტიფიკატი მიწოდებულია სტუდენტთან.
                </p>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium transition"
                >
                  გაუქმება
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={submitting}
                  className={`px-6 py-2 font-medium rounded-lg transition ${
                    modalAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white'
                      : modalAction === 'send'
                      ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
                      : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
                  }`}
                >
                  {submitting ? 'იტვირთება...' : 'დადასტურება'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
