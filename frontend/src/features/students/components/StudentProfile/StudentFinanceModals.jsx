import React, { useState, useEffect } from 'react'
import { Check, Download } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import api from '../../../../lib/axios'
import { formatPKR } from '../../../../lib/formatters'
import { useToastStore } from '../../../../store/toastStore'

// ─── Modal: Adjust Concession / Scholarship ──────────────────────────────────
export function AdjustConcessionModal({ open, feeRecord, onClose, onSuccess }) {
  const toast = useToastStore()
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
      console.error(err)
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
            <span className="text-slate-400 font-semibold uppercase text-2xs">
              Base Gross Amount
            </span>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">
              {formatPKR(amountDue)}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase text-2xs">Already Paid</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
              {formatPKR(feeRecord.amountPaid)}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
            Concession Category
          </label>
          <select
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
          <input
            type="text"
            value={concessionReason}
            onChange={(e) => setConcessionReason(e.target.value)}
            placeholder="e.g. Approved by Principal / Board notification #42"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
          <div>
            <p className="text-2xs text-slate-500 uppercase font-semibold">New Net Payable</p>
            <p className="font-extrabold text-sm text-indigo-900 dark:text-indigo-300">
              {formatPKR(previewNet)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xs text-slate-500 uppercase font-semibold">New Outstanding</p>
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

// ─── Modal: Record Payment ───────────────────────────────────────────────────
export function RecordPaymentModal({
  open,
  feeRecord,
  onClose,
  onSuccess,
  onDownloadReceipt,
}) {
  const toast = useToastStore()
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
      console.error(err)
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
              <span className="text-slate-400 font-semibold uppercase text-2xs">
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
            <input
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
              <select
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
              <input
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
            <input
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

// ─── Modal: Assign Additional Fee ─────────────────────────────────────────────
export function AssignFeeModal({ open, student, onClose, onSuccess }) {
  const toast = useToastStore()
  const [structures, setStructures] = useState([])
  const [selectedStructureId, setSelectedStructureId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [concessionType, setConcessionType] = useState('None')
  const [concessionReason, setConcessionReason] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loadingStructures, setLoadingStructures] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && student) {
      setDiscount(0)
      setConcessionType('None')
      setConcessionReason('')
      setDueDate('')
      const classId = student.classId?._id || student.classId
      if (classId) {
        setLoadingStructures(true)
        api
          .get('/finance/structures', { params: { classId } })
          .then((res) => {
            if (res.data?.success) {
              const list = res.data.data || []
              setStructures(list)
              if (list.length > 0) {
                setSelectedStructureId(list[0]._id)
                setDueDate(
                  list[0].dueDate
                    ? new Date(list[0].dueDate).toISOString().split('T')[0]
                    : ''
                )
              }
            }
          })
          .catch((err) => console.error(err))
          .finally(() => setLoadingStructures(false))
      }
    }
  }, [open, student])

  if (!open || !student) return null

  const selectedStructure = structures.find((s) => s._id === selectedStructureId) || structures[0]
  const baseAmount = selectedStructure?.amount || 0
  const numDiscount = Number(discount) || 0
  const netAmount = Math.max(0, baseAmount - numDiscount)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedStructureId) {
      toast.error('Please select a fee structure')
      return
    }
    if (numDiscount > baseAmount) {
      toast.error('Discount cannot exceed base fee amount')
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/finance/student-fees/assign', {
        studentId: student._id,
        feeStructureId: selectedStructureId,
        discount: numDiscount,
        concessionType: concessionType !== 'None' ? concessionType : undefined,
        concessionReason: concessionReason.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      })
      if (res.data?.success) {
        toast.success('Fee invoice assigned to student successfully!')
        onSuccess()
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to assign fee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Assign Additional Fee"
      subtitle={`${student.fullName} · ${student.classId?.name || 'Class'}`}
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
            Select Fee Structure <span className="text-red-500">*</span>
          </label>
          {loadingStructures ? (
            <p className="text-xs text-slate-500">Loading fee structures…</p>
          ) : structures.length > 0 ? (
            <select
              value={selectedStructureId}
              onChange={(e) => {
                const sId = e.target.value
                setSelectedStructureId(sId)
                const str = structures.find((s) => s._id === sId)
                if (str?.dueDate) {
                  setDueDate(new Date(str.dueDate).toISOString().split('T')[0])
                } else {
                  setDueDate('')
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20 font-medium"
            >
              {structures.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title || s.feeType} — {formatPKR(s.amount)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-red-500">
              No active fee structures for this student's class.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Base Fee Amount
            </label>
            <input
              type="text"
              disabled
              value={formatPKR(baseAmount)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Concession Waiver (PKR)
            </label>
            <input
              type="number"
              min="0"
              max={baseAmount}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Concession Type
            </label>
            <select
              value={concessionType}
              onChange={(e) => setConcessionType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="None">None</option>
              <option value="Need-Based Scholarship">Need-Based</option>
              <option value="Merit Scholarship">Merit</option>
              <option value="Sibling Concession">Sibling</option>
              <option value="Teacher Child Discount">Teacher Child</option>
              <option value="Special Management Concession">Special Management</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            Net Payable Amount:
          </span>
          <span className="font-black text-sm text-indigo-900 dark:text-indigo-300">
            {formatPKR(netAmount)}
          </span>
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!selectedStructureId}
            loading={saving}
          >
            Assign Fee
          </Button>
        </div>
      </form>
    </Modal>
  )
}
