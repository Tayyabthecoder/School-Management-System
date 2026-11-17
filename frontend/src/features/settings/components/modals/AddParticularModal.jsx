import React from 'react'
import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'

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
          <input aria-label="Particular / Head Name"
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
            <select aria-label="Fee Type"
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
            <input aria-label="Default Amount (PKR)"
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
