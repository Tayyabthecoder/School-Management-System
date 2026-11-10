import React, { useCallback, useEffect, useState } from 'react'
import { CalendarPlus, Send } from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { formatDate } from '../../lib/formatters'
import { useToast } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'

const LEAVE_TYPES = ['Casual', 'Sick', 'Annual', 'Medical', 'Unpaid', 'Maternity', 'Paternity']
const EMPTY_FORM = { leaveType: 'Casual', fromDate: '', toDate: '', reason: '' }

/**
 * FUNC-03: staff (teachers, accountants, HR) request leave and follow its status.
 * The backend files the request against the signed-in user's own staff record.
 */
export default function MyLeavePage() {
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/hr/leave')
      setRequests(res.data?.data || [])
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Could not load your leave requests')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.toDate < form.fromDate) {
      toast.warning('The end date cannot be before the start date.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/hr/leave', { ...form, reason: form.reason.trim() })
      toast.success('Leave request submitted for HR review')
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  const noStaffRecord = !user?.staffId

  return (
    <div>
      <Breadcrumb title="My Leave" subtitle="Request leave and track HR decisions." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-indigo-500" /> New Leave Request
          </h2>
          {noStaffRecord && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Your account is not linked to a staff record, so leave cannot be filed from it. Ask HR to link it.
            </p>
          )}
          <div>
            <label htmlFor="leaveType" className="block text-xs font-semibold text-gray-600 mb-1">Leave type</label>
            <select
              id="leaveType"
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fromDate" className="block text-xs font-semibold text-gray-600 mb-1">From</label>
              <input id="fromDate" required type="date" value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label htmlFor="toDate" className="block text-xs font-semibold text-gray-600 mb-1">To</label>
              <input id="toDate" required type="date" value={form.toDate} min={form.fromDate || undefined}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="reason" className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
            <textarea id="reason" required minLength={3} maxLength={500} rows={3} value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <Button type="submit" variant="primary" icon={<Send className="w-4 h-4" />} loading={submitting} disabled={noStaffRecord} className="w-full">
            Submit Request
          </Button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">My Requests</h2>
          </div>
          {loading ? (
            <div className="p-6"><SkeletonTable rows={3} /></div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">You have not requested any leave yet.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((r) => (
                <div key={r._id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      {r.leaveType} · {formatDate(r.fromDate)} — {formatDate(r.toDate)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.reason}</p>
                    {r.reviewRemarks && <p className="text-xs text-gray-400 mt-0.5 italic">HR: {r.reviewRemarks}</p>}
                  </div>
                  <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'danger' : 'warning'}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
