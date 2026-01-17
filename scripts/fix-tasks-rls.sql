-- Fix RLS issues on tasks tables
-- Run this in Supabase SQL Editor if you're having issues with tasks

-- Disable RLS on tasks tables to match the rest of the schema
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_skill_rewards DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies if they cause issues
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;
DROP POLICY IF EXISTS "Allow all on task_courses" ON task_courses;
DROP POLICY IF EXISTS "Allow all on task_applications" ON task_applications;
