import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  CircleDollarSign,
  Briefcase,
  BarChart3,
  Settings,
  GraduationCap,
  PlusCircle,
  FileText,
  User,
  ArrowRight,
  Clock,
  Sparkles,
  X,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/axios'

const STATIC_COMMANDS = [
  // Navigation
  { id: 'nav-dashboard', title: 'Dashboard & Analytics', category: 'Navigation', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'accountant', 'hr_manager'] },
  { id: 'nav-students', title: 'Students Directory & Admissions', category: 'Navigation', icon: Users, path: '/students', roles: ['super_admin', 'teacher', 'hr_manager'] },
  { id: 'nav-classes', title: 'Classes & Academic Sections', category: 'Navigation', icon: GraduationCap, path: '/academics', roles: ['super_admin', 'teacher'] },
  { id: 'nav-timetable', title: 'Weekly Timetable Schedule', category: 'Navigation', icon: Clock, path: '/academics/timetable', roles: ['super_admin', 'teacher'] },
  { id: 'nav-attendance', title: 'Daily Attendance Marking', category: 'Navigation', icon: CalendarCheck, path: '/attendance', roles: ['super_admin', 'teacher', 'hr_manager'] },
  { id: 'nav-grades', title: 'Exam Schedules & Marks Entry', category: 'Navigation', icon: Award, path: '/grades', roles: ['super_admin', 'teacher'] },
  { id: 'nav-transcripts', title: 'Multi-Year Transcripts & Report Cards', category: 'Navigation', icon: FileText, path: '/grades/report-cards', roles: ['super_admin', 'teacher'] },
  { id: 'nav-finance', title: 'Finance Ledger & Bank Challans', category: 'Navigation', icon: CircleDollarSign, path: '/finance', roles: ['super_admin', 'accountant'] },
  { id: 'nav-hr', title: 'HR Management & Staff Directory', category: 'Navigation', icon: Briefcase, path: '/hr', roles: ['super_admin', 'hr_manager'] },
  { id: 'nav-reports', title: 'Dynamic Custom Report Builder', category: 'Navigation', icon: BarChart3, path: '/reports', roles: ['super_admin', 'accountant', 'hr_manager'] },
  { id: 'nav-settings', title: 'System Administration & Settings', category: 'Navigation', icon: Settings, path: '/settings', roles: ['super_admin'] },

  // Quick Actions
  { id: 'act-new-student', title: 'Register New Student (5-Step Wizard)', category: 'Quick Action', icon: PlusCircle, path: '/students', roles: ['super_admin', 'teacher'] },
  { id: 'act-new-challan', title: 'Issue Bank Fee Challan', category: 'Quick Action', icon: CircleDollarSign, path: '/finance', roles: ['super_admin', 'accountant'] },
  { id: 'act-mark-att', title: 'Record Class Attendance', category: 'Quick Action', icon: CalendarCheck, path: '/attendance', roles: ['super_admin', 'teacher'] },
]

export default function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette } = useUIStore()
  const { user } = useAuthStore()
  const userRole = user?.roleName || user?.role || 'student'
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [studentResults, setStudentResults] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const inputRef = useRef(null)

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setStudentResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isCommandPaletteOpen])

  // Live student search with debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setStudentResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingStudents(true)
        const res = await api.get('/students', { params: { search: query.trim(), limit: 5 } })
        if (res.data?.success) {
          setStudentResults(
            (res.data.data?.students || res.data.data || []).slice(0, 5).map((s) => ({
              id: `student-${s._id}`,
              title: `${s.fullName} (${s.studentId})`,
              subtitle: `Grade ${s.classId?.name || s.classId?.level || 'N/A'} · Section ${s.section || 'A'}`,
              category: 'Students',
              icon: User,
              path: `/students/${s._id}`,
            }))
          )
        }
      } catch {
        // Ignore search error
      } finally {
        setLoadingStudents(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  // Filter commands by user role and search query
  const matchingCommands = STATIC_COMMANDS.filter((cmd) => {
    if (cmd.roles && !cmd.roles.includes(userRole)) return false
    if (!query.trim()) return true
    return cmd.title.toLowerCase().includes(query.toLowerCase()) || cmd.category.toLowerCase().includes(query.toLowerCase())
  })

  const allItems = [...studentResults, ...matchingCommands]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isCommandPaletteOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((idx) => (idx + 1) % Math.max(1, allItems.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((idx) => (idx - 1 + allItems.length) % Math.max(1, allItems.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allItems[selectedIndex]) {
          executeItem(allItems[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeCommandPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCommandPaletteOpen, allItems, selectedIndex])

  const executeItem = (item) => {
    closeCommandPalette()
    if (item.path) {
      navigate(item.path)
    }
  }

  if (!isCommandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={closeCommandPalette}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command, page, or student name..."
            className="w-full bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {loadingStudents && (
            <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
              <span>Searching student directory...</span>
            </div>
          )}

          {allItems.length === 0 && !loadingStudents ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching commands or students found for "{query}".
            </div>
          ) : (
            <div className="space-y-0.5">
              {allItems.map((item, index) => {
                const Icon = item.icon
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={item.id || index}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        {item.subtitle && (
                          <p className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'}`}>
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.category}
                      </span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">↵</kbd> select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            SMS Spotlight
          </span>
        </div>
      </div>
    </div>
  )
}
