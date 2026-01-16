import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Job, Course, Skill, SkillRequirement } from '@/lib/supabase'
import JobApplyButton from '@/components/JobApplyButton'

const JOB_TYPES: Record<string, string> = {
  'full-time': 'სრული განაკვეთი',
  'part-time': 'ნახევარი განაკვეთი',
  internship: 'სტაჟირება',
  freelance: 'ფრილანსი',
}

function cleanHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
}

type JobWithRelations = Job & {
  job_courses?: { course_id: string; courses: Course }[]
  job_skill_requirements?: { skill_id: string; required_level: number; skills: Skill }[]
}

async function getJob(id: string): Promise<Job | null> {
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
      ),
      job_skill_requirements (
        skill_id,
        required_level,
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

  // Transform job_courses to courses array
  const job = data as JobWithRelations
  const courses = job.job_courses?.map((jc) => jc.courses).filter(Boolean) || []

  // Transform job_skill_requirements to skill_requirements array
  const skill_requirements: SkillRequirement[] = job.job_skill_requirements?.map((jsr) => ({
    skill_id: jsr.skill_id,
    required_level: jsr.required_level,
    skill: jsr.skills,
  })).filter(Boolean) || []

  const { job_courses: _, job_skill_requirements: __, ...jobWithoutJunction } = job
  return { ...jobWithoutJunction, courses, skill_requirements }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          ← უკან
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-700">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {job.title}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 font-medium">
            {job.company}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {job.location && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                📍 {job.location}
              </span>
            )}
            {job.type && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                🕐 {JOB_TYPES[job.type] || job.type}
              </span>
            )}
            {job.salary && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                💰 {job.salary}
              </span>
            )}
            {job.open_positions && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                {job.open_positions === 1 ? '👤' : '👥'} {job.open_positions} ვაკანტური ადგილი
              </span>
            )}
            {job.courses && job.courses.length > 0 && job.courses.map((course) => (
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
          {job.description && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                აღწერა
              </h2>
              <div
                className="text-zinc-600 dark:text-zinc-400 prose prose-zinc dark:prose-invert max-w-none [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: cleanHtml(job.description) }}
              />
            </div>
          )}

          {job.requirements && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                მოთხოვნები
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Skill Requirements Section */}
          {job.skill_requirements && job.skill_requirements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                საჭირო უნარები
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skill_requirements.map((sr) => (
                  <span
                    key={sr.skill_id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                  >
                    {sr.skill.icon && <span>{sr.skill.icon}</span>}
                    {sr.skill.name}
                    <span className="ml-1 px-1.5 py-0.5 bg-orange-200 dark:bg-orange-800 rounded text-xs font-medium">
                      Lv.{sr.required_level}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Section */}
          <JobApplyButton
            jobId={job.id}
            skillRequirements={job.skill_requirements || []}
            contactEmail={job.contact_email}
            contactPhone={job.contact_phone}
          />
        </div>
      </div>
    </main>
  )
}
