import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { School, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

import PageLoader from '../../components/ui/PageLoader'

export default function GuardianLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-gray-900 leading-tight">Guardian Portal</h1>
              <p className="text-xs text-gray-500">Al-Haq Model Academy & College</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <User className="w-4 h-4 text-indigo-600" />
              <span className="font-medium">{user?.username || 'Guardian'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <React.Suspense fallback={<PageLoader />}>
          <Outlet />
        </React.Suspense>
      </main>
    </div>
  )
}

