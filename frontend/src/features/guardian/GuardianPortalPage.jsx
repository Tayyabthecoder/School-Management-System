import React, { useEffect, useState } from 'react'
import {
  User,
  CalendarCheck,
  Award,
  CircleDollarSign,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Phone,
  MapPin,
  Send,
  Plus,
  XCircle,
} from 'lucide-react'
import api from '../../lib/axios'
import { formatPKR, formatDate } from '../../lib/formatters'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import { useToast } from '../../store/toastStore'
import { cachedGet } from '../../lib/cachedGet'
import LeaveRequestModal from './components/LeaveRequestModal'
import GuardianGradesTab from './components/GuardianGradesTab'
import GuardianAttendanceTab from './components/GuardianAttendanceTab'

const TABS = [
  { id: 'child', label: 'My Child', icon: User },
  { id: 'attendance', label: 'Attendance & Leaves', icon: CalendarCheck },
  { id: 'grades', label: 'Grades & Exams', icon: Award },
  { id: 'fees', label: 'Fee Records', icon: CircleDollarSign },
]

export default function GuardianPortalPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('child')
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState(null)
  // FUNC-04: a guardian may have several children; every request is scoped with ?studentId=
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [grades, setGrades] = useState([])
  const [fees, setFees] = useState([])
  const [error, setError] = useState(null)
  const [selectedTerm, setSelectedTerm] = useState('All')

  // Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    category: 'Sick',
    reason: '',
  })
  const [submittingLeave, setSubmittingLeave] = useState(false)

  const fetchPortalData = async (requestedChildId = selectedChildId) => {
    setLoading(true)
    setError(null)
    try {
      let childId = requestedChildId
      if (!childId) {
        const listRes = await cachedGet('/guardian/my-children').catch(() => null)
        const list = listRes?.data?.data || []
        setChildren(list)
        childId = list[0]?._id || null
        setSelectedChildId(childId)
      }
      const scope = childId ? { params: { studentId: childId } } : undefined

      const [childRes, attRes, leavesRes, gradesRes, feesRes] = await Promise.allSettled([
        cachedGet('/guardian/my-child', scope),
        cachedGet('/guardian/attendance', scope),
        cachedGet('/guardian/leave-requests', scope),
        cachedGet('/guardian/grades', scope),
        cachedGet('/guardian/fees', scope),
      ])

      // Reset per-child data so nothing from the previously selected child lingers
      setAttendance(null)
      setLeaveRequests([])
      setGrades([])
      setFees([])
      setSelectedTerm('All')

      if (childRes.status === 'fulfilled' && childRes.value.data?.success) {
        setChild(childRes.value.data.data)
      } else {
        setError(childRes.reason?.response?.data?.error?.message || 'Unable to load child profile')
      }

      if (attRes.status === 'fulfilled' && attRes.value.data?.success) {
        setAttendance(attRes.value.data.data)
      }

      if (leavesRes.status === 'fulfilled' && leavesRes.value.data?.success) {
        setLeaveRequests(leavesRes.value.data.data || [])
      }

      if (gradesRes.status === 'fulfilled' && gradesRes.value.data?.success) {
        setGrades(gradesRes.value.data.data)
      }

      if (feesRes.status === 'fulfilled' && feesRes.value.data?.success) {
        setFees(feesRes.value.data.data)
      }
    } catch (err) {
      setError('An unexpected error occurred while loading guardian portal data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortalData(null)
  }, [])

  const handleSelectChild = (childId) => {
    if (!childId || childId === selectedChildId) return
    setSelectedChildId(childId)
    fetchPortalData(childId)
  }

  const handleSubmitLeave = async (e) => {
    e.preventDefault()
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error('Please fill in all required leave details')
      return
    }

    setSubmittingLeave(true)
    try {
      const res = await api.post('/guardian/leave-requests', { ...leaveForm, studentId: selectedChildId || undefined })
      if (res.data?.success) {
        toast.success('Leave application submitted to class teacher successfully!')
        setShowLeaveModal(false)
        setLeaveForm({ startDate: '', endDate: '', category: 'Sick', reason: '' })
        fetchPortalData(selectedChildId)
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit leave request')
    } finally {
      setSubmittingLeave(false)
    }
  }

  const handleDownloadChallan = async (challanId, challanNo) => {
    try {
      const res = await api.get(`/finance/challans/${challanId}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Challan_${challanNo || challanId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Unable to generate Challan PDF. Please contact school administration.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-40" />
        <SkeletonTable rows={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">Unable to Access Portal</h3>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
        <p className="text-gray-500 dark:text-slate-400 text-xs mt-3">
          Please verify your parent account credentials or contact the school office.
        </p>
      </div>
    )
  }

  const attSummary = attendance?.summary || {}
  const attHistory = attendance?.history || []
  const attPct = parseInt(attSummary.attendancePercentage || '100', 10)
  const isLowAttendance = attPct < 75

  const terms = ['All', ...new Set(grades.map(g => g.examId?.name).filter(Boolean))]
  const filteredGrades = selectedTerm === 'All' ? grades : grades.filter(g => g.examId?.name === selectedTerm)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {children.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Select child">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 mr-1">Viewing:</span>
          {children.map((c) => {
            const selected = c._id === selectedChildId
            return (
              <button
                key={c._id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleSelectChild(c._id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {c.fullName}{c.classId?.name ? ` · ${c.classId.name}` : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Student Header Card ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-indigo-400/40 flex items-center justify-center text-2xl font-black shadow-inner">
            {child?.fullName?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{child?.fullName}</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold rounded-full">
                {child?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Class: <strong>{child?.classId?.name || 'Assigned Class'}</strong> ({child?.sectionId}) · Roll No: <strong>{child?.rollNumber || 'N/A'}</strong>
            </p>
            <p className="text-xs text-indigo-300 font-mono mt-0.5">
              Student ID: {child?.studentId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial bg-indigo-950/60 border border-indigo-700/50 p-3 rounded-2xl text-center">
            <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Attendance</div>
            <div className={`text-lg font-black ${isLowAttendance ? 'text-amber-400' : 'text-emerald-400'}`}>
              {attSummary.attendancePercentage || '100%'}
            </div>
          </div>
          <div className="flex-1 md:flex-initial bg-indigo-950/60 border border-indigo-700/50 p-3 rounded-2xl text-center">
            <div className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Exams Taken</div>
            <div className="text-lg font-black text-indigo-100">{grades.length}</div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl px-3 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-4 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: Profile ─────────────────────────────────────────── */}
      {activeTab === 'child' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Academic & Personal Details
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Full Name</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{child?.fullName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Student ID</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{child?.studentId}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Date of Birth</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{formatDate(child?.dob)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Gender</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{child?.gender}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Blood Group</span>
                <span className="font-bold text-red-600 dark:text-red-400">{child?.bloodGroup || 'O+'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Enrollment Date</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{formatDate(child?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Parent & Emergency Contacts
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Guardian Name</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{child?.guardian?.name || 'Registered Parent'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Primary Phone</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{child?.guardian?.phone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Residential Address</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{child?.address || 'On file'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Emergency Contact</span>
                <span className="font-bold text-gray-900 dark:text-slate-100">{child?.guardian?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Attendance & Leaves ──────────────────────────────── */}
      {activeTab === 'attendance' && (
        <GuardianAttendanceTab
          attSummary={attSummary}
          attHistory={attHistory}
          isLowAttendance={isLowAttendance}
          attendance={attendance}
          leaveRequests={leaveRequests}
          setShowLeaveModal={setShowLeaveModal}
        />
      )}

      {/* ── TAB 3: Grades ──────────────────────────────────────────── */}
      {activeTab === 'grades' && (
        <GuardianGradesTab
          terms={terms}
          filteredGrades={filteredGrades}
          grades={grades}
          selectedTerm={selectedTerm}
          setSelectedTerm={setSelectedTerm}
        />
      )}

      {/* ── TAB 4: Fees ────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Fee Invoices & Digital Challans</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Download fee challans and check receipt records</p>
          </div>

          {fees.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-xs">
              No fee records found for this student.
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((f) => (
                <div
                  key={f._id}
                  className="p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">{f.feeStructureId?.name || 'Tuition Fee'}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        f.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' : f.status === 'Overdue' ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">
                      Due: <strong>{formatDate(f.dueDate)}</strong> · Total: <strong>{formatPKR(f.netAmount || f.amount)}</strong> · Outstanding: <strong className="text-red-600 dark:text-red-400">{formatPKR(f.outstandingAmount || 0)}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadChallan(f._id, f.challanNo)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Challan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Leave Application Modal ────────────────────────────────── */}
      {showLeaveModal && (
        <LeaveRequestModal
          handleSubmitLeave={handleSubmitLeave}
          child={child}
          setShowLeaveModal={setShowLeaveModal}
          leaveForm={leaveForm}
          setLeaveForm={setLeaveForm}
          submittingLeave={submittingLeave}
        />
      )}
    </div>
  )
}
