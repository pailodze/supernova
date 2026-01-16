import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxkiziokykfohghptojs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4a2l6aW9reWtmb2hnaHB0b2pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA1MzAzNywiZXhwIjoyMDgxNjI5MDM3fQ.jpx16julQ-2MO07b3wvwy3ylaBrKP_nM3LKrorfqQrE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeGroups() {
  const { data, error } = await supabase
    .from('students')
    .select('group_name, profession')

  if (error) {
    console.error('Error:', error)
    return
  }

  // Count group names
  const groupCounts = {}
  const professionCounts = {}

  data.forEach(student => {
    const group = student.group_name || 'null'
    const profession = student.profession || 'null'

    groupCounts[group] = (groupCounts[group] || 0) + 1
    professionCounts[profession] = (professionCounts[profession] || 0) + 1
  })

  console.log('\n=== GROUP NAMES (sorted by count) ===\n')
  Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`${count.toString().padStart(4)} - ${name}`)
    })

  console.log('\n=== PROFESSIONS (sorted by count) ===\n')
  Object.entries(professionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`${count.toString().padStart(4)} - ${name}`)
    })
}

analyzeGroups()
