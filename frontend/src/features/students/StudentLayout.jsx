import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, Award, User, Bell, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import PageLoader from '../../components/ui/PageLoader'

export default function StudentLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-indigo-950 text-white shadow-md border-b border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-inner flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight leading-none text-white">
                  SMS Student Portal
                </h1>
                <span className="px-2 py-0.5 bg-indigo-800 text-indigo-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Academic Hub
                </span>
              </div>
              <p className="text-xs text-indigo-300 mt-0.5">Session 2026 · Student Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.username?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-white leading-tight capitalize">{user?.username || 'Student'}</p>
                <p className="text-[10px] text-indigo-300">Enrolled Student</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-800/80 hover:bg-red-600/80 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <React.Suspense fallback={<PageLoader />}>
          <Outlet />
        </React.Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        School Management System · Student Academic Hub © 2026
      </footer>
    </div>
  )
}
