import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Task, Course, Skill, SkillReward } from '@/lib/supabase'
import TaskApplyButton from '@/components/TaskApplyButton'

type TaskWithRelations = Task & {
  task_courses?: { course_id: string; courses: Course }[]
  task_skill_rewards?: { skill_id: string; level_reward: number; skills: Skill }[]
}

async function getTask(id: string): Promise<Task | null> {
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
      ),
      task_skill_rewards (
        skill_id,
        level_reward,
        skills (
          id,
          name,
          icon
        )
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // Transform task_courses to courses array
  const task = data as TaskWithRelations
  const courses = task.task_courses?.map((tc) => tc.courses).filter(Boolean) || []

  // Transform task_skill_rewards to skill_rewards array
  const skill_rewards: SkillReward[] = task.task_skill_rewards?.map((tsr) => ({
    skill_id: tsr.skill_id,
    level_reward: tsr.level_reward,
    skill: tsr.skills,
  })).filter(Boolean) || []

  const { task_courses: _, task_skill_rewards: __, ...taskWithoutJunction } = task
  return { ...taskWithoutJunction, courses, skill_rewards }
}

const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

function formatDeadline(deadline: string | null) {
  if (!deadline) return null

  const date = new Date(deadline)
  const now = new Date()
  const isPast = date < now

  // Calculate time difference
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

  // Format date: "25 დეკემბერი, 14:00"
  const day = date.getDate()
  const month = GEORGIAN_MONTHS[date.getMonth()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  let text = `${day} ${month}, ${hours}:${minutes}`

  // Add relative time for upcoming deadlines
  if (!isPast) {
    if (diffHours < 24) {
      text += ` (${diffHours} საათში)`
    } else if (diffDays <= 7) {
      text += ` (${diffDays} დღეში)`
    }
  }

  return {
    text,
    isPast,
  }
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  const deadlineInfo = formatDeadline(task.deadline)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          href="/dashboard?tab=tasks"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          ← უკან
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-700">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            {task.title}
          </h1>

          <div className="flex flex-wrap gap-2">
            {/* Skill Rewards */}
            {task.skill_rewards && task.skill_rewards.length > 0 && task.skill_rewards.map((sr) => (
              <span
                key={sr.skill_id}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
              >
                {sr.skill.icon && <span>{sr.skill.icon}</span>}
                {sr.skill.name}
                <span className="ml-1 px-1.5 py-0.5 bg-cyan-200 dark:bg-cyan-800 rounded text-xs font-medium">
                  +{sr.level_reward} Lv
                </span>
              </span>
            ))}

            {deadlineInfo ? (
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                deadlineInfo.isPast
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}>
                ⏰ {deadlineInfo.text}
                {deadlineInfo.isPast && ' (ვადაგასული)'}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                ⏰ უვადო
              </span>
            )}

            {task.courses && task.courses.length > 0 && task.courses.map((course) => (
              <span
                key={course.id}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                {course.name}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {task.description && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                აღწერა
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Apply Section */}
          <TaskApplyButton
            taskId={task.id}
            skillRewards={task.skill_rewards || []}
            deadline={task.deadline}
          />
        </div>
      </div>
    </main>
  )
}
