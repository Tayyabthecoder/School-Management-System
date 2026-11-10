// Regression tests for low-severity audit findings (P3).
const { generatePDFBuffer, drawFooter } = require('../utils/pdf/pdf.base')

describe('LOW-02: PDF footers number every page', () => {
  test('a three-page document is stamped "Page i of 3" on each footer page', async () => {
    const stamped = []
    let pageCount = 0
    await generatePDFBuffer((doc) => {
      const originalText = doc.text.bind(doc)
      doc.text = (str, ...rest) => {
        if (typeof str === 'string' && str.startsWith('Page ')) stamped.push(str)
        return originalText(str, ...rest)
      }
      for (let i = 0; i < 3; i++) {
        if (i > 0) doc.addPage()
        doc.text(`Body of page ${i + 1}`)
        drawFooter(doc, 'Test')
      }
      pageCount = doc.bufferedPageRange().count
    })

    expect(pageCount).toBe(3)
    expect(stamped).toEqual(['Page 1 of 3', 'Page 2 of 3', 'Page 3 of 3'])
  })

  test('drawing the footer does not add an extra blank page', async () => {
    let count = 0
    await generatePDFBuffer((doc) => {
      drawFooter(doc, 'Single')
      count = doc.bufferedPageRange().count
    })
    expect(count).toBe(1)
  })
})

describe('LOW-04: weekday follows the school timezone, not the server clock', () => {
  const { getSchoolDayName } = require('../utils/date.util')

  test('02:30 PKT on Tuesday is still Monday in UTC', () => {
    const instant = new Date('2026-06-08T21:30:00Z')
    expect(getSchoolDayName(instant, 'Asia/Karachi')).toBe('Tuesday')
    expect(getSchoolDayName(instant, 'UTC')).toBe('Monday')
  })

  test('defaults to the configured SCHOOL_TIMEZONE', () => {
    const env = require('../config/env')
    expect(env.SCHOOL_TIMEZONE).toBe(process.env.SCHOOL_TIMEZONE || 'Asia/Karachi')
    expect(getSchoolDayName(new Date('2026-06-08T21:30:00Z'))).toBe(getSchoolDayName(new Date('2026-06-08T21:30:00Z'), env.SCHOOL_TIMEZONE))
  })
})

describe('LOW-08: fee events reach finance roles only', () => {
  const { broadcast, _clients } = require('../modules/reports/sse.controller')

  afterEach(() => _clients.clear())

  test('fee:paid goes to super_admin and accountant, not to teachers', () => {
    const make = (role) => ({ id: role, role, res: { write: jest.fn() } })
    const admin = make('super_admin')
    const accountant = make('accountant')
    const teacher = make('teacher')
    ;[admin, accountant, teacher].forEach((c) => _clients.add(c))

    broadcast('fee:paid', { studentId: 's1', amountPaid: 4500 })
    broadcast('attendance:updated', { classId: 'c1' })

    expect(admin.res.write).toHaveBeenCalledTimes(2)
    expect(accountant.res.write).toHaveBeenCalledTimes(2)
    expect(teacher.res.write).toHaveBeenCalledTimes(1)
    expect(teacher.res.write.mock.calls[0][0]).toContain('attendance:updated')
  })
})

describe('LOW-07: in-memory cache entries are short-lived without Redis', () => {
  test('a 600 s TTL is capped in the per-process fallback', async () => {
    const { getOrSet, MEMORY_CACHE_MAX_TTL_SECONDS } = require('../utils/cache.util')
    expect(MEMORY_CACHE_MAX_TTL_SECONDS).toBeLessThanOrEqual(30)
    const realNow = Date.now
    try {
      let calls = 0
      const fetcher = async () => ++calls
      await getOrSet('low07:test', 600, fetcher)
      Date.now = () => realNow() + (MEMORY_CACHE_MAX_TTL_SECONDS + 1) * 1000
      await getOrSet('low07:test', 600, fetcher)
      expect(calls).toBe(2)
    } finally {
      Date.now = realNow
    }
  })
})

describe('LOW-09: subject codes are unique per class', () => {
  test('Subject declares a unique (classId, code) index and normalises the code', () => {
    const Subject = require('../models/Subject.model')
    const index = Subject.schema.indexes().find(([fields]) => fields.classId === 1 && fields.code === 1)
    expect(index && index[1].unique).toBe(true)
    expect(new Subject({ name: 'Maths', code: ' math-10 ', classId: '64b000000000000000000001' }).code).toBe('MATH-10')
  })
})

describe('LOW-10: .env.example boots a development copy', () => {
  test('placeholder secrets pass the 32-character check but are listed as forbidden in production', () => {
    const fs = require('fs')
    const path = require('path')
    const example = fs.readFileSync(path.join(__dirname, '../../.env.example'), 'utf8')
    const value = (key) => (example.match(new RegExp(`^${key}="?([^"\r\n]+)"?`, 'm')) || [])[1]
    const access = value('JWT_SECRET')
    const refresh = value('JWT_REFRESH_SECRET')
    expect(access.length).toBeGreaterThanOrEqual(32)
    expect(refresh.length).toBeGreaterThanOrEqual(32)
    const envSource = fs.readFileSync(path.join(__dirname, '../config/env.js'), 'utf8')
    expect(envSource).toContain(access)
    expect(envSource).toContain(refresh)
  })
})

describe('LOW-13: staff attendance statuses are consistent', () => {
  test('constants list Half Day, and the legacy "Leave" is stored as "On Leave"', async () => {
    const { ATTENDANCE_STATUS } = require('../config/constants')
    expect(ATTENDANCE_STATUS.STAFF).toEqual(['Present', 'Absent', 'Late', 'On Leave', 'Half Day'])

    const StaffAttendance = require('../models/StaffAttendance.model')
    const spy = jest.spyOn(StaffAttendance, 'findOneAndUpdate').mockResolvedValue({ status: 'On Leave' })
    const { markStaffAttendance } = require('../modules/attendance/attendance.controller')
    const next = jest.fn()
    await markStaffAttendance({ body: { staffId: 'st1', date: '2026-06-08', status: 'Leave' }, user: { _id: 'u1' } }, { json: jest.fn() }, next)
    expect(next).not.toHaveBeenCalled()
    expect(spy.mock.calls[0][1]).toMatchObject({ status: 'On Leave' })
    spy.mockRestore()
  })
})

describe('SEC-03: frontend export map stays in sync with the backend', () => {
  test('frontend/src/features/reports/exportAccess.js mirrors export-access.js', () => {
    const fs = require('fs')
    const path = require('path')
    const { EXPORT_ENTITY_ROLES } = require('../modules/reports/export-access')
    const source = fs.readFileSync(path.join(__dirname, '../../../frontend/src/features/reports/exportAccess.js'), 'utf8')
    const literal = source.match(/EXPORT_ENTITY_ROLES = Object\.freeze\((\{[\s\S]*?\})\)/)[1]
    // eslint-disable-next-line no-new-func
    expect(Function(`return ${literal}`)()).toEqual(EXPORT_ENTITY_ROLES)
  })
})

describe('FUNC-03: staff self-service leave and half-day payroll deductions', () => {
  test('a teacher can file leave without naming a staffId (the server uses their own record)', () => {
    const { submitLeaveRequestSchema } = require('../modules/hr/hr.dto')
    const result = submitLeaveRequestSchema.safeParse({
      body: { leaveType: 'Casual', fromDate: '2026-12-01', toDate: '2026-12-02', reason: 'Family event' },
    })
    expect(result.success).toBe(true)
  })

  test('payroll counts a Half Day as half an absent day', async () => {
    const Staff = require('../models/Staff.model')
    const StaffAttendance = require('../models/StaffAttendance.model')
    const PayrollRecord = require('../models/PayrollRecord.model')
    const staff = { _id: 'st1', salary: 30000, allowances: 0, deductions: 0 }
    const spies = [
      jest.spyOn(Staff, 'find').mockResolvedValue([staff]),
      jest.spyOn(StaffAttendance, 'aggregate').mockResolvedValue([{ _id: 'st1', count: 1.5 }]),
      jest.spyOn(PayrollRecord, 'findOne').mockResolvedValue(null),
      jest.spyOn(PayrollRecord, 'findOneAndUpdate').mockImplementation(async (_q, update) => update),
    ]
    try {
      const { runPayroll } = require('../modules/hr/hr.controller')
      const res = { json: jest.fn() }
      const next = jest.fn()
      await runPayroll({ body: { month: 6, year: 2026 }, user: { _id: 'u1' } }, res, next)

      expect(next).not.toHaveBeenCalled()
      const pipeline = StaffAttendance.aggregate.mock.calls[0][0]
      expect(pipeline[0].$match.status).toEqual({ $in: ['Absent', 'Half Day'] })
      expect(JSON.stringify(pipeline[1])).toContain('0.5')
      // 30,000 / 30 days = 1,000 per day; 1.5 days absent
      expect(res.json.mock.calls[0][0].data[0].absentDaysDeduction).toBe(1500)
    } finally {
      spies.forEach((s) => s.mockRestore())
    }
  })
})
