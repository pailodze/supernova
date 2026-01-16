import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = 'https://sxkiziokykfohghptojs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4a2l6aW9reWtmb2hnaHB0b2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTMwMzcsImV4cCI6MjA4MTYyOTAzN30.sftKZm1ptqbagk6sbwMS2lwsnV5DhmBlW9NlRzxDfHE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface RawStudent {
  Name: string
  'სტატუსი': string
  'გაყიდვის მენეჯერი': string
  'ჯგუფი': string
  'მიღება': string
  'პირადი ნომერი': string
  'ტელეფონი': string
  'დაბ. თარიღი': string | null
  'ასაკი': string
  'რეგისტრაციის თარიღი': string
  'პროფესია': string | null
  'დასწრების ტიპი': string
  'ბანკი': string
  'გადახდის მეთოდი': string
  'ვალი': string
  'დაფარა': string
  'სრული თანხა': string
  'მომდევნო გადახდა': string
  'ჩამრიცხველი': string
  'პირადი ინფორმაცია': string
  'კომენტარი': string
  'ელ-ფოსტა': string
  'დაფარვა': string
  'პრობლემატური': string | null
  'წყარო': string
  Discord: string
  'კონტრაქტი': string
  'ანი': string
  'დანართი': string | null
  'სხვა საკონტაქტო': string | null
  'მშობელის ნომერი': string | null
  'მშობლის სახელი': string | null
  'მშობელთან საუბარი': string | null
  'მშობლის კონტროლი': string | null
  Happiness: string | null
  'პრობლემა': string | null
}

function cleanPhone(phone: string | null): string {
  if (!phone) return ''
  // Remove any non-digit characters and trim
  return phone.replace(/\D/g, '').trim()
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  // Check if it's a valid date format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return null
  return dateStr
}

function parseNumber(numStr: string | null): number {
  if (!numStr) return 0
  const num = parseFloat(numStr.replace(/[^\d.-]/g, ''))
  return isNaN(num) ? 0 : num
}

function mapStudent(raw: RawStudent) {
  const phone = cleanPhone(raw['ტელეფონი'])

  return {
    name: raw.Name || '',
    phone: phone,
    personal_id: raw['პირადი ნომერი'] || '',
    email: raw['ელ-ფოსტა'] || '',
    status: raw['სტატუსი'] || '',
    group_name: raw['ჯგუფი'] || '',
    intake: raw['მიღება'] || '',
    birth_date: parseDate(raw['დაბ. თარიღი']),
    age: parseInt(raw['ასაკი']) || null,
    registration_date: parseDate(raw['რეგისტრაციის თარიღი']),
    profession: raw['პროფესია'] || '',
    attendance_type: raw['დასწრების ტიპი'] || '',
    bank: raw['ბანკი'] || '',
    payment_method: raw['გადახდის მეთოდი'] || '',
    debt: parseNumber(raw['ვალი']),
    paid: parseNumber(raw['დაფარა']),
    total_amount: parseNumber(raw['სრული თანხა']),
    next_payment: parseDate(raw['მომდევნო გადახდა']),
    payer: raw['ჩამრიცხველი'] || '',
    personal_info: raw['პირადი ინფორმაცია'] || '',
    comment: raw['კომენტარი'] || '',
    source: raw['წყარო'] || '',
    discord: raw.Discord || '',
    contract: raw['კონტრაქტი'] || '',
    parent_phone: cleanPhone(raw['მშობელის ნომერი']),
    parent_name: raw['მშობლის სახელი'] || '',
    sales_manager: raw['გაყიდვის მენეჯერი'] || '',
    coverage: raw['დაფარვა'] || '',
    problematic: raw['პრობლემატური'] || '',
    ani: raw['ანი'] || '',
    attachment: raw['დანართი'] || '',
    other_contact: raw['სხვა საკონტაქტო'] || '',
    parent_conversation: raw['მშობელთან საუბარი'] || '',
    parent_control: raw['მშობლის კონტროლი'] || '',
    happiness: raw.Happiness || '',
    problem: raw['პრობლემა'] || '',
  }
}

async function importStudents() {
  console.log('Reading students.json...')

  const filePath = path.join(__dirname, '..', 'students.json')
  const rawData = fs.readFileSync(filePath, 'utf-8')
  const students: RawStudent[] = JSON.parse(rawData)

  console.log(`Found ${students.length} students`)

  // Map and clean data
  const mappedStudents = students
    .map(mapStudent)
    .filter(s => s.phone) // Only include students with phone numbers

  console.log(`${mappedStudents.length} students have valid phone numbers`)

  // Remove duplicates by phone (keep first occurrence)
  const seenPhones = new Set<string>()
  const uniqueStudents = mappedStudents.filter(s => {
    if (seenPhones.has(s.phone)) {
      return false
    }
    seenPhones.add(s.phone)
    return true
  })

  console.log(`${uniqueStudents.length} unique students (by phone)`)

  // Insert in batches of 100
  const batchSize = 100
  let inserted = 0
  let errors = 0

  for (let i = 0; i < uniqueStudents.length; i += batchSize) {
    const batch = uniqueStudents.slice(i, i + batchSize)

    const { error } = await supabase
      .from('students')
      .upsert(batch, { onConflict: 'phone' })

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      console.log(`Inserted batch ${i / batchSize + 1} (${inserted}/${uniqueStudents.length})`)
    }
  }

  console.log('\n--- Import Complete ---')
  console.log(`Successfully inserted: ${inserted}`)
  console.log(`Errors: ${errors}`)
}

importStudents().catch(console.error)
