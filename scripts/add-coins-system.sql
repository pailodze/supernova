-- Add coins column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Add coins_required column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS coins_required INTEGER DEFAULT 0;

-- Create job_applications table to track who applied to which job
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_student ON job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);

-- Disable RLS for job_applications table
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;

-- Give all existing students 100 coins as starting balance
UPDATE students SET coins = 100 WHERE coins = 0 OR coins IS NULL;
