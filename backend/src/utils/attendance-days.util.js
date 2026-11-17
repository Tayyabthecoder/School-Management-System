/**
 * School-day attendance for one student, from the registers that mention them.
 *
 * A school may take attendance once a day or once per period. Counting every register as a "day"
 * made a student with eight periods look like eight days, so the totals shown on report cards, in
 * the guardian and student portals and in low-attendance alerts were inflated. This collapses the
 * registers of one calendar date into a single day:
 *
 *  - the day counts as attended when the student was present or late in at least half of that
 *    day's registers (a daily register is simply present/late or not, exactly as before);
 *  - its category is the most common status of the attended or the missed side, so the portal can
 *    still split days into present, late, absent and excused (ties favour the first in that order).
 *
 * @param {{ date?: Date|string, records?: { studentId: any, status: string }[] }[]} registers
 * @param {any} studentId
 * @returns {{ totalDays, attendedDays, presentDays, lateDays, absentDays, excusedDays, rate }}
 *          rate is a whole percentage of attended days, or null when there are no days at all
 */
const ATTENDED = ['Present', 'Late']
const MISSED = ['Absent', 'Excused']

const idOf = (value) => String(value?._id || value || '')

const dayKeyOf = (date, fallbackIndex) => {
  const d = new Date(date)
  if (!date || Number.isNaN(d.getTime())) return `register-${fallbackIndex}` // no usable date: its own day
  d.setHours(0, 0, 0, 0)
  return String(d.getTime())
}

const summarizeAttendanceDays = (registers, studentId) => {
  const wanted = idOf(studentId)
  const days = new Map() // dayKey -> { Present, Late, Absent, Excused, total }

  ;(registers || []).forEach((register, index) => {
    const record = (register?.records || []).find((r) => r && r.studentId && idOf(r.studentId) === wanted)
    if (!record) return
    const key = dayKeyOf(register.date, index)
    if (!days.has(key)) days.set(key, { Present: 0, Late: 0, Absent: 0, Excused: 0, total: 0 })
    const day = days.get(key)
    day.total += 1
    if (record.status in day) day[record.status] += 1
  })

  const summary = { totalDays: 0, attendedDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, excusedDays: 0, rate: null }
  for (const day of days.values()) {
    summary.totalDays += 1
    const attended = day.Present + day.Late >= day.total / 2
    const pool = attended ? ATTENDED : MISSED
    // most common status on the winning side; the order of `pool` breaks ties
    const category = pool.reduce((best, status) => (day[status] > day[best] ? status : best), pool[0])
    if (attended) summary.attendedDays += 1
    if (category === 'Present') summary.presentDays += 1
    else if (category === 'Late') summary.lateDays += 1
    else if (category === 'Absent') summary.absentDays += 1
    else summary.excusedDays += 1
  }
  summary.rate = summary.totalDays > 0 ? Math.round((summary.attendedDays / summary.totalDays) * 100) : null
  return summary
}

module.exports = { summarizeAttendanceDays }
