import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { School, Lock, User, AlertCircle, KeyRound, CalendarX, ShieldCheck } from 'lucide-react'
import api from '../../lib/axios'
import { useAllowedDays } from '../../hooks/useAllowedDays'
import { useAuthStore } from '../../store/authStore'

// Seeded demo credentials must never ship in a production bundle: anyone could click
// "Super Admin" and, via the forced first-login password change, take over the account.
// Vite replaces these env flags at build time, so the array is dropped from prod builds.
const SHOW_DEMO_LOGIN = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true'
const DEMO_ACCOUNTS = SHOW_DEMO_LOGIN
  ? [
      { label: 'Super Admin', username: 'admin', pass: 'Admin@1234', color: 'bg-indigo-600 hover:bg-indigo-700' },
      { label: 'Teacher', username: 'teacher1', pass: 'Staff@1234', color: 'bg-emerald-600 hover:bg-emerald-700' },
      { label: 'Parent / Guardian', username: 'parent1', pass: 'Parent@1234', color: 'bg-rose-600 hover:bg-rose-700' },
      { label: 'Student', username: 'stu-2026-0001', pass: 'Student@1234', color: 'bg-purple-600 hover:bg-purple-700' },
      { label: 'Accountant', username: 'accountant1', pass: 'Staff@1234', color: 'bg-amber-600 hover:bg-amber-700' },
      { label: 'HR Manager', username: 'hr_manager', pass: 'Staff@1234', color: 'bg-teal-600 hover:bg-teal-700' },
    ]
  : []

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // R6: Day restriction state
  const { data: dayInfo, isLoading: dayLoading } = useAllowedDays() // { today, allowedDays, isAllowedToday }
  const [showAdminBypass, setShowAdminBypass] = useState(false)

  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async (usr, pwd) => {
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', { username: usr, password: pwd })
      if (res.data?.success) {
        const { user, accessToken } = res.data.data
        setAuth(user, accessToken)

        // Route appropriately based on user role
        const role = user?.roleName || user?.role
        if (role === 'guardian') {
          navigate('/guardian-portal')
        } else if (role === 'student') {
          navigate('/student-portal')
        } else if (role === 'teacher') {
          navigate('/teacher/workspace')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleLogin(username, password)
  }

  // ── R6: Day-Blocked Screen ──────────────────────────────────────────────────
  if (!dayLoading && dayInfo && !dayInfo.isAllowedToday && !showAdminBypass) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-10 border border-indigo-100 dark:border-indigo-900 text-center">
          <div className="inline-flex p-4 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-700 dark:text-amber-300 mb-5 shadow">
            <CalendarX className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight mb-2">
            System Unavailable Today
          </h1>
          <p className="text-base font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            Today is <span className="text-amber-700 dark:text-amber-300 font-bold">{dayInfo.today}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            The School Management System is only operational on scheduled school days.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4 text-left">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Configured School Days
            </p>
            <div className="flex flex-wrap gap-2">
              {(dayInfo.allowedDays || []).map((d) => (
                <span
                  key={d}
                  className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-semibold"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>Admin emergency override?</span>
            <button
              type="button"
              onClick={() => setShowAdminBypass(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Administrator Sign-In
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-indigo-100 dark:border-indigo-900">
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 bg-indigo-600 rounded-2xl text-white mb-3 shadow-lg shadow-indigo-600/30">
            <School className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">SMS Portal Sign In</h1>
          {/* R6: Explicitly display current day name */}
          {dayInfo?.today && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-150 text-xs font-bold">
              <span>Today:</span>
              <span className="text-indigo-900 dark:text-indigo-100 font-extrabold">{dayInfo.today}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Authenticate to access your role-based academic workspace</p>
          {showAdminBypass && (
            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mt-1">
              * Admin Override Mode active for {dayInfo?.today}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
              <input aria-label="e.g. admin"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
              <input aria-label="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Quick Demo Sign-In Buttons (development / explicit demo builds only) */}
        {DEMO_ACCOUNTS.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 1-Click Demo Sign-In
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => {
                  setUsername(acc.username)
                  setPassword(acc.pass)
                  handleLogin(acc.username, acc.pass)
                }}
                className={`${acc.color} text-white px-3 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all text-center flex flex-col items-center justify-center`}
              >
                <span>{acc.label}</span>
                <span className="text-[10px] opacity-80 font-normal">{acc.username}</span>
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
    </main>
  )
}
