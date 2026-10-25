import React, { useEffect, useState, useCallback } from 'react'
import {
  Briefcase, UserPlus, DollarSign, Calendar, ChevronDown, ChevronRight,
  Check, X, Download, Search, AlertTriangle,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { formatPKR, formatDate } from '../../lib/formatters'
import { useToastStore } from '../../store/toastStore'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
function AddStaffModal({ open, onClose, onAdded }) {
  const toast = useToastStore()
  const [form, setForm] = useState({
    fullName: '', cnic: '', phone: '', email: '',
    designation: '', department: 'Academics', joiningDate: '', salary: '',
  })
  const [saving, setSaving] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/hr/staff', form)
      if (res.data?.success) {
        toast.success(`Staff member "${form.fullName}" added successfully!`)
        onAdded(res.data.data)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Staff Member</h2>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Full Name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CNIC</label>
              <input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="42101-1234567-1" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="+92300…" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="email@school.edu.pk" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Department *</label>
              <select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {['Academics', 'Finance', 'HR', 'Administration', 'IT', 'Operations'].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Designation *</label>
              <input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Senior Teacher" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Salary (PKR) *</label>
              <input required type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="50000" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60">
              {saving ? 'Adding…' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Leave Request Table ──────────────────────────────────────────────────────
function LeaveRequestsPanel({ onStatusChange }) {
  const toast = useToastStore()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/hr/leave?status=${filter}`)
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
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
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        <div className="py-12 text-center text-sm text-gray-400">
          No {filter.toLowerCase()} leave requests
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {leaves.map((leave) => (
            <div key={leave._id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">
                  {leave.staffId?.fullName || 'Staff Member'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {leave.leaveType} · {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                </p>
                {leave.reason && (
                  <p className="text-xs text-gray-400 mt-0.5 italic">"{leave.reason}"</p>
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
                      className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReview(leave._id, 'Rejected')}
                      className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HRPage() {
  const toast = useToastStore()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [expanded, setExpanded] = useState(null)

  // Payroll controls
  const [payMonth, setPayMonth] = useState(CURRENT_MONTH)
  const [payYear, setPayYear] = useState(CURRENT_YEAR)
  const [runningPayroll, setRunningPayroll] = useState(false)
  const [payrollRecords, setPayrollRecords] = useState([])
  const [payrollRun, setPayrollRun] = useState(false)

  useEffect(() => {
    api.get('/hr/staff')
      .then((res) => { if (res.data?.success) setStaff(res.data.data) })
      .catch(() => toast.error('Could not load staff list'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = staff.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.staffId?.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.toLowerCase().includes(search.toLowerCase())
  )

  const handleRunPayroll = async () => {
    setRunningPayroll(true)
    try {
      const res = await api.post('/hr/payroll/run', { month: payMonth, year: payYear })
      if (res.data?.success) {
        toast.success(`Payroll executed for ${res.data.count} staff for ${MONTHS[payMonth - 1]} ${payYear}!`)
        setPayrollRecords(res.data.data)
        setPayrollRun(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payroll execution failed')
    } finally {
      setRunningPayroll(false)
    }
  }

  const handleDownloadPayslip = async (recordId, staffName) => {
    try {
      toast.info(`Downloading payslip for ${staffName}...`)
      const res = await api.get(`/hr/payroll/payslip/${recordId}`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `Payslip-${(staffName || 'Staff').replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      toast.success(`Payslip downloaded for ${staffName}`)
    } catch (err) {
      console.error('Failed to download payslip', err)
      toast.error('Failed to download payslip')
    }
  }

  return (
    <div>
      <Breadcrumb
        title="HR & Staff Payroll Management"
        subtitle="Manage staff profiles, leave approvals, and run monthly payroll."
      />

      {/* ── Payroll Runner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Payroll Runner
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              Select a month & year and run payroll for all active staff
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1">Month</label>
              <select
                value={payMonth}
                onChange={(e) => { setPayMonth(Number(e.target.value)); setPayrollRun(false) }}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1} className="text-gray-800">{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1">Year</label>
              <select
                value={payYear}
                onChange={(e) => { setPayYear(Number(e.target.value)); setPayrollRun(false) }}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="text-gray-800">{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRunPayroll}
              disabled={runningPayroll}
              className="px-5 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm rounded-lg shadow-sm disabled:opacity-60 transition-colors"
            >
              {runningPayroll ? 'Processing…' : `Run ${MONTHS[payMonth - 1]} ${payYear} Payroll`}
            </button>
          </div>
        </div>

        {/* Payroll results */}
        {payrollRun && payrollRecords.length > 0 && (
          <div className="mt-5 bg-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-indigo-100 mb-3">
              ✓ Payroll processed for {payrollRecords.length} staff members
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {payrollRecords.map((rec) => {
                const staffMember = staff.find((s) => s._id === (rec.staffId?._id || rec.staffId))
                const name = rec.staffId?.fullName || staffMember?.fullName || 'Staff'
                return (
                  <div key={rec._id} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                    <span className="text-sm text-white font-medium">{name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-300">{formatPKR(rec.netPay)}</span>
                      <button
                        onClick={() => handleDownloadPayslip(rec._id, name)}
                        className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg"
                      >
                        <Download className="w-3 h-3" />
                        Payslip
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Staff List & Leave Requests ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Staff List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              Staff Directory ({filtered.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-48"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Staff Member</div>
                <div className="col-span-3">Role & Department</div>
                <div className="col-span-2 text-right">Salary</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1" />
              </div>
              <div className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <React.Fragment key={s._id}>
                    <div
                      className="grid grid-cols-12 px-5 py-4 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === s._id ? null : s._id)}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                          {s.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{s.fullName}</p>
                          <p className="text-xs text-gray-400">{s.staffId}</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-gray-700">{s.designation}</p>
                        <p className="text-xs text-gray-400">{s.department}</p>
                      </div>
                      <div className="col-span-2 text-right font-semibold text-gray-800 text-sm">
                        {formatPKR(s.salary)}
                      </div>
                      <div className="col-span-2 text-center">
                        <Badge variant={s.isActive ? 'success' : 'secondary'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-right">
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${expanded === s._id ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                    {expanded === s._id && (
                      <div className="bg-indigo-50/50 px-5 py-4 border-t border-indigo-100 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Phone</p>
                          <p className="text-gray-700 mt-0.5">{s.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Email</p>
                          <p className="text-gray-700 mt-0.5 truncate">{s.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">Joining Date</p>
                          <p className="text-gray-700 mt-0.5">{formatDate(s.joiningDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold">CNIC</p>
                          <p className="text-gray-700 mt-0.5">{s.cnic || '—'}</p>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-400">No staff members found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Leave Requests */}
        <div>
          <LeaveRequestsPanel />
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={(newStaff) => setStaff((prev) => [newStaff, ...prev])}
      />
    </div>
  )
}
