import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { School, Lock, User, AlertCircle, KeyRound, CalendarX, ShieldCheck } from 'lucide-react'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // R6: Day restriction state
  const [dayInfo, setDayInfo] = useState(null) // { today, allowedDays, isAllowedToday }
  const [dayLoading, setDayLoading] = useState(true)
  const [showAdminBypass, setShowAdminBypass] = useState(false)

  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  // Fetch allowed days on mount (public endpoint, no token needed)
  useEffect(() => {
    api.get('/settings/allowed-days')
      .then((res) => {
        if (res.data?.success) setDayInfo(res.data.data)
      })
      .catch(() => {
        // Fallback: fail-open on network error to avoid false lockouts
        setDayInfo({
          today: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isAllowedToday: true,
        })
      })
      .finally(() => setDayLoading(false))
  }, [])

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

  const demoAccounts = [
    { label: 'Super Admin', username: 'admin', pass: 'Admin@1234', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Teacher', username: 'teacher1', pass: 'Staff@1234', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Parent / Guardian', username: 'parent1', pass: 'Parent@1234', color: 'bg-rose-600 hover:bg-rose-700' },
    { label: 'Student', username: 'stu-2026-0001', pass: 'Student@1234', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Accountant', username: 'accountant1', pass: 'Staff@1234', color: 'bg-amber-600 hover:bg-amber-700' },
    { label: 'HR Manager', username: 'hr_manager', pass: 'Staff@1234', color: 'bg-teal-600 hover:bg-teal-700' },
  ]

  // ── R6: Day-Blocked Screen ──────────────────────────────────────────────────
  if (!dayLoading && dayInfo && !dayInfo.isAllowedToday && !showAdminBypass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 border border-indigo-100 text-center">
          <div className="inline-flex p-4 bg-amber-100 rounded-2xl text-amber-600 mb-5 shadow">
            <CalendarX className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
            System Unavailable Today
          </h1>
          <p className="text-base font-semibold text-indigo-700 mb-1">
            Today is <span className="text-amber-600 font-bold">{dayInfo.today}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            The School Management System is only operational on scheduled school days.
          </p>
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-4 text-left">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Configured School Days
            </p>
            <div className="flex flex-wrap gap-2">
              {(dayInfo.allowedDays || []).map((d) => (
                <span
                  key={d}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Admin emergency override?</span>
            <button
              type="button"
              onClick={() => setShowAdminBypass(true)}
              className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Administrator Sign-In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-indigo-100">
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 bg-indigo-600 rounded-2xl text-white mb-3 shadow-lg shadow-indigo-600/30">
            <School className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">SMS Portal Sign In</h1>
          {/* R6: Explicitly display current day name */}
          {dayInfo?.today && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-150 text-xs font-bold">
              <span>Today:</span>
              <span className="text-indigo-900 font-extrabold">{dayInfo.today}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">Authenticate to access your role-based academic workspace</p>
          {showAdminBypass && (
            <p className="text-xs text-amber-600 font-semibold mt-1">
              * Admin Override Mode active for {dayInfo?.today}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-sm transition-all"
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

        {/* 1-Click Quick Demo Sign-In Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            <KeyRound className="w-4 h-4 text-indigo-600" /> 1-Click Demo Sign-In
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoAccounts.map((acc) => (
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
      </div>
    </div>
  )
}
