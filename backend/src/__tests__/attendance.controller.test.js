const attendanceController = require('../modules/attendance/attendance.controller')
const StudentAttendance = require('../models/StudentAttendance.model')
const Student = require('../models/Student.model')
const SchoolSettings = require('../models/SchoolSettings.model')
const cacheUtil = require('../utils/cache.util')
const auditLogUtil = require('../utils/audit-log.util')
const sseController = require('../modules/reports/sse.controller')

jest.mock('../models/StudentAttendance.model')
jest.mock('../models/StaffAttendance.model')
jest.mock('../models/Student.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')
jest.mock('../modules/reports/sse.controller')

describe('Attendance Controller Tests', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
    cacheUtil.invalidateCache.mockResolvedValue()
    cacheUtil.getOrSet.mockImplementation((key, ttl, fn) => fn())
    auditLogUtil.logAudit.mockResolvedValue()
    sseController.broadcast.mockImplementation(() => {})
  })

  describe('markStudentAttendance edge cases', () => {
    const baseReq = (overrides = {}) => ({
      body: {
        classId: 'class123',
        sectionId: 'A',
        date: '2026-10-01',
        periodNumber: 1,
        records: [{ studentId: 'student1', status: 'Present' }],
        ...overrides,
      },
      user: { _id: 'teacher123' },
    })

    it('updates the register when a concurrent request created it first (duplicate key)', async () => {
      const raced = { records: [], save: jest.fn().mockImplementation(function save() { return Promise.resolve(this) }) }
      StudentAttendance.findOne
        .mockResolvedValueOnce(null) // nothing yet when we looked
        .mockResolvedValueOnce(raced) // but it exists by the time create() fails
      StudentAttendance.create.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }))

      await attendanceController.markStudentAttendance(baseReq(), res, next)

      expect(next).not.toHaveBeenCalled()
      expect(raced.records).toEqual([{ studentId: 'student1', status: 'Present' }])
      expect(raced.markedBy).toBe('teacher123')
      expect(raced.save).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('passes other create errors through instead of swallowing them', async () => {
      StudentAttendance.findOne.mockResolvedValue(null)
      StudentAttendance.create.mockRejectedValue(new Error('disk full'))

      await attendanceController.markStudentAttendance(baseReq(), res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'disk full' }))
    })

    it('replaces the records of an existing register for the same class, section, day and period', async () => {
      const existing = { records: [{ studentId: 'old', status: 'Absent' }], save: jest.fn().mockImplementation(function save() { return Promise.resolve(this) }) }
      StudentAttendance.findOne.mockResolvedValue(existing)

      await attendanceController.markStudentAttendance(baseReq(), res, next)

      expect(StudentAttendance.create).not.toHaveBeenCalled()
      expect(existing.records).toEqual([{ studentId: 'student1', status: 'Present' }])
      expect(existing.save).toHaveBeenCalled()
    })

    it('writes one low-attendance alert per student below the threshold, and none above it', async () => {
      StudentAttendance.findOne.mockResolvedValue(null)
      StudentAttendance.create.mockResolvedValue({ _id: 'att1' })
      Student.find.mockResolvedValue([{ _id: 'low' }, { _id: 'fine' }])
      SchoolSettings.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue({ attendanceAlertThreshold: 75 }) })
      // Four sessions this month: 'low' was present once (25%), 'fine' present every time (100%).
      const session = (low, fine) => ({ records: [{ studentId: 'low', status: low }, { studentId: 'fine', status: fine }] })
      StudentAttendance.find.mockResolvedValue([
        session('Absent', 'Present'), session('Absent', 'Present'), session('Absent', 'Present'), session('Present', 'Present'),
      ])

      await attendanceController.markStudentAttendance(
        baseReq({ records: [{ studentId: 'low', status: 'Absent' }, { studentId: 'fine', status: 'Absent' }] }),
        res,
        next
      )

      expect(next).not.toHaveBeenCalled()
      const alerts = auditLogUtil.logAudit.mock.calls.filter(([arg]) => arg.action === 'LOW_ATTENDANCE_ALERT')
      expect(alerts).toHaveLength(1)
      expect(alerts[0][0]).toMatchObject({ documentId: 'low', newValues: { monthlyRate: 25, threshold: 75 } })
    })
  })

  describe('markStudentAttendance', () => {
    it('saves attendance, invalidates cache and broadcasts attendance:updated', async () => {
      req = {
        body: {
          classId: 'class123',
          sectionId: 'A',
          date: '2026-10-01',
          periodNumber: 1,
          records: [
            { studentId: 'student1', status: 'Present' },
            { studentId: 'student2', status: 'Late' },
          ],
        },
        user: { _id: 'teacher123' },
      }

      const mockSavedDoc = {
        _id: 'att123',
        classId: 'class123',
        sectionId: 'A',
        records: req.body.records,
      }

      StudentAttendance.findOne.mockResolvedValue(null)
      StudentAttendance.create.mockResolvedValue(mockSavedDoc)

      await attendanceController.markStudentAttendance(req, res, next)

      expect(StudentAttendance.create).toHaveBeenCalled()
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('dashboard:stats')
      expect(sseController.broadcast).toHaveBeenCalledWith('attendance:updated', expect.objectContaining({
        classId: 'class123',
      }))
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockSavedDoc,
      }))
    })

    it('triggers low-attendance alert when absent student drops below threshold', async () => {
      req = {
        body: {
          classId: 'class123',
          sectionId: 'A',
          date: '2026-10-01',
          records: [
            { studentId: 'student_low', status: 'Absent' },
          ],
        },
        user: { _id: 'teacher123' },
      }

      StudentAttendance.findOne.mockResolvedValue(null)
      StudentAttendance.create.mockResolvedValue({ _id: 'att124' })

      Student.find.mockResolvedValue([{ _id: 'student_low' }])
      SchoolSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({ attendanceAlertThreshold: 75 }),
      })

      // 10 attendance records: 5 present, 5 absent = 50% (< 75%)
      StudentAttendance.find.mockResolvedValue(
        Array.from({ length: 10 }).map((_, i) => ({
          records: [{ studentId: 'student_low', status: i < 5 ? 'Present' : 'Absent' }],
        }))
      )

      await attendanceController.markStudentAttendance(req, res, next)

      expect(auditLogUtil.logAudit).toHaveBeenCalledWith(expect.objectContaining({
        action: 'LOW_ATTENDANCE_ALERT',
        documentId: 'student_low',
      }))
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('dashboard:stats')
    })
  })

  describe('getStudentAttendance', () => {
    it('returns attendance matching query filter', async () => {
      req = {
        query: { classId: 'class123', sectionId: 'A', date: '2026-10-01' },
      }

      const mockData = [{ _id: 'att1' }]
      StudentAttendance.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockData),
      })

      await attendanceController.getStudentAttendance(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData })
    })

    it('filters by student at query level instead of loading every register', async () => {
      const studentId = '64b000000000000000000001'
      req = { query: { studentId } }
      StudentAttendance.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      })

      await attendanceController.getStudentAttendance(req, res, next)

      expect(StudentAttendance.find).toHaveBeenCalledWith({ 'records.studentId': studentId })
      expect(next).not.toHaveBeenCalled()
    })

    it('rejects a malformed studentId with 400', async () => {
      req = { query: { studentId: 'not-an-id' } }

      await attendanceController.getStudentAttendance(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
      expect(StudentAttendance.find).not.toHaveBeenCalled()
    })
  })
})
