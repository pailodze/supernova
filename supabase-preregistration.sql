-- Pre-registration for the free-courses relaunch.
-- Run this in the Supabase SQL editor. Safe to run more than once.

-- The application someone fills in after verifying their phone. Everything the
-- applicant writes about themselves is free-form prose on purpose — this is not
-- a structured CV.
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  personal_id TEXT NOT NULL,
  education TEXT NOT NULL,
  interests TEXT NOT NULL,
  work_experience TEXT NOT NULL,
  why_supernova TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  discord_invite_url TEXT,
  discord_invite_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);

-- IMPORTANT: this table holds personal ID numbers, and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- is visible to anyone who opens the site. RLS is enabled with no policies, so the
-- anon key cannot read or write it at all — only the service role key can, which
-- is why the server routes use SUPABASE_SERVICE_ROLE_KEY.
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Rate limiting reads recent OTP rows per phone; without this it's a table scan
-- on every send.
CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_codes(phone, created_at DESC);

-- Tell newcomers apart from the imported Novatori student database.
--
-- This is a separate column from `status` on purpose: status changes as you
-- process someone (applicant -> accepted -> active), but where they came from
-- never does. Everyone already in the table keeps FALSE.
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_pre_registration BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_students_pre_registration
  ON students(is_pre_registration) WHERE is_pre_registration = TRUE;

COMMENT ON COLUMN students.is_pre_registration IS
  'TRUE = self-registered through the free-courses pre-registration; FALSE = existing Novatori student';
COMMENT ON COLUMN students.status IS
  'applicant = self-registered, not yet enrolled';

-- Everyone who signed up for the new programme:
--   SELECT * FROM students WHERE is_pre_registration;
-- Existing students who never received a certificate keep using the existing
-- certificate request form — nothing about their records changes.

