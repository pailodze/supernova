import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapping of group_name to course name
const groupToCourseMap: Record<string, string> = {
  'კომპიუტერული მეცნიერება': 'კომპიუტერული მეცნიერება',
  'ციფრული დიზაინი': 'ციფრული დიზაინი',
  'ციფრული მარკეტინგი': 'ციფრული მარკეტინგი',
  'React Senior': 'კომპიუტერული მეცნიერება',
  'React Minor': 'კომპიუტერული მეცნიერება',
  'UI/UX': 'ციფრული დიზაინი',
  'Wordpress': 'კომპიუტერული მეცნიერება',
}

async function assignCourses() {
  console.log('Starting course assignment...')

  // Step 1: Get all courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, name')

  if (coursesError || !courses) {
    console.error('Error fetching courses:', coursesError)
    return
  }

  console.log('Available courses:', courses.map(c => c.name))

  // Create a map of course name to ID
  const courseNameToId = new Map<string, string>()
  for (const course of courses) {
    courseNameToId.set(course.name, course.id)
  }

  // Step 2: Get all students with their group_name
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, group_name')

  if (studentsError || !students) {
    console.error('Error fetching students:', studentsError)
    return
  }

  console.log(`Found ${students.length} students`)

  // Step 3: Clear existing student_courses
  console.log('\nClearing existing student_courses...')
  const { error: deleteError } = await supabase
    .from('student_courses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.error('Error clearing student_courses:', deleteError)
    return
  }
  console.log('Cleared existing assignments')

  // Step 4: Assign courses based on group_name
  console.log('\nAssigning courses to students...')

  const assignments: { student_id: string; course_id: string }[] = []
  let skipped = 0

  for (const student of students) {
    const groupName = student.group_name
    if (!groupName) {
      skipped++
      continue
    }

    const courseName = groupToCourseMap[groupName]
    if (!courseName) {
      console.log(`   No mapping for group: ${groupName}`)
      skipped++
      continue
    }

    const courseId = courseNameToId.get(courseName)
    if (!courseId) {
      console.log(`   Course not found: ${courseName}`)
      skipped++
      continue
    }

    assignments.push({
      student_id: student.id,
      course_id: courseId,
    })
  }

  // Insert in batches
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < assignments.length; i += batchSize) {
    const batch = assignments.slice(i, i + batchSize)
    const { error } = await supabase.from('student_courses').insert(batch)

    if (error) {
      console.error('Error inserting batch:', error)
    } else {
      inserted += batch.length
      process.stdout.write(`\r   Inserted ${inserted} / ${assignments.length} assignments...`)
    }
  }

  console.log(`\n\nAssignment complete!`)
  console.log(`   Total students: ${students.length}`)
  console.log(`   Assigned: ${inserted}`)
  console.log(`   Skipped: ${skipped}`)
}

assignCourses().catch(console.error)
