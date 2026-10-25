import React, { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  UserCheck,
  Building,
  GraduationCap,
  CalendarCheck,
  FileText,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { formatDate } from '../../lib/formatters'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore } from '../../store/authStore'

// ─── Fast Period Attendance Modal ─────────────────────────────────────────────
function QuickPeriodAttendanceModal({ open, period, onClose, onAttendanceMarked }) {
  const toast = useToastStore()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState({}) // { studentId: 'Present' | 'Absent' | 'Late' | 'Excused' }

  useEffect(() => {
    if (!open || !period?.class?._id) return

    const loadRoster = async () => {
      setLoading(true)
      try {
        const res = await api.get('/students', {
          params: {
            classId: period.class._id,
            sectionId: period.sectionId,
            limit: 100,
          },
        })
        const studentList = res.data?.data || []
        setStudents(studentList)

        // Initialize all to Present by default
        const initRecs = {}
        studentList.forEach(s => {
          initRecs[s._id] = 'Present'
        })
        setRecords(initRecs)
      } catch (err) {
        toast.error('Failed to load class student roster')
      } finally {
        setLoading(false)
      }
    }

    loadRoster()
  }, [open, period, toast])

  const setAllStatus = (status) => {
    const updated = {}
    students.forEach(s => {
      updated[s._id] = status
    })
    setRecords(updated)
  }

  const toggleStudentStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        classId: period.class._id,
        sectionId: period.sectionId,
        date: new Date().toISOString().split('T')[0],
        periodNumber: period.periodNumber || 1,
        records: students.map(s => ({
          studentId: s._id,
          status: records[s._id] || 'Present',
        })),
      }

      const res = await api.post('/attendance/student', payload)
      if (res.data?.success) {
        toast.success(`Attendance recorded for ${period.class.name} (${period.sectionId}) — Period ${period.periodNumber}!`)
        onAttendanceMarked()
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !period) return null

  const presentCount = Object.values(records).filter(s => s === 'Present').length
  const absentCount = Object.values(records).filter(s => s === 'Absent').length
  const lateCount = Object.values(records).filter(s => s === 'Late').length

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold text-xs rounded-full uppercase">
                Period {period.periodNumber}
              </span>
              <span className="text-xs text-indigo-200">
                {period.startTime} – {period.endTime}
              </span>
            </div>
            <h3 className="text-lg font-bold mt-1">
              Take Attendance: {period.class?.name} ({period.sectionId})
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Subject: {period.subject?.name} · Room: {period.room || 'Classroom'}
            </p>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white text-lg">✕</button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAllStatus('Present')}
              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg font-bold"
            >
              ✓ All Present
            </button>
            <button
              type="button"
              onClick={() => setAllStatus('Absent')}
              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-bold"
            >
              ✕ All Absent
            </button>
          </div>

          <div className="flex gap-3 text-gray-600 font-semibold">
            <span className="text-green-700">Present: {presentCount}</span>
            <span className="text-red-600">Absent: {absentCount}</span>
            <span className="text-amber-600">Late: {lateCount}</span>
          </div>
        </div>

        {/* Student Roster List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <SkeletonTable rows={5} />
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No students enrolled in this class and section.
            </div>
          ) : (
            students.map((student, idx) => {
              const curStatus = records[student._id] || 'Present'
              return (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-xs truncate">{student.fullName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">ID: {student.studentId} · Roll: {student.rollNumber || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-1.5">
                    {['Present', 'Absent', 'Late', 'Excused'].map((st) => {
                      const isActive = curStatus === st
                      let btnColor = 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      if (isActive) {
                        if (st === 'Present') btnColor = 'bg-green-600 text-white font-bold shadow-sm'
                        if (st === 'Absent') btnColor = 'bg-red-600 text-white font-bold shadow-sm'
                        if (st === 'Late') btnColor = 'bg-amber-600 text-white font-bold shadow-sm'
                        if (st === 'Excused') btnColor = 'bg-blue-600 text-white font-bold shadow-sm'
                      }

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleStudentStatus(student._id, st)}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${btnColor}`}
                        >
                          {st}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || students.length === 0}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {submitting ? 'Saving Attendance…' : `Save Period Attendance (${students.length} Students)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Teacher Workspace Page ──────────────────────────────────────────────
export default function TeacherWorkspacePage() {
  const { user } = useAuthStore()
  const toast = useToastStore()

  const [workspace, setWorkspace] = useState(null)
  const [leaveRequests, setLeaveRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [reviewingId, setReviewingId] = useState(null)

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true)
    try {
      const [wsRes, leavesRes] = await Promise.allSettled([
        api.get('/teachers/me/workspace'),
        api.get('/teachers/leave-requests', { params: { status: 'Pending' } }),
      ])

      if (wsRes.status === 'fulfilled' && wsRes.value.data?.success) {
        setWorkspace(wsRes.value.data.data)
      }
      if (leavesRes.status === 'fulfilled' && leavesRes.value.data?.success) {
        setLeaveRequests(leavesRes.value.data.data || [])
      }
    } catch (err) {
      toast.error('Failed to load teacher workspace')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadWorkspaceData()
  }, [loadWorkspaceData])

  const handleReviewLeave = async (leaveId, status) => {
    setReviewingId(leaveId)
    try {
      const res = await api.patch(`/teachers/leave-requests/${leaveId}/review`, {
        status,
        remarks: `Reviewed by faculty: ${user?.username}`,
      })
      if (res.data?.success) {
        toast.success(`Leave request ${status.toLowerCase()} successfully!`)
        setLeaveRequests(prev => prev.filter(r => r._id !== leaveId))
        loadWorkspaceData()
      }
    } catch (err) {
      toast.error('Failed to review leave request')
    } finally {
      setReviewingId(null)
    }
  }

  const teacher = workspace?.teacher
  const today = workspace?.today
  const workload = workspace?.workload
  const assignedClasses = workspace?.assignedClasses || []

  return (
    <div className="space-y-6">
      <Breadcrumb
        title={`Faculty Workspace: ${teacher?.fullName || user?.username || 'Teacher'}`}
        subtitle={`Today is ${today?.dayName || 'Today'} · View today's periods, take fast attendance, and review student leaves.`}
      />

      {/* ── Top Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Today's Periods</p>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{today?.totalPeriodsToday ?? 0}</h3>
                <p className="text-[11px] text-indigo-600 font-medium">{today?.dayName} Schedule</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Assigned Classes</p>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{workload?.totalAssignedClasses ?? 0}</h3>
                <p className="text-[11px] text-teal-600 font-medium">Distinct Class Sections</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Total Students</p>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{workload?.totalStudents ?? 0}</h3>
                <p className="text-[11px] text-green-600 font-medium">Across Assigned Sections</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">Pending Leaves</p>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">{workload?.pendingLeaveRequests ?? 0}</h3>
                <p className="text-[11px] text-amber-600 font-medium">Parent Absence Notes</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Today's Schedule Card ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Today's Teaching Periods ({today?.dayName})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Click any period to record or review classroom attendance.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
            Session 2026
          </span>
        </div>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : !today?.periods || today.periods.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No scheduled periods for {today?.dayName || 'today'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Enjoy your free day or prepare lesson plans!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {today.periods.map((period) => {
              const isActive = period.status === 'active'
              const isCompleted = period.status === 'completed'

              return (
                <div
                  key={period._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                      : isCompleted
                      ? 'bg-gray-50 border-gray-200 opacity-80'
                      : 'bg-white border-gray-200 hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-bold text-xs rounded-lg">
                      Period {period.periodNumber}
                    </span>
                    {isActive ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" /> Active Now
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">
                        {period.startTime} – {period.endTime}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-base mt-1">
                    {period.subject?.name || 'Subject'}
                  </h3>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                    Class: {period.class?.name || 'Class'} ({period.sectionId})
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200/60">
                    <span>Room: <strong>{period.room || 'Classroom'}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeriod(period)
                        setShowAttendanceModal(true)
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Take Attendance
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Assigned Classes & Student Leave Requests Grid ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Classes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600" /> Assigned Classes & Attendance Status
            </h2>
          </div>

          <div className="space-y-3">
            {assignedClasses.length === 0 ? (
              <p className="text-xs text-gray-400">No classes assigned to this faculty profile.</p>
            ) : (
              assignedClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{cls.className} ({cls.sectionId})</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {cls.studentCount} Active Students · Subjects: {cls.subjects?.join(', ') || 'General'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {cls.isAttendanceMarkedToday ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Marked Today
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" /> Pending Today
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Student Leave Applications Review Queue */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" /> Student Leave Requests
            </h2>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              {leaveRequests.length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No pending student leave applications to review.
              </div>
            ) : (
              leaveRequests.map((leave) => (
                <div key={leave._id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xs text-gray-900">{leave.studentId?.fullName}</p>
                      <p className="text-[10px] text-gray-500">
                        {leave.classId?.name} ({leave.sectionId}) · Roll: {leave.studentId?.rollNumber || 'N/A'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      {leave.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-white p-2 rounded-lg border border-amber-100 italic">
                    "{leave.reason}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </span>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={reviewingId === leave._id}
                        onClick={() => handleReviewLeave(leave._id, 'Approved')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-[10px] flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={reviewingId === leave._id}
                        onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] flex items-center gap-1 shadow-sm"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Attendance Modal ────────────────────────────────────────── */}
      {showAttendanceModal && selectedPeriod && (
        <QuickPeriodAttendanceModal
          open={showAttendanceModal}
          period={selectedPeriod}
          onClose={() => {
            setShowAttendanceModal(false)
            setSelectedPeriod(null)
          }}
          onAttendanceMarked={loadWorkspaceData}
        />
      )}
    </div>
  )
}
