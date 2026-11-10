// Regression tests for audit P2 findings DATA-01 (single active academic year),
// DATA-02 (challan download must not reset deadlines) and SEC-03 (export access + row cap).
jest.mock('../utils/cache.util', () => ({
  invalidateCache: jest.fn().mockResolvedValue(),
  getOrSet: jest.fn(),
}))

const {
  activateAcademicYear,
  chooseActiveYear,
  normalizeActiveAcademicYear,
} = require('../services/academic-year.service')
const { resolveChallanDueDate } = require('../modules/finance/finance.controller')
const {
  assertCanExport,
  assertExportSize,
  canExportEntity,
  limitExport,
  EXPORT_ROW_LIMIT,
} = require('../modules/reports/export-access')
const AcademicYear = require('../models/AcademicYear.model')

const DAY = 24 * 60 * 60 * 1000

describe('DATA-01: single active academic year', () => {
  test('the model defaults to inactive and declares a partial unique index on isActive', () => {
    expect(new AcademicYear({ year: 2030, startDate: new Date(), endDate: new Date() }).isActive).toBe(false)
    const index = AcademicYear.schema.indexes().find(([fields]) => fields.isActive === 1)
    expect(index).toBeDefined()
    expect(index[1]).toMatchObject({ unique: true, partialFilterExpression: { isActive: true } })
  })

  test('activateAcademicYear deactivates the others before activating the target', async () => {
    const calls = []
    const Model = {
      findById: jest.fn().mockResolvedValue({ _id: 'y2027' }),
      updateMany: jest.fn().mockImplementation(async (...args) => { calls.push(['updateMany', ...args]) }),
      findByIdAndUpdate: jest.fn().mockImplementation(async (...args) => {
        calls.push(['activate', ...args])
        return { _id: 'y2027', isActive: true }
      }),
    }

    const result = await activateAcademicYear('y2027', Model)

    expect(result).toEqual({ _id: 'y2027', isActive: true })
    expect(calls.map((c) => c[0])).toEqual(['updateMany', 'activate'])
    expect(calls[0][1]).toEqual({ _id: { $ne: 'y2027' }, isActive: true })
    expect(calls[0][2]).toEqual({ $set: { isActive: false } })
  })

  test('activateAcademicYear returns null for an unknown year', async () => {
    const Model = { findById: jest.fn().mockResolvedValue(null), updateMany: jest.fn() }
    expect(await activateAcademicYear('missing', Model)).toBeNull()
    expect(Model.updateMany).not.toHaveBeenCalled()
  })

  test('chooseActiveYear prefers the year whose dates contain today, else the latest', () => {
    const years = [
      { _id: 'a', year: 2025, startDate: '2025-01-01', endDate: '2025-12-31' },
      { _id: 'b', year: 2026, startDate: '2026-01-01', endDate: '2026-12-31' },
      { _id: 'c', year: 2027, startDate: '2027-01-01', endDate: '2027-12-31' },
    ]
    expect(chooseActiveYear(years, new Date('2026-06-01'))._id).toBe('b')
    expect(chooseActiveYear(years, new Date('2030-06-01'))._id).toBe('c')
    expect(chooseActiveYear([], new Date())).toBeNull()
  })

  test('normalizeActiveAcademicYear keeps one of several active years and builds the index', async () => {
    const Model = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: 'old', year: 2024, startDate: '2024-01-01', endDate: '2024-12-31', isActive: true },
          { _id: 'cur', year: 2026, startDate: '2026-01-01', endDate: '2026-12-31', isActive: true },
        ]),
      }),
      updateMany: jest.fn().mockResolvedValue(),
      updateOne: jest.fn().mockResolvedValue(),
      createIndexes: jest.fn().mockResolvedValue(),
    }

    const result = await normalizeActiveAcademicYear(Model, new Date('2026-03-01'))

    expect(result).toEqual({ previouslyActive: 2, activeId: 'cur' })
    expect(Model.updateMany).toHaveBeenCalledWith({ _id: { $ne: 'cur' }, isActive: true }, { $set: { isActive: false } })
    expect(Model.createIndexes).toHaveBeenCalled()
  })

  test('normalizeActiveAcademicYear leaves a database with exactly one active year alone', async () => {
    const Model = {
      find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'only', isActive: true }]) }),
      updateMany: jest.fn(),
      updateOne: jest.fn(),
      createIndexes: jest.fn().mockResolvedValue(),
    }
    expect(await normalizeActiveAcademicYear(Model)).toEqual({ previouslyActive: 1, activeId: 'only' })
    expect(Model.updateMany).not.toHaveBeenCalled()
  })
})

describe('DATA-02: challan download due date', () => {
  const now = new Date('2026-06-10T09:00:00')

  test('a never-issued, not-yet-due challan gets 10 days from the download', () => {
    const fee = { status: 'Pending', dueDate: new Date('2026-06-12'), challanDownloadCount: 0 }
    const { dueDate, extended } = resolveChallanDueDate(fee, now)
    expect(extended).toBe(true)
    expect(Math.floor((dueDate - now) / DAY)).toBe(10)
    expect(dueDate.getHours()).toBe(23)
  })

  test('an overdue fee keeps its deadline (downloading cannot reset it)', () => {
    const fee = { status: 'Overdue', dueDate: new Date('2026-05-10'), challanDownloadCount: 0 }
    expect(resolveChallanDueDate(fee, now)).toEqual({ dueDate: fee.dueDate, extended: false })
  })

  test('a pending fee already past its due date is not extended', () => {
    const fee = { status: 'Pending', dueDate: new Date('2026-06-01'), challanDownloadCount: 0 }
    expect(resolveChallanDueDate(fee, now).extended).toBe(false)
  })

  test('a re-download never moves the deadline', () => {
    const fee = { status: 'Pending', dueDate: new Date('2026-06-15'), challanDownloadCount: 1 }
    expect(resolveChallanDueDate(fee, now)).toEqual({ dueDate: fee.dueDate, extended: false })
  })

  test('a later existing due date is never shortened', () => {
    const fee = { status: 'Pending', dueDate: new Date('2026-07-30'), challanDownloadCount: 0 }
    expect(resolveChallanDueDate(fee, now)).toEqual({ dueDate: fee.dueDate, extended: false })
  })
})

describe('SEC-03: export access and row cap', () => {
  test.each([
    ['hr_manager', 'fees', false],
    ['hr_manager', 'defaulters', false],
    ['accountant', 'staff', false],
    ['accountant', 'staff-attendance', false],
    ['accountant', 'payroll', true],
    ['hr_manager', 'staff', true],
    ['accountant', 'defaulters', true],
    ['super_admin', 'staff', true],
    ['teacher', 'students', false],
  ])('%s exporting %s -> allowed=%s', (role, entity, allowed) => {
    expect(canExportEntity(role, entity)).toBe(allowed)
    const run = () => assertCanExport({ role: { name: role }, roleName: role }, entity)
    if (allowed) expect(run).not.toThrow()
    else expect(run).toThrow(expect.objectContaining({ statusCode: 403 }))
  })

  test('the controller rejects a forbidden export before touching the database', async () => {
    const reportsController = require('../modules/reports/reports.controller')
    const next = jest.fn()
    const res = { json: jest.fn(), setHeader: jest.fn(), send: jest.fn(), status: jest.fn() }
    await reportsController.exportCustomReport({ user: { roleName: 'hr_manager' }, query: { entity: 'defaulters', format: 'excel' } }, res, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(res.send).not.toHaveBeenCalled()
  })

  test('limitExport caps the query at the limit plus one', () => {
    const query = { limit: jest.fn().mockReturnThis() }
    limitExport(query)
    expect(query.limit).toHaveBeenCalledWith(EXPORT_ROW_LIMIT + 1)
  })

  test('assertExportSize rejects oversized exports with 413', () => {
    expect(() => assertExportSize(EXPORT_ROW_LIMIT)).not.toThrow()
    expect(() => assertExportSize(EXPORT_ROW_LIMIT + 1)).toThrow(expect.objectContaining({ statusCode: 413 }))
  })
})
