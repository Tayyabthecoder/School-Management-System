import React from 'react'
import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import api from '../../../../lib/axios'
import { useToast } from '../../../../store/toastStore'

// ─── Modal: Create Academic Year ──────────────────────────────────────────────
export function CreateAcademicYearModal({ open, onClose, onCreated }) {
  const toast = useToast()
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
          <input aria-label="Academic Year"
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
            <input aria-label="Start Date"
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">End Date *</label>
            <input aria-label="End Date"
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
