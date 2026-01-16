import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxkiziokykfohghptojs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4a2l6aW9reWtmb2hnaHB0b2pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MzAzNywiZXhwIjoyMDgxNjI5MDM3fQ.jpx16julQ-2MO07b3wvwy3ylaBrKP_nM3LKrorfqQrE'

const supabase = createClient(supabaseUrl, supabaseKey)

// Map group_name to course slug
function mapGroupToCourseSlug(groupName) {
  if (!groupName) return null

  const name = groupName.toLowerCase()

  // Computer Science related
  if (
    name.includes('კომპიუტერული მეცნიერება') ||
    name.includes('react') ||
    name.includes('wordpress') ||
    name.includes('რობოტიკა')
  ) {
    return 'computer-science'
  }

  // Design related
  if (
    name.includes('დიზაინ') ||
    name.includes('ui/ux') ||
    name.includes('ux') ||
    name.includes('design')
  ) {
    return 'design'
  }

  // Marketing related
  if (
    name.includes('მარკეტინგ') ||
    name.includes('marketing')
  ) {
    return 'marketing'
  }

  return null
}

async function migrate() {
  console.log('Starting migration...\n')

  // Step 1: Get all courses
  console.log('Fetching courses...')
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')

  if (coursesError) {
    console.error('Error fetching courses:', coursesError)
    console.log('\nPlease run the SQL schema first:')
    console.log('https://supabase.com/dashboard/project/sxkiziokykfohghptojs/sql')
    console.log('\nSQL file: scripts/create-courses-schema.sql')
    return
  }

  if (!courses || courses.length === 0) {
    console.error('No courses found. Please run the SQL schema first.')
    return
  }

  console.log(`Found ${courses.length} courses:`)
  courses.forEach(c => console.log(`  - ${c.name} (${c.slug})`))

  // Create a map of course slug to course id
  const courseSlugMap = {}
  courses.forEach(course => {
    courseSlugMap[course.slug] = course.id
  })

  // Step 2: Get all students with their group_name
  console.log('\nFetching students...')
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, group_name')

  if (studentsError) {
    console.error('Error fetching students:', studentsError)
    return
  }

  console.log(`Found ${students.length} students`)

  // Step 3: Create student_courses relations
  console.log('\nCreating student_courses relations...')

  const relations = []
  const stats = { 'computer-science': 0, 'design': 0, 'marketing': 0, 'unmatched': 0 }

  students.forEach(student => {
    const groupName = student.group_name
    const courseSlug = mapGroupToCourseSlug(groupName)

    if (courseSlug && courseSlugMap[courseSlug]) {
      relations.push({
        student_id: student.id,
        course_id: courseSlugMap[courseSlug]
      })
      stats[courseSlug]++
    } else if (groupName) {
      stats['unmatched']++
      // Log unmatched for debugging
      // console.log(`Unmatched group: ${groupName}`)
    }
  })

  console.log('\nMapping stats:')
  console.log(`  - Computer Science: ${stats['computer-science']}`)
  console.log(`  - Design: ${stats['design']}`)
  console.log(`  - Marketing: ${stats['marketing']}`)
  console.log(`  - Unmatched: ${stats['unmatched']}`)

  if (relations.length === 0) {
    console.log('\nNo relations to insert')
    return
  }

  // Insert in batches of 100
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < relations.length; i += batchSize) {
    const batch = relations.slice(i, i + batchSize)
    const { error } = await supabase
      .from('student_courses')
      .upsert(batch, { onConflict: 'student_id,course_id' })

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
    } else {
      inserted += batch.length
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${relations.length}`)
    }
  }

  console.log(`\nMigration complete! Inserted ${inserted} student_courses relations`)
}

migrate()
