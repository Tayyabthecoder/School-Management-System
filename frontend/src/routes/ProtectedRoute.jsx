import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import PageLoader from '../components/ui/PageLoader'
import api from '../lib/axios'
import { CalendarX } from 'lucide-react'

// R6: In-App Day Blocked Component for active sessions on restricted days
function DayBlockedScreen({ today, allowedDays, onLogout }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-10 text-center">
        <div className="inline-flex p-4 bg-amber-100 dark:bg-amber-950/60 rounded-2xl text-amber-600 dark:text-amber-400 mb-5">
          <CalendarX className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-base font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
          Today is <span className="text-amber-600 dark:text-amber-400 font-bold">{today}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          The School Management System is not accessible today. Please return on an authorized school day.
        </p>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4 text-left mb-6">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Authorized School Days</p>
          <div className="flex flex-wrap gap-2">
            {(allowedDays || []).map((d) => (
              <span key={d} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-semibold">
                {d}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function ProtectedRoute() {
  const { isAuthenticated, isInitializing, user, setAccessToken, logout } = useAuthStore()
  const location = useLocation()

  // R6: Day restriction state
  const [dayInfo, setDayInfo] = useState(null)
  const [dayChecked, setDayChecked] = useState(false)

  useEffect(() => {
    if (isInitializing && !isAuthenticated && user) {
      api.post('/auth/refresh')
        .then((res) => {
          if (res.data?.success && res.data?.data?.accessToken) {
            setAccessToken(res.data.data.accessToken)
          } else {
            logout()
          }
        })
        .catch(() => {
          logout()
        })
    }
  }, [isInitializing, isAuthenticated, user, setAccessToken, logout])

  // Fetch day restrictions info
  useEffect(() => {
    api.get('/settings/allowed-days')
      .then((res) => {
        if (res.data?.success) setDayInfo(res.data.data)
      })
      .catch(() => {
        setDayInfo({ today: '', allowedDays: [], isAllowedToday: true })
      })
      .finally(() => setDayChecked(true))
  }, [])

  if (isInitializing && !isAuthenticated && user) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!dayChecked) {
    return <PageLoader />
  }

  // R6: Block non-super_admin access on unauthorized days
  const role = user?.roleName || (typeof user?.role === 'object' ? user?.role?.name : user?.role)
  if (role !== 'super_admin' && dayInfo && !dayInfo.isAllowedToday) {
    return (
      <DayBlockedScreen
        today={dayInfo.today}
        allowedDays={dayInfo.allowedDays}
        onLogout={logout}
      />
    )
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  // Guardian role routing
  if (role === 'guardian' && location.pathname !== '/guardian-portal' && location.pathname !== '/change-password') {
    return <Navigate to="/guardian-portal" replace />
  }

  // Student role routing
  if (role === 'student' && location.pathname !== '/student-portal' && location.pathname !== '/change-password') {
    return <Navigate to="/student-portal" replace />
  }

  // Teacher default landing
  if (role === 'teacher' && (location.pathname === '/' || location.pathname === '/dashboard')) {
    return <Navigate to="/teacher/workspace" replace />
  }

  return <Outlet />
}
