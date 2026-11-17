import React, { useState, useEffect } from 'react'
import { Check, Download } from 'lucide-react'
import Modal from '../../../../../components/ui/Modal'
import Button from '../../../../../components/ui/Button'
import api from '../../../../../lib/axios'
import { formatPKR } from '../../../../../lib/formatters'
import { useToast } from '../../../../../store/toastStore'
import { logError } from '../../../../../lib/logger'

// ─── Modal: Record Payment ───────────────────────────────────────────────────
export function RecordPaymentModal({
  open,
  feeRecord,
  onClose,
  onSuccess,
  onDownloadReceipt,
}) {
  const toast = useToast()
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [referenceNo, setReferenceNo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [completedPayment, setCompletedPayment] = useState(null)

  useEffect(() => {
    if (feeRecord) {
      setAmountPaid(feeRecord.outstandingAmount || 0)
      setPaymentMode('Cash')
      setReferenceNo('')
      setRemarks('')
      setCompletedPayment(null)
    }
  }, [feeRecord, open])

  if (!open || !feeRecord) return null

  const handleSave = async (e) => {
    e.preventDefault()
    const numPaid = Number(amountPaid)
    if (numPaid <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }
    if (numPaid > feeRecord.outstandingAmount) {
      toast.error(
        `Payment amount cannot exceed outstanding balance (${formatPKR(feeRecord.outstandingAmount)})`
      )
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/finance/payments', {
        studentFeeId: feeRecord._id,
        amountPaid: numPaid,
        paymentMode,
        referenceNo: referenceNo.trim(),
        remarks: remarks.trim(),
      })
      if (res.data?.success) {
        toast.success(`Payment of ${formatPKR(numPaid)} recorded successfully!`)
        setCompletedPayment(res.data.data?.payment)
        onSuccess()
      }
    } catch (err) {
      logError(err)
      toast.error(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Record Fee Payment"
      subtitle={feeRecord.feeStructureId?.title || 'Invoice Payment'}
      size="md"
    >
      {completedPayment ? (
        <div className="p-4 space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Payment Logged Successfully!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Receipt No:{' '}
              <strong className="font-mono text-emerald-800 dark:text-emerald-300">
                {completedPayment.receiptNo}
              </strong>
            </p>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatPKR(completedPayment.amountPaid)}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              variant="success"
              size="md"
              icon={Download}
              onClick={() => onDownloadReceipt(completedPayment._id, completedPayment.receiptNo)}
              className="w-full"
            >
              Download Official Receipt (.pdf)
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="w-full">
              Done / Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-2xs">
                Net Invoice Amount
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
                {formatPKR(feeRecord.netAmount)}
              </p>
            </div>
            <div>
              <span className="text-amber-800 dark:text-amber-400 font-bold uppercase text-2xs">
                Outstanding Balance
              </span>
              <p className="font-black text-amber-900 dark:text-amber-300 text-sm mt-0.5">
                {formatPKR(feeRecord.outstandingAmount)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Amount Being Paid (PKR) <span className="text-red-500">*</span>
            </label>
            <input aria-label="Amount Being Paid (PKR)"
              type="number"
              min="1"
              max={feeRecord.outstandingAmount}
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                Payment Mode
              </label>
              <select aria-label="Payment Mode"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium"
              >
                <option value="Cash">Cash (Counter)</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online Portal</option>
                <option value="Cheque">Cheque</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                Reference #
              </label>
              <input aria-label="Reference #"
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. TXN-7845"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Payment Remarks
            </label>
            <input aria-label="Payment Remarks"
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Received at accounts counter"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm" loading={saving}>
              Record Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
