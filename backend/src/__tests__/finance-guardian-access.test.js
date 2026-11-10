const financeController = require('../modules/finance/finance.controller')
const guardianController = require('../modules/guardian/guardian.controller')
const Payment = require('../models/Payment.model')
const StudentFee = require('../models/StudentFee.model')
const Student = require('../models/Student.model')
const Grade = require('../models/Grade.model')
const Exam = require('../models/Exam.model')
const StudentLeaveRequest = require('../models/StudentLeaveRequest.model')
const challanService = require('../services/monthly-challan.service')
const cacheUtil = require('../utils/cache.util')
const auditUtil = require('../utils/audit-log.util')
const pdfUtil = require('../utils/pdf.util')
const ChallanSettings = require('../models/ChallanSettings.model')

jest.mock('../models/Payment.model')
jest.mock('../models/StudentFee.model')
jest.mock('../models/Student.model')
jest.mock('../models/Grade.model')
jest.mock('../models/Exam.model')
jest.mock('../models/StudentLeaveRequest.model')
jest.mock('../models/ChallanSettings.model')
jest.mock('../models/SchoolSettings.model')
jest.mock('../services/monthly-challan.service')
jest.mock('../utils/cache.util')
jest.mock('../utils/audit-log.util')
jest.mock('../modules/reports/sse.controller')
jest.mock('../utils/pdf.util', () => ({
  generatePDFBuffer: jest.fn().mockResolvedValue(Buffer.from('%PDF')),
  buildPaymentReceiptPDF: jest.fn(),
  buildFeeChallanPDF: jest.fn(),
  DEFAULT_CHALLAN_SETTINGS: {},
}))

const CHILD_A = '64b000000000000000000001'
const CHILD_B = '64b000000000000000000002'
const STRANGER = '64b000000000000000000009'

const guardian = { _id: 'g1', roleName: 'guardian', studentId: CHILD_A, studentIds: [CHILD_A, CHILD_B] }

const mockRes = () => {
  const res = { json: jest.fn(), status: jest.fn(), setHeader: jest.fn(), send: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}

const mockPaymentFor = (studentId) => {
  const populated = {
    _id: 'p1',
    receiptNo: 'REC-1',
    studentId: { _id: studentId, fullName: 'Kid', classId: { name: 'Grade 1' } },
    studentFeeId: { outstandingAmount: 0 },
  }
  const second = { populate: jest.fn().mockResolvedValue(populated) }
  Payment.findById.mockReturnValue({ populate: jest.fn().mockReturnValue(second) })
}

beforeEach(() => {
  jest.clearAllMocks()
  cacheUtil.getOrSet.mockResolvedValue({})
  cacheUtil.invalidateCache.mockResolvedValue()
  auditUtil.logAudit.mockResolvedValue()
  pdfUtil.generatePDFBuffer.mockResolvedValue(Buffer.from('%PDF'))
  ChallanSettings.findOne.mockReturnValue({ sort: jest.fn().mockResolvedValue(null) })
})

describe('downloadReceiptPDF ownership', () => {
  test('guardian can download the receipt of their second linked child', async () => {
    mockPaymentFor(CHILD_B)
    const res = mockRes()
    const next = jest.fn()

    await financeController.downloadReceiptPDF({ params: { paymentId: 'p1' }, user: guardian }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.send).toHaveBeenCalled()
  })

  test('guardian cannot download a receipt of an unrelated student', async () => {
    mockPaymentFor(STRANGER)
    const next = jest.fn()

    await financeController.downloadReceiptPDF({ params: { paymentId: 'p1' }, user: guardian }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })

  test('student cannot download another student receipt', async () => {
    mockPaymentFor(CHILD_B)
    const next = jest.fn()
    const student = { roleName: 'student', studentId: CHILD_A }

    await financeController.downloadReceiptPDF({ params: { paymentId: 'p1' }, user: student }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})

describe('downloadChallanPDF ownership', () => {
  const mockFeeFor = (studentId) => {
    const fee = {
      _id: { toString: () => 'feeid000000abcdef' },
      studentId: { _id: studentId, fullName: 'Kid', classId: { name: 'Grade 1' } },
      status: 'Pending',
      dueDate: new Date(),
      save: jest.fn().mockResolvedValue(),
    }
    const second = { populate: jest.fn().mockResolvedValue(fee) }
    StudentFee.findById.mockReturnValue({ populate: jest.fn().mockReturnValue(second) })
    return fee
  }

  test('guardian can download the challan of a non-primary linked child', async () => {
    mockFeeFor(CHILD_B)
    const res = mockRes()
    const next = jest.fn()

    await financeController.downloadChallanPDF({ params: { feeId: 'f1' }, user: guardian }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.send).toHaveBeenCalled()
  })

  test('guardian is denied (and the record untouched) for an unrelated student', async () => {
    const fee = mockFeeFor(STRANGER)
    const next = jest.fn()

    await financeController.downloadChallanPDF({ params: { feeId: 'f1' }, user: guardian }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(fee.save).not.toHaveBeenCalled()
  })
})

describe('triggerMonthlyChallansManually audit attribution', () => {
  test('records the acting username instead of "undefined"', async () => {
    challanService.generateMonthlyFeeChallans.mockResolvedValue({ month: 'May', year: 2026, generatedCount: 0 })
    const req = { body: {}, user: { username: 'admin', roleName: 'super_admin' } }

    await financeController.triggerMonthlyChallansManually(req, mockRes(), jest.fn())

    expect(challanService.generateMonthlyFeeChallans).toHaveBeenCalledWith(
      expect.objectContaining({ executedBy: 'admin (super_admin)' })
    )
  })
})

describe('guardian submitLeaveRequest', () => {
  const body = { startDate: '2026-05-01', endDate: '2026-05-03', reason: 'Flu' }

  test('rejects a leave request for a student who is not the guardian\'s child (IDOR)', async () => {
    const next = jest.fn()

    await guardianController.submitLeaveRequest({ body: { ...body, studentId: STRANGER }, query: {}, user: guardian }, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
    expect(StudentLeaveRequest.create).not.toHaveBeenCalled()
  })

  test('accepts a leave request for a linked child', async () => {
    Student.findOne.mockResolvedValue({ _id: CHILD_B, classId: 'c1', sectionId: 'A' })
    StudentLeaveRequest.create.mockResolvedValue({ _id: 'leave1' })
    const res = mockRes()
    const next = jest.fn()

    await guardianController.submitLeaveRequest({ body: { ...body, studentId: CHILD_B }, query: {}, user: guardian }, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('rejects an end date before the start date', async () => {
    const next = jest.fn()
    const req = { body: { ...body, startDate: '2026-05-05', endDate: '2026-05-01', studentId: CHILD_A }, query: {}, user: guardian }

    await guardianController.submitLeaveRequest(req, mockRes(), next)

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })
})

describe('guardian getChildGrades', () => {
  test('only returns grades of published exams', async () => {
    Exam.find.mockReturnValue({ distinct: jest.fn().mockResolvedValue(['exam-published']) })
    const sort = jest.fn().mockResolvedValue([])
    Grade.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort }) })

    await guardianController.getChildGrades({ query: {}, user: guardian }, mockRes(), jest.fn())

    expect(Exam.find).toHaveBeenCalledWith({ isPublished: true })
    expect(Grade.find).toHaveBeenCalledWith({ studentId: CHILD_A, examId: { $in: ['exam-published'] } })
  })
})
