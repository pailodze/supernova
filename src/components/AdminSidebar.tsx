'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuCategories = [
  {
    title: 'მომხმარებლები',
    items: [
      { href: '/admin', label: 'სტუდენტები', icon: '👥' },
    ],
  },
  {
    title: 'კარიერა',
    items: [
      { href: '/admin/jobs', label: 'ვაკანსიები', icon: '💼' },
      { href: '/admin/job-applications', label: 'განაცხადები', icon: '📨' },
      { href: '/admin/tasks', label: 'დავალებები', icon: '📋' },
      { href: '/admin/submissions', label: 'შესრულებული', icon: '✅' },
    ],
  },
  {
    title: 'სწავლა',
    items: [
      { href: '/admin/learning', label: 'მასალები', icon: '📚' },
      { href: '/admin/skills', label: 'უნარები', icon: '🎯' },
      { href: '/admin/certificates', label: 'სერტიფიკატები', icon: '📜' },
    ],
  },
  {
    title: 'სისტემა',
    items: [
      { href: '/admin/logs', label: 'ლოგები', icon: '📊' },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 min-h-screen flex flex-col">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <Link href="/admin" className="text-xl font-bold text-zinc-900 dark:text-white">
          ადმინ პანელი
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {menuCategories.map((category) => (
          <div key={category.title}>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              {category.title}
            </h3>
            <ul className="space-y-1">
              {category.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                      isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition"
        >
          <span className="text-lg">←</span>
          <span>დაბრუნება</span>
        </Link>
      </div>
    </aside>
  )
}
