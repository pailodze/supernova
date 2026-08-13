// Shared by the apply form and the API route, so the browser and the server
// never disagree about what counts as a complete application.

export type ApplicationInput = {
  firstName: string
  lastName: string
  personalId: string
  education: string
  interests: string
  workExperience: string
  whySupernova: string
}

export type FieldError = { code: 'required' | 'personalId' | 'tooShort'; min?: number }
export type FieldErrors = Partial<Record<keyof ApplicationInput, FieldError>>

/** Minimum prose length per field — enough to be an answer, not an essay. */
export const MIN_LENGTH: Partial<Record<keyof ApplicationInput, number>> = {
  education: 40,
  interests: 30,
  workExperience: 20,
  whySupernova: 60,
}

export const MAX_LENGTH = 4000

export const ERROR_TEXT: Record<FieldError['code'], string> = {
  required: 'ეს ველი სავალდებულოა',
  personalId: 'პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან',
  tooShort: 'ცოტა მეტი დაწერე — მინიმუმ {n} სიმბოლო',
}

export function errorText(error: FieldError): string {
  return ERROR_TEXT[error.code].replace('{n}', String(error.min ?? 0))
}

export function normalizeApplication(
  raw: Partial<Record<keyof ApplicationInput, unknown>>
): ApplicationInput {
  const str = (value: unknown) =>
    typeof value === 'string' ? value.trim().slice(0, MAX_LENGTH) : ''

  return {
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    personalId: str(raw.personalId).replace(/\D/g, ''),
    education: str(raw.education),
    interests: str(raw.interests),
    workExperience: str(raw.workExperience),
    whySupernova: str(raw.whySupernova),
  }
}

export function validateApplication(input: ApplicationInput): FieldErrors {
  const errors: FieldErrors = {}

  for (const field of ['firstName', 'lastName', 'personalId'] as const) {
    if (!input[field]) errors[field] = { code: 'required' }
  }

  // Georgian personal ID numbers are exactly 11 digits.
  if (input.personalId && !/^\d{11}$/.test(input.personalId)) {
    errors.personalId = { code: 'personalId' }
  }

  for (const [field, min] of Object.entries(MIN_LENGTH) as [keyof ApplicationInput, number][]) {
    const value = input[field]
    if (!value) errors[field] = { code: 'required' }
    else if (value.length < min) errors[field] = { code: 'tooShort', min }
  }

  return errors
}
