import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing')
  console.error('Key:', supabaseKey ? 'set' : 'missing')
  process.exit(1)
}

console.log('Using Supabase URL:', supabaseUrl)
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon')

const supabase = createClient(supabaseUrl, supabaseKey)

// MySQL dump data extracted from realnovatori.sql

// Courses from MySQL - only Computer Science, Design, and Marketing
const mysqlCourses = [
  { id: 1, name: 'კომპიუტერული მეცნიერება', abbr: 'CS', isMain: '1' },
  { id: 2, name: 'ციფრული დიზაინი', abbr: 'D', isMain: '1' },
  { id: 10, name: 'ციფრული მარკეტინგი', abbr: 'DM', isMain: '1' },
]

// Allowed course IDs for filtering technologies
const allowedCourseIds = new Set([1, 2, 10])

// Technologies from MySQL - only for allowed courses (1, 2, 10)
const allMysqlTechnologies = [
  { id: 1, name: 'შესავალი', courseId: 1, abbr: 'შეს' },
  { id: 2, name: 'შესავალი', courseId: 2, abbr: 'შეს' },
  { id: 3, name: 'Javascript', courseId: 1, abbr: 'JS' },
  { id: 4, name: 'HTML', courseId: 1, abbr: 'HTML' },
  { id: 5, name: 'CSS', courseId: 1, abbr: 'CSS' },
  { id: 6, name: 'GIT', courseId: 1, abbr: 'GIT' },
  { id: 8, name: 'ალგორითმები', courseId: 1, abbr: 'ALGO' },
  { id: 20, name: 'CLI', courseId: 1, abbr: 'CLI' },
  { id: 34, name: 'React', courseId: 1, abbr: 'REACT' },
  { id: 35, name: 'NestJS', courseId: 1, abbr: 'NEST' },
  { id: 32, name: 'შესავალი', courseId: 10, abbr: 'შეს' },
]

// Filter technologies by allowed courses
const mysqlTechnologies = allMysqlTechnologies.filter(t => allowedCourseIds.has(t.courseId))

// Load topics from JSON file
const topicsPath = path.join(__dirname, 'topics-data.json')
const mysqlTopics: { id: number; name: string; theoryVideo: string | null; miroLink: string | null; technologyId: number }[] = JSON.parse(fs.readFileSync(topicsPath, 'utf8'))

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u10D0-\u10FF]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function importData() {
  console.log('Starting data import...')
  console.log(`Loaded ${mysqlTopics.length} topics from JSON file`)

  // Step 1: Clear existing data
  console.log('\n1. Clearing existing data...')

  // Delete in correct order due to foreign keys
  const { error: topicsDeleteError } = await supabase.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (topicsDeleteError) {
    console.error('Error deleting topics:', topicsDeleteError)
  } else {
    console.log('   - Topics cleared')
  }

  const { error: techDeleteError } = await supabase.from('technologies').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (techDeleteError) {
    console.error('Error deleting technologies:', techDeleteError)
  } else {
    console.log('   - Technologies cleared')
  }

  const { error: coursesDeleteError } = await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (coursesDeleteError) {
    console.error('Error deleting courses:', coursesDeleteError)
  } else {
    console.log('   - Courses cleared')
  }

  // Step 2: Insert courses
  console.log('\n2. Inserting courses...')
  const courseIdMap = new Map<number, string>()

  for (const course of mysqlCourses) {
    const slug = generateSlug(course.name)
    const { data, error } = await supabase
      .from('courses')
      .insert({ name: course.name, slug })
      .select()
      .single()

    if (error) {
      console.error(`   Error inserting course ${course.name}:`, error)
    } else {
      courseIdMap.set(course.id, data.id)
      console.log(`   - ${course.name} (${course.id} -> ${data.id})`)
    }
  }

  // Step 3: Insert technologies
  console.log('\n3. Inserting technologies...')
  const techIdMap = new Map<number, string>()

  for (let i = 0; i < mysqlTechnologies.length; i++) {
    const tech = mysqlTechnologies[i]
    const courseId = courseIdMap.get(tech.courseId)

    if (!courseId) {
      console.error(`   Skipping technology ${tech.name} - course ${tech.courseId} not found`)
      continue
    }

    const slug = generateSlug(tech.name) + '-' + tech.id // Make unique since there are duplicate names
    const { data, error } = await supabase
      .from('technologies')
      .insert({
        course_id: courseId,
        name: tech.name,
        slug,
        description: null,
        icon: null,
        order_index: i,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error(`   Error inserting technology ${tech.name}:`, error)
    } else {
      techIdMap.set(tech.id, data.id)
      console.log(`   - ${tech.name} (${tech.id} -> ${data.id})`)
    }
  }

  // Step 4: Insert topics in batches
  console.log('\n4. Inserting topics...')

  // Group topics by technology for proper order_index
  const topicsByTech = new Map<number, typeof mysqlTopics>()
  for (const topic of mysqlTopics) {
    const existing = topicsByTech.get(topic.technologyId) || []
    existing.push(topic)
    topicsByTech.set(topic.technologyId, existing)
  }

  let insertedCount = 0
  let skippedCount = 0

  for (const [techMysqlId, techTopics] of topicsByTech) {
    const technologyId = techIdMap.get(techMysqlId)

    if (!technologyId) {
      console.log(`   Skipping ${techTopics.length} topics - technology ${techMysqlId} not found`)
      skippedCount += techTopics.length
      continue
    }

    // Insert topics for this technology in batches
    const batchSize = 50
    for (let i = 0; i < techTopics.length; i += batchSize) {
      const batch = techTopics.slice(i, i + batchSize)
      const topicsToInsert = batch.map((topic, idx) => ({
        technology_id: technologyId,
        name: topic.name,
        slug: generateSlug(topic.name) + '-' + topic.id,
        description: null,
        duration: 0,
        theory_video: topic.theoryVideo,
        miro_link: topic.miroLink,
        order_index: i + idx,
        is_active: true,
      }))

      const { error } = await supabase.from('topics').insert(topicsToInsert)

      if (error) {
        console.error(`   Error inserting batch for technology ${techMysqlId}:`, error)
      } else {
        insertedCount += batch.length
        process.stdout.write(`\r   Inserted ${insertedCount} topics...`)
      }
    }
  }

  console.log(`\n   Total inserted: ${insertedCount}, skipped: ${skippedCount}`)
  console.log('\nImport complete!')
}

importData().catch(console.error)
