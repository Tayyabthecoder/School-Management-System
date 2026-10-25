const {
  generateMonthlyFeeChallans,
  getMonthlyChallansStatus,
  getDefaultTuitionForClass,
} = require('../services/monthly-challan.service')
const FeeStructure = require('../models/FeeStructure.model')
const StudentFee = require('../models/StudentFee.model')
const Student = require('../models/Student.model')
const Class = require('../models/Class.model')
const AcademicYear = require('../models/AcademicYear.model')
const cacheUtil = require('../utils/cache.util')
const auditLogUtil = require('../utils/audit-log.util')
const financeController = require('../modules/finance/finance.controller')
const cron = require('node-cron')
const { initMonthlyChallanCron, getCronJob } = require('../jobs/monthly-challan.cron')

jest.mock('../models/FeeStructure.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/Student.model')
jest.mock('../models/Class.model')
jest.mock('../models/AcademicYear.model')
jest.mock('../models/ChallanSettings.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')
jest.mock('../utils/pdf.util', () => ({
  generatePDFBuffer: jest.fn().mockImplementation((builderFn) => {
    const fakeDoc = {}
    builderFn(fakeDoc)
    return Promise.resolve(Buffer.from('fake_pdf_content'))
  }),
  buildFeeChallanPDF: jest.fn(),
  DEFAULT_CHALLAN_SETTINGS: {},
}))
jest.mock('../modules/reports/sse.controller', () => ({
  broadcast: jest.fn(),
}))
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ start: jest.fn(), stop: jest.fn() }),
}))

describe('Automated Monthly Challan Service & Feature Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cacheUtil.invalidateCache.mockResolvedValue()
    auditLogUtil.logAudit.mockResolvedValue()
  })

  describe('getDefaultTuitionForClass', () => {
    it('returns standard fee for Play Jouior', () => {
      expect(getDefaultTuitionForClass('Play Jouior')).toBe(8000)
    })

    it('returns standard fee for Grade 1 and Grade 10', () => {
      expect(getDefaultTuitionForClass('Grade 1')).toBe(8500)
      expect(getDefaultTuitionForClass('Grade 10')).toBe(13000)
    })

    it('falls back to level calculation for custom class name', () => {
      expect(getDefaultTuitionForClass('Custom Grade', 4)).toBe(10000)
      expect(getDefaultTuitionForClass('Nursery', 0)).toBe(8000)
    })
  })

  describe('generateMonthlyFeeChallans', () => {
    const mockAcademicYear = {
      _id: 'year2026',
      year: 2026,
      isActive: true,
    }

    const mockClasses = [
      { _id: 'class_pj', name: 'Play Jouior', level: 0 },
      { _id: 'class_g10', name: 'Grade 10', level: 10 },
    ]

    const mockStudents = [
      {
        _id: 'student_1',
        fullName: 'Ali Khan',
        studentId: 'STU-001',
        classId: { _id: 'class_pj', name: 'Play Jouior' },
        status: 'Active',
      },
      {
        _id: 'student_2',
        fullName: 'Zara Fatima',
        studentId: 'STU-002',
        classId: { _id: 'class_g10', name: 'Grade 10' },
        status: 'Active',
      },
    ]

    it('creates fee structures if missing, applies concessions, and generates challans', async () => {
      AcademicYear.findById.mockResolvedValue(null)
      AcademicYear.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAcademicYear),
      })
      Class.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockClasses),
      })

      // Simulate no existing fee structures found for the month
      FeeStructure.findOne.mockResolvedValue(null)
      FeeStructure.create.mockImplementation((data) =>
        Promise.resolve({ _id: `fs_${data.classId}`, ...data })
      )

      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudents),
      })

      // No existing fees for this month (idempotency check returns empty)
      StudentFee.find.mockImplementation((query) => {
        if (query && query.discount && query.discount.$gt !== undefined) {
          // Historical concessions query: student_2 has a 25% sibling discount
          return {
            sort: jest.fn().mockResolvedValue([
              {
                studentId: 'student_2',
                discount: 3250,
                amountDue: 13000,
                concessionType: 'Sibling Discount',
                concessionReason: 'Second child enrolled',
              },
            ]),
          }
        }
        return {
          select: jest.fn().mockResolvedValue([]),
        }
      })

      StudentFee.insertMany.mockImplementation((items) => Promise.resolve(items))

      const targetDate = new Date(2026, 9, 1) // Oct 1, 2026
      const result = await generateMonthlyFeeChallans({
        targetDate,
        executedBy: 'TEST_SUITE',
      })

      expect(result.success).toBe(true)
      expect(result.month).toBe('October')
      expect(result.year).toBe(2026)
      expect(result.generatedCount).toBe(2)
      expect(result.skippedCount).toBe(0)

      // Verify FeeStructure creation was attempted for both classes
      expect(FeeStructure.create).toHaveBeenCalledTimes(2)

      // Verify StudentFee insertion
      expect(StudentFee.insertMany).toHaveBeenCalledTimes(1)
      const inserted = StudentFee.insertMany.mock.calls[0][0]
      expect(inserted).toHaveLength(2)

      // Student 1 (Play Jouior) - No concession
      const fee1 = inserted.find((f) => f.studentId === 'student_1')
      expect(fee1.amountDue).toBe(8000)
      expect(fee1.discount).toBe(0)
      expect(fee1.netAmount).toBe(8000)
      expect(fee1.status).toBe('Pending')

      // Student 2 (Grade 10) - 25% Sibling Discount carried over
      const fee2 = inserted.find((f) => f.studentId === 'student_2')
      expect(fee2.amountDue).toBe(13000)
      expect(fee2.discount).toBe(3250) // 25% of 13000
      expect(fee2.netAmount).toBe(9750)
      expect(fee2.concessionType).toBe('Sibling Discount')

      // Cache invalidation and audit log
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('dashboard:stats')
      expect(auditLogUtil.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MONTHLY_CHALLANS_AUTO_GENERATED',
          module: 'finance',
        })
      )
    })

    it('skips students who already have challans for the target month (idempotency)', async () => {
      AcademicYear.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAcademicYear),
      })
      Class.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockClasses),
      })
      FeeStructure.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({ _id: 'fs_existing', amount: 8000 }),
      })
      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockStudents),
      })

      // Simulate student_1 and student_2 already have existing fees for this month
      StudentFee.find.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue([
          { studentId: 'student_1', feeStructureId: 'fs_existing' },
          { studentId: 'student_2', feeStructureId: 'fs_existing' },
        ]),
      }))

      const result = await generateMonthlyFeeChallans({
        targetDate: new Date(2026, 9, 1),
      })

      expect(result.success).toBe(true)
      expect(result.generatedCount).toBe(0)
      expect(result.skippedCount).toBe(2)
      expect(StudentFee.insertMany).not.toHaveBeenCalled()
    })

    it('throws error when no active academic year is configured', async () => {
      AcademicYear.findById.mockResolvedValue(null)
      AcademicYear.findOne.mockReturnValue(null)

      await expect(
        generateMonthlyFeeChallans({ targetDate: new Date() })
      ).rejects.toThrow('No active academic year found in system')
    })
  })

  describe('getMonthlyChallansStatus', () => {
    it('returns cron schedule details, active student counts, and status', async () => {
      Student.countDocuments.mockResolvedValue(189)
      StudentFee.countDocuments.mockResolvedValue(189)
      StudentFee.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ createdAt: new Date() }),
        }),
      })

      const status = await getMonthlyChallansStatus()
      expect(status.cronSchedule).toBe('0 0 1 * *')
      expect(status.timezone).toBe('Asia/Karachi')
      expect(status.totalActiveStudents).toBe(189)
      expect(status.currentMonthChallansCount).toBe(189)
      expect(status.status).toBe('Generated')
    })
  })

  describe('Finance Controller endpoints for Monthly Challans', () => {
    let req, res, next

    beforeEach(() => {
      req = { body: {}, user: { fullName: 'Admin User', roleName: 'accountant' } }
      res = {
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      }
      next = jest.fn()
    })

    it('getMonthlyChallansCronStatus responds with status object', async () => {
      Student.countDocuments.mockResolvedValue(50)
      StudentFee.countDocuments.mockResolvedValue(0)
      StudentFee.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        }),
      })

      await financeController.getMonthlyChallansCronStatus(req, res, next)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            cronSchedule: '0 0 1 * *',
            totalActiveStudents: 50,
          }),
        })
      )
    })

    it('triggerMonthlyChallansManually responds with generation result', async () => {
      const mockAcademicYear = { _id: 'year2026', year: 2026, isActive: true }
      AcademicYear.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAcademicYear),
      })
      Class.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'c1', name: 'Play Jouior', level: 0 }]),
      })
      FeeStructure.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue({ _id: 'fs1', amount: 8000 }),
      })
      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { _id: 's1', classId: { _id: 'c1' }, status: 'Active' },
        ]),
      })
      StudentFee.find.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue([]),
        sort: jest.fn().mockResolvedValue([]),
      }))
      StudentFee.insertMany.mockResolvedValue([{ _id: 'sf1' }])

      req.body = { targetDate: '2026-11-01' }
      await financeController.triggerMonthlyChallansManually(req, res, next)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('November 2026'),
          data: expect.objectContaining({
            month: 'November',
            year: 2026,
            generatedCount: 1,
          }),
        })
      )
    })

    it('downloadChallanPDF updates fee record due date to exactly 10 days after download and updates tracking', async () => {
      const originalDueDate = new Date('2026-05-15')
      const mockFee = {
        _id: 'fee123456',
        amountDue: 8000,
        netAmount: 8000,
        outstandingAmount: 8000,
        status: 'Overdue',
        dueDate: originalDueDate,
        studentId: { _id: 's1', fullName: 'Ali', studentId: 'STU-001', classId: { name: 'Play Jouior' } },
        feeStructureId: { title: 'Tuition' },
        save: jest.fn().mockResolvedValue(),
      }

      StudentFee.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockFee),
        }),
      })

      const ChallanSettings = require('../models/ChallanSettings.model')
      ChallanSettings.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      })

      const dlReq = {
        params: { feeId: 'fee123456' },
        user: { roleName: 'accountant' },
      }
      const dlRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      }
      const dlNext = jest.fn()

      const beforeDownload = new Date()
      await financeController.downloadChallanPDF(dlReq, dlRes, dlNext)

      expect(mockFee.save).toHaveBeenCalled()
      expect(mockFee.challanDownloadedAt).toBeInstanceOf(Date)
      expect(mockFee.challanDownloadCount).toBe(1)
      expect(mockFee.dueDate).toBeInstanceOf(Date)

      // Verify that dueDate is updated to 10 days after downloadDate
      const diffDays = Math.floor((mockFee.dueDate.getTime() - beforeDownload.getTime()) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(10)
      expect(mockFee.status).toBe('Pending') // Overdue reset to Pending upon fresh download

      expect(dlRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf')
      expect(dlRes.send).toHaveBeenCalled()
    })
  })

  describe('Monthly Challan Cron Job Initialization', () => {
    it('schedules cron with "0 0 1 * *" and Asia/Karachi timezone', () => {
      initMonthlyChallanCron()
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 0 1 * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'Asia/Karachi',
        })
      )
      expect(getCronJob()).toBeDefined()
    })
  })
})
