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
  })
})
