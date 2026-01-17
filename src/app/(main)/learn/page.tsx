import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Course, Technology } from '@/lib/supabase'

type CourseWithTechnologies = Course & {
  technologies: Technology[]
}

async function getStudentCourses(studentId: string): Promise<string[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('student_courses')
    .select('course_id')
    .eq('student_id', studentId)

  if (error) {
    console.error('Error fetching student courses:', error)
    return []
  }

  return data?.map((sc) => sc.course_id) || []
}

async function getCoursesWithTechnologies(courseIds: string[]): Promise<CourseWithTechnologies[]> {
  if (courseIds.length === 0) return []

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      technologies (
        *
      )
    `)
    .in('id', courseIds)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching courses with technologies:', error)
    return []
  }

  // Sort technologies by order_index and filter active ones
  return (data || []).map(course => ({
    ...course,
    technologies: (course.technologies || [])
      .filter((tech: Technology) => tech.is_active)
      .sort((a: Technology, b: Technology) => a.order_index - b.order_index)
  }))
}

export default async function LearnPage() {
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

  const studentCourseIds = await getStudentCourses(session.studentId)
  const courses = await getCoursesWithTechnologies(studentCourseIds)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          სასწავლო მასალა
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          აირჩიე კურსი და ტექნოლოგია სასწავლებლად
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            კურსები ვერ მოიძებნა
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            თქვენ ჯერ არ ხართ ჩაწერილი არცერთ კურსზე
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {course.name}
                </h2>
              </div>

              {course.technologies.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                  ტექნოლოგიები მალე დაემატება
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {course.technologies.map((tech) => (
                      <Link
                        key={tech.id}
                        href={`/learn/${tech.id}`}
                        className="group flex items-start gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <div className="text-3xl flex-shrink-0">
                          {tech.icon || '📖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {tech.name}
                          </h3>
                          {tech.description && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                              {tech.description}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
