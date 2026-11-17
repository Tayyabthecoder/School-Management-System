import React from 'react'
import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import api from '../../../../lib/axios'
import { useToast } from '../../../../store/toastStore'

// ─── Modal: Reset Password ────────────────────────────────────────────────────
export function ResetPasswordModal({ open, user, onClose }) {
  const toast = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const res = await api.put(`/users/${user._id}/reset-password`, { newPassword })
      if (res.data?.success) {
        toast.success(`Password for ${user.username} has been reset successfully!`)
        onClose()
        setNewPassword('')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Password reset failed')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset User Password"
      size="md"
    >
      <form onSubmit={handleReset} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Resetting password for account: <span className="font-bold text-gray-900 dark:text-white">{user.username}</span> ({user.roleName || user.role?.name})
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">New Password *</label>
          <input aria-label="New Password"
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="warning"
            loading={saving}
            className="flex-1"
          >
            Set New Password
          </Button>
        </div>
      </form>
    </Modal>
  )
}
