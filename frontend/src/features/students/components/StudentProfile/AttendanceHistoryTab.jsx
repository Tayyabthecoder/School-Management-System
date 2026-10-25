import React, { useState, useMemo } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { formatDate } from '../../../../lib/formatters'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const ATT_PAGE_SIZE = 10

export default function AttendanceHistoryTab({
  attendanceStats,
  flatAttendanceList = [],
  attendanceDateMap = {},
}) {
  const [calMonth, setCalMonth] = useState(new Date())
  const [attPage, setAttPage] = useState(1)

  const handlePrevMonth = () => {
    setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }
  const handleTodayMonth = () => {
    setCalMonth(new Date())
  }

  // Generate calendar days for calMonth
  const calendarGrid = useMemo(() => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay()
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-${i}` })
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayDate = new Date(year, month, day)
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const attItem = attendanceDateMap[dateString]
      const isToday = new Date().toDateString() === dayDate.toDateString()
      const isSunday = dayDate.getDay() === 0

      days.push({
        empty: false,
        day,
        date: dayDate,
        dateString,
        isToday,
        isSunday,
        attItem,
        key: dateString,
      })
    }
    return days
  }, [calMonth, attendanceDateMap])

  // Pagination for attendance log
  const paginatedAttendance = useMemo(() => {
    const start = (attPage - 1) * ATT_PAGE_SIZE
    return flatAttendanceList.slice(start, start + ATT_PAGE_SIZE)
  }, [flatAttendanceList, attPage])
  const totalAttPages = Math.max(1, Math.ceil(flatAttendanceList.length / ATT_PAGE_SIZE))

  return (
    <div className="space-y-6">
      {/* Attendance KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card-surface p-4 text-center">
          <p className="text-2xs text-slate-400 font-semibold uppercase">Total Days Logged</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {attendanceStats.totalAttended}
          </p>
        </div>
        <div className="card-surface p-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 text-center">
          <p className="text-2xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
            Present Days
          </p>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
            {attendanceStats.presentDays}
          </p>
        </div>
        <div className="card-surface p-4 border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 text-center">
          <p className="text-2xs text-rose-700 dark:text-rose-400 font-semibold uppercase">
            Absent Days
          </p>
          <p className="text-xl font-bold text-rose-800 dark:text-rose-300 mt-1">
            {attendanceStats.absentDays}
          </p>
        </div>
        <div className="card-surface p-4 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 text-center">
          <p className="text-2xs text-amber-700 dark:text-amber-400 font-semibold uppercase">
            Late Arrivals
          </p>
          <p className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">
            {attendanceStats.lateDays}
          </p>
        </div>
        <div className="card-surface p-4 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 text-center">
          <p className="text-2xs text-indigo-700 dark:text-indigo-400 font-semibold uppercase">
            Attendance %
          </p>
          <p className="text-xl font-black text-indigo-800 dark:text-indigo-300 mt-1">
            {attendanceStats.attendancePct !== null ? `${attendanceStats.attendancePct}%` : '—'}
          </p>
        </div>
      </div>

      {/* Month-by-Month Attendance Calendar */}
      <div className="card-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Attendance Calendar · {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
            </h3>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTodayMonth}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarGrid.map((cell) => {
            if (cell.empty) {
              return (
                <div
                  key={cell.key}
                  className="h-14 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent"
                />
              )
            }

            const { day, isToday, isSunday, attItem } = cell
            let statusStyles =
              'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            let badge = null

            if (attItem) {
              if (attItem.status === 'Present') {
                statusStyles =
                  'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold'
                badge = (
                  <span className="text-2xs bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full">
                    P
                  </span>
                )
              } else if (attItem.status === 'Absent') {
                statusStyles =
                  'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-bold'
                badge = (
                  <span className="text-2xs bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full">
                    A
                  </span>
                )
              } else if (attItem.status === 'Late') {
                statusStyles =
                  'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-bold'
                badge = (
                  <span className="text-2xs bg-amber-600 text-white font-black px-1.5 py-0.2 rounded-full">
                    L
                  </span>
                )
              } else if (attItem.status === 'Excused') {
                statusStyles =
                  'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300 font-bold'
                badge = (
                  <span className="text-2xs bg-purple-600 text-white font-black px-1.5 py-0.2 rounded-full">
                    E
                  </span>
                )
              }
            } else if (isSunday) {
              statusStyles =
                'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
            }

            return (
              <div
                key={cell.key}
                className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${statusStyles} ${
                  isToday ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      isToday
                        ? 'font-black text-indigo-700 dark:text-indigo-400 underline'
                        : 'font-semibold'
                    }`}
                  >
                    {day}
                  </span>
                  {badge}
                </div>
                <div className="text-2xs truncate">
                  {attItem?.status || (isSunday ? 'Weekend' : '—')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Calendar Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
            <span>Late Arrival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-purple-500 inline-block" />
            <span>Excused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700 inline-block" />
            <span>Weekend / No Log</span>
          </div>
        </div>
      </div>

      {/* Compliance Meter */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Institutional Attendance Compliance (Threshold: ≥75%)
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              attendanceStats.attendancePct !== null && attendanceStats.attendancePct >= 75
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60'
            }`}
          >
            {attendanceStats.attendancePct !== null
              ? attendanceStats.attendancePct >= 75
                ? '✓ Compliant'
                : '⚠ Action Required'
              : 'No Records Recorded'}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              attendanceStats.attendancePct !== null && attendanceStats.attendancePct >= 75
                ? 'bg-emerald-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(attendanceStats.attendancePct || 0, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {attendanceStats.attendancePct !== null
            ? attendanceStats.attendancePct >= 75
              ? 'Student meets the mandatory 75% classroom attendance policy for board examination eligibility.'
              : 'Attendance is currently below the mandatory 75% threshold. Guardian intervention recommended.'
            : 'No attendance entries have been logged yet for this student.'}
        </p>
      </div>

      {/* Paginated Attendance Timeline Log */}
      <div className="card-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Attendance Log History ({flatAttendanceList.length} total entries)
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {attPage} of {totalAttPages}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/80 dark:border-slate-800">
            <div className="col-span-3">Date & Day</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-3">Class / Section</div>
            <div className="col-span-3 text-right">Remarks / Notes</div>
          </div>

          {paginatedAttendance.length > 0 ? (
            paginatedAttendance.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs transition-colors"
              >
                <div className="col-span-3">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {formatDate(item.date)}
                  </p>
                  <p className="text-slate-400 text-2xs">
                    {item.date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
                <div className="col-span-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs ${
                      item.status === 'Present'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : item.status === 'Absent'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : item.status === 'Late'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="col-span-3 font-medium text-slate-700 dark:text-slate-300">
                  {item.className || 'Class'} ({item.sectionId || 'A'})
                </div>
                <div className="col-span-3 text-right text-slate-500 dark:text-slate-400 italic">
                  {item.remarks || 'Regular'}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-slate-400">
              No attendance history available for this student.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalAttPages > 1 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={attPage === 1}
              onClick={() => setAttPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalAttPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setAttPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold ${
                    attPage === pg
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={attPage === totalAttPages}
              onClick={() => setAttPage((p) => Math.min(totalAttPages, p + 1))}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
