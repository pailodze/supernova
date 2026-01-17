import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Technology, Topic, Course } from '@/lib/supabase'
import TopicViewer from '@/components/TopicViewer'

type TechnologyWithDetails = Technology & {
  course: Course
  topics: Topic[]
}

async function getStudentCourseIds(studentId: string): Promise<string[]> {
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

async function getTechnology(technologyId: string): Promise<TechnologyWithDetails | null> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('technologies')
    .select(`
      *,
      course:courses(*),
      topics(*)
    `)
    .eq('id', technologyId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching technology:', error)
    return null
  }

  // Sort topics by order_index and filter active ones
  return {
    ...data,
    topics: (data.topics || [])
      .filter((topic: Topic) => topic.is_active)
      .sort((a: Topic, b: Topic) => a.order_index - b.order_index)
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} წთ`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} სთ`
  }
  return `${hours} სთ ${mins} წთ`
}

export default async function TechnologyPage({
  params,
  searchParams,
}: {
  params: Promise<{ technologyId: string }>
  searchParams: Promise<{ topic?: string }>
}) {
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

  const { technologyId } = await params
  const { topic: selectedTopicId } = await searchParams

  // Get student's enrolled courses
  const studentCourseIds = await getStudentCourseIds(session.studentId)

  // Get technology details
  const technology = await getTechnology(technologyId)

  if (!technology) {
    notFound()
  }

  // Check if student is enrolled in this course
  if (!studentCourseIds.includes(technology.course_id)) {
    redirect('/learn')
  }

  // Find selected topic or default to first
  const selectedTopic = selectedTopicId
    ? technology.topics.find((t) => t.id === selectedTopicId)
    : technology.topics[0]

  const totalDuration = technology.topics.reduce((sum, t) => sum + (t.duration || 0), 0)

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        <Link href="/learn" className="hover:text-blue-600 dark:hover:text-blue-400">
          სასწავლო მასალა
        </Link>
        <span>/</span>
        <Link href="/learn" className="hover:text-blue-600 dark:hover:text-blue-400">
          {technology.course.name}
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-white">{technology.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">{technology.icon || '📖'}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
              {technology.name}
            </h1>
            {technology.description && (
              <p className="text-zinc-600 dark:text-zinc-400 mb-3">
                {technology.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {technology.topics.length} თემა
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(totalDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {technology.topics.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            თემები მალე დაემატება
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            ამ ტექნოლოგიაში ჯერ არ არის დამატებული თემები
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Topics List - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden sticky top-4">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="font-semibold text-zinc-900 dark:text-white">
                  თემები
                </h2>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                <nav className="p-2">
                  {technology.topics.map((topic, index) => {
                    const isSelected = selectedTopic?.id === topic.id
                    return (
                      <Link
                        key={topic.id}
                        href={`/learn/${technologyId}?topic=${topic.id}`}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium truncate ${
                              isSelected ? '' : 'text-zinc-900 dark:text-white'
                            }`}
                          >
                            {topic.name}
                          </p>
                          {topic.duration > 0 && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {formatDuration(topic.duration)}
                            </p>
                          )}
                        </div>
                        {topic.theory_video && (
                          <span className="flex-shrink-0 text-zinc-400" title="ვიდეო">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Topic Content - Main Area */}
          <div className="lg:col-span-2">
            {selectedTopic ? (
              <TopicViewer topic={selectedTopic} />
            ) : (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  აირჩიე თემა
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  სიაში აირჩიე თემა სასწავლებლად
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
