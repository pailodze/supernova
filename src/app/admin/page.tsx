'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  name: string
  phone: string
  personal_id: string | null
  email: string | null
  status: string | null
  group_name: string | null
  intake: string | null
  birth_date: string | null
  profession: string | null
  attendance_type: string | null
  bank: string | null
  payment_method: string | null
  debt: number | null
  paid: number | null
  total_amount: number | null
  next_payment: string | null
  payer: string | null
  personal_info: string | null
  comment: string | null
  source: string | null
  discord: string | null
  contract: string | null
  parent_phone: string | null
  parent_name: string | null
  sales_manager: string | null
  coins: number | null
  is_admin: boolean
  course_ids?: string[]
}

type Course = {
  id: string
  name: string
  slug: string
}

type StudentListItem = {
  id: string
  name: string
  phone: string
  email: string | null
  group_name: string | null
  is_admin: boolean
}

const emptyFormData = {
  name: '',
  phone: '',
  personal_id: '',
  email: '',
  status: '',
  group_name: '',
  intake: '',
  birth_date: '',
  profession: '',
  attendance_type: '',
  bank: '',
  payment_method: '',
  debt: '',
  paid: '',
  total_amount: '',
  next_payment: '',
  payer: '',
  personal_info: '',
  comment: '',
  source: '',
  discord: '',
  contract: '',
  parent_phone: '',
  parent_name: '',
  sales_manager: '',
  coins: '',
  is_admin: false,
  course_ids: [] as string[],
}

export default function AdminPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentListItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState(emptyFormData)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetchStudents()
    fetchCourses()
  }, [search])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()
      setCourses(data.courses || [])
    } catch {
      console.error('Failed to fetch courses')
    }
  }

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/admin/students?${params}`)

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data.students || [])
    } catch (err) {
      console.error('Failed to fetch students:', err)
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDetails = async (id: string) => {
    setLoadingStudent(true)
    try {
      const response = await fetch(`/api/admin/students?id=${id}`)
      if (!response.ok) throw new Error('Failed to fetch student')
      const data = await response.json()
      return data.student as Student
    } catch (err) {
      console.error('Failed to fetch student details:', err)
      return null
    } finally {
      setLoadingStudent(false)
    }
  }

  const handleImpersonate = async (student: StudentListItem) => {
    setImpersonating(student.id)
    setError('')

    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to impersonate')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setImpersonating(null)
    }
  }

  const handleAddNew = () => {
    setEditingStudent(null)
    setFormData(emptyFormData)
    setFormError('')
    setShowForm(true)
  }

  const handleEdit = async (student: StudentListItem) => {
    const fullStudent = await fetchStudentDetails(student.id)
    if (!fullStudent) {
      setError('Failed to load student details')
      return
    }

    setEditingStudent(fullStudent)
    setFormData({
      name: fullStudent.name || '',
      phone: fullStudent.phone || '',
      personal_id: fullStudent.personal_id || '',
      email: fullStudent.email || '',
      status: fullStudent.status || '',
      group_name: fullStudent.group_name || '',
      intake: fullStudent.intake || '',
      birth_date: fullStudent.birth_date || '',
      profession: fullStudent.profession || '',
      attendance_type: fullStudent.attendance_type || '',
      bank: fullStudent.bank || '',
      payment_method: fullStudent.payment_method || '',
      debt: fullStudent.debt?.toString() || '',
      paid: fullStudent.paid?.toString() || '',
      total_amount: fullStudent.total_amount?.toString() || '',
      next_payment: fullStudent.next_payment || '',
      payer: fullStudent.payer || '',
      personal_info: fullStudent.personal_info || '',
      comment: fullStudent.comment || '',
      source: fullStudent.source || '',
      discord: fullStudent.discord || '',
      contract: fullStudent.contract || '',
      parent_phone: fullStudent.parent_phone || '',
      parent_name: fullStudent.parent_name || '',
      sales_manager: fullStudent.sales_manager || '',
      coins: fullStudent.coins?.toString() || '',
      is_admin: fullStudent.is_admin || false,
      course_ids: fullStudent.course_ids || [],
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        personal_id: formData.personal_id.trim() || null,
        email: formData.email.trim() || null,
        status: formData.status.trim() || null,
        group_name: formData.group_name.trim() || null,
        intake: formData.intake.trim() || null,
        birth_date: formData.birth_date || null,
        profession: formData.profession.trim() || null,
        attendance_type: formData.attendance_type.trim() || null,
        bank: formData.bank.trim() || null,
        payment_method: formData.payment_method.trim() || null,
        debt: formData.debt ? parseFloat(formData.debt) : null,
        paid: formData.paid ? parseFloat(formData.paid) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        next_payment: formData.next_payment || null,
        payer: formData.payer.trim() || null,
        personal_info: formData.personal_info.trim() || null,
        comment: formData.comment.trim() || null,
        source: formData.source.trim() || null,
        discord: formData.discord.trim() || null,
        contract: formData.contract.trim() || null,
        parent_phone: formData.parent_phone.trim() || null,
        parent_name: formData.parent_name.trim() || null,
        sales_manager: formData.sales_manager.trim() || null,
        coins: formData.coins ? parseInt(formData.coins) : null,
        is_admin: formData.is_admin,
        course_ids: formData.course_ids,
      }

      if (editingStudent) {
        payload.id = editingStudent.id
      }

      const response = await fetch('/api/admin/students', {
        method: editingStudent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setFormError(data.error || 'Failed to save student')
        return
      }

      await fetchStudents()
      setShowForm(false)
      setEditingStudent(null)
      setFormData(emptyFormData)
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            სტუდენტების მართვა
          </h2>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            + ახალი სტუდენტი
          </button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
          მოძებნეთ სტუდენტი რედაქტირებისთვის ან შესვლისთვის მათი სახელით.
        </p>

        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="მოძებნეთ სახელით, ტელეფონით ან ელ-ფოსტით..."
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Students List */}
        {loading ? (
          <div className="text-center py-8 text-zinc-500">იტვირთება...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            {search ? 'სტუდენტები არ მოიძებნა' : 'სტუდენტები არ არის'}
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {student.name || 'უსახელო'}
                    </span>
                    {student.is_admin && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                        ადმინი
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {student.phone}
                    {student.email && ` • ${student.email}`}
                    {student.group_name && ` • ${student.group_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(student)}
                    disabled={loadingStudent}
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg transition"
                  >
                    რედაქტირება
                  </button>
                  <button
                    onClick={() => handleImpersonate(student)}
                    disabled={impersonating === student.id}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition"
                  >
                    {impersonating === student.id ? '...' : 'შესვლა'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingStudent ? 'სტუდენტის რედაქტირება' : 'ახალი სტუდენტი'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">ძირითადი ინფორმაცია</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      სახელი *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ტელეფონი *
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      პირადი ნომერი
                    </label>
                    <input
                      type="text"
                      value={formData.personal_id}
                      onChange={(e) => setFormData({ ...formData, personal_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ელ-ფოსტა
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      დაბადების თარიღი
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Discord
                    </label>
                    <input
                      type="text"
                      value={formData.discord}
                      onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">სასწავლო ინფორმაცია</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Courses Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      კურსები
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {courses.map((course) => {
                        const isSelected = formData.course_ids.includes(course.id)
                        return (
                          <button
                            key={course.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                course_ids: isSelected
                                  ? prev.course_ids.filter(id => id !== course.id)
                                  : [...prev.course_ids, course.id]
                              }))
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                            }`}
                          >
                            {course.name}
                          </button>
                        )
                      })}
                    </div>
                    {courses.length === 0 && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">კურსები არ არის</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ჯგუფი
                    </label>
                    <input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ნაკადი
                    </label>
                    <input
                      type="text"
                      value={formData.intake}
                      onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      პროფესია
                    </label>
                    <input
                      type="text"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      დასწრების ტიპი
                    </label>
                    <input
                      type="text"
                      value={formData.attendance_type}
                      onChange={(e) => setFormData({ ...formData, attendance_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      სტატუსი
                    </label>
                    <input
                      type="text"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ქოინები
                    </label>
                    <input
                      type="number"
                      value={formData.coins}
                      onChange={(e) => setFormData({ ...formData, coins: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">გადახდის ინფორმაცია</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      სრული თანხა
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      გადახდილი
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.paid}
                      onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      დავალიანება
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.debt}
                      onChange={(e) => setFormData({ ...formData, debt: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      გადახდის მეთოდი
                    </label>
                    <input
                      type="text"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      ბანკი
                    </label>
                    <input
                      type="text"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      შემდეგი გადახდა
                    </label>
                    <input
                      type="date"
                      value={formData.next_payment}
                      onChange={(e) => setFormData({ ...formData, next_payment: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      გადამხდელი
                    </label>
                    <input
                      type="text"
                      value={formData.payer}
                      onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      კონტრაქტი
                    </label>
                    <input
                      type="text"
                      value={formData.contract}
                      onChange={(e) => setFormData({ ...formData, contract: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Parent/Guardian Info */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">მშობლის ინფორმაცია</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      მშობლის სახელი
                    </label>
                    <input
                      type="text"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      მშობლის ტელეფონი
                    </label>
                    <input
                      type="text"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Other Info */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">დამატებითი ინფორმაცია</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      წყარო
                    </label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      გაყიდვების მენეჯერი
                    </label>
                    <input
                      type="text"
                      value={formData.sales_manager}
                      onChange={(e) => setFormData({ ...formData, sales_manager: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      პირადი ინფორმაცია
                    </label>
                    <textarea
                      value={formData.personal_info}
                      onChange={(e) => setFormData({ ...formData, personal_info: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      კომენტარი
                    </label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_admin" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ადმინისტრატორი
                </label>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingStudent(null)
                    setFormData(emptyFormData)
                    setFormError('')
                  }}
                  className="px-4 py-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium transition"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                >
                  {submitting ? 'იტვირთება...' : editingStudent ? 'შენახვა' : 'დამატება'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
