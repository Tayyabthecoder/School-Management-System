const { summarizeAttendanceDays } = require('../utils/attendance-days.util')

const STUDENT = 'stu-1'
const day = (d) => new Date(2026, 9, d) // October 2026
const register = (date, status, extra = {}) => ({ date, records: [{ studentId: STUDENT, status }], ...extra })

describe('summarizeAttendanceDays: one register per day (unchanged behaviour)', () => {
  test('counts each register as a day, like the old per-register loops', () => {
    const result = summarizeAttendanceDays([
      register(day(1), 'Present'),
      register(day(2), 'Late'),
      register(day(3), 'Absent'),
      register(day(4), 'Excused'),
    ], STUDENT)

    expect(result).toMatchObject({ totalDays: 4, attendedDays: 2, presentDays: 1, lateDays: 1, absentDays: 1, excusedDays: 1, rate: 50 })
  })

  test('no registers means no days and no rate', () => {
    expect(summarizeAttendanceDays([], STUDENT)).toMatchObject({ totalDays: 0, attendedDays: 0, rate: null })
    expect(summarizeAttendanceDays(undefined, STUDENT)).toMatchObject({ totalDays: 0, rate: null })
  })
})

describe('summarizeAttendanceDays: several period registers on one day', () => {
  const periods = (date, statuses) => statuses.map((status, i) => register(date, status, { periodNumber: i + 1 }))

  test('eight periods are one day, not eight', () => {
    const result = summarizeAttendanceDays(periods(day(5), Array(8).fill('Present')), STUDENT)

    expect(result).toMatchObject({ totalDays: 1, attendedDays: 1, presentDays: 1, rate: 100 })
  })

  test('present or late in at least half of the periods counts as attended', () => {
    const half = summarizeAttendanceDays(periods(day(5), ['Present', 'Present', 'Late', 'Late', 'Absent', 'Absent', 'Absent', 'Absent']), STUDENT)
    expect(half).toMatchObject({ totalDays: 1, attendedDays: 1 })

    const fewer = summarizeAttendanceDays(periods(day(5), ['Present', 'Present', 'Late', 'Absent', 'Absent', 'Absent', 'Absent', 'Absent']), STUDENT)
    expect(fewer).toMatchObject({ totalDays: 1, attendedDays: 0, absentDays: 1, rate: 0 })
  })

  test('a mostly-late day is a late day', () => {
    const result = summarizeAttendanceDays(periods(day(5), ['Late', 'Late', 'Late', 'Present']), STUDENT)

    expect(result).toMatchObject({ totalDays: 1, attendedDays: 1, lateDays: 1, presentDays: 0 })
  })

  test('a day missed mostly with leave is an excused day, otherwise absent', () => {
    expect(summarizeAttendanceDays(periods(day(5), ['Excused', 'Excused', 'Excused', 'Absent']), STUDENT))
      .toMatchObject({ totalDays: 1, attendedDays: 0, excusedDays: 1, absentDays: 0 })
    // a tie between Absent and Excused favours Absent
    expect(summarizeAttendanceDays(periods(day(5), ['Excused', 'Absent']), STUDENT))
      .toMatchObject({ absentDays: 1, excusedDays: 0 })
  })

  test('several days with several periods each are counted per date', () => {
    const result = summarizeAttendanceDays([
      ...periods(day(5), Array(8).fill('Present')),
      ...periods(day(6), Array(8).fill('Absent')),
      ...periods(day(7), ['Present', 'Present', 'Present', 'Present', 'Absent', 'Absent', 'Absent', 'Absent']),
    ], STUDENT)

    expect(result).toMatchObject({ totalDays: 3, attendedDays: 2, rate: 67 }) // 24 registers, 3 days
  })

  test('registers on the same date at different clock times are the same day', () => {
    const morning = new Date(2026, 9, 5, 0, 0, 0)
    const noon = new Date(2026, 9, 5, 12, 30, 0)
    const result = summarizeAttendanceDays([register(morning, 'Present'), register(noon, 'Present')], STUDENT)

    expect(result.totalDays).toBe(1)
  })
})

describe('summarizeAttendanceDays: matching and robustness', () => {
  test('only the requested student is counted, and ids may be objects', () => {
    const registers = [
      { date: day(1), records: [{ studentId: 'someone-else', status: 'Absent' }, { studentId: { _id: STUDENT }, status: 'Present' }] },
      { date: day(2), records: [{ studentId: 'someone-else', status: 'Present' }] }, // student not in this register
    ]

    expect(summarizeAttendanceDays(registers, STUDENT)).toMatchObject({ totalDays: 1, attendedDays: 1 })
    expect(summarizeAttendanceDays(registers, { _id: STUDENT })).toMatchObject({ totalDays: 1 })
  })

  test('a register without a usable date is its own day instead of being merged or dropped', () => {
    const result = summarizeAttendanceDays([
      { records: [{ studentId: STUDENT, status: 'Present' }] },
      { date: 'garbage', records: [{ studentId: STUDENT, status: 'Absent' }] },
    ], STUDENT)

    expect(result).toMatchObject({ totalDays: 2, attendedDays: 1, rate: 50 })
  })

  test('an unknown status counts as a missed day rather than crashing', () => {
    expect(summarizeAttendanceDays([register(day(1), 'Holiday')], STUDENT)).toMatchObject({ totalDays: 1, attendedDays: 0 })
  })
})
