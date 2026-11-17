import React, { useEffect, useState, useCallback } from 'react'
import { Calendar, Check, X } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { SkeletonTable } from '../../../components/ui/Skeleton'
import api from '../../../lib/axios'
import { formatDate } from '../../../lib/formatters'
import { useToast } from '../../../store/toastStore'
import { cachedGet } from '../../../lib/cachedGet'

// ─── Leave Request Table ──────────────────────────────────────────────────────
export default function LeaveRequestsPanel({ onStatusChange }) {
  const toast = useToast()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cachedGet(`/hr/leave?status=${filter}`)
      if (res.data?.success) setLeaves(res.data.data)
    } catch {
      toast.error('Could not load leave requests')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleReview = async (leaveId, status) => {
    try {
      await api.put('/hr/leave/review', { leaveId, status })
      toast.success(`Leave request ${status.toLowerCase()} successfully`)
      load()
    } catch {
      toast.error('Failed to update leave request')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          Leave Requests
        </h3>
        <div className="flex gap-2">
          {['Pending', 'Approved', 'Rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="p-6"><SkeletonTable rows={3} /></div>
      ) : leaves.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-400">
          No {filter.toLowerCase()} leave requests
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {leaves.map((leave) => (
            <div key={leave._id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">
                  {leave.staffId?.fullName || 'Staff Member'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {leave.leaveType} · {formatDate(leave.fromDate)} — {formatDate(leave.toDate)}
                </p>
                {leave.reason && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 italic">"{leave.reason}"</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  leave.status === 'Approved' ? 'success' :
                  leave.status === 'Rejected' ? 'danger' : 'warning'
                }>
                  {leave.status}
                </Badge>
                {leave.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleReview(leave._id, 'Approved')}
                      className="p-1.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReview(leave._id, 'Rejected')}
                      className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
