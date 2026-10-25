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
import { useToastStore } from '../../store/toastStore'

const TABS = [
  { id: 'child', label: 'My Child', icon: User },
  { id: 'attendance', label: 'Attendance & Leaves', icon: CalendarCheck },
  { id: 'grades', label: 'Grades & Exams', icon: Award },
  { id: 'fees', label: 'Fee Records', icon: CircleDollarSign },
]

export default function GuardianPortalPage() {
  const toast = useToastStore()
  const [activeTab, setActiveTab] = useState('child')
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState(null)
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

  const fetchPortalData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [childRes, attRes, leavesRes, gradesRes, feesRes] = await Promise.allSettled([
        api.get('/guardian/my-child'),
        api.get('/guardian/attendance'),
        api.get('/guardian/leave-requests'),
        api.get('/guardian/grades'),
        api.get('/guardian/fees'),
      ])

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
    fetchPortalData()
  }, [])

  const handleSubmitLeave = async (e) => {
    e.preventDefault()
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error('Please fill in all required leave details')
      return
    }

    setSubmittingLeave(true)
    try {
      const res = await api.post('/guardian/leave-requests', leaveForm)
      if (res.data?.success) {
        toast.success('Leave application submitted to class teacher successfully!')
        setShowLeaveModal(false)
        setLeaveForm({ startDate: '', endDate: '', category: 'Sick', reason: '' })
        fetchPortalData()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request')
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
      alert('Unable to generate Challan PDF. Please contact school administration.')
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
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-red-900 text-lg">Unable to Access Portal</h3>
        <p className="text-red-700 text-sm mt-1">{error}</p>
        <p className="text-gray-500 text-xs mt-3">
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
      <div className="flex border-b border-gray-200 bg-white rounded-2xl px-3 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-4 text-xs font-bold transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
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
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Academic & Personal Details
            </h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Full Name</span>
                <span className="font-bold text-gray-900">{child?.fullName}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Student ID</span>
                <span className="font-mono font-bold text-indigo-600">{child?.studentId}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-bold text-gray-900">{formatDate(child?.dob)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Gender</span>
                <span className="font-bold text-gray-900">{child?.gender}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Blood Group</span>
                <span className="font-bold text-red-600">{child?.bloodGroup || 'O+'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Enrollment Date</span>
                <span className="font-bold text-gray-900">{formatDate(child?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" /> Parent & Emergency Contacts
            </h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Guardian Name</span>
                <span className="font-bold text-gray-900">{child?.guardian?.name || 'Registered Parent'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Primary Phone</span>
                <span className="font-bold text-gray-900">{child?.guardian?.phone}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Residential Address</span>
                <span className="font-bold text-gray-900">{child?.address || 'On file'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Emergency Contact</span>
                <span className="font-bold text-gray-900">{child?.guardian?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Attendance & Leaves ──────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Attendance & Absence Management</h3>
              <p className="text-xs text-gray-400 mt-0.5">Track daily attendance and submit digital leave applications</p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Apply for Student Leave
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <span className="text-xs text-gray-500 font-semibold uppercase">Total Sessions</span>
              <div className="text-2xl font-black text-gray-900 mt-1">{attSummary.totalDays || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <span className="text-xs text-gray-500 font-semibold uppercase">Present Days</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{attSummary.presentDays || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <span className="text-xs text-gray-500 font-semibold uppercase">Attendance Rate</span>
              <div className={`text-2xl font-black mt-1 ${isLowAttendance ? 'text-amber-600' : 'text-emerald-600'}`}>
                {attSummary.attendancePercentage || '100%'}
              </div>
            </div>
          </div>

          {/* Leave Requests Status List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Submitted Leave Applications</h4>
            {leaveRequests.length === 0 ? (
              <p className="text-xs text-gray-400">No leave requests submitted yet.</p>
            ) : (
              <div className="space-y-2">
                {leaveRequests.map((leave) => {
                  let statusBg = 'bg-amber-100 text-amber-800'
                  if (leave.status === 'Approved') statusBg = 'bg-green-100 text-green-800'
                  if (leave.status === 'Rejected') statusBg = 'bg-red-100 text-red-800'

                  return (
                    <div key={leave._id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{leave.category} Leave</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBg}`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · Reason: <em>"{leave.reason}"</em>
                        </p>
                      </div>

                      {leave.reviewRemarks && (
                        <span className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                          Note: {leave.reviewRemarks}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Daily Records List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-700">
              Daily Attendance Timeline
            </div>
            {attHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">No attendance recorded yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {attHistory.map((rec, i) => {
                  let statusBg = 'bg-emerald-100 text-emerald-800'
                  if (rec.status === 'Absent') statusBg = 'bg-red-100 text-red-800'
                  if (rec.status === 'Late') statusBg = 'bg-amber-100 text-amber-800'
                  if (rec.status === 'Excused') statusBg = 'bg-blue-100 text-blue-800'

                  return (
                    <div key={i} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50">
                      <div>
                        <span className="font-bold text-gray-800">{formatDate(rec.date)}</span>
                        {rec.remarks && <p className="text-[11px] text-gray-400 mt-0.5">{rec.remarks}</p>}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${statusBg}`}>
                        {rec.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Grades ──────────────────────────────────────────── */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Examination Marks & Performance</h3>
              <p className="text-xs text-gray-400">Published examination grades</p>
            </div>

            {terms.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                {terms.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerm(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedTerm === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredGrades.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No examination marks published for this term yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Exam</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3 text-center">Marks Obtained</th>
                    <th className="p-3 text-center">Total Marks</th>
                    <th className="p-3 text-center">Percentage</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGrades.map((g) => {
                    const marks = g.marksObtained ?? 0
                    const total = g.examId?.totalMarks || 100
                    const pct = Math.round((marks / total) * 100)
                    const isPassing = marks >= (g.examId?.passMarks || 33)

                    return (
                      <tr key={g._id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">{g.examId?.name || 'Term Exam'}</td>
                        <td className="p-3 font-semibold text-gray-700">{g.examId?.subjectId?.name || 'Subject'}</td>
                        <td className="p-3 text-center font-bold text-gray-900">{marks}</td>
                        <td className="p-3 text-center text-gray-500">{total}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{pct}%</td>
                        <td className="p-3 text-center">
                          {isPassing ? (
                            <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full text-[10px]">
                              Passed
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[10px]">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Fees ────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Fee Invoices & Digital Challans</h3>
            <p className="text-xs text-gray-400 mt-0.5">Download fee challans and check receipt records</p>
          </div>

          {fees.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No fee records found for this student.
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((f) => (
                <div
                  key={f._id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{f.feeStructureId?.name || 'Tuition Fee'}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        f.status === 'Paid' ? 'bg-green-100 text-green-800' : f.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-1">
                      Due: <strong>{formatDate(f.dueDate)}</strong> · Total: <strong>{formatPKR(f.netAmount || f.amount)}</strong> · Outstanding: <strong className="text-red-600">{formatPKR(f.outstandingAmount || 0)}</strong>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-indigo-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">Apply for Student Leave</h3>
                <p className="text-xs text-indigo-300 mt-0.5">Submit an absence note to {child?.fullName}'s teacher</p>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-indigo-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Leave Category</label>
                <select
                  value={leaveForm.category}
                  onChange={(e) => setLeaveForm({ ...leaveForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                >
                  <option value="Sick">Sick / Illness</option>
                  <option value="Medical">Medical Appointment / Hospital</option>
                  <option value="Family">Family Event / Emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason / Note *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Suffering from viral fever, doctor advised 2 days bed rest…"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingLeave ? 'Submitting…' : 'Submit Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
