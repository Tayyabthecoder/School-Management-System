import React, { useState, useEffect } from 'react'
import Modal from '../../../../../components/ui/Modal'
import Button from '../../../../../components/ui/Button'
import api from '../../../../../lib/axios'
import { formatPKR } from '../../../../../lib/formatters'
import { useToast } from '../../../../../store/toastStore'
import { logError } from '../../../../../lib/logger'

// ─── Modal: Assign Additional Fee ─────────────────────────────────────────────
export function AssignFeeModal({ open, student, onClose, onSuccess }) {
  const toast = useToast()
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
          .catch((err) => logError(err))
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
      logError(err)
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading fee structures…</p>
          ) : structures.length > 0 ? (
            <select aria-label="Fee structure"
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
            <input aria-label="Base Fee Amount"
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
            <input aria-label="Due Date"
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
            <input aria-label="Concession Waiver (PKR)"
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
            <select aria-label="Concession Type"
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
