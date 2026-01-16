'use client'

import { useState, useEffect } from 'react'
import type { SkillRequirement, StudentSkill } from '@/lib/supabase'

interface JobApplyButtonProps {
  jobId: string
  skillRequirements: SkillRequirement[]
  contactEmail?: string | null
  contactPhone?: string | null
}

type SkillCheck = {
  skill_id: string
  skill_name: string
  skill_icon: string | null
  required_level: number
  student_level: number
  met: boolean
}

export default function JobApplyButton({
  jobId,
  skillRequirements,
  contactEmail,
  contactPhone,
}: JobApplyButtonProps) {
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [studentSkills, setStudentSkills] = useState<StudentSkill[]>([])
  const [skillChecks, setSkillChecks] = useState<SkillCheck[]>([])

  useEffect(() => {
    checkApplicationStatus()
  }, [jobId])

  useEffect(() => {
    // Calculate skill checks whenever student skills or requirements change
    const checks: SkillCheck[] = skillRequirements.map((sr) => {
      const studentSkill = studentSkills.find((ss) => ss.skill_id === sr.skill_id)
      const studentLevel = studentSkill?.proficiency_level || 0
      return {
        skill_id: sr.skill_id,
        skill_name: sr.skill.name,
        skill_icon: sr.skill.icon,
        required_level: sr.required_level,
        student_level: studentLevel,
        met: studentLevel >= sr.required_level,
      }
    })
    setSkillChecks(checks)
  }, [studentSkills, skillRequirements])

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`)
      const data = await response.json()
      setApplied(data.applied)
      setShowContactInfo(data.applied)
      if (data.studentSkills) {
        setStudentSkills(data.studentSkills)
      }
    } catch {
      console.error('Failed to check application status')
    } finally {
      setLoading(false)
    }
  }

  const allSkillsMet = skillChecks.length === 0 || skillChecks.every((sc) => sc.met)

  const handleApply = async () => {
    setError('')
    setApplying(true)

    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'განაცხადის გაგზავნა ვერ მოხერხდა')
        return
      }

      setApplied(true)
      setShowContactInfo(true)
    } catch {
      setError('ქსელის შეცდომა. სცადეთ თავიდან.')
    } finally {
      setApplying(false)
    }
  }

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
        განაცხადის გაგზავნა
      </h2>

      {!applied ? (
        <div className="space-y-4">
          {/* Skill Requirements Check */}
          {skillChecks.length > 0 && (
            <div className={`p-4 rounded-xl ${allSkillsMet ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
              <p className={`font-medium mb-3 ${allSkillsMet ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'}`}>
                {allSkillsMet ? 'თქვენ აკმაყოფილებთ ყველა მოთხოვნას' : 'უნარების მოთხოვნები:'}
              </p>
              <div className="space-y-2">
                {skillChecks.map((sc) => (
                  <div
                    key={sc.skill_id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      sc.met
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {sc.skill_icon && <span>{sc.skill_icon}</span>}
                      <span className={sc.met ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                        {sc.skill_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${sc.met ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        თქვენი: Lv.{sc.student_level} / საჭირო: Lv.{sc.required_level}
                      </span>
                      {sc.met ? (
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">✗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!allSkillsMet && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-3">
                  შეასრულეთ დავალებები შესაბამისი უნარების დონის ასამაღლებლად
                </p>
              )}
            </div>
          )}

          {/* No requirements message */}
          {skillChecks.length === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  ეს ვაკანსია არ საჭიროებს კონკრეტულ უნარებს
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  შეგიძლიათ გააგზავნოთ განაცხადი პირდაპირ
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={applying || !allSkillsMet}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg transition ${
              allSkillsMet
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
          >
            {applying ? 'იტვირთება...' : 'გააგზავნე განაცხადი'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                განაცხადი გაგზავნილია!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                ქვემოთ იხილეთ საკონტაქტო ინფორმაცია
              </p>
            </div>
          </div>

          {showContactInfo && (
            <div className="flex flex-wrap gap-3">
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center px-6 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white font-medium rounded-lg transition"
                >
                  📧 {contactEmail}
                </a>
              )}

              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex items-center px-6 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white font-medium rounded-lg transition"
                >
                  📞 {contactPhone}
                </a>
              )}

              {!contactEmail && !contactPhone && (
                <p className="text-zinc-500 dark:text-zinc-400">
                  საკონტაქტო ინფორმაცია არ არის მითითებული
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
