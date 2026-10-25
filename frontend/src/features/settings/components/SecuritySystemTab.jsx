import React from 'react'
import {
  Lock,
  Palette,
  Server,
  RefreshCw,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'

export default function SecuritySystemTab({
  user,
  passwordForm,
  setPasswordForm,
  systemHealth,
  onCheckHealth,
}) {
  const toast = useToastStore()

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passwordForm.currentPassword) {
      toast.error('Current password is required!')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match!')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long!')
      return
    }
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      if (res.data?.success) {
        toast.success('Your password has been changed successfully!')
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password. Please verify your current password.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Change Current Password */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Update Account Password
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
          Logged in as <span className="font-bold text-gray-800 dark:text-slate-200">{user?.username}</span> ({user?.roleName || user?.role})
        </p>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Current Password *</label>
            <input
              required
              type="password"
              value={passwordForm?.currentPassword || ''}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">New Password *</label>
            <input
              required
              type="password"
              value={passwordForm?.newPassword || ''}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Confirm New Password *</label>
            <input
              required
              type="password"
              value={passwordForm?.confirmPassword || ''}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-sm"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
          >
            Change Password
          </Button>
        </form>
      </div>

      {/* UI Theme & Appearance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Interface Theme & Appearance
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Toggle light and dark visual themes across the application portal.
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              document.documentElement.classList.remove('dark')
              localStorage.setItem('sms_theme', 'light')
              toast.success('Switched to Light Theme')
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-sm"
          >
            ☀️ Light Mode
          </button>
          <button
            type="button"
            onClick={() => {
              document.documentElement.classList.add('dark')
              localStorage.setItem('sms_theme', 'dark')
              toast.success('Switched to Dark Mode')
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-800 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
          >
            🌙 Dark Mode
          </button>
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            System Health & Environment Diagnostics
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onCheckHealth}
          >
            Re-check
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Backend API Status</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {systemHealth.status}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">MongoDB Connection</p>
            <p className="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-1">Connected (Local / Atlas)</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">SMS Portal Version</p>
            <p className="text-base font-bold text-gray-800 dark:text-slate-200 mt-1">v1.2.0 (Enterprise)</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Environment Mode</p>
            <p className="text-base font-bold text-amber-700 dark:text-amber-400 mt-1 capitalize">{systemHealth.env}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
