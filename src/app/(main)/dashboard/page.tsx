import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import type { Job, Course, Task, StudentSkill } from '@/lib/supabase'
import DashboardTabs from '@/components/DashboardTabs'
import CertificateRequestCard from '@/components/CertificateRequestCard'

async function getStudent(studentId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error) return null
  return data
}

/** Has this person applied to the free-courses programme yet? */
async function hasApplied(studentId: string): Promise<boolean> {
  try {
    const admin = createAdminSupabaseClient()
    const { data } = await admin
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    // Service role key not configured — hide the CTA rather than break the page.
    return true
  }
}

async function getStudentCourses(studentId: string): Promise<{ ids: string[], names: string[] }> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('student_courses')
    .select(`
      course_id,
      courses (
        name
      )
    `)
    .eq('student_id', studentId)

  if (error) {
    console.error('Error fetching student courses:', error)
    return { ids: [], names: [] }
  }

  const ids = data?.map((sc) => sc.course_id) || []
  const names = data?.map((sc) => {
    const course = sc.courses as unknown as { name: string } | null
    return course?.name
  }).filter(Boolean) as string[]
  return { ids, names }
}

async function getStudentSkills(studentId: string): Promise<StudentSkill[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('student_skills')
    .select(`
      *,
      skill:skills (
        id,
        name,
        icon
      )
    `)
    .eq('student_id', studentId)
    .order('proficiency_level', { ascending: false })

  if (error) {
    console.error('Error fetching student skills:', error)
    return []
  }

  return data || []
}

type JobWithCourses = Job & {
  job_courses?: { course_id: string; courses: Course }[]
}

type TaskWithCourses = Task & {
  task_courses?: { course_id: string; courses: Course }[]
}

async function getJobs(studentCourseIds: string[]): Promise<Job[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      job_courses (
        course_id,
        courses (
          id,
          name,
          slug
        )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  const jobs = (data as JobWithCourses[]) || []

  // Filter jobs: show jobs with no courses (for everyone) OR matching student's courses
  return jobs.filter((job) => {
    const jobCourseIds = job.job_courses?.map((jc) => jc.course_id) || []

    // Jobs with no courses are visible to everyone
    if (jobCourseIds.length === 0) return true

    // Jobs with courses are only visible to students who have at least one matching course
    return jobCourseIds.some((courseId) => studentCourseIds.includes(courseId))
  }).map((job) => {
    // Transform job_courses to courses array for display
    const courses = job.job_courses?.map((jc) => jc.courses).filter(Boolean) || []
    const { job_courses: _, ...jobWithoutJunction } = job
    return { ...jobWithoutJunction, courses }
  })
}

async function getTasks(studentCourseIds: string[]): Promise<Task[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      task_courses (
        course_id,
        courses (
          id,
          name,
          slug
        )
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  const tasks = (data as TaskWithCourses[]) || []

  // Filter tasks: show tasks with no courses (for everyone) OR matching student's courses
  // Also filter out tasks with passed deadlines
  const now = new Date()
  return tasks.filter((task) => {
    // Filter out expired tasks
    if (task.deadline && new Date(task.deadline) < now) return false

    const taskCourseIds = task.task_courses?.map((tc) => tc.course_id) || []

    // Tasks with no courses are visible to everyone
    if (taskCourseIds.length === 0) return true

    // Tasks with courses are only visible to students who have at least one matching course
    return taskCourseIds.some((courseId) => studentCourseIds.includes(courseId))
  }).map((task) => {
    // Transform task_courses to courses array for display
    const courses = task.task_courses?.map((tc) => tc.courses).filter(Boolean) || []
    const { task_courses: _, ...taskWithoutJunction } = task
    return { ...taskWithoutJunction, courses }
  })
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) {
    redirect('/login')
  }

  let session
  try {
    session = JSON.parse(sessionCookie.value)
  } catch {
    redirect('/login')
  }

  if (!session.studentId || session.expiresAt < Date.now()) {
    redirect('/login')
  }

  const student = await getStudent(session.studentId)

  if (!student) {
    redirect('/login')
  }

  // Get student's courses, skills, and filter jobs/tasks accordingly
  const studentCourses = await getStudentCourses(session.studentId)
  const [jobs, tasks, studentSkills, applied] = await Promise.all([
    getJobs(studentCourses.ids),
    getTasks(studentCourses.ids),
    getStudentSkills(session.studentId),
    hasApplied(session.studentId),
  ])
  

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome Card */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
              გამარჯობა, {student.name}!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              {student.group_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {studentSkills.length > 0 ? (
              studentSkills.map((ss) => (
                <div
                  key={ss.id}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl"
                >
                  <span className="text-xl">{ss.skill?.icon || '⭐'}</span>
                  <div>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400">{ss.skill?.name}</p>
                    <p className="text-lg font-bold text-cyan-800 dark:text-cyan-200">
                      Lvl {ss.proficiency_level}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700/30 rounded-xl">
                <span className="text-xl">🎯</span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  უნარები ჯერ არ გაქვს
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Existing students aren't forced through the new application, but the
          free-courses programme is open to them too — this is how they opt in. */}
      {!student.is_pre_registration && !applied && (
        <Link
          href="/apply"
          className="block mb-8 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/30 hover:border-cyan-400/60 transition"
        >
          <p className="font-semibold text-zinc-900 dark:text-white">
            🌟 უფასო კურსების პროგრამა დაიწყო
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            შეავსე განაცხადი და მიიღე წვდომა დახურულ Discord არხზე →
          </p>
        </Link>
      )}

      {/* Certificate Request CTA — for the existing student database only.
          Anyone who signed up through pre-registration has never taken a
          course here, so there is no certificate for them to request yet. */}
      {!student.is_pre_registration && <CertificateRequestCard studentId={session.studentId} />}

      {/* Tabs */}
      <DashboardTabs jobs={jobs} tasks={tasks} />
    </main>
  )
}
