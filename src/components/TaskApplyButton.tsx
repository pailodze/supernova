'use client'

import { useState, useEffect } from 'react'
import type { SkillReward } from '@/lib/supabase'

interface TaskApplyButtonProps {
  taskId: string
  skillRewards: SkillReward[]
  deadline: string | null
}

type ApplicationStatus = 'in_progress' | 'paused' | 'done' | 'cancelled' | 'approved' | 'rejected'

export default function TaskApplyButton({
  taskId,
  skillRewards,
  deadline,
}: TaskApplyButtonProps) {
  const [applied, setApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submission, setSubmission] = useState('')

  const isExpired = deadline ? new Date(deadline) < new Date() : false

  useEffect(() => {
    checkApplicationStatus()
  }, [taskId])

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/apply`)
      const data = await response.json()
      setApplied(data.applied)
      if (data.application) {
        setApplicationStatus(data.application.status)
      }
    } catch {
      console.error('Failed to check application status')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    setError('')
    setApplying(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}/apply`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'განაცხადის გაგზავნა ვერ მოხერხდა')
        return
      }

      setApplied(true)
      setApplicationStatus('in_progress')
    } catch {
      setError('ქსელის შეცდომა. სცადეთ თავიდან.')
    } finally {
      setApplying(false)
    }
  }

  const handleUpdateStatus = async (newStatus: ApplicationStatus, submissionText?: string) => {
    setError('')
    setUpdating(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}/apply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, submission: submissionText }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'სტატუსის განახლება ვერ მოხერხდა')
        return
      }

      setApplicationStatus(newStatus)
      if (newStatus === 'done') {
        setShowSubmissionModal(false)
        setSubmission('')
      }
    } catch {
      setError('ქსელის შეცდომა. სცადეთ თავიდან.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSubmitDone = () => {
    if (!submission.trim()) {
      setError('გთხოვთ მიუთითოთ შესრულებული სამუშაოს აღწერა')
      return
    }
    handleUpdateStatus('done', submission.trim())
  }

  const handleCancel = async () => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ განაცხადის გაუქმება?')) return

    setError('')
    setUpdating(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}/apply`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'განაცხადის გაუქმება ვერ მოხერხდა')
        return
      }

      setApplied(false)
      setApplicationStatus(null)
    } catch {
      setError('ქსელის შეცდომა. სცადეთ თავიდან.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusInfo = (status: ApplicationStatus) => {
    switch (status) {
      case 'in_progress':
        return {
          label: 'მიმდინარეობს',
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          icon: '🔄',
        }
      case 'paused':
        return {
          label: 'შეჩერებული',
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
          icon: '⏸️',
        }
      case 'done':
        return {
          label: 'დასრულებული',
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          icon: '✅',
        }
      case 'approved':
        return {
          label: 'დამტკიცებული',
          color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          icon: '🎉',
        }
      case 'rejected':
        return {
          label: 'უარყოფილი',
          color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
          icon: '❌',
        }
      default:
        return {
          label: status,
          color: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
          icon: '📋',
        }
    }
  }

  // Check if student can modify their application
  const canModify = applicationStatus && !['approved', 'rejected'].includes(applicationStatus)

  if (loading) {
    return (
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
        <div className="animate-pulse bg-zinc-200 dark:bg-zinc-700 h-12 w-48 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
        მონაწილეობა
      </h2>

      {!applied ? (
        <div className="space-y-4">
          {/* Skill Rewards Info */}
          <div className={`p-4 rounded-xl ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : 'bg-cyan-50 dark:bg-cyan-900/20'}`}>
            {skillRewards.length > 0 ? (
              <>
                <p className={`font-medium mb-3 ${isExpired ? 'text-red-800 dark:text-red-200' : 'text-cyan-800 dark:text-cyan-200'}`}>
                  {isExpired ? 'დავალების ვადა ამოიწურა' : 'ჯილდოები:'}
                </p>
                {!isExpired && (
                  <div className="flex flex-wrap gap-2">
                    {skillRewards.map((sr) => (
                      <span
                        key={sr.skill_id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm bg-cyan-100 dark:bg-cyan-800/50 text-cyan-700 dark:text-cyan-200"
                      >
                        {sr.skill.icon && <span>{sr.skill.icon}</span>}
                        {sr.skill.name}
                        <span className="font-medium">+{sr.level_reward} Lv</span>
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className={`font-medium ${isExpired ? 'text-red-800 dark:text-red-200' : 'text-cyan-800 dark:text-cyan-200'}`}>
                {isExpired ? 'დავალების ვადა ამოიწურა' : 'დავალება უნარების ჯილდოს გარეშე'}
              </p>
            )}
            {!isExpired && skillRewards.length > 0 && (
              <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-2">
                დავალების შესრულების შემდეგ აიმაღლებთ უნარების დონეებს
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={applying || isExpired}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg transition ${
              isExpired
                ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
            }`}
          >
            {applying ? (
              'იტვირთება...'
            ) : isExpired ? (
              'ვადა ამოიწურა'
            ) : (
              'დაიწყე დავალება'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Status */}
          {applicationStatus && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${getStatusInfo(applicationStatus).color}`}>
              <span className="text-2xl">{getStatusInfo(applicationStatus).icon}</span>
              <div className="flex-1">
                <p className="font-medium">
                  სტატუსი: {getStatusInfo(applicationStatus).label}
                </p>
                {applicationStatus === 'done' && (
                  <p className="text-sm opacity-80">
                    ადმინისტრატორი განიხილავს და დაგირიცხავთ უნარების ქულებს
                  </p>
                )}
                {applicationStatus === 'approved' && skillRewards.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm opacity-80 mb-1">დავალება დასრულებულია! მიღებული უნარები:</p>
                    <div className="flex flex-wrap gap-1">
                      {skillRewards.map((sr) => (
                        <span
                          key={sr.skill_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/30 dark:bg-black/20"
                        >
                          {sr.skill.icon} {sr.skill.name} +{sr.level_reward}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Status Controls - only show if student can modify */}
          {canModify && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {/* Pause button - only visible when in_progress */}
                {applicationStatus === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateStatus('paused')}
                    disabled={updating}
                    className="flex-1 px-4 py-2 font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition disabled:opacity-50"
                  >
                    ⏸️ შეჩერება
                  </button>
                )}
                {/* Resume button - only visible when paused */}
                {applicationStatus === 'paused' && (
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={updating}
                    className="flex-1 px-4 py-2 font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition disabled:opacity-50"
                  >
                    🔄 გაგრძელება
                  </button>
                )}
                {/* Mark as done button */}
                <button
                  onClick={() => setShowSubmissionModal(true)}
                  disabled={updating}
                  className="flex-1 px-4 py-2 font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition disabled:opacity-50"
                >
                  ✅ დასრულება
                </button>
                {/* Cancel button */}
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                >
                  გაუქმება
                </button>
              </div>
            </div>
          )}

          {/* Message for approved/rejected status */}
          {applicationStatus === 'rejected' && (
            <div className="pt-2">
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition disabled:opacity-50"
              >
                წაშლა და თავიდან ცდა
              </button>
            </div>
          )}
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              დავალების დასრულება
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              გთხოვთ მიუთითოთ შესრულებული სამუშაოს დეტალები, ლინკები ან სხვა წყაროები
            </p>

            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              placeholder="მაგ: GitHub ლინკი, Google Drive ლინკი, აღწერა..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowSubmissionModal(false)
                  setSubmission('')
                  setError('')
                }}
                disabled={updating}
                className="flex-1 px-4 py-2 font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition disabled:opacity-50"
              >
                გაუქმება
              </button>
              <button
                onClick={handleSubmitDone}
                disabled={updating || !submission.trim()}
                className="flex-1 px-4 py-2 font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'იგზავნება...' : '✅ გაგზავნა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
