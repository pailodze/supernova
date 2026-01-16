import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxkiziokykfohghptojs.supabase.co'
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function addCategoryColumn() {
  // First check if column exists by trying to select it
  const { data, error } = await supabase
    .from('jobs')
    .select('category')
    .limit(1)

  if (error && error.code === '42703') {
    console.log('Category column does not exist. Please run this SQL in Supabase dashboard:')
    console.log('')
    console.log('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category TEXT;')
    console.log('')
    console.log('Dashboard URL: https://supabase.com/dashboard/project/sxkiziokykfohghptojs/sql')
  } else if (error) {
    console.error('Error checking column:', error)
  } else {
    console.log('Category column already exists!')
  }
}

addCategoryColumn()
