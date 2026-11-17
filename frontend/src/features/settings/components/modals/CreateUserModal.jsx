import React from 'react'
import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import api from '../../../../lib/axios'
import { useToast } from '../../../../store/toastStore'

// ─── Modal: Create User ───────────────────────────────────────────────────────
export function CreateUserModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState({
    username: '',
    password: '',
    roleName: 'teacher',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/users', form)
      if (res.data?.success) {
        toast.success(`User "${form.username}" created with role ${form.roleName}!`)
        onCreated(res.data.data)
        onClose()
        setForm({ username: '', password: '', roleName: 'teacher' })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create System User"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Username *</label>
          <input aria-label="Username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
            placeholder="e.g. teacher_science, staff_ahmed"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Role *</label>
          <select aria-label="Role"
            value={form.roleName}
            onChange={(e) => setForm({ ...form, roleName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="super_admin">Super Admin (Full Control)</option>
            <option value="teacher">Teacher (Academics & Attendance)</option>
            <option value="accountant">Accountant (Fee Ledger & Payments)</option>
            <option value="hr_manager">HR Manager (Staff & Payroll)</option>
            <option value="student">Student / Guardian (Portal Access)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Initial Password *</label>
          <input aria-label="Initial Password"
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
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
            variant="primary"
            loading={saving}
            className="flex-1"
          >
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  )
}
