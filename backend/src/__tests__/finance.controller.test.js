const financeController = require('../modules/finance/finance.controller')
const FeeStructure = require('../models/FeeStructure.model')
const StudentFee = require('../models/StudentFee.model')
const Payment = require('../models/Payment.model')
const Student = require('../models/Student.model')
const Counter = require('../models/Counter.model')
const cacheUtil = require('../utils/cache.util')
const auditLogUtil = require('../utils/audit-log.util')
const sseController = require('../modules/reports/sse.controller')

jest.mock('../models/FeeStructure.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/Payment.model')
jest.mock('../models/Student.model')
jest.mock('../models/AcademicYear.model')
jest.mock('../models/ChallanSettings.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../models/Counter.model')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')
jest.mock('../modules/reports/sse.controller')

describe('Finance Controller Tests', () => {
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

  describe('recordPayment', () => {
    it('records full payment, updates StudentFee status to Paid, invalidates cache and broadcasts', async () => {
      req = {
        body: {
          studentFeeId: 'fee123',
          amountPaid: 5000,
          paymentMode: 'Cash',
        },
        user: { _id: 'user123' },
      }

      const mockFeeRecord = {
        _id: 'fee123',
        amountDue: 5000,
        netAmount: 5000,
        amountPaid: 0,
        outstandingAmount: 5000,
        studentId: { _id: 'student123' },
      }

      const mockUpdatedFee = {
        _id: 'fee123',
        amountDue: 5000,
        netAmount: 5000,
        amountPaid: 5000,
        outstandingAmount: 0,
        status: 'Pending',
        save: jest.fn().mockResolvedValue(),
      }

      StudentFee.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFeeRecord),
      })
      StudentFee.findOneAndUpdate.mockResolvedValue(mockUpdatedFee)
      Counter.getNextSequence.mockResolvedValue(101)
      Payment.create.mockResolvedValue({
        _id: 'payment123',
        receiptNo: 'REC-2026-00101',
        amountPaid: 5000,
      })

      await financeController.recordPayment(req, res, next)

      expect(mockUpdatedFee.status).toBe('Paid')
      expect(mockUpdatedFee.save).toHaveBeenCalled()
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('dashboard:stats')
      expect(sseController.broadcast).toHaveBeenCalledWith('fee:paid', expect.objectContaining({
        studentId: 'student123',
        amountPaid: 5000,
      }))
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('records partial payment, updates StudentFee status to Partial', async () => {
      req = {
        body: {
          studentFeeId: 'fee123',
          amountPaid: 2000,
        },
        user: { _id: 'user123' },
      }

      const mockFeeRecord = {
        _id: 'fee123',
        amountDue: 5000,
        netAmount: 5000,
        amountPaid: 0,
        outstandingAmount: 5000,
        studentId: { _id: 'student123' },
      }

      const mockUpdatedFee = {
        _id: 'fee123',
        amountDue: 5000,
        netAmount: 5000,
        amountPaid: 2000,
        outstandingAmount: 3000,
        status: 'Pending',
        save: jest.fn().mockResolvedValue(),
      }

      StudentFee.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFeeRecord),
      })
      StudentFee.findOneAndUpdate.mockResolvedValue(mockUpdatedFee)
      Counter.getNextSequence.mockResolvedValue(102)
      Payment.create.mockResolvedValue({
        _id: 'payment124',
        receiptNo: 'REC-2026-00102',
        amountPaid: 2000,
      })

      await financeController.recordPayment(req, res, next)

      expect(mockUpdatedFee.status).toBe('Partial')
      expect(mockUpdatedFee.save).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('rejects payment exceeding outstanding balance', async () => {
      req = {
        body: {
          studentFeeId: 'fee123',
          amountPaid: 6000,
        },
        user: { _id: 'user123' },
      }

      const mockFeeRecord = {
        _id: 'fee123',
        amountDue: 5000,
        netAmount: 5000,
        amountPaid: 0,
        outstandingAmount: 5000,
        studentId: { _id: 'student123' },
      }

      StudentFee.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFeeRecord),
      })

      await financeController.recordPayment(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining('exceeds outstanding amount'),
        })
      )
    })
  })

  describe('createFeeStructure', () => {
    it('creates structure, assigns fees to students, and invalidates dashboard cache', async () => {
      req = {
        body: {
          name: 'Monthly Tuition Fee',
          amount: 4000,
          classId: 'class123',
          dueDate: new Date(),
        },
      }

      FeeStructure.create.mockResolvedValue({
        _id: 'struct123',
        name: 'Monthly Tuition Fee',
        amount: 4000,
        classId: 'class123',
      })
      Student.find.mockResolvedValue([
        { _id: 'stu1' },
        { _id: 'stu2' },
      ])
      StudentFee.insertMany.mockResolvedValue([])

      await financeController.createFeeStructure(req, res, next)

      expect(StudentFee.insertMany).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ studentId: 'stu1', amountDue: 4000 }),
        expect.objectContaining({ studentId: 'stu2', amountDue: 4000 }),
      ]))
      expect(cacheUtil.invalidateCache).toHaveBeenCalledWith('dashboard:stats')
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })
})
