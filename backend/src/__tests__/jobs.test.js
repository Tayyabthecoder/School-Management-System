// Background jobs: the monthly challan cron registration and the fee-overdue BullMQ queue.
jest.mock('node-cron', () => ({ schedule: jest.fn() }))
jest.mock('../services/monthly-challan.service', () => ({ generateMonthlyFeeChallans: jest.fn() }))

describe('monthly challan cron', () => {
  let cron
  let service
  let job

  beforeEach(() => {
    jest.resetModules()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    cron = require('node-cron')
    cron.schedule.mockReset()
    service = require('../services/monthly-challan.service')
    service.generateMonthlyFeeChallans.mockReset()
    job = require('../jobs/monthly-challan.cron')
  })

  afterEach(() => jest.restoreAllMocks())

  test('schedules the 1st of every month at midnight in Asia/Karachi', () => {
    job.initMonthlyChallanCron()

    expect(cron.schedule).toHaveBeenCalledTimes(1)
    const [pattern, , options] = cron.schedule.mock.calls[0]
    expect(pattern).toBe('0 0 1 * *')
    expect(options).toMatchObject({ timezone: 'Asia/Karachi', scheduled: true })
  })

  test('the scheduled callback generates challans for the current month as the cron user', async () => {
    service.generateMonthlyFeeChallans.mockResolvedValue({ generatedCount: 3, skippedCount: 1, month: 'May', year: 2026 })
    job.initMonthlyChallanCron()
    const callback = cron.schedule.mock.calls[0][1]

    await callback()

    expect(service.generateMonthlyFeeChallans).toHaveBeenCalledWith(
      expect.objectContaining({ executedBy: 'CRON_SYSTEM', targetDate: expect.any(Date) })
    )
  })

  test('a failing generation is logged, not thrown, so the schedule keeps running', async () => {
    service.generateMonthlyFeeChallans.mockRejectedValue(new Error('db down'))
    job.initMonthlyChallanCron()
    const callback = cron.schedule.mock.calls[0][1]

    await expect(callback()).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to generate'), 'db down')
  })

  test('a scheduling error at start-up does not crash the server', () => {
    cron.schedule.mockImplementation(() => { throw new Error('bad pattern') })

    expect(() => job.initMonthlyChallanCron()).not.toThrow()
    expect(job.getCronJob()).toBeNull()
  })
})

describe('fee overdue queue', () => {
  const loadQueues = ({ redisUp }) => {
    jest.resetModules()
    const queueInstance = { on: jest.fn(), add: jest.fn().mockResolvedValue({}) }
    const Queue = jest.fn(() => queueInstance)
    jest.doMock('bullmq', () => ({ Queue }))
    jest.doMock('../config/redis', () => ({
      redisClient: redisUp ? {} : null,
      checkRedisAvailable: () => redisUp,
      createRedisClient: () => ({}),
    }))
    return { queues: require('../jobs/queues'), Queue, queueInstance }
  }

  afterEach(() => {
    jest.dontMock('bullmq')
    jest.dontMock('../config/redis')
  })

  test('does nothing while Redis is unavailable', () => {
    const { queues, Queue } = loadQueues({ redisUp: false })

    expect(queues.initQueues()).toBeNull()
    expect(Queue).not.toHaveBeenCalled()
  })

  test('creates the queue once and registers the daily 01:00 repeat job', () => {
    const { queues, Queue, queueInstance } = loadQueues({ redisUp: true })

    const first = queues.initQueues()
    const second = queues.initQueues()

    expect(first).toBe(queueInstance)
    expect(second).toBe(first)
    expect(Queue).toHaveBeenCalledTimes(1)
    expect(queueInstance.add).toHaveBeenCalledWith(
      'daily-fee-overdue-check', {}, { repeat: { pattern: '0 1 * * *' } }
    )
  })
})
