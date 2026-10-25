import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Calendar,
  Users,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  FileText,
  Check,
  CheckCheck,
  XCircle,
  XSquare,
  RotateCcw,
} from 'lucide-react'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import GradeSectionNavigator from '../../components/ui/GradeSectionNavigator'
import api from '../../lib/axios'
import { formatDate } from '../../lib/formatters'
import { useToastStore } from '../../store/toastStore'
import { GRADE_THEMES, FALLBACK_GRADES } from '../../constants/grades'

export default function AttendancePage() {
  const toast = useToastStore()
  const [activeMainTab, setActiveMainTab] = useState('attendance') // 'attendance' | 'leaves'
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const [navLevel, setNavLevel] = useState('grades')
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Leave Requests state
  const [leaveRequests, setLeaveRequests] = useState([])
  const [leavesLoading, setLeavesLoading] = useState(false)
  const [leaveFilter, setLeaveFilter] = useState('ALL')
  const [reviewingId, setReviewingId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsRes, stuRes] = await Promise.all([
          api.get('/classes'),
          api.get('/students', { params: { limit: 100 } }),
        ])
        if (clsRes.data?.success && clsRes.data.data.length > 0) {
          setClasses(clsRes.data.data)
        } else {
          setClasses(FALLBACK_GRADES)
        }
        if (stuRes.data?.success) setStudents(stuRes.data.data)
      } catch (err) {
        setClasses(FALLBACK_GRADES)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadLeaveRequests = async () => {
    setLeavesLoading(true)
    try {
      const res = await api.get('/teachers/leave-requests', {
        params: { status: leaveFilter !== 'ALL' ? leaveFilter : undefined },
      })
      if (res.data?.success) {
        setLeaveRequests(res.data.data || [])
      }
    } catch {
      toast.error('Could not load student leave requests')
    } finally {
      setLeavesLoading(false)
    }
  }

  useEffect(() => {
    if (activeMainTab === 'leaves') {
      loadLeaveRequests()
    }
  }, [activeMainTab, leaveFilter])

  const handleReviewLeave = async (leaveId, status) => {
    setReviewingId(leaveId)
    try {
      const res = await api.patch(`/teachers/leave-requests/${leaveId}/review`, {
        status,
        remarks: `Reviewed by school administration`,
      })
      if (res.data?.success) {
        toast.success(`Leave request ${status.toLowerCase()} successfully!`)
        loadLeaveRequests()
      }
    } catch {
      toast.error('Failed to review leave application')
    } finally {
      setReviewingId(null)
    }
  }

  const displayClasses = classes && classes.length > 0 ? classes : FALLBACK_GRADES

  const handleSelectGrade = (cls) => {
    setSelectedGrade(cls)
    setSelectedSection(null)
    setNavLevel('sections')
  }

  const loadExistingAttendance = useCallback(async (grade, section, date) => {
    if (!grade || !section) return
    const secStudents = students.filter(
      s => s.classId && (s.classId._id === grade._id || s.classId === grade._id || s.classId?.name === grade.name) && s.sectionId === section
    )
    const initial = {}
    secStudents.forEach(s => { initial[s._id] = 'Present' })

    try {
      const res = await api.get('/attendance/student', {
        params: {
          classId: grade._id,
          sectionId: section,
          date,
        },
      })
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const attDoc = res.data.data[0]
        if (Array.isArray(attDoc.records)) {
          attDoc.records.forEach((r) => {
            const sid = r.studentId?._id || r.studentId
            if (sid && initial.hasOwnProperty(sid)) {
              initial[sid] = r.status
            }
          })
        }
      }
    } catch (err) {
      console.warn('Could not fetch existing attendance, using defaults', err)
    }
    setAttendance(initial)
  }, [students])

  const handleSelectSection = (sec) => {
    setSelectedSection(sec)
    setNavLevel('roster')
    loadExistingAttendance(selectedGrade, sec, attendanceDate)
  }

  const handleDateChange = (newDate) => {
    setAttendanceDate(newDate)
    if (navLevel === 'roster' && selectedGrade && selectedSection) {
      loadExistingAttendance(selectedGrade, selectedSection, newDate)
    }
  }

  const handleMarkAllPresent = () => {
    const updated = { ...attendance }
    Object.keys(updated).forEach(k => { updated[k] = 'Present' })
    setAttendance(updated)
  }

  const handleMarkAllAbsent = () => {
    const updated = { ...attendance }
    Object.keys(updated).forEach(k => { updated[k] = 'Absent' })
    setAttendance(updated)
  }

  const handleInvertAttendance = () => {
    const updated = { ...attendance }
    Object.keys(updated).forEach(k => {
      updated[k] = updated[k] === 'Present' ? 'Absent' : 'Present'
    })
    setAttendance(updated)
  }

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSubmitAttendance = async () => {
    if (!selectedGrade || !selectedSection) return
    setSubmitting(true)

    try {
      const records = Object.keys(attendance).map(studentId => ({
        studentId,
        status: attendance[studentId],
      }))

      await api.post('/attendance/student', {
        classId: selectedGrade._id,
        sectionId: selectedSection,
        date: attendanceDate,
        records,
      })

      const absentCount = records.filter(r => r.status === 'Absent').length
      toast.success(`Attendance saved for ${selectedGrade.name} - Section ${selectedSection}! ${absentCount > 0 ? `Alerts dispatched for ${absentCount} absent student(s).` : 'All students present.'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const activeRoster = students.filter(
    s => selectedGrade && selectedSection && s.classId && (s.classId._id === selectedGrade._id || s.classId === selectedGrade._id || s.classId?.name === selectedGrade.name) && s.sectionId === selectedSection
  )

  const statusCounts = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 }
    activeRoster.forEach((s) => {
      const st = attendance[s._id] || 'Present'
      if (counts[st] !== undefined) counts[st]++
      else counts.Present++
    })
    return counts
  }, [activeRoster, attendance])

  const getSectionsForGrade = (grade) => {
    if (!grade) return ['A', 'B']
    const definedSections = Array.isArray(grade.sections) && grade.sections.length > 0 ? grade.sections : ['A', 'B']
    const studentSections = students
      .filter(s => s.classId && (s.classId._id === grade._id || s.classId === grade._id || s.classId?.name === grade.name))
      .map(s => s.sectionId)
      .filter(Boolean)
    return Array.from(new Set([...definedSections, ...studentSections])).sort()
  }

  const sectionsToDisplay = getSectionsForGrade(selectedGrade)

  return (
    <div className="space-y-6">
      <Breadcrumb
        title="Attendance & Leave Management"
        subtitle="Vibrant 12-Grade card drill-down navigation and administrative student leave request reviews."
      />

      {/* ── Main Tab Switcher ──────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl px-3 shadow-sm">
        <button
          onClick={() => setActiveMainTab('attendance')}
          className={`flex items-center gap-2 py-4 px-4 text-xs font-bold transition-all border-b-2 ${
            activeMainTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Daily Class Attendance
        </button>
        <button
          onClick={() => setActiveMainTab('leaves')}
          className={`flex items-center gap-2 py-4 px-4 text-xs font-bold transition-all border-b-2 ${
            activeMainTab === 'leaves'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Student Leave Applications
        </button>
      </div>

      {/* ── TAB 1: Daily Class Attendance ──────────────────────────── */}
      {activeMainTab === 'attendance' && (
        <>
          {navLevel === 'grades' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Select Academic Grade (1–12) for Attendance
                  </h2>
                  <p className="text-xs text-gray-500">Pick a grade to access its sections and mark student attendance.</p>
                </div>
                <Badge variant="indigo">{displayClasses.length} Grades Active</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {displayClasses.map((cls, index) => {
                  const theme = GRADE_THEMES[index % GRADE_THEMES.length]
                  const gradeCount = students.filter(s => s.classId && (s.classId._id === cls._id || s.classId === cls._id || s.classId?.name === cls.name)).length
                  const classSections = getSectionsForGrade(cls)

                  return (
                    <div
                      key={cls._id || cls.name}
                      onClick={() => handleSelectGrade(cls)}
                      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-5 text-white shadow-lg ${theme.shadow} hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase">
                          Level {cls.level}
                        </span>
                        <Calendar className="w-6 h-6 text-white/90" />
                      </div>

                      <h3 className="text-2xl font-extrabold mb-1">{cls.name}</h3>
                      <p className="text-xs text-white/80 font-medium mb-4">
                        Sections: {classSections.join(', ')}
                      </p>

                      <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {gradeCount} Students
                        </span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Mark Attendance <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {navLevel === 'sections' && selectedGrade && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => setNavLevel('grades')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to All Grades
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">GRADE LEVEL {selectedGrade.level}</span>
                    <h2 className="text-2xl font-extrabold text-gray-900">{selectedGrade.name} - Select Section for Attendance</h2>
                    <p className="text-xs text-gray-500 mt-1">Select a section roster to record today's attendance status.</p>
                  </div>
                  <Badge variant="indigo">{sectionsToDisplay.length} Sections</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {sectionsToDisplay.map((sec) => {
                    const secCount = students.filter(s => s.classId && (s.classId._id === selectedGrade._id || s.classId === selectedGrade._id || s.classId?.name === selectedGrade.name) && s.sectionId === sec).length

                    return (
                      <div
                        key={sec}
                        onClick={() => handleSelectSection(sec)}
                        className="bg-gray-50 hover:bg-indigo-50/60 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                            {sec}
                          </div>
                          <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-full border text-gray-600">
                            Section {sec}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {selectedGrade.name} - Section {sec}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 mb-4 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> {secCount} Enrolled Students
                        </p>

                        <div className="w-full py-2 bg-white group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
                          Open Roster <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {navLevel === 'roster' && selectedGrade && selectedSection && (
            <div>
              <GradeSectionNavigator
                grades={displayClasses}
                selectedGrade={selectedGrade}
                selectedSection={selectedSection}
                onSelectGrade={(g) => {
                  setSelectedGrade(g)
                  const secs = getSectionsForGrade(g)
                  const sec = secs.includes(selectedSection) ? selectedSection : (secs[0] || 'A')
                  setSelectedSection(sec)
                  loadExistingAttendance(g, sec, attendanceDate)
                }}
                onSelectSection={(sec) => {
                  setSelectedSection(sec)
                  loadExistingAttendance(selectedGrade, sec, attendanceDate)
                }}
                students={students}
                rightSlot={
                  <button
                    onClick={() => setNavLevel('grades')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> All Grades
                  </button>
                }
              />

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {selectedGrade.name} · SECTION {selectedSection}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                      Student Attendance Checklist
                    </h2>
                    {/* Live Metric Breakdown */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Present: {statusCounts.Present}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Absent: {statusCounts.Absent}
                      </span>
                      {statusCounts.Late > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Late: {statusCounts.Late}
                        </span>
                      )}
                      {statusCounts.Excused > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Excused: {statusCounts.Excused}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={CheckCheck}
                      onClick={handleMarkAllPresent}
                      className="text-emerald-700 hover:text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                    >
                      All Present
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XSquare}
                      onClick={handleMarkAllAbsent}
                      className="text-rose-700 hover:text-rose-800 bg-rose-50/70 hover:bg-rose-100/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
                    >
                      All Absent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={RotateCcw}
                      onClick={handleInvertAttendance}
                      title="Invert Present / Absent status for all"
                    >
                      Invert
                    </Button>
                  </div>
                </div>

                {activeRoster.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    No students enrolled in this section.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 mt-4">
                    {activeRoster.map((student, idx) => {
                      const curStatus = attendance[student._id] || 'Present'
                      return (
                        <div
                          key={student._id}
                          className="py-3 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-gray-100 font-bold text-gray-600 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-gray-900">{student.fullName}</p>
                              <p className="text-[10px] text-gray-400 font-mono">ID: {student.studentId} · Roll: {student.rollNumber || 'N/A'}</p>
                            </div>
                          </div>

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
                                  onClick={() => handleStatusChange(student._id, st)}
                                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${btnColor}`}
                                >
                                  {st}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="pt-6 mt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={submitting || activeRoster.length === 0}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {submitting ? 'Saving…' : `Save Attendance (${activeRoster.length} Students)`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Student Leave Applications ──────────────────────── */}
      {activeMainTab === 'leaves' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Parent Leave Applications</h3>
              <p className="text-xs text-gray-400 mt-0.5">Review and approve digital absence requests submitted by guardians</p>
            </div>

            <select
              value={leaveFilter}
              onChange={(e) => setLeaveFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700"
            >
              <option value="ALL">All Applications</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {leavesLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading leave requests…</div>
            ) : leaveRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">
                No student leave requests matching your filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaveRequests.map((leave) => {
                  let statusBg = 'bg-amber-100 text-amber-800'
                  if (leave.status === 'Approved') statusBg = 'bg-green-100 text-green-800'
                  if (leave.status === 'Rejected') statusBg = 'bg-red-100 text-red-800'

                  return (
                    <div key={leave._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{leave.studentId?.fullName}</span>
                          <span className="text-[10px] text-gray-400">({leave.classId?.name} - {leave.sectionId})</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${statusBg}`}>
                            {leave.status}
                          </span>
                        </div>
                        <p className="text-gray-600">
                          <strong>{leave.category} Leave:</strong> {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </p>
                        <p className="text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                          "{leave.reason}"
                        </p>
                      </div>

                      {leave.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={reviewingId === leave._id}
                            onClick={() => handleReviewLeave(leave._id, 'Approved')}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            disabled={reviewingId === leave._id}
                            onClick={() => handleReviewLeave(leave._id, 'Rejected')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          Reviewed
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
