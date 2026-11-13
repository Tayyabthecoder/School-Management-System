const { Worker } = require('bullmq')
const { redisClient, checkRedisAvailable, createRedisClient } = require('../config/redis')
const StudentFee = require('../models/StudentFee.model')
const { logAudit } = require('../utils/audit-log.util')

const executeFeeOverdueCheck = async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueFees = await StudentFee.find({
      status: { $in: ['Pending', 'Partial'] },
      dueDate: { $lt: today },
    }).populate('studentId')

    if (overdueFees.length === 0) {
      return { processedCount: 0 }
    }

    const overdueIds = overdueFees.map((f) => f._id)
    await StudentFee.updateMany(
      // Re-check status so a fee paid since the find above is not flipped back to Overdue.
      { _id: { $in: overdueIds }, status: { $in: ['Pending', 'Partial'] } },
      { $set: { status: 'Overdue' } }
    )

    await logAudit({
      req: null,
      action: 'FEE_OVERDUE_BATCH',
      module: 'finance',
      newValues: {
        feesMarkedOverdue: overdueFees.length,
        runAt: new Date(),
      },
    })

    return { processedCount: overdueFees.length }
  } catch (err) {
    console.error('[Fee Overdue Worker Error]:', err.message)
    throw err
  }
}

const OVERDUE_CRON_PATTERN = '0 1 * * *' // 01:00 daily, same slot as the BullMQ repeat job
const OVERDUE_CRON_TIMEZONE = 'Asia/Karachi'

let feeOverdueWorker = null
let fallbackCronJob = null

const startBullWorker = () => {
  const workerConnection = createRedisClient('FeeWorker') || redisClient
  const worker = new Worker(
    'fee-overdue-check',
    async () => executeFeeOverdueCheck(),
    { connection: workerConnection, concurrency: 1 }
  )
  worker.on('error', (err) => {
    console.error('[Fee Overdue Worker] Unhandled worker error:', err?.message || err)
  })
  worker.on('completed', (job, result) => {
    console.log(`[Fee Overdue Worker]: Completed job ${job.id}:`, result)
  })
  worker.on('failed', (job, err) => {
    console.error(`[Fee Overdue Worker]: Failed job ${job?.id}:`, err.message)
  })
  return worker
}

/**
 * Starts the daily overdue-fee check. Uses the BullMQ worker when Redis is reachable;
 * otherwise falls back to an in-process node-cron schedule (plus one immediate run),
 * so fees still become Overdue on installs without Redis.
 *
 * @param {{ cronLib?: object, runNow?: boolean }} [options]
 * @returns {'bullmq' | 'cron' | 'none'}
 */
const initFeeOverdueSchedule = ({ cronLib = require('node-cron'), runNow = true } = {}) => {
  if (redisClient && checkRedisAvailable()) {
    try {
      feeOverdueWorker = startBullWorker()
      return 'bullmq'
    } catch (err) {
      console.warn('[Fee Overdue Worker] BullMQ unavailable, using cron fallback:', err?.message || err)
    }
  }

  try {
    fallbackCronJob = cronLib.schedule(
      OVERDUE_CRON_PATTERN,
      () => executeFeeOverdueCheck().catch(() => {}),
      { scheduled: true, timezone: OVERDUE_CRON_TIMEZONE }
    )
    if (runNow) executeFeeOverdueCheck().catch(() => {})
    console.log('[Fee Overdue]: Redis unavailable; daily overdue check scheduled with node-cron.')
    return 'cron'
  } catch (err) {
    console.error('[Fee Overdue]: Could not schedule overdue check:', err?.message || err)
    return 'none'
  }
}

module.exports = {
  executeFeeOverdueCheck,
  initFeeOverdueSchedule,
  getFeeOverdueWorker: () => feeOverdueWorker,
  getFallbackCronJob: () => fallbackCronJob,
}
