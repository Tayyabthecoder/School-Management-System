import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { loadClasses } from '../../hooks/useClasses'
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
import { formatDate, toLocalDateInput } from '../../lib/formatters'
import { useToast } from '../../store/toastStore'
import { GRADE_THEMES, FALLBACK_GRADES } from '../../constants/grades'
import { logWarn } from '../../lib/logger'
import { cachedGet } from '../../lib/cachedGet'
import LeaveRequestsTab from './components/LeaveRequestsTab'
import AttendanceRegisterCard from './components/AttendanceRegisterCard'

export default function AttendancePage() {
  const toast = useToast()
  const [activeMainTab, setActiveMainTab] = useState('attendance') // 'attendance' | 'leaves'
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [sectionRoster, setSectionRoster] = useState([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const [navLevel, setNavLevel] = useState('grades')
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  const [attendanceDate, setAttendanceDate] = useState(() => toLocalDateInput())
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
          loadClasses(),
          cachedGet('/students', { params: { limit: 1000 } }),
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
      const res = await cachedGet('/teachers/leave-requests', {
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
    setSectionRoster([])
    setNavLevel('sections')
  }

  const loadExistingAttendance = useCallback(async (grade, section, date) => {
    if (!grade || !section) return
    setRosterLoading(true)

    try {
      // Dynamic section roster fetch ensures full class list even in large institutions (2,000+ students)
      const [stuRes, attRes] = await Promise.all([
        cachedGet('/students', {
          params: {
            classId: grade._id,
            sectionId: section,
            limit: 1000,
            status: 'Active',
          },
        }).catch(() => null),
        cachedGet('/attendance/student', {
          params: {
            classId: grade._id,
            sectionId: section,
            date,
          },
        }).catch(() => null),
      ])

      const fetchedStudents = stuRes?.data?.success && Array.isArray(stuRes.data.data) && stuRes.data.data.length > 0
        ? stuRes.data.data
        : students.filter(
            s => s.classId && (s.classId._id === grade._id || s.classId === grade._id || s.classId?.name === grade.name) && s.sectionId === section
          )

      setSectionRoster(fetchedStudents)

      const initial = {}
      fetchedStudents.forEach(s => { initial[s._id] = 'Present' })

      if (attRes?.data?.success && Array.isArray(attRes.data.data) && attRes.data.data.length > 0) {
        const attDoc = attRes.data.data[0]
        if (Array.isArray(attDoc.records)) {
          attDoc.records.forEach((r) => {
            const sid = r.studentId?._id || r.studentId
            if (sid && Object.prototype.hasOwnProperty.call(initial, sid)) {
              initial[sid] = r.status
            }
          })
        }
      }
      setAttendance(initial)
    } catch (err) {
      logWarn('Could not fetch existing attendance or roster, using defaults', err)
    } finally {
      setRosterLoading(false)
    }
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

  const activeRoster = sectionRoster.length > 0
    ? sectionRoster
    : students.filter(
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
      <div className="flex border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl px-3 shadow-sm">
        <button
          onClick={() => setActiveMainTab('attendance')}
          className={`flex items-center gap-2 py-4 px-4 text-xs font-bold transition-all border-b-2 ${
            activeMainTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Daily Class Attendance
        </button>
        <button
          onClick={() => setActiveMainTab('leaves')}
          className={`flex items-center gap-2 py-4 px-4 text-xs font-bold transition-all border-b-2 ${
            activeMainTab === 'leaves'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-900'
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
                  <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Select Academic Grade (1–12) for Attendance
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Pick a grade to access its sections and mark student attendance.</p>
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
                        <span className="px-2.5 py-1 rounded-full bg-white/20 dark:bg-slate-900/20 backdrop-blur-md text-xs font-bold uppercase">
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to All Grades
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">GRADE LEVEL {selectedGrade.level}</span>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{selectedGrade.name} - Select Section for Attendance</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Select a section roster to record today's attendance status.</p>
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
                        className="bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-50/60 p-6 rounded-2xl border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                            {sec}
                          </div>
                          <span className="text-xs font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border text-gray-600 dark:text-slate-400">
                            Section {sec}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                          {selectedGrade.name} - Section {sec}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" /> {secCount} Enrolled Students
                        </p>

                        <div className="w-full py-2 bg-white dark:bg-slate-900 group-hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 group-hover:text-white font-semibold text-xs rounded-lg text-center border border-indigo-200 dark:border-indigo-800 group-hover:border-indigo-600 transition-all flex items-center justify-center gap-1">
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

              <AttendanceRegisterCard
                handleDateChange={handleDateChange}
                handleMarkAllPresent={handleMarkAllPresent}
                handleMarkAllAbsent={handleMarkAllAbsent}
                handleInvertAttendance={handleInvertAttendance}
                handleStatusChange={handleStatusChange}
                handleSubmitAttendance={handleSubmitAttendance}
                activeRoster={activeRoster}
                statusCounts={statusCounts}
                students={students}
                selectedGrade={selectedGrade}
                selectedSection={selectedSection}
                attendanceDate={attendanceDate}
                attendance={attendance}
                submitting={submitting}
              />
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Student Leave Applications ──────────────────────── */}
      {activeMainTab === 'leaves' && (
        <LeaveRequestsTab
          handleReviewLeave={handleReviewLeave}
          leaveRequests={leaveRequests}
          leavesLoading={leavesLoading}
          leaveFilter={leaveFilter}
          setLeaveFilter={setLeaveFilter}
          reviewingId={reviewingId}
        />
      )}
    </div>
  )
}
