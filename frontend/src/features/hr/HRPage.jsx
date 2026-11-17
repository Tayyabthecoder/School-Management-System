import React, { useEffect, useState, useCallback } from 'react'
import {
  Briefcase, UserPlus, DollarSign, Calendar, ChevronDown, ChevronRight,
  Check, X, Download, Search, AlertTriangle,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { confirmAction } from '../../store/confirmStore'
import api from '../../lib/axios'
import { announceCredentials } from '../../lib/credentials'
import { formatPKR, formatDate } from '../../lib/formatters'
import { useToast } from '../../store/toastStore'
import StaffAttendanceRegister from './components/StaffAttendanceRegister'
import { logError } from '../../lib/logger'
import { cachedGet } from '../../lib/cachedGet'
import AddStaffModal from './components/AddStaffModal'
import LeaveRequestsPanel from './components/LeaveRequestsPanel'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HRPage() {
  const toast = useToast()
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
  const [finalizing, setFinalizing] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const payrollRun = payrollRecords.length > 0
  const draftCount = payrollRecords.filter((r) => r.status !== 'Finalized').length
  const unpaidFinalizedCount = payrollRecords.filter((r) => r.status === 'Finalized' && r.paymentStatus !== 'Paid').length

  useEffect(() => {
    cachedGet('/hr/staff')
      .then((res) => { if (res.data?.success) setStaff(res.data.data) })
      .catch(() => toast.error('Could not load staff list'))
      .finally(() => setLoading(false))
  }, [toast])

  // Show the payroll already generated for the selected month, so it can be finalized later
  useEffect(() => {
    let cancelled = false
    cachedGet(`/hr/payroll?month=${payMonth}&year=${payYear}`)
      .then((res) => { if (!cancelled) setPayrollRecords(res.data?.data || []) })
      .catch(() => { if (!cancelled) setPayrollRecords([]) })
    return () => { cancelled = true }
  }, [payMonth, payYear])

  const handleFinalizePayroll = async () => {
    const period = `${MONTHS[payMonth - 1]} ${payYear}`
    if (!(await confirmAction({ title: 'Finalize payroll', message: `Finalize ${draftCount} draft payroll record(s) for ${period}? Finalized records are locked and are not recalculated by later runs.`, confirmLabel: 'Finalize' }))) return
    setFinalizing(true)
    try {
      const res = await api.put('/hr/payroll/finalize', { month: payMonth, year: payYear })
      toast.success(res.data?.message || `Payroll finalized for ${period}`)
      setPayrollRecords((prev) => prev.map((r) => ({ ...r, status: 'Finalized' })))
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to finalize payroll')
    } finally {
      setFinalizing(false)
    }
  }

  const handleMarkPayrollPaid = async () => {
    const period = `${MONTHS[payMonth - 1]} ${payYear}`
    if (!(await confirmAction({ title: 'Mark payroll as paid', message: `Mark ${unpaidFinalizedCount} finalized payslip(s) for ${period} as paid? Do this after the salaries have actually been transferred.`, confirmLabel: 'Mark as paid' }))) return
    setMarkingPaid(true)
    try {
      const res = await api.put('/hr/payroll/mark-paid', { month: payMonth, year: payYear })
      toast.success(res.data?.message || `Payroll marked as paid for ${period}`)
      setPayrollRecords((prev) => prev.map((r) => (r.status === 'Finalized' ? { ...r, paymentStatus: 'Paid' } : r)))
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to mark payroll as paid')
    } finally {
      setMarkingPaid(false)
    }
  }

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
      logError('Failed to download payslip', err)
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
              <select aria-label="Month"
                value={payMonth}
                onChange={(e) => setPayMonth(Number(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1} className="text-gray-800">{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-200 mb-1">Year</label>
              <select aria-label="Year"
                value={payYear}
                onChange={(e) => setPayYear(Number(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm focus:ring-2 focus:ring-white/40 backdrop-blur-sm"
              >
                {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
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
            {payrollRun && draftCount > 0 && (
              <button
                onClick={handleFinalizePayroll}
                disabled={finalizing}
                className="px-5 py-2 bg-emerald-700 text-white hover:bg-emerald-800 font-bold text-sm rounded-lg shadow-sm disabled:opacity-60 transition-colors"
              >
                {finalizing ? 'Finalizing…' : `Finalize ${draftCount} Draft${draftCount === 1 ? '' : 's'}`}
              </button>
            )}
            {payrollRun && draftCount === 0 && unpaidFinalizedCount > 0 && (
              <button
                onClick={handleMarkPayrollPaid}
                disabled={markingPaid}
                className="px-5 py-2 bg-sky-500 text-white hover:bg-sky-600 font-bold text-sm rounded-lg shadow-sm disabled:opacity-60 transition-colors"
              >
                {markingPaid ? 'Saving…' : `Mark ${unpaidFinalizedCount} as Paid`}
              </button>
            )}
          </div>
        </div>

        {/* Payroll results */}
        {payrollRun && payrollRecords.length > 0 && (
          <div className="mt-5 bg-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-indigo-100 mb-3">
              {payrollRecords.length} payroll record(s) for {MONTHS[payMonth - 1]} {payYear}
              {draftCount === 0 ? ' · all finalized' : ` · ${draftCount} draft`}
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {payrollRecords.map((rec) => {
                const staffMember = staff.find((s) => s._id === (rec.staffId?._id || rec.staffId))
                const name = rec.staffId?.fullName || staffMember?.fullName || 'Staff'
                return (
                  <div key={rec._id} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                    <span className="text-sm text-white font-medium">{name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${rec.status === 'Finalized' ? 'bg-emerald-400/30 text-emerald-100' : 'bg-amber-400/30 text-amber-100'}`}>
                        {rec.status === 'Finalized' && rec.paymentStatus === 'Paid' ? 'Paid' : (rec.status || 'Draft')}
                      </span>
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

      {/* ── Staff Attendance (FUNC-03) ───────────────────────────────────── */}
      <StaffAttendanceRegister staff={staff} />

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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input aria-label="Search staff…"
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
                          <p className="text-xs text-gray-500">{s.staffId}</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="text-sm text-gray-700">{s.designation}</p>
                        <p className="text-xs text-gray-500">{s.department}</p>
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
                          className={`w-4 h-4 text-gray-500 transition-transform ${expanded === s._id ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                    {expanded === s._id && (
                      <div className="bg-indigo-50/50 px-5 py-4 border-t border-indigo-100 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Phone</p>
                          <p className="text-gray-700 mt-0.5">{s.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Email</p>
                          <p className="text-gray-700 mt-0.5 truncate">{s.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">Joining Date</p>
                          <p className="text-gray-700 mt-0.5">{formatDate(s.joiningDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">CNIC</p>
                          <p className="text-gray-700 mt-0.5">{s.cnic || '—'}</p>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-500">No staff members found</div>
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
