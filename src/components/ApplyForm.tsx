'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  type ApplicationInput,
  type FieldErrors,
  MIN_LENGTH,
  errorText,
  normalizeApplication,
  validateApplication,
} from '@/lib/application'

const FIELD_CLASS =
  'w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition'

// Declared at module scope on purpose: nesting these inside ApplyForm would
// hand React a brand new component type on every keystroke, remounting the
// input and throwing away focus mid-word.
function TextField({
  name,
  label,
  hint,
  value,
  error,
  onChange,
  ...rest
}: {
  name: string
  label: string
  hint?: string
  value: string
  error: string | null
  onChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'name'>) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300 mb-2">
        {label}
      </label>
      <input
        id={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={FIELD_CLASS}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

function ProseField({
  name,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  name: string
  label: string
  hint: string
  value: string
  error: string | null
  onChange: (value: string) => void
}) {
  const min = MIN_LENGTH[name as keyof ApplicationInput] ?? 0
  const length = value.trim().length

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-300 mb-2">
        {label}
      </label>
      <textarea
        id={name}
        rows={5}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${FIELD_CLASS} resize-y`}
        aria-invalid={Boolean(error)}
      />
      <div className="mt-1.5 flex items-start justify-between gap-4">
        <p className={`text-xs ${error ? 'text-red-400' : 'text-zinc-500'}`}>{error ?? hint}</p>
        <span
          className={`shrink-0 text-xs tabular-nums ${
            length >= min ? 'text-zinc-500' : 'text-zinc-600'
          }`}
        >
          {length}/{min}
        </span>
      </div>
    </div>
  )
}

export default function ApplyForm({ defaults }: { defaults: Partial<ApplicationInput> }) {
  const router = useRouter()
  const [values, setValues] = useState<ApplicationInput>({
    firstName: defaults.firstName ?? '',
    lastName: defaults.lastName ?? '',
    personalId: defaults.personalId ?? '',
    education: '',
    interests: '',
    workExperience: '',
    whySupernova: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (field: keyof ApplicationInput, value: string) => {
    setValues(current => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors(current => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  const messageFor = (field: keyof ApplicationInput): string | null => {
    const error = errors[field]
    return error ? errorText(error) : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Same rules the API will apply, so the two can't disagree.
    const normalized = normalizeApplication(values)
    const found = validateApplication(normalized)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      })
      const data = await response.json()

      if (!response.ok) {
        // Already applied isn't an error the applicant can act on — it just
        // means their Discord link is waiting on the next page.
        if (response.status === 409) {
          router.replace('/welcome')
          return
        }
        if (data.fieldErrors) setErrors(data.fieldErrors as FieldErrors)
        else setFormError(data.error || 'რაღაც ვერ გამოვიდა. სცადე თავიდან.')
        return
      }

      router.replace('/welcome')
      router.refresh()
    } catch {
      setFormError('ქსელის შეცდომა. სცადე თავიდან.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="firstName"
            label="სახელი"
            value={values.firstName}
            error={messageFor('firstName')}
            onChange={v => set('firstName', v)}
            autoComplete="given-name"
          />
          <TextField
            name="lastName"
            label="გვარი"
            value={values.lastName}
            error={messageFor('lastName')}
            onChange={v => set('lastName', v)}
            autoComplete="family-name"
          />
        </div>

        <TextField
          name="personalId"
          label="პირადი ნომერი"
          hint="11 ციფრი"
          value={values.personalId}
          error={messageFor('personalId')}
          onChange={v => set('personalId', v.replace(/\D/g, ''))}
          inputMode="numeric"
          maxLength={11}
          dir="ltr"
        />

        <p className="text-xs text-zinc-500">
          პირად ნომერს ვიყენებთ მხოლოდ იდენტიფიკაციისთვის. ის არსად ქვეყნდება.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-sm border border-zinc-700/50 space-y-6">
        <ProseField
          name="education"
          label="განათლება"
          hint="სად და რა ისწავლე. ორიოდე წინადადება საკმარისია."
          value={values.education}
          error={messageFor('education')}
          onChange={v => set('education', v)}
        />
        <ProseField
          name="interests"
          label="ინტერესები და ჰობი"
          hint="რა გაინტერესებს კოდის მიღმა?"
          value={values.interests}
          error={messageFor('interests')}
          onChange={v => set('interests', v)}
        />
        <ProseField
          name="workExperience"
          label="სამუშაო გამოცდილება"
          hint="თუ გაქვს — მოკლედ აღწერე. თუ არ გაქვს, ისიც დაწერე, პრობლემა არაა."
          value={values.workExperience}
          error={messageFor('workExperience')}
          onChange={v => set('workExperience', v)}
        />
        <ProseField
          name="whySupernova"
          label="რატომ ფიქრობ, რომ supernova-ს ნაწილი ხარ?"
          hint="ეს ყველაზე მნიშვნელოვანი კითხვაა. იყავი გულწრფელი."
          value={values.whySupernova}
          error={messageFor('whySupernova')}
          onChange={v => set('whySupernova', v)}
        />
      </div>

      {formError && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:from-zinc-600 disabled:to-zinc-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/25 disabled:hover:scale-100"
      >
        {loading ? 'იგზავნება...' : 'განაცხადის გაგზავნა'}
      </button>
    </form>
  )
}
