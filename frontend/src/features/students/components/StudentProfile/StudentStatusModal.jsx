import React, { useState, useEffect } from 'react'
import Modal from '../../../../components/ui/Modal'
import Button from '../../../../components/ui/Button'
import api from '../../../../lib/axios'
import { useToastStore } from '../../../../store/toastStore'

export default function StudentStatusModal({ open, student, onClose, onUpdated }) {
  const toast = useToastStore()
  const [status, setStatus] = useState(student?.status || 'Active')
  const [transferReason, setTransferReason] = useState(student?.transferReason || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (student) {
      setStatus(student.status || 'Active')
      setTransferReason(student.transferReason || '')
    }
  }, [student, open])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.put(`/students/${student._id}`, {
        status,
        transferReason: status !== 'Active' ? transferReason : '',
        transferDate: status !== 'Active' ? new Date() : null,
      })
      if (res.data?.success) {
        toast.success(`Student status updated to "${status}"!`)
        onUpdated(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student status')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !student) return null

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Update Status / Transfer Record"
      subtitle={`Student: ${student.fullName} (${student.studentId || 'ID'})`}
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Enrollment Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            <option value="Active">Active (Regularly Enrolled)</option>
            <option value="Transferred">Transferred to Another School</option>
            <option value="Withdrawn">Withdrawn by Guardian</option>
            <option value="Graduated">Graduated / Completed</option>
          </select>
        </div>

        {status !== 'Active' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Remarks *
            </label>
            <textarea
              required
              rows={3}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Relocated to another city, School Leaving Certificate issued…"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Save Status
          </Button>
        </div>
      </form>
    </Modal>
  )
}
