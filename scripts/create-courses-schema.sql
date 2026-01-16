-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_courses junction table (many-to-many)
CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create job_courses junction table (many-to-many - a job can target multiple courses)
CREATE TABLE IF NOT EXISTS job_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_courses_student ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course ON student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_job_courses_job ON job_courses(job_id);
CREATE INDEX IF NOT EXISTS idx_job_courses_course ON job_courses(course_id);

-- Disable RLS for these tables
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_courses DISABLE ROW LEVEL SECURITY;

-- Insert courses (main categories only)
INSERT INTO courses (name, slug) VALUES
  ('კომპიუტერული მეცნიერება', 'computer-science'),
  ('დიზაინი', 'design'),
  ('მარკეტინგი', 'marketing')
ON CONFLICT (name) DO NOTHING;
