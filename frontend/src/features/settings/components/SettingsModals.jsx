import React, { useState } from 'react'
import {
  Users,
  Key,
  Calendar,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import api from '../../../lib/axios'
import { useToastStore } from '../../../store/toastStore'

// ─── Modal: Create User ───────────────────────────────────────────────────────
export function CreateUserModal({ open, onClose, onCreated }) {
  const toast = useToastStore()
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
          <input
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
            placeholder="e.g. teacher_science, staff_ahmed"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Role *</label>
          <select
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
          <input
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

// ─── Modal: Reset Password ────────────────────────────────────────────────────
export function ResetPasswordModal({ open, user, onClose }) {
  const toast = useToastStore()
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
          <input
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

// ─── Modal: Create Academic Year ──────────────────────────────────────────────
export function CreateAcademicYearModal({ open, onClose, onCreated }) {
  const toast = useToastStore()
  const [form, setForm] = useState({
    year: new Date().getFullYear() + 1,
    startDate: '',
    endDate: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/classes/academic-years', {
        year: Number(form.year),
        startDate: form.startDate,
        endDate: form.endDate,
        terms: [
          { name: 'Term 1', startDate: form.startDate, endDate: form.startDate },
          { name: 'Term 2', startDate: form.endDate, endDate: form.endDate },
        ],
      })
      if (res.data?.success) {
        toast.success(`Academic Year ${form.year} added successfully!`)
        onCreated(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create academic year')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Academic Session"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Academic Year *</label>
          <input
            required
            type="number"
            min={2020}
            max={2040}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Start Date *</label>
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">End Date *</label>
            <input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
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
            Save Session
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal: Add Payment Channel ──────────────────────────────────────────────
export function AddPaymentMethodModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    type: 'bank',
    name: '',
    accountTitle: '',
    accountNumber: '',
    branchCode: '',
    branchName: '',
    iban: '',
  })

  const handleSelectPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      ...preset,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.accountNumber) return
    onAdd({
      id: `pm-${Date.now()}`,
      ...form,
      isEnabled: true,
      isPrimary: false,
    })
    onClose()
    setForm({
      type: 'bank',
      name: '',
      accountTitle: '',
      accountNumber: '',
      branchCode: '',
      branchName: '',
      iban: '',
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Payment Channel"
      subtitle="Configure bank, digital wallet or Raast gateway"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Preset Buttons */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-2">Quick Presets</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  type: 'bank',
                  name: 'Meezan Bank Ltd.',
                  accountTitle: 'SMS School Fee Collection',
                  accountNumber: '0142-0105882910',
                  branchCode: '0142',
                  branchName: 'Main Campus Branch',
                  iban: 'PK36MEZN0001420105882910',
                })
              }
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200"
            >
              🏦 Meezan Bank
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  type: 'bank',
                  name: 'Habib Bank Limited (HBL)',
                  accountTitle: 'SMS Educational Trust Fee Collection',
                  accountNumber: '0042-79012345-03',
                  branchCode: '0042',
                  branchName: 'Campus Booth',
                  iban: 'PK45HABB0000427901234503',
                })
              }
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200"
            >
              🏦 HBL
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  type: 'easypaisa',
                  name: 'Easypaisa Merchant',
                  accountTitle: 'SMS School Fee A/C',
                  accountNumber: 'Till ID: 789012 (0300-1234567)',
                  branchCode: '',
                  branchName: '',
                  iban: '',
                })
              }
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200"
            >
              📱 Easypaisa
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  type: 'jazzcash',
                  name: 'JazzCash Direct',
                  accountTitle: 'SMS School Fee A/C',
                  accountNumber: 'Till ID: 654321 (0301-7654321)',
                  branchCode: '',
                  branchName: '',
                  iban: '',
                })
              }
              className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold border border-orange-200"
            >
              📱 JazzCash
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectPreset({
                  type: 'raast',
                  name: 'Raast Instant Pay / 1Bill',
                  accountTitle: 'SMS Academy Trust',
                  accountNumber: 'Raast ID: 03001234567',
                  branchCode: '',
                  branchName: '',
                  iban: '',
                })
              }
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200"
            >
              ⚡ Raast / 1Bill
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Channel Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bank">Commercial Bank (Branch Deposit)</option>
              <option value="easypaisa">Easypaisa (Till / Mobile Account)</option>
              <option value="jazzcash">JazzCash (Till / Mobile Account)</option>
              <option value="raast">Raast Instant / 1Bill</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Display Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Meezan Bank Ltd."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Account / Merchant Title *</label>
          <input
            required
            value={form.accountTitle}
            onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
            placeholder="e.g. SMS Educational Trust Fee Collection"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Account Number / Till ID / Raast ID *</label>
          <input
            required
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            placeholder="e.g. 0142-79012345 or Till ID: 789012"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {form.type === 'bank' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Branch Code / Name</label>
              <input
                value={form.branchCode}
                onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
                placeholder="e.g. 0142 (Campus Main)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">IBAN (24 Characters)</label>
              <input
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
                placeholder="PK36MEZN..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

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
            className="flex-1"
          >
            Add Channel
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Modal: Add Fee Head / Line Item ─────────────────────────────────────────
export function AddParticularModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '',
    type: 'fixed',
    defaultAmount: 500,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) return
    onAdd({
      id: `part-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      defaultAmount: Number(form.defaultAmount) || 0,
      isEnabled: true,
      isDeduction: false,
    })
    onClose()
    setForm({ name: '', type: 'fixed', defaultAmount: 500 })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Fee Particular Head"
      subtitle="Create a new item for the printed fee schedule"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Particular / Head Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Science Lab Fee, Annual Magazine, Transport"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Fee Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="fixed">Fixed Standard Fee</option>
              <option value="variable">Variable / Optional</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Default Amount (PKR)</label>
            <input
              type="number"
              min="0"
              value={form.defaultAmount}
              onChange={(e) => setForm({ ...form, defaultAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
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
            className="flex-1"
          >
            Add Head
          </Button>
        </div>
      </form>
    </Modal>
  )
}
