const StudentFee = require('../models/StudentFee.model')
const auditUtil = require('../utils/audit-log.util')
const reportsController = require('../modules/reports/reports.controller')
const { initFeeOverdueSchedule, executeFeeOverdueCheck } = require('../jobs/fee-overdue.worker')

jest.mock('../models/StudentFee.model')
jest.mock('../utils/audit-log.util')

beforeEach(() => {
  jest.clearAllMocks()
  auditUtil.logAudit.mockResolvedValue()
})

describe('fee overdue schedule without Redis', () => {
  test('falls back to a daily node-cron job in Asia/Karachi and runs once immediately', async () => {
    StudentFee.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) })
    const cronLib = { schedule: jest.fn().mockReturnValue({ stop: jest.fn() }) }

    const mode = initFeeOverdueSchedule({ cronLib })

    expect(mode).toBe('cron')
    expect(cronLib.schedule).toHaveBeenCalledWith('0 1 * * *', expect.any(Function), expect.objectContaining({ timezone: 'Asia/Karachi' }))
    await new Promise(setImmediate)
    expect(StudentFee.find).toHaveBeenCalledWith(expect.objectContaining({ status: { $in: ['Pending', 'Partial'] } }))
  })

  test('the scheduled callback marks past-due unpaid fees as Overdue', async () => {
    StudentFee.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: 'fee-1' }, { _id: 'fee-2' }]) })
    StudentFee.updateMany.mockResolvedValue({})

    const result = await executeFeeOverdueCheck()

    expect(result).toEqual({ processedCount: 2 })
    expect(StudentFee.updateMany).toHaveBeenCalledWith({ _id: { $in: ['fee-1', 'fee-2'] }, status: { $in: ['Pending', 'Partial'] } }, { $set: { status: 'Overdue' } })
  })
})

describe('defaulter aging does not depend on the stored Overdue status', () => {
  test('matches any unpaid, past-due fee (Pending included)', async () => {
    StudentFee.aggregate.mockResolvedValue([{}])
    const res = { json: jest.fn() }

    await reportsController.getDefaulterAging({ query: {} }, res, jest.fn())

    const match = StudentFee.aggregate.mock.calls[0][0][0].$match
    expect(match.status).toEqual({ $ne: 'Paid' })
    expect(match.dueDate.$lt).toBeInstanceOf(Date)
    expect(match.outstandingAmount).toEqual({ $gt: 0 })
  })
})
