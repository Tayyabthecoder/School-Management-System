// The nightly job that flips unpaid fees to Overdue, and how it is scheduled (BullMQ when Redis is up,
// an in-process cron when it is not).
const mockWorkerInstances = []
jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((name, processor, options) => {
    const worker = { name, processor, options, handlers: {}, on: jest.fn((event, cb) => { worker.handlers[event] = cb }) }
    mockWorkerInstances.push(worker)
    return worker
  }),
}))
jest.mock('../config/redis', () => ({
  redisClient: {},
  checkRedisAvailable: jest.fn(),
  createRedisClient: jest.fn(),
}))
jest.mock('../models/StudentFee.model', () => ({ find: jest.fn(), updateMany: jest.fn() }))
jest.mock('../utils/audit-log.util', () => ({ logAudit: jest.fn() }))

const { Worker } = require('bullmq')
const redis = require('../config/redis')
const StudentFee = require('../models/StudentFee.model')
const { logAudit } = require('../utils/audit-log.util')
const worker = require('../jobs/fee-overdue.worker')

const findReturns = (rows) => StudentFee.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(rows) })

beforeEach(() => {
  jest.clearAllMocks()
  mockWorkerInstances.length = 0
  redis.checkRedisAvailable.mockReturnValue(false)
  redis.createRedisClient.mockReturnValue(null)
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe('executeFeeOverdueCheck', () => {
  test('looks only at unpaid fees whose due date is before today', async () => {
    findReturns([])
    await worker.executeFeeOverdueCheck()

    const [filter] = StudentFee.find.mock.calls[0]
    expect(filter.status).toEqual({ $in: ['Pending', 'Partial'] })
    const cutoff = filter.dueDate.$lt
    expect(cutoff.getHours()).toBe(0)
    expect(cutoff.getMinutes()).toBe(0)
  })

  test('with nothing overdue it changes and logs nothing', async () => {
    findReturns([])
    expect(await worker.executeFeeOverdueCheck()).toEqual({ processedCount: 0 })
    expect(StudentFee.updateMany).not.toHaveBeenCalled()
    expect(logAudit).not.toHaveBeenCalled()
  })

  test('marks the found fees Overdue, re-checking status so a fee paid in the meantime is left alone, and audits the batch', async () => {
    findReturns([{ _id: 'f1' }, { _id: 'f2' }, { _id: 'f3' }])

    expect(await worker.executeFeeOverdueCheck()).toEqual({ processedCount: 3 })

    expect(StudentFee.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['f1', 'f2', 'f3'] }, status: { $in: ['Pending', 'Partial'] } },
      { $set: { status: 'Overdue' } },
    )
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({
      req: null, action: 'FEE_OVERDUE_BATCH', module: 'finance', newValues: expect.objectContaining({ feesMarkedOverdue: 3 }),
    }))
  })

  test('a database failure is logged and rethrown so the queue records the failure', async () => {
    StudentFee.find.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error('mongo down')) })
    await expect(worker.executeFeeOverdueCheck()).rejects.toThrow('mongo down')
    expect(console.error).toHaveBeenCalledWith('[Fee Overdue Worker Error]:', 'mongo down')
  })
})

describe('initFeeOverdueSchedule', () => {
  test('with Redis up it starts a BullMQ worker on its own connection, one job at a time', async () => {
    redis.checkRedisAvailable.mockReturnValue(true)
    const own = { own: true }
    redis.createRedisClient.mockReturnValue(own)
    findReturns([])

    expect(worker.initFeeOverdueSchedule()).toBe('bullmq')

    expect(Worker).toHaveBeenCalledWith('fee-overdue-check', expect.any(Function), { connection: own, concurrency: 1 })
    expect(worker.getFeeOverdueWorker()).toBe(mockWorkerInstances[0])
    await expect(mockWorkerInstances[0].processor()).resolves.toEqual({ processedCount: 0 })
  })

  test('falls back to the shared connection when an isolated one cannot be made', () => {
    redis.checkRedisAvailable.mockReturnValue(true)
    redis.createRedisClient.mockReturnValue(null)
    worker.initFeeOverdueSchedule()
    expect(Worker.mock.calls[0][2].connection).toBe(redis.redisClient)
  })

  test('the worker logs its events instead of crashing the process', () => {
    redis.checkRedisAvailable.mockReturnValue(true)
    worker.initFeeOverdueSchedule()
    const { handlers } = mockWorkerInstances[0]

    handlers.error(new Error('conn'))
    handlers.error('plain string')
    handlers.completed({ id: 7 }, { processedCount: 2 })
    handlers.failed({ id: 7 }, new Error('boom'))
    handlers.failed(undefined, new Error('no job'))

    expect(console.error).toHaveBeenCalledWith('[Fee Overdue Worker] Unhandled worker error:', 'conn')
    expect(console.error).toHaveBeenCalledWith('[Fee Overdue Worker] Unhandled worker error:', 'plain string')
    expect(console.log).toHaveBeenCalledWith('[Fee Overdue Worker]: Completed job 7:', { processedCount: 2 })
    expect(console.error).toHaveBeenCalledWith('[Fee Overdue Worker]: Failed job 7:', 'boom')
    expect(console.error).toHaveBeenCalledWith('[Fee Overdue Worker]: Failed job undefined:', 'no job')
  })

  test('without Redis it schedules a daily 01:00 Karachi cron and also runs once now', () => {
    findReturns([])
    const schedule = jest.fn(() => ({ job: true }))

    expect(worker.initFeeOverdueSchedule({ cronLib: { schedule } })).toBe('cron')

    expect(schedule).toHaveBeenCalledWith('0 1 * * *', expect.any(Function), { scheduled: true, timezone: 'Asia/Karachi' })
    expect(StudentFee.find).toHaveBeenCalledTimes(1) // the immediate run
    expect(worker.getFallbackCronJob()).toEqual({ job: true })
  })

  test('runNow:false only schedules', () => {
    findReturns([])
    worker.initFeeOverdueSchedule({ cronLib: { schedule: jest.fn() }, runNow: false })
    expect(StudentFee.find).not.toHaveBeenCalled()
  })

  test('a failing scheduled run is swallowed (the next night tries again)', async () => {
    StudentFee.find.mockReturnValue({ populate: jest.fn().mockRejectedValue(new Error('mongo down')) })
    let tick
    worker.initFeeOverdueSchedule({ cronLib: { schedule: (_p, fn) => { tick = fn } }, runNow: false })

    await expect(Promise.resolve(tick())).resolves.toBeUndefined()
  })

  test('if BullMQ cannot start it uses the cron instead', () => {
    redis.checkRedisAvailable.mockReturnValue(true)
    Worker.mockImplementationOnce(() => { throw new Error('bad connection') })
    findReturns([])
    const schedule = jest.fn()

    expect(worker.initFeeOverdueSchedule({ cronLib: { schedule } })).toBe('cron')
    expect(console.warn).toHaveBeenCalledWith('[Fee Overdue Worker] BullMQ unavailable, using cron fallback:', 'bad connection')
  })

  test('if even the cron cannot be scheduled it reports none', () => {
    const cronLib = { schedule: () => { throw new Error('invalid pattern') } }
    expect(worker.initFeeOverdueSchedule({ cronLib })).toBe('none')
    expect(console.error).toHaveBeenCalledWith('[Fee Overdue]: Could not schedule overdue check:', 'invalid pattern')
  })
})
