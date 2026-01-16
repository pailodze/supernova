-- Run this SQL in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/sxkiziokykfohghptojs/sql

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT UNIQUE,
  personal_id TEXT,
  email TEXT,
  status TEXT,
  group_name TEXT,
  intake TEXT,
  birth_date DATE,
  age INTEGER,
  registration_date DATE,
  profession TEXT,
  attendance_type TEXT,
  bank TEXT,
  payment_method TEXT,
  debt NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  next_payment DATE,
  payer TEXT,
  personal_info TEXT,
  comment TEXT,
  source TEXT,
  discord TEXT,
  contract TEXT,
  parent_phone TEXT,
  parent_name TEXT,
  sales_manager TEXT,
  coverage TEXT,
  problematic TEXT,
  ani TEXT,
  attachment TEXT,
  other_contact TEXT,
  parent_conversation TEXT,
  parent_control TEXT,
  happiness TEXT,
  problem TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_admin column to existing students table (if table already exists)
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Make user with phone 593000323 an admin
UPDATE students SET is_admin = TRUE WHERE phone = '593000323';

-- OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(code);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  type TEXT, -- full-time, part-time, internship, freelance
  salary TEXT, -- salary info as text (e.g., "1500-2000 GEL", "negotiable")
  category TEXT, -- computer-science, marketing, design
  description TEXT,
  requirements TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  apply_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, add the category column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for active jobs
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active skills
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

-- Student skills junction table (many-to-many with proficiency level)
CREATE TABLE IF NOT EXISTS student_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

-- Create indexes for student_skills
CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);

-- Job skill requirements (what skills/levels are needed to apply)
CREATE TABLE IF NOT EXISTS job_skill_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level INTEGER DEFAULT 1 CHECK (required_level >= 1 AND required_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_job_skill_requirements_job ON job_skill_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skill_requirements_skill ON job_skill_requirements(skill_id);

-- Task skill rewards (what skills/levels are gained on completion)
CREATE TABLE IF NOT EXISTS task_skill_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level_reward INTEGER DEFAULT 1 CHECK (level_reward >= 1 AND level_reward <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_task_skill_rewards_task ON task_skill_rewards(task_id);
CREATE INDEX IF NOT EXISTS idx_task_skill_rewards_skill ON task_skill_rewards(skill_id);

-- Disable RLS for simplicity (enable if needed for production)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_skill_requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_skill_rewards DISABLE ROW LEVEL SECURITY;
