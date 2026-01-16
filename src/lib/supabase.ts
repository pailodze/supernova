import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Student = {
  id: string
  name: string
  phone: string
  personal_id: string
  email: string
  status: string
  group_name: string
  intake: string
  birth_date: string
  age: number
  registration_date: string
  profession: string
  attendance_type: string
  bank: string
  payment_method: string
  debt: number
  paid: number
  total_amount: number
  next_payment: string
  payer: string
  personal_info: string
  comment: string
  source: string
  discord: string
  contract: string
  parent_phone: string
  parent_name: string
  sales_manager: string
  coins: number
  is_admin: boolean
  created_at: string
}

export type OtpCode = {
  id: string
  phone: string
  code: string
  expires_at: string
  used: boolean
  created_at: string
}

export type SkillRequirement = {
  skill_id: string
  skill: Skill
  required_level: number
}

export type Job = {
  id: string
  title: string
  company: string
  location: string | null
  type: 'full-time' | 'part-time' | 'internship' | 'freelance' | null
  salary: string | null
  description: string | null
  requirements: string | null
  contact_email: string | null
  contact_phone: string | null
  apply_url: string | null
  open_positions: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Related courses (populated via join)
  courses?: Course[]
  // Related skill requirements (populated via join)
  skill_requirements?: SkillRequirement[]
}

export type JobApplication = {
  id: string
  student_id: string
  job_id: string
  created_at: string
}

export type Course = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type StudentCourse = {
  id: string
  student_id: string
  course_id: string
  created_at: string
}

export type JobCourse = {
  id: string
  job_id: string
  course_id: string
  created_at: string
}

export type SkillReward = {
  skill_id: string
  skill: Skill
  level_reward: number
}

export type Task = {
  id: string
  title: string
  description: string | null
  deadline: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Related courses (populated via join)
  courses?: Course[]
  // Related skill rewards (populated via join)
  skill_rewards?: SkillReward[]
}

export type TaskApplication = {
  id: string
  task_id: string
  student_id: string
  status: 'in_progress' | 'paused' | 'done' | 'cancelled' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export type TaskCourse = {
  id: string
  task_id: string
  course_id: string
  created_at: string
}

export type Skill = {
  id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StudentSkill = {
  id: string
  student_id: string
  skill_id: string
  proficiency_level: number
  created_at: string
  updated_at: string
  // Populated via join
  skill?: Skill
}

export type JobSkillRequirement = {
  id: string
  job_id: string
  skill_id: string
  required_level: number
  created_at: string
}

export type TaskSkillReward = {
  id: string
  task_id: string
  skill_id: string
  level_reward: number
  created_at: string
}
