// Payroll: approved Unpaid leave costs a day of pay, and the provident fund follows the school setting.
const {
  countUnpaidLeaveDays,
  calculateProvidentFund,
  dayKey,
} = require('../modules/hr/hr.service')
const Staff = require('../models/Staff.model')
const StaffAttendance = require('../models/StaffAttendance.model')
const PayrollRecord = require('../models/PayrollRecord.model')
const LeaveRequest = require('../models/LeaveRequest.model')
const SchoolSettings = require('../models/SchoolSettings.model')
const { runPayroll } = require('../modules/hr/hr.controller')

jest.mock('../models/Staff.model')
jest.mock('../models/User.model')
jest.mock('../models/Role.model')
jest.mock('../models/Counter.model')
jest.mock('../models/StaffAttendance.model')
jest.mock('../models/PayrollRecord.model')
jest.mock('../models/LeaveRequest.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../utils/audit-log.util', () => ({ logAudit: jest.fn().mockResolvedValue() }))
jest.mock('../utils/cache.util', () => ({ getOrSet: (key, ttl, fn) => fn(), invalidateCache: jest.fn().mockResolvedValue() }))

// June 2026: the 1st is a Monday, the 6th and 7th are the weekend.
const JUNE_START = new Date(2026, 5, 1)
const JUNE_END = new Date(2026, 5, 30, 23, 59, 59, 999)
const leave = (from, to) => ({ fromDate: new Date(2026, 5, from), toDate: new Date(2026, 5, to) })

describe('countUnpaidLeaveDays', () => {
  test('counts school working days only, skipping the weekend', () => {
    // Mon 8 June to Sun 14 June
    expect(countUnpaidLeaveDays([leave(8, 14)], JUNE_START, JUNE_END)).toBe(5)
  })

  test('only the part of a leave inside the month counts', () => {
    const crossing = { fromDate: new Date(2026, 4, 28), toDate: new Date(2026, 5, 3) } // 28 May to Wed 3 June
    expect(countUnpaidLeaveDays([crossing], JUNE_START, JUNE_END)).toBe(3) // 1, 2 and 3 June
  })

  test('a day already deducted as an absence is not charged twice', () => {
    const deducted = new Map([
      [dayKey(new Date(2026, 5, 9)), 1], // marked Absent
      [dayKey(new Date(2026, 5, 10)), 0.5], // Half Day
    ])
    // Mon 8, Tue 9 (already 1), Wed 10 (already 0.5)  =>  1 + 0 + 0.5
    expect(countUnpaidLeaveDays([leave(8, 10)], JUNE_START, JUNE_END, undefined, deducted)).toBe(1.5)
  })

  test('overlapping leave requests count each day once', () => {
    expect(countUnpaidLeaveDays([leave(8, 10), leave(9, 11)], JUNE_START, JUNE_END)).toBe(4)
  })

  test('follows the school working days from settings', () => {
    const sixDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    expect(countUnpaidLeaveDays([leave(8, 14)], JUNE_START, JUNE_END, sixDays)).toBe(6) // adds Saturday 13 June
  })

  test('ignores invalid dates and an empty list', () => {
    expect(countUnpaidLeaveDays([{ fromDate: 'nope', toDate: 'nope' }], JUNE_START, JUNE_END)).toBe(0)
    expect(countUnpaidLeaveDays(undefined, JUNE_START, JUNE_END)).toBe(0)
  })
})

describe('calculateProvidentFund', () => {
  test('is the configured percentage of basic pay', () => {
    expect(calculateProvidentFund(30000, 5)).toBe(1500)
    expect(calculateProvidentFund(45000, 2.5)).toBe(1125)
  })

  test('is zero when not configured and clamps nonsense values', () => {
    expect(calculateProvidentFund(30000, 0)).toBe(0)
    expect(calculateProvidentFund(30000, undefined)).toBe(0)
    expect(calculateProvidentFund(30000, -5)).toBe(0)
    expect(calculateProvidentFund(30000, 500)).toBe(30000) // capped at 100%
  })
})

describe('runPayroll with unpaid leave and provident fund', () => {
  const mockRes = () => ({ json: jest.fn() })
  const staff = { _id: 'st1', salary: 30000, allowances: 0, deductions: 0 }

  const run = async ({ leaves = [], markedAbsent = [], settings = {}, body = {} } = {}) => {
    Staff.find.mockResolvedValue([staff])
    StaffAttendance.aggregate.mockResolvedValue([])
    StaffAttendance.find.mockResolvedValue(markedAbsent)
    LeaveRequest.find.mockResolvedValue(leaves)
    SchoolSettings.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(settings) })
    PayrollRecord.findOne.mockResolvedValue(null)
    PayrollRecord.findOneAndUpdate.mockImplementation(async (_q, update) => update)
    const res = mockRes()
    const next = jest.fn()
    await runPayroll({ body: { month: 6, year: 2026, applyEobi: false, ...body }, user: { _id: 'u1' } }, res, next)
    expect(next).not.toHaveBeenCalled()
    return res.json.mock.calls[0][0].data[0]
  }

  beforeEach(() => jest.clearAllMocks())

  test('five working days of approved Unpaid leave deduct five days of pay', async () => {
    const record = await run({ leaves: [{ staffId: 'st1', ...leave(8, 12) }] })

    // 30,000 / 30 = 1,000 a day
    expect(record.absentDaysDeduction).toBe(5000)
    expect(record.netPay).toBe(25000)
  })

  test('only Approved Unpaid leave in the month is queried', async () => {
    await run()

    expect(LeaveRequest.find).toHaveBeenCalledWith(expect.objectContaining({
      staffId: { $in: ['st1'] },
      status: 'Approved',
      leaveType: 'Unpaid',
    }))
  })

  test('a day marked Absent inside the leave is deducted once', async () => {
    const record = await run({
      leaves: [{ staffId: 'st1', ...leave(8, 10) }],
      markedAbsent: [{ staffId: 'st1', date: new Date(2026, 5, 9), status: 'Absent' }],
    })

    // The attendance aggregate is empty in this mock, so the leave adds only the days that were
    // not already marked absent: Mon 8 and Wed 10.
    expect(record.absentDaysDeduction).toBe(2000)
  })

  test('the provident fund is the settings percentage of basic pay', async () => {
    const record = await run({ settings: { providentFundPercent: 5 } })

    expect(record.providentFund).toBe(1500)
    expect(record.netPay).toBe(28500)
  })

  test('with no setting the provident fund stays 0 and pay is unchanged', async () => {
    const record = await run({ settings: {} })

    expect(record.providentFund).toBe(0)
    expect(record.netPay).toBe(30000)
  })
})
