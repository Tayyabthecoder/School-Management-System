import React from 'react'
import { useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'

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
              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800"
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
              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800"
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
              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800"
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
              className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-semibold border border-orange-200 dark:border-orange-800"
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
              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-200 dark:border-indigo-800"
            >
              ⚡ Raast / 1Bill
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Channel Type *</label>
            <select aria-label="Channel Type"
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
            <input aria-label="Display Name"
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
          <input aria-label="Account / Merchant Title"
            required
            value={form.accountTitle}
            onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
            placeholder="e.g. SMS Educational Trust Fee Collection"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Account Number / Till ID / Raast ID *</label>
          <input aria-label="Account Number / Till ID / Raast ID"
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
              <input aria-label="Branch Code / Name"
                value={form.branchCode}
                onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
                placeholder="e.g. 0142 (Campus Main)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">IBAN (24 Characters)</label>
              <input aria-label="IBAN (24 Characters)"
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
