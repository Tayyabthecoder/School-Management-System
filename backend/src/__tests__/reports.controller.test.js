const reportsController = require('../modules/reports/reports.controller')
const Student = require('../models/Student.model')
const Staff = require('../models/Staff.model')
const StudentFee = require('../models/StudentFee.model')
const Payment = require('../models/Payment.model')
const StudentAttendance = require('../models/StudentAttendance.model')
const StaffAttendance = require('../models/StaffAttendance.model')
const LeaveRequest = require('../models/LeaveRequest.model')
const Grade = require('../models/Grade.model')
const AcademicYear = require('../models/AcademicYear.model')
const cacheUtil = require('../utils/cache.util')
const reportsBuilder = require('../modules/reports/reports.builder')
const excelUtil = require('../utils/excel.util')
const pdfUtil = require('../utils/pdf.util')

jest.mock('../models/Student.model')
jest.mock('../models/Staff.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/Payment.model')
jest.mock('../models/StudentAttendance.model')
jest.mock('../models/StaffAttendance.model')
jest.mock('../models/LeaveRequest.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Exam.model')
jest.mock('../models/AcademicYear.model')
jest.mock('../models/Class.model')
jest.mock('../models/AuditLog.model')
jest.mock('../utils/cache.util')
jest.mock('../modules/reports/reports.builder')
jest.mock('../utils/excel.util')
jest.mock('../utils/pdf.util')

describe('Reports Controller Unit Tests', () => {
  let req, res, next

  beforeEach(() => {
    jest.clearAllMocks()
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
    next = jest.fn()
    cacheUtil.getOrSet.mockImplementation((key, ttl, fn) => fn())
    cacheUtil.invalidateCache.mockResolvedValue()
  })

  // ── 1. getDashboardStats ──────────────────────────────────────────────────────
  describe('getDashboardStats', () => {
    beforeEach(() => {
      Student.countDocuments.mockResolvedValue(150)
      Staff.countDocuments.mockResolvedValue(20)
      AcademicYear.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: '2025-2026' }),
      })

      StudentFee.aggregate
        .mockResolvedValueOnce([
          { _id: null, totalDue: 100000, totalPaid: 75000, totalOutstanding: 25000 },
        ])
        .mockResolvedValueOnce([
          { _id: null, count: 5, total: 25000 },
        ])

      StudentAttendance.aggregate
        .mockResolvedValueOnce([
          { _id: null, total: 100, present: 95 },
        ])
        .mockResolvedValueOnce([
          { _id: '2026-10-01', total: 100, present: 94 },
          { _id: '2026-10-02', total: 100, present: 96 },
        ])

      StaffAttendance.countDocuments
        .mockResolvedValueOnce(1) // staffOnLeaveToday
        .mockResolvedValueOnce(2) // staffPresentToday

      LeaveRequest.countDocuments.mockResolvedValue(2)
    })

    it('returns full stats including fees for super_admin role', async () => {
      req = { user: { roleName: 'super_admin' } }

      await reportsController.getDashboardStats(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalStudents: 150,
          totalStaff: 20,
          academicYear: '2025-2026',
          totalCollections: 75000,
          totalOutstandingFees: 25000,
          feeCollectionRate: 75,
          staffPresentToday: 2,
          staffOnLeaveToday: 1,
          pendingLeaveRequests: 2,
          sparklines: expect.objectContaining({
            attendance: expect.any(Array),
            students: expect.any(Array),
          }),
        }),
      })
    })

    it('sanitizes financial metrics for teacher role', async () => {
      req = { user: { roleName: 'teacher' } }

      await reportsController.getDashboardStats(req, res, next)

      expect(res.json).toHaveBeenCalled()
      const responseData = res.json.mock.calls[0][0].data
      expect(responseData.totalStudents).toBe(150)
      expect(responseData.totalStaff).toBe(20)
      expect(responseData.totalCollections).toBeUndefined()
      expect(responseData.totalOutstandingFees).toBeUndefined()
      expect(responseData.feeCollectionRate).toBeUndefined()
    })
  })

  // ── 2. getFeeTrend ────────────────────────────────────────────────────────────
  describe('getFeeTrend', () => {
    it('returns monthly collections from Payment aggregation', async () => {
      req = { query: { months: '3' } }
      Payment.aggregate.mockResolvedValue([
        { _id: { year: 2026, month: 1 }, collected: 50000 },
        { _id: { year: 2026, month: 2 }, collected: 65000 },
      ])

      await reportsController.getFeeTrend(req, res, next)

      expect(Payment.aggregate).toHaveBeenCalledTimes(1)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ month: expect.any(String), collected: expect.any(Number) }),
        ]),
      })
    })
  })

  // ── 3. getDefaulterAging ──────────────────────────────────────────────────────
  describe('getDefaulterAging', () => {
    it('aggregates aging buckets via facet pipeline', async () => {
      req = {}
      StudentFee.aggregate.mockResolvedValue([
        {
          '0-30': [{ count: 5, amount: 25000 }],
          '31-60': [{ count: 3, amount: 15000 }],
          '61-90': [{ count: 2, amount: 10000 }],
          '90+': [{ count: 1, amount: 5000 }],
          totals: [{ count: 11, total: 55000 }],
        },
      ])

      await reportsController.getDefaulterAging(req, res, next)

      expect(StudentFee.aggregate).toHaveBeenCalledTimes(1)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          buckets: {
            '0-30': { count: 5, amount: 25000 },
            '31-60': { count: 3, amount: 15000 },
            '61-90': { count: 2, amount: 10000 },
            '90+': { count: 1, amount: 5000 },
          },
          totalOutstanding: 55000,
          totalDefaulters: 11,
        }),
      })
    })
  })

  // ── 4. getAcademicPerformanceAnalytics ────────────────────────────────────────
  describe('getAcademicPerformanceAnalytics', () => {
    it('calculates grade letter distribution, pass rate, and average score', async () => {
      req = { query: {} }
      Grade.aggregate
        .mockResolvedValueOnce([
          { _id: 'A', count: 10 },
          { _id: 'B', count: 20 },
          { _id: 'F', count: 2 },
        ])
        .mockResolvedValueOnce([
          { _id: null, avgPct: 78.5 },
        ])

      await reportsController.getAcademicPerformanceAnalytics(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          distribution: [
            { grade: 'A+', count: 0 },
            { grade: 'A', count: 10 },
            { grade: 'B', count: 20 },
            { grade: 'C', count: 0 },
            { grade: 'D', count: 0 },
            { grade: 'F', count: 2 },
          ],
          totalGraded: 32,
          passRate: 94,
          averageScore: 79,
        },
      })
    })
  })

  // ── 5. getDemographicsAnalytics ───────────────────────────────────────
  describe('getDemographicsAnalytics', () => {
    it('calculates student gender counts and age distribution buckets', async () => {
      req = {}
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 4)
      const eightYearsAgo = new Date()
      eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8)

      Student.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { gender: 'Male', dob: fiveYearsAgo },
          { gender: 'Female', dob: eightYearsAgo },
          { gender: 'Female', dob: null },
        ]),
      })

      await reportsController.getDemographicsAnalytics(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          gender: [
            { name: 'Male', value: 1 },
            { name: 'Female', value: 2 },
          ],
          totalEnrolled: 3,
          ageDistribution: expect.any(Array),
        }),
      })
    })
  })

  // ── 6. getTeacherPerformanceAnalytics ─────────────────────────────────────────
  describe('getTeacherPerformanceAnalytics', () => {
    it('calculates teacher attendance rates and faculty stats', async () => {
      req = {}
      const teacherId = 'teacher_1'
      Staff.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            _id: teacherId,
            staffId: 'STF-001',
            fullName: 'Jane Doe',
            designation: 'Senior Teacher',
            department: 'Academics',
          },
        ]),
      })

      StaffAttendance.find.mockResolvedValue([
        { staffId: teacherId, status: 'Present' },
        { staffId: teacherId, status: 'Present' },
        { staffId: teacherId, status: 'Absent' },
      ])

      await reportsController.getTeacherPerformanceAnalytics(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          teachers: [
            {
              _id: teacherId,
              staffId: 'STF-001',
              fullName: 'Jane Doe',
              designation: 'Senior Teacher',
              department: 'Academics',
              totalDays: 3,
              presentDays: 2,
              attendanceRate: 67,
            },
          ],
          averageAttendanceRate: 67,
          totalFaculty: 1,
        },
      })
    })
  })

  // ── 7. exportCustomReport ─────────────────────────────────────────────────────
  describe('exportCustomReport', () => {
    it('generates Excel report with proper headers', async () => {
      req = {
        query: { entity: 'students', format: 'excel' },
      }
      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          {
            studentId: 'STD-1',
            fullName: 'John Smith',
            gender: 'Male',
            classId: { name: 'Grade 10' },
            sectionId: 'A',
            guardian: { name: 'Father', phone: '03001234567' },
            status: 'Active',
          },
        ]),
      })

      excelUtil.generateExcelBuffer.mockResolvedValue(Buffer.from('mock-excel'))

      await reportsController.exportCustomReport(req, res, next)

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=Report_students_')
      )
      expect(res.send).toHaveBeenCalled()
    })

    it('generates PDF report with application/pdf Content-Type', async () => {
      req = {
        query: { entity: 'students', format: 'pdf' },
      }
      Student.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          {
            studentId: 'STD-1',
            fullName: 'John Smith',
            gender: 'Male',
            classId: { name: 'Grade 10' },
            sectionId: 'A',
            guardian: { name: 'Father', phone: '03001234567' },
            status: 'Active',
          },
        ]),
      })

      pdfUtil.generatePDFBuffer.mockResolvedValue(Buffer.from('mock-pdf'))

      await reportsController.exportCustomReport(req, res, next)

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf')
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('.pdf')
      )
      expect(res.send).toHaveBeenCalled()
    })
  })

  // ── 8. previewCustomReport & exportCustomReportWithFields ─────────────────────
  describe('previewCustomReport', () => {
    it('delegates to reportsBuilder.compileDynamicCustomReport with slice for preview', async () => {
      req = {
        body: {
          entity: 'students',
          fields: ['studentId', 'fullName'],
          filters: { classId: 'cls1' },
        },
      }

      reportsBuilder.compileDynamicCustomReport.mockResolvedValue({
        columns: [
          { header: 'Student ID', key: 'studentId' },
          { header: 'Full Name', key: 'fullName' },
        ],
        rows: [
          { studentId: 'S1', fullName: 'Alice' },
          { studentId: 'S2', fullName: 'Bob' },
        ],
        entity: 'students',
      })

      await reportsController.previewCustomReport(req, res, next)

      expect(reportsBuilder.compileDynamicCustomReport).toHaveBeenCalledWith({
        entity: 'students',
        fields: ['studentId', 'fullName'],
        filters: { classId: 'cls1' },
        sortBy: undefined,
        sortOrder: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          count: 2,
          rows: expect.any(Array),
        }),
      })
    })
  })

  // ── 9. getCashFlowForecast (Pillar 2) ─────────────────────────────────────────
  describe('getCashFlowForecast', () => {
    it('calculates payroll obligation, historical velocity, and 3-month forecast', async () => {
      req = {}
      Staff.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { salary: 50000 },
          { salary: 70000 },
        ]),
      })

      Payment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { paymentDate: new Date('2026-05-01'), studentFeeId: { dueDate: new Date('2026-05-05') } },
            { paymentDate: new Date('2026-05-08'), studentFeeId: { dueDate: new Date('2026-05-05') } },
          ]),
        }),
      })

      Student.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: 's1' }, { _id: 's2' }]),
      })

      StudentFee.aggregate.mockResolvedValue([
        { _id: null, avgGross: 5000, avgDiscount: 500, totalFees: 20 },
      ])

      await reportsController.getCashFlowForecast(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          monthlyPayrollObligation: 120000,
          historicalVelocity: expect.objectContaining({
            earlyPercentage: expect.any(Number),
            onTimePercentage: expect.any(Number),
          }),
          forecast: expect.arrayContaining([
            expect.objectContaining({
              month: expect.any(String),
              grossBillable: expect.any(Number),
              projectedInflow: expect.any(Number),
              payrollLiability: 120000,
              netOperatingMargin: expect.any(Number),
            }),
          ]),
        }),
      })
    })
  })

  // ── 10. getConcessionAnalytics (Pillar 2) ─────────────────────────────────────
  describe('getConcessionAnalytics', () => {
    it('calculates concession totals and flags merit scholars below 70%', async () => {
      req = {}
      const mockStudentId = 'stu_merit_1'

      StudentFee.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              concessionType: 'Merit Scholarship',
              discount: 2000,
              studentId: {
                _id: mockStudentId,
                studentId: 'STD-099',
                fullName: 'Kamran Akmal',
                classId: { name: 'Grade 10-A' },
                guardian: { phone: '03001234567' },
              },
            },
          ]),
        }),
      })

      Grade.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { studentId: mockStudentId, percentage: 64 },
          { studentId: mockStudentId, percentage: 66 },
        ]),
      })

      await reportsController.getConcessionAnalytics(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          totalConcessionsAwarded: 2000,
          beneficiaryCount: 1,
          categories: expect.arrayContaining([
            expect.objectContaining({
              type: 'Merit Scholarship',
              totalAmount: 2000,
              averageGradePercentage: 65,
              reviewRequiredCount: 1,
            }),
          ]),
          flaggedStudents: expect.arrayContaining([
            expect.objectContaining({
              studentId: 'STD-099',
              fullName: 'Kamran Akmal',
              currentAverage: 65,
            }),
          ]),
        }),
      })
    })
  })

  // ── 11. getPaymentVelocityAnalytics (Pillar 2) ────────────────────────────────
  describe('getPaymentVelocityAnalytics', () => {
    it('aggregates payment modes and computes digital adoption and median latency', async () => {
      req = {}
      Payment.aggregate.mockResolvedValue([
        { _id: 'Cash', totalAmount: 60000, transactionCount: 12 },
        { _id: 'Bank Transfer', totalAmount: 40000, transactionCount: 8 },
      ])

      Payment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { paymentDate: new Date('2026-05-03'), studentFeeId: { dueDate: new Date('2026-05-01') } },
            { paymentDate: new Date('2026-05-01'), studentFeeId: { dueDate: new Date('2026-05-01') } },
          ]),
        }),
      })

      await reportsController.getPaymentVelocityAnalytics(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          medianDaysToSettle: expect.any(Number),
          onTimeCollectionRate: expect.any(Number),
          digitalAdoptionRate: 40,
          channelBreakdown: expect.arrayContaining([
            expect.objectContaining({ mode: 'Cash', totalAmount: 60000 }),
            expect.objectContaining({ mode: 'Bank Transfer', totalAmount: 40000 }),
          ]),
        }),
      })
    })
  })
})
