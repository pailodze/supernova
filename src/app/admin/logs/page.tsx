'use client'

import { useState, useEffect, useCallback } from 'react'

interface ApiLog {
  id: string
  timestamp: string
  method: string
  path: string
  status_code: number
  duration_ms: number
  user_id: string | null
  ip_address: string | null
  user_agent: string | null
  error_message: string | null
  request_body: Record<string, unknown> | null
  students?: {
    id: string
    name: string
    phone: string
  } | null
}

interface LoginAttempt {
  id: string
  phone: string
  first_attempt_at: string
  last_attempt_at: string
  attempt_count: number
  student: {
    id: string
    name: string
    phone: string
  } | null
  is_registered: boolean
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  redirect: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  client_error: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  server_error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function getStatusColor(code: number): string {
  if (code >= 200 && code < 300) return STATUS_COLORS.success
  if (code >= 300 && code < 400) return STATUS_COLORS.redirect
  if (code >= 400 && code < 500) return STATUS_COLORS.client_error
  return STATUS_COLORS.server_error
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('ka-GE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'logins'>('api')

  // API Logs state
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)
  const limit = 50

  // Login attempts state
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [loginAttemptsLoading, setLoginAttemptsLoading] = useState(true)
  const [loginStats, setLoginStats] = useState({ registered: 0, unregistered: 0 })

  // Filters
  const [filters, setFilters] = useState({
    method: '',
    path: '',
    status: '',
    startDate: '',
    endDate: '',
  })

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('offset', (page * limit).toString())

      if (filters.method) params.set('method', filters.method)
      if (filters.path) params.set('path', filters.path)
      if (filters.status) params.set('status', filters.status)
      if (filters.startDate) params.set('start_date', filters.startDate)
      if (filters.endDate) params.set('end_date', filters.endDate)

      const response = await fetch(`/api/logs?${params}`)
      const data = await response.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch {
      console.error('Failed to fetch logs')
    } finally {
      setLogsLoading(false)
    }
  }, [page, filters])

  const fetchLoginAttempts = useCallback(async () => {
    setLoginAttemptsLoading(true)
    try {
      const response = await fetch('/api/login-attempts')
      const data = await response.json()
      setLoginAttempts(data.attempts || [])
      setLoginStats({
        registered: data.registered_count || 0,
        unregistered: data.unregistered_count || 0,
      })
    } catch {
      console.error('Failed to fetch login attempts')
    } finally {
      setLoginAttemptsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'api') {
      fetchLogs()
    } else {
      fetchLoginAttempts()
    }
  }, [activeTab, fetchLogs, fetchLoginAttempts])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0)
  }

  const clearFilters = () => {
    setFilters({
      method: '',
      path: '',
      status: '',
      startDate: '',
      endDate: '',
    })
    setPage(0)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'api'
              ? 'bg-purple-600 text-white'
              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
        >
          API ლოგები
          <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded">
            {total}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('logins')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'logins'
              ? 'bg-purple-600 text-white'
              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
          }`}
        >
          შესვლის მცდელობები
          <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded">
            {loginAttempts.length}
          </span>
        </button>
      </div>

      {activeTab === 'api' ? (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  მეთოდი
                </label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ყველა</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Path
                </label>
                <input
                  type="text"
                  value={filters.path}
                  onChange={(e) => handleFilterChange('path', e.target.value)}
                  placeholder="/api/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  სტატუსი
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ყველა</option>
                  <option value="success">წარმატებული (2xx)</option>
                  <option value="error">შეცდომა (4xx, 5xx)</option>
                  <option value="200">200</option>
                  <option value="201">201</option>
                  <option value="400">400</option>
                  <option value="401">401</option>
                  <option value="404">404</option>
                  <option value="500">500</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  დაწყების თარიღი
                </label>
                <input
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  დასრულების თარიღი
                </label>
                <input
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition"
                >
                  გასუფთავება
                </button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow overflow-hidden">
            {logsLoading ? (
              <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                ლოგები არ მოიძებნა
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        დრო
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        მეთოდი
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        Path
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        სტატუსი
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        დრო
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        მომხმარებელი
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              METHOD_COLORS[log.method] || 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {log.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                          {log.path}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(
                              log.status_code
                            )}`}
                          >
                            {log.status_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                          {formatDuration(log.duration_ms)}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {log.students?.name || log.user_id?.slice(0, 8) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  გვერდი {page + 1} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                  >
                    წინა
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                  >
                    შემდეგი
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Login Attempts Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-4">
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {loginAttempts.length}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                სულ უნიკალური ნომერი
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-4">
              <div className="text-2xl font-bold text-green-600">
                {loginStats.registered}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                რეგისტრირებული
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow p-4">
              <div className="text-2xl font-bold text-red-600">
                {loginStats.unregistered}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                არარეგისტრირებული
              </div>
            </div>
          </div>

          {/* Login Attempts Table */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow overflow-hidden">
            {loginAttemptsLoading ? (
              <div className="text-center py-12 text-zinc-500">იტვირთება...</div>
            ) : loginAttempts.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                შესვლის მცდელობები არ მოიძებნა
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-700/50 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        ტელეფონი
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        სტუდენტი
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        სტატუსი
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        მცდელობები
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        პირველი მცდელობა
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                        ბოლო მცდელობა
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {loginAttempts.map((attempt) => (
                      <tr
                        key={attempt.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition"
                      >
                        <td className="px-4 py-3 font-mono text-zinc-900 dark:text-white">
                          {attempt.phone}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {attempt.student?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${
                              attempt.is_registered
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {attempt.is_registered ? 'რეგისტრირებული' : 'არარეგისტრირებული'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                          {attempt.attempt_count || 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                          {attempt.first_attempt_at ? formatDate(attempt.first_attempt_at) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                          {formatDate(attempt.last_attempt_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                ლოგის დეტალები
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    თარიღი/დრო
                  </label>
                  <div className="text-zinc-900 dark:text-white">
                    {formatDate(selectedLog.timestamp)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    ხანგრძლივობა
                  </label>
                  <div className="text-zinc-900 dark:text-white">
                    {formatDuration(selectedLog.duration_ms)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    მეთოდი
                  </label>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      METHOD_COLORS[selectedLog.method] || 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {selectedLog.method}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    სტატუს კოდი
                  </label>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(
                      selectedLog.status_code
                    )}`}
                  >
                    {selectedLog.status_code}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Path
                </label>
                <div className="font-mono text-sm bg-zinc-100 dark:bg-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white">
                  {selectedLog.path}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    მომხმარებელი
                  </label>
                  <div className="text-zinc-900 dark:text-white">
                    {selectedLog.students ? (
                      <div>
                        <div className="font-medium">{selectedLog.students.name}</div>
                        <div className="text-sm text-zinc-500">{selectedLog.students.phone}</div>
                      </div>
                    ) : selectedLog.user_id ? (
                      <span className="font-mono text-xs">{selectedLog.user_id}</span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    IP მისამართი
                  </label>
                  <div className="font-mono text-sm text-zinc-900 dark:text-white">
                    {selectedLog.ip_address || '-'}
                  </div>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    User Agent
                  </label>
                  <div className="text-sm bg-zinc-100 dark:bg-zinc-700 rounded-lg px-3 py-2 text-zinc-600 dark:text-zinc-300 break-all">
                    {selectedLog.user_agent}
                  </div>
                </div>
              )}

              {selectedLog.request_body && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Request Body
                  </label>
                  <pre className="text-sm bg-zinc-100 dark:bg-zinc-700 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(selectedLog.request_body, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <label className="block text-xs font-medium text-red-500 dark:text-red-400 mb-1">
                    შეცდომის შეტყობინება
                  </label>
                  <div className="text-sm bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2 text-red-600 dark:text-red-400">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Log ID
                </label>
                <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedLog.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
