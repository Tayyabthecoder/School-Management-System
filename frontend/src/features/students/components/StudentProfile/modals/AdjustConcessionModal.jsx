import React, { useState, useEffect } from 'react'
import Modal from '../../../../../components/ui/Modal'
import Button from '../../../../../components/ui/Button'
import api from '../../../../../lib/axios'
import { formatPKR } from '../../../../../lib/formatters'
import { useToast } from '../../../../../store/toastStore'
import { logError } from '../../../../../lib/logger'

// ─── Modal: Adjust Concession / Scholarship ──────────────────────────────────
export function AdjustConcessionModal({ open, feeRecord, onClose, onSuccess }) {
  const toast = useToast()
  const [concessionType, setConcessionType] = useState('Need-Based Scholarship')
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [concessionReason, setConcessionReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (feeRecord) {
      setConcessionType(
        feeRecord.concessionType && feeRecord.concessionType !== 'None'
          ? feeRecord.concessionType
          : 'Need-Based Scholarship'
      )
      setDiscountType('fixed')
      setDiscountValue(feeRecord.discount || 0)
      setConcessionReason(feeRecord.concessionReason || '')
    }
  }, [feeRecord, open])

  if (!open || !feeRecord) return null

  const amountDue = feeRecord.amountDue || 0
  const numVal = Number(discountValue) || 0
  const calculatedDiscount =
    discountType === 'percentage'
      ? Math.round((amountDue * Math.min(numVal, 100)) / 100)
      : Math.min(amountDue, numVal)
  const previewNet = Math.max(0, amountDue - calculatedDiscount)
  const previewOutstanding = Math.max(0, previewNet - (feeRecord.amountPaid || 0))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/finance/concession', {
        studentFeeId: feeRecord._id,
        discountAmount: calculatedDiscount,
        concessionType,
        concessionReason: concessionReason.trim(),
      })
      if (res.data?.success) {
        toast.success('Fee concession updated successfully!')
        onSuccess()
        onClose()
      }
    } catch (err) {
      logError(err)
      toast.error(err.response?.data?.message || 'Failed to update fee concession')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Adjust Concession / Scholarship"
      subtitle={feeRecord.feeStructureId?.title || 'Tuition Fee'}
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-2xs">
              Base Gross Amount
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
              {formatPKR(amountDue)}
            </p>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-2xs">Already Paid</span>
            <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">
              {formatPKR(feeRecord.amountPaid)}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
            Concession Category
          </label>
          <select aria-label="Concession Category"
            value={concessionType}
            onChange={(e) => setConcessionType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20 font-medium"
          >
            <option value="Need-Based Scholarship">Need-Based Scholarship</option>
            <option value="Merit Scholarship">Merit Scholarship</option>
            <option value="Sibling Concession">Sibling Concession</option>
            <option value="Teacher Child Discount">Teacher Child Discount</option>
            <option value="Staff Concession">Staff Concession</option>
            <option value="Special Management Concession">Special Management Concession</option>
            <option value="Orphan Support">Orphan Support</option>
            <option value="None">None (Remove Concession)</option>
          </select>
        </div>

        {concessionType !== 'None' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Discount Mode & Value
            </label>
            <div className="flex gap-2">
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    discountType === 'percentage'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    discountType === 'fixed'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  PKR
                </button>
              </div>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : amountDue}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? 'e.g. 20' : 'e.g. 1500'}
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
            Concession Approval Reason / Remarks
          </label>
          <input aria-label="Concession Approval Reason / Remarks"
            type="text"
            value={concessionReason}
            onChange={(e) => setConcessionReason(e.target.value)}
            placeholder="e.g. Approved by Principal / Board notification #42"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
          <div>
            <p className="text-2xs text-slate-500 dark:text-slate-400 uppercase font-semibold">New Net Payable</p>
            <p className="font-extrabold text-sm text-indigo-900 dark:text-indigo-300">
              {formatPKR(previewNet)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xs text-slate-500 dark:text-slate-400 uppercase font-semibold">New Outstanding</p>
            <p className="font-extrabold text-sm text-amber-800 dark:text-amber-400">
              {formatPKR(previewOutstanding)}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Concession
          </Button>
        </div>
      </form>
    </Modal>
  )
}
