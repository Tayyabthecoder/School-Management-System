import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  CircleDollarSign,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock3,
  CalendarCheck,
  User,
  GraduationCap,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton'
import api from '../../lib/axios'
import { formatPKR, formatDate } from '../../lib/formatters'
import { useToastStore } from '../../store/toastStore'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const GRADE_BADGES = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'A': 'bg-green-100 text-green-800 border-green-300',
  'B': 'bg-blue-100 text-blue-800 border-blue-300',
  'C': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'D': 'bg-orange-100 text-orange-800 border-orange-300',
  'F': 'bg-red-100 text-red-800 border-red-300',
}

export default function StudentPortalPage() {
  const toast = useToastStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('timetable') // 'timetable' | 'attendance' | 'grades' | 'fees'
  const [selectedDay, setSelectedDay] = useState(
    DAYS[new Date().getDay() - 1] || 'Monday'
  )
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [downloadingChallanId, setDownloadingChallanId] = useState(null)

  useEffect(() => {
    const loadPortal = async () => {
      setLoading(true)
      try {
        const res = await api.get('/students/me/portal')
        if (res.data?.success) {
          setData(res.data.data)
        }
      } catch (err) {
        toast.error('Failed to load student academic records')
      } finally {
        setLoading(false)
      }
    }
    loadPortal()
  }, [toast])

  const handleDownloadReportCard = async () => {
    if (!data?.student?._id) return
    setDownloadingReport(true)
    try {
      const res = await api.get(`/report-cards/${data.student._id}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ReportCard_${data.student.studentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report card PDF downloaded successfully!')
    } catch (err) {
      toast.error('Failed to download report card PDF')
    } finally {
      setDownloadingReport(false)
    }
  }

  const handleDownloadChallan = async (challanId, challanNo) => {
    setDownloadingChallanId(challanId)
    try {
      const res = await api.get(`/finance/challans/${challanId}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `FeeChallan_${challanNo || challanId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Fee challan PDF downloaded!')
    } catch (err) {
      toast.error('Failed to download challan PDF')
    } finally {
      setDownloadingChallanId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-32" />
        <SkeletonTable rows={5} />
      </div>
    )
  }

  const student = data?.student
  const timetable = data?.timetable || []
  const attendance = data?.attendance || { summary: {}, history: [] }
  const grades = data?.grades || []
  const fees = data?.fees || []

  const attRate = attendance.summary?.rate ?? 100
  const isLowAttendance = attRate < 75

  // Filter timetable by day
  const dayTimetable = timetable.filter(t => t.dayOfWeek === selectedDay)

  return (
    <div className="space-y-6">
      {/* ── Student Profile Hero Banner ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold shadow-lg border-2 border-indigo-400/30">
              {student?.fullName?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {student?.fullName || 'Student'}
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold rounded-full">
                  {student?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                Class: <strong className="text-white">{student?.classId?.name || 'Class'}</strong> ({student?.sectionId}) · Roll No: <strong className="text-white">{student?.rollNumber || 'N/A'}</strong>
              </p>
              <p className="text-xs text-indigo-300 font-mono mt-0.5">
                Student ID: {student?.studentId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadReportCard}
              disabled={downloadingReport}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-900 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              {downloadingReport ? 'Generating PDF…' : 'Official Report Card'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Low Attendance Warning Banner ──────────────────────────── */}
      {isLowAttendance && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">Low Attendance Warning</p>
            <p className="mt-0.5">
              Your current attendance rate is <strong>{attRate}%</strong>, which is below the minimum required standard of 75%. Please ensure regular attendance to maintain examination eligibility.
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl px-3 shadow-sm">
        {[
          { id: 'timetable', label: 'Class Schedule', icon: Clock },
          { id: 'attendance', label: 'My Attendance', icon: CalendarCheck },
          { id: 'grades', label: 'Grades & Exams', icon: Award },
          { id: 'fees', label: 'Fee Challans', icon: CircleDollarSign },
        ].map((tab) => {
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

      {/* ── TAB 1: Timetable ───────────────────────────────────────── */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          {/* Day Selector Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Periods Schedule Cards */}
          {dayTimetable.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No classes scheduled on {selectedDay}</p>
              <p className="text-xs text-gray-400 mt-0.5">Enjoy your free study or recreational period!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayTimetable.map((period) => (
                <div
                  key={period._id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg">
                      Period {period.periodNumber}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {period.startTime} – {period.endTime}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-base">
                    {period.subjectId?.name || 'Subject'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Teacher: <strong className="text-gray-800">{period.teacherId?.fullName || 'Assigned Faculty'}</strong>
                  </p>

                  <div className="pt-2 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                    <span>Room: <strong className="text-gray-700">{period.room || 'Classroom'}</strong></span>
                    <span className="font-mono text-[10px]">{period.subjectId?.code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Attendance ──────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Overall Attendance</p>
              <h3 className={`text-3xl font-extrabold mt-1 ${isLowAttendance ? 'text-amber-600' : 'text-green-600'}`}>
                {attRate}%
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">Minimum target: 75%</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Days</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{attendance.summary?.totalDays ?? 0}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Recorded sessions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Present Days</p>
              <h3 className="text-3xl font-extrabold text-green-600 mt-1">{attendance.summary?.presentDays ?? 0}</h3>
              <p className="text-[10px] text-gray-400 mt-1">On-time attendance</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Absent Days</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-1">{attendance.summary?.absentDays ?? 0}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Unexcused missed days</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold uppercase">Excused / Late</p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1">
                {(attendance.summary?.excusedDays || 0) + (attendance.summary?.lateDays || 0)}
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">Approved leaves & late</p>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Recent Daily Attendance Records</h3>
              <p className="text-xs text-gray-400 mt-0.5">Showing last 30 recorded days</p>
            </div>

            {attendance.history?.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">No attendance records logged yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {attendance.history.map((record, i) => {
                  let statusColor = 'bg-gray-100 text-gray-700'
                  if (record.status === 'Present') statusColor = 'bg-green-100 text-green-800'
                  else if (record.status === 'Absent') statusColor = 'bg-red-100 text-red-800'
                  else if (record.status === 'Late') statusColor = 'bg-amber-100 text-amber-800'
                  else if (record.status === 'Excused') statusColor = 'bg-blue-100 text-blue-800'

                  return (
                    <div key={i} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="font-bold text-gray-800">{formatDate(record.date)}</span>
                          {record.remarks && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{record.remarks}</p>
                          )}
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full font-bold text-[11px] ${statusColor}`}>
                        {record.status}
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Examination Performance & Marks</h3>
              <p className="text-xs text-gray-400 mt-0.5">Subject-wise marks and official letter grades</p>
            </div>
            <button
              onClick={handleDownloadReportCard}
              disabled={downloadingReport}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Report Card PDF
            </button>
          </div>

          {grades.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              No examination marks published yet for your current session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Exam / Term</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3 text-center">Marks Obtained</th>
                    <th className="p-3 text-center">Max Marks</th>
                    <th className="p-3 text-center">Percentage</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grades.map((grade) => {
                    const marks = grade.marksObtained ?? 0
                    const total = grade.examId?.totalMarks || 100
                    const pct = Math.round((marks / total) * 100)
                    const isPassing = marks >= (grade.examId?.passMarks || 33)

                    let gradeLetter = 'F'
                    if (pct >= 80) gradeLetter = 'A+'
                    else if (pct >= 70) gradeLetter = 'A'
                    else if (pct >= 60) gradeLetter = 'B'
                    else if (pct >= 50) gradeLetter = 'C'
                    else if (pct >= 33) gradeLetter = 'D'

                    return (
                      <tr key={grade._id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-gray-900">{grade.examId?.name || 'Exam'}</td>
                        <td className="p-3 text-gray-700 font-semibold">{grade.examId?.subjectId?.name || 'Subject'}</td>
                        <td className="p-3 text-center font-bold text-gray-900">{marks}</td>
                        <td className="p-3 text-center text-gray-500">{total}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{pct}%</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${GRADE_BADGES[gradeLetter] || 'bg-gray-100'}`}>
                            {gradeLetter}
                          </span>
                        </td>
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
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-base mb-1">Fee Invoices & Challan Receipts</h3>
            <p className="text-xs text-gray-400 mb-4">View issued fee challans, payment statuses, and download printable receipts</p>

            {fees.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No fee records issued for your profile.
              </div>
            ) : (
              <div className="space-y-3">
                {fees.map((fee) => {
                  let statusBadge = 'bg-amber-100 text-amber-800'
                  if (fee.status === 'Paid') statusBadge = 'bg-green-100 text-green-800'
                  if (fee.status === 'Overdue') statusBadge = 'bg-red-100 text-red-800'

                  return (
                    <div
                      key={fee._id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">
                            {fee.feeStructureId?.name || 'Tuition Fee'}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>
                            {fee.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Amount: <strong className="text-gray-900">{formatPKR(fee.netAmount || fee.amount)}</strong> · Due Date: <strong>{formatDate(fee.dueDate)}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDownloadChallan(fee._id, fee.challanNo)}
                        disabled={downloadingChallanId === fee._id}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        {downloadingChallanId === fee._id ? 'Downloading…' : 'Print Challan'}
                      </button>
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
