/**
 * Routing checks for src/middleware.ts.
 *
 * The middleware decides who sees the landing page, who gets forced into the
 * application form, and who is allowed into /admin — all from a cookie, with no
 * database. That makes it both the riskiest file in the pre-registration change
 * and the easiest one to check, so: run it as a pure function.
 *
 *   npx tsx scripts/check-middleware.ts
 */
import { NextRequest } from 'next/server'
import { middleware } from '../src/middleware'

type SessionShape = {
  studentId?: string
  isAdmin?: boolean
  needsApplication?: boolean
  expiresAt?: number
}

const HOUR = 60 * 60 * 1000

function run(pathname: string, session?: SessionShape | 'malformed') {
  const request = new NextRequest(new URL(`https://supernova.guru${pathname}`))
  if (session) {
    request.cookies.set(
      'session',
      session === 'malformed' ? 'not json at all' : JSON.stringify(session)
    )
  }

  const response = middleware(request)
  const location = response.headers.get('location')
  return location ? new URL(location).pathname : 'PASS'
}

const applicant: SessionShape = {
  studentId: 'a-1',
  isAdmin: false,
  needsApplication: true,
  expiresAt: Date.now() + HOUR,
}
const student: SessionShape = {
  studentId: 's-1',
  isAdmin: false,
  needsApplication: false,
  expiresAt: Date.now() + HOUR,
}
const admin: SessionShape = {
  studentId: 'x-1',
  isAdmin: true,
  needsApplication: false,
  expiresAt: Date.now() + HOUR,
}
const expired: SessionShape = { studentId: 's-9', expiresAt: Date.now() - HOUR }

const cases: [string, string, SessionShape | 'malformed' | undefined, string][] = [
  // The whole point of the change: the landing page must render for strangers.
  ['logged out', '/', undefined, 'PASS'],
  ['logged out', '/login', undefined, 'PASS'],
  ['logged out', '/verify', undefined, 'PASS'],
  ['logged out', '/jobs', undefined, 'PASS'],
  ['logged out', '/dashboard', undefined, '/login'],
  ['logged out', '/apply', undefined, '/login'],
  ['logged out', '/welcome', undefined, '/login'],
  ['logged out', '/admin', undefined, '/login'],

  // An applicant who hasn't filled the form goes nowhere else.
  ['applicant', '/', applicant, '/apply'],
  ['applicant', '/dashboard', applicant, '/apply'],
  ['applicant', '/learn', applicant, '/apply'],
  ['applicant', '/apply', applicant, 'PASS'],
  ['applicant', '/api/application', applicant, 'PASS'],
  ['applicant', '/api/auth/logout', applicant, 'PASS'],
  ['applicant', '/login', applicant, '/apply'],
  // Must NOT bounce back to /apply, or a stale cookie loops forever.
  ['applicant', '/welcome', applicant, 'PASS'],

  // Existing students are untouched: no forced application, certificate flow
  // and the rest of the LMS keep working exactly as before.
  ['student', '/dashboard', student, 'PASS'],
  ['student', '/', student, 'PASS'],
  ['student', '/learn', student, 'PASS'],
  ['student', '/apply', student, 'PASS'],
  ['student', '/api/certificate-requests', student, 'PASS'],
  ['student', '/login', student, '/dashboard'],
  ['student', '/admin', student, '/dashboard'],

  ['admin', '/admin', admin, 'PASS'],
  ['admin', '/admin/applications', admin, 'PASS'],
  ['admin', '/api/admin/applications', admin, 'PASS'],

  ['expired', '/admin', expired, '/login'],
  ['malformed cookie', '/admin', 'malformed', '/login'],
]

let failures = 0
for (const [who, pathname, session, expected] of cases) {
  const actual = run(pathname, session)
  const ok = actual === expected
  if (!ok) failures++
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${who.padEnd(16)} ${pathname.padEnd(26)} -> ${actual}${
      ok ? '' : `  (expected ${expected})`
    }`
  )
}

console.log(`\n${cases.length - failures}/${cases.length} passed`)
process.exit(failures === 0 ? 0 : 1)
