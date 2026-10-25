import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  CalendarCheck,
  Award,
  CircleDollarSign,
  Briefcase,
  BarChart3,
  Settings,
  School,
  Clock,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

const NAV_SECTIONS = [
  {
    title: 'Academics & Faculty',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin', 'accountant', 'hr_manager'] },
      { label: 'Faculty Workspace', icon: Clock, path: '/teacher/workspace', roles: ['super_admin', 'teacher'] },
      { label: 'Students Directory', icon: Users, path: '/students', roles: ['super_admin', 'teacher', 'hr_manager'] },
      { label: 'Classes & Sections', icon: GraduationCap, path: '/academics', roles: ['super_admin', 'teacher'] },
      { label: 'Daily Attendance', icon: CalendarCheck, path: '/attendance', roles: ['super_admin', 'teacher', 'hr_manager'] },
    ],
  },
  {
    title: 'Exams & Records',
    items: [
      { label: 'Grades & Exams', icon: Award, path: '/grades', roles: ['super_admin', 'teacher'] },
      { label: 'Report Cards & Transcripts', icon: School, path: '/grades/report-cards', roles: ['super_admin', 'teacher'] },
      { label: 'Annual Promotion', icon: GraduationCap, path: '/students/promotion', roles: ['super_admin'] },
    ],
  },
  {
    title: 'Finance & Operations',
    items: [
      { label: 'Fees & Bank Challans', icon: CircleDollarSign, path: '/finance', roles: ['super_admin', 'accountant'] },
      { label: 'Staff Directory', icon: UserCheck, path: '/teachers', roles: ['super_admin', 'teacher', 'hr_manager'] },
      { label: 'HR & Monthly Payroll', icon: Briefcase, path: '/hr', roles: ['super_admin', 'hr_manager'] },
    ],
  },
  {
    title: 'Analytics & System',
    items: [
      { label: 'Reports & Export Engine', icon: BarChart3, path: '/reports', roles: ['super_admin', 'accountant', 'hr_manager'] },
      { label: 'System Settings & RBAC', icon: Settings, path: '/settings', roles: ['super_admin'] },
    ],
  },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const { isSidebarOpen } = useUIStore()

  const userRole = user?.roleName || user?.role || 'student'

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-slate-950 text-slate-300 border-r border-slate-800/80 transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col font-sans select-none`}
    >
      {/* Institution Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shadow-indigo-600/30 flex-shrink-0">
            <School className="w-5 h-5" />
          </div>
          {isSidebarOpen && (
            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">SMS Enterprise</span>
                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold rounded-md border border-indigo-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Al-Haq Model Academy</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map((section, sIndex) => {
          const visibleItems = section.items.filter((item) => item.roles.includes(userRole))
          if (visibleItems.length === 0) return null

          return (
            <div key={sIndex} className="space-y-1">
              {isSidebarOpen && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                      } ${!isSidebarOpen ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer User Profile Pill */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className={`flex items-center gap-3 ${!isSidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {isSidebarOpen && (
            <div className="flex-1 overflow-hidden leading-tight">
              <p className="text-xs font-semibold text-slate-200 truncate capitalize">{user?.username}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
