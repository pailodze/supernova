import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxkiziokykfohghptojs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4a2l6aW9reWtmb2hnaHB0b2pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MzAzNywiZXhwIjoyMDgxNjI5MDM3fQ.jpx16julQ-2MO07b3wvwy3ylaBrKP_nM3LKrorfqQrE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndAddColumns() {
  console.log('Checking coins system columns...\n')

  // Check if coins column exists in students by trying to select it
  const { data: studentTest, error: studentError } = await supabase
    .from('students')
    .select('coins')
    .limit(1)

  if (studentError && studentError.code === '42703') {
    console.log('Students coins column does not exist.')
    console.log('Please run this SQL in Supabase dashboard:')
    console.log('ALTER TABLE students ADD COLUMN coins INTEGER DEFAULT 0;')
    console.log('')
  } else if (studentError) {
    console.error('Error checking students table:', studentError)
  } else {
    console.log('✓ Students coins column exists')
  }

  // Check if coins_required column exists in jobs
  const { data: jobTest, error: jobError } = await supabase
    .from('jobs')
    .select('coins_required')
    .limit(1)

  if (jobError && jobError.code === '42703') {
    console.log('Jobs coins_required column does not exist.')
    console.log('Please run this SQL in Supabase dashboard:')
    console.log('ALTER TABLE jobs ADD COLUMN coins_required INTEGER DEFAULT 0;')
    console.log('')
  } else if (jobError) {
    console.error('Error checking jobs table:', jobError)
  } else {
    console.log('✓ Jobs coins_required column exists')
  }

  // Check if job_applications table exists
  const { data: appTest, error: appError } = await supabase
    .from('job_applications')
    .select('id')
    .limit(1)

  if (appError && appError.code === '42P01') {
    console.log('\nJob_applications table does not exist.')
    console.log('Please run the SQL in scripts/add-coins-system.sql in Supabase dashboard')
  } else if (appError && appError.message) {
    console.error('Error checking job_applications table:', appError)
  } else {
    console.log('✓ Job_applications table exists')
  }

  // If coins column exists, give starting coins to students with 0 coins
  if (!studentError || studentError.code !== '42703') {
    console.log('\nUpdating students with 0 coins to 100...')
    const { data, error } = await supabase
      .from('students')
      .update({ coins: 100 })
      .or('coins.is.null,coins.eq.0')
      .select('id')

    if (error) {
      console.error('Error updating coins:', error)
    } else {
      console.log(`✓ Updated ${data?.length || 0} students with 100 starting coins`)
    }
  }
}

checkAndAddColumns()
