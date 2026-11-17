// Real-MongoDB tests (see test/integration-db.js) for three behaviours that mocks cannot prove:
//  1. a teacher cannot be put in two classrooms in the same period, even by two simultaneous saves
//  2. the fee-collection report keeps a promoted student's old fees with the class they were billed for
//  3. attendance totals count school days, not period registers
const { setupIntegrationDb } = require('../../test/integration-db')

jest.setTimeout(90000)

let ctx
let admin
let accountant
let Staff
let TimetableEntry
let Student
let Class
let StudentAttendance

beforeAll(async () => {
  ctx = await setupIntegrationDb('functional')
  admin = await ctx.as('admin')
  accountant = await ctx.as('accountant1')
  Staff = require('../models/Staff.model')
  TimetableEntry = require('../models/TimetableEntry.model')
  Student = require('../models/Student.model')
  Class = require('../models/Class.model')
  StudentAttendance = require('../models/StudentAttendance.model')
  await TimetableEntry.init()
})
afterAll(async () => { if (ctx) await ctx.teardown() })

const id = (doc) => String(doc?._id || doc)
const slot = (overrides) => ({
  classId: id(ctx.fixtures.cls),
  subjectId: id(ctx.fixtures.subject),
  teacherId: id(ctx.fixtures.teacherStaff),
  startTime: '15:00',
  endTime: '15:45',
  ...overrides,
})
const countFor = (teacherId, dayOfWeek, periodNumber) => TimetableEntry.countDocuments({ teacherId, dayOfWeek, periodNumber })

describe('timetable: one teacher, one classroom per period', () => {
  test('the database has a unique, partial teacher-slot index', async () => {
    const indexes = await TimetableEntry.collection.indexes()
    const guard = indexes.find((i) => i.name === 'teacherSlotKey_1')

    expect(guard).toBeDefined()
    expect(guard.unique).toBe(true)
    expect(guard.partialFilterExpression).toEqual({ teacherSlotKey: { $type: 'string' } })
  })

  test('MongoDB itself refuses a second stamped slot for the same teacher, day and period', async () => {
    const base = { ...slot({ dayOfWeek: 'Sunday', periodNumber: 12 }), teacherSlotKey: `${id(ctx.fixtures.teacherStaff)}|Sunday|12` }
    await TimetableEntry.create({ ...base, sectionId: 'A' })

    const error = await TimetableEntry.create({ ...base, sectionId: 'B' }).catch((e) => e)

    expect(error.code).toBe(11000)
    expect(error.keyPattern).toEqual({ teacherSlotKey: 1 })
  })

  test('two admins saving the same teacher into two classrooms at once: exactly one wins', async () => {
    const body = (sectionId) => slot({ sectionId, dayOfWeek: 'Saturday', periodNumber: 9 })

    const results = await Promise.all([
      admin.post('/api/v1/timetable').send(body('A')),
      admin.post('/api/v1/timetable').send(body('B')),
    ])

    expect(results.map((r) => r.status).sort()).toEqual([201, 409])
    const loser = results.find((r) => r.status === 409)
    expect(loser.body.error.message).toMatch(/already assigned/i)
    expect(await countFor(ctx.fixtures.teacherStaff._id, 'Saturday', 9)).toBe(1)
  })

  test('the same race through POST /teachers/assign is guarded too', async () => {
    const body = (sectionId) => slot({ sectionId, dayOfWeek: 'Saturday', periodNumber: 10 })

    const results = await Promise.all([
      admin.post('/api/v1/teachers/assign').send(body('A')),
      admin.post('/api/v1/teachers/assign').send(body('B')),
    ])

    expect(results.map((r) => r.status).sort()).toEqual([200, 409])
    expect(await countFor(ctx.fixtures.teacherStaff._id, 'Saturday', 10)).toBe(1)
  })

  test('two saves of the very same slot at once never produce a server error or a duplicate', async () => {
    const body = slot({ sectionId: 'B', dayOfWeek: 'Saturday', periodNumber: 11 })

    const results = await Promise.all([admin.post('/api/v1/timetable').send(body), admin.post('/api/v1/timetable').send(body)])

    for (const r of results) expect([200, 201]).toContain(r.status)
    expect(await TimetableEntry.countDocuments({ classId: ctx.fixtures.cls._id, sectionId: 'B', dayOfWeek: 'Saturday', periodNumber: 11 })).toBe(1)
  })

  test('re-saving a slot with the same teacher is an update, not a conflict', async () => {
    const body = slot({ sectionId: 'A', dayOfWeek: 'Saturday', periodNumber: 8 })
    expect((await admin.post('/api/v1/timetable').send(body)).status).toBe(201)

    const again = await admin.post('/api/v1/timetable').send({ ...body, room: 'Lab 2' })

    expect(again.status).toBe(200)
    expect(again.body.data.room).toBe('Lab 2')
  })

  test('handing a slot to another teacher frees the first teacher for that period', async () => {
    const [other] = await Staff.find({ _id: { $ne: ctx.fixtures.teacherStaff._id }, isActive: true }).limit(1)
    const first = slot({ sectionId: 'A', dayOfWeek: 'Sunday', periodNumber: 7 })
    expect((await admin.post('/api/v1/timetable').send(first)).status).toBe(201)

    // same slot, new teacher
    expect((await admin.post('/api/v1/timetable').send({ ...first, teacherId: id(other) })).status).toBe(200)
    // the original teacher can now teach elsewhere in that period
    expect((await admin.post('/api/v1/timetable').send({ ...first, sectionId: 'B' })).status).toBe(201)
    // and the new teacher is now protected
    expect((await admin.post('/api/v1/timetable').send({ ...first, sectionId: 'B', teacherId: id(other) })).status).toBe(409)
  })

  test('a slot saved before the guard existed (no key) is still protected by the lookup', async () => {
    await TimetableEntry.collection.insertOne({
      ...slot({ sectionId: 'A', dayOfWeek: 'Sunday', periodNumber: 6 }),
      classId: ctx.fixtures.cls._id,
      subjectId: ctx.fixtures.subject._id,
      teacherId: ctx.fixtures.teacherStaff._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const res = await admin.post('/api/v1/timetable').send(slot({ sectionId: 'B', dayOfWeek: 'Sunday', periodNumber: 6 }))

    expect(res.status).toBe(409)
  })
})

describe('fee collection by class after promotion', () => {
  const byClass = (rows) => Object.fromEntries(rows.map((r) => [r.className, { due: r.totalDue, paid: r.totalPaid }]))
  const fetchReport = async () => {
    const res = await accountant.get('/api/v1/reports/fee-collection-by-class')
    if (res.status !== 200) throw new Error(`report failed: ${res.status}`)
    return byClass(res.body.data)
  }

  test('moving a student to the next class does not move the fees they were billed in the old one', async () => {
    const { childA, cls } = ctx.fixtures
    const next = await Class.findOne({ _id: { $ne: cls._id }, isActive: true })
    const before = await fetchReport()
    expect(before[cls.name].due).toBeGreaterThan(0)

    await Student.updateOne({ _id: childA._id }, { $set: { classId: next._id } }) // "promoted"
    try {
      const after = await fetchReport()
      expect(after[cls.name]).toEqual(before[cls.name])
      expect(after[next.name]).toEqual(before[next.name])
    } finally {
      await Student.updateOne({ _id: childA._id }, { $set: { classId: cls._id } })
    }
  })
})

describe('attendance counts school days, not registers', () => {
  const DAY_WITH_PERIODS = new Date(2027, 2, 3)
  const SECOND_DAY = new Date(2027, 2, 4)

  test('three period registers on one date plus a daily register are two days (guardian and student views)', async () => {
    const { childA, cls } = ctx.fixtures
    const guardian = await ctx.as('it_guardian')
    const student = await ctx.as('stu-2026-0001')
    const summaryOf = async () => (await guardian.get(`/api/v1/guardian/attendance?studentId=${id(childA)}`)).body.data.summary
    const portalOf = async () => (await student.get('/api/v1/students/me/portal')).body.data.attendance.summary
    const [g0, p0] = [await summaryOf(), await portalOf()]

    const register = (date, periodNumber, status) => ({
      classId: cls._id, sectionId: childA.sectionId, date, periodNumber, markedBy: ctx.fixtures.guardian._id,
      records: [{ studentId: childA._id, status }],
    })
    await StudentAttendance.insertMany([
      register(DAY_WITH_PERIODS, 1, 'Present'),
      register(DAY_WITH_PERIODS, 2, 'Present'),
      register(DAY_WITH_PERIODS, 3, 'Absent'),
      register(SECOND_DAY, 0, 'Absent'), // a daily register
    ])

    const [g1, p1] = [await summaryOf(), await portalOf()]
    // Before the fix this added four "days"
    expect(g1.totalDays - g0.totalDays).toBe(2)
    expect(g1.presentDays - g0.presentDays).toBe(1) // 2 of 3 periods present => attended; the daily absence is not
    expect(p1.totalDays - p0.totalDays).toBe(2)
    expect(p1.presentDays - p0.presentDays).toBe(1)
    expect(p1.absentDays - p0.absentDays).toBe(1)
  })
})
