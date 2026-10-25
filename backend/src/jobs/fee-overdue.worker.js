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
      { _id: { $in: overdueIds } },
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

let feeOverdueWorker = null

if (redisClient && checkRedisAvailable()) {
  try {
    const workerConnection = createRedisClient('FeeWorker') || redisClient
    feeOverdueWorker = new Worker(
      'fee-overdue-check',
      async () => {
        return await executeFeeOverdueCheck()
      },
      {
        connection: workerConnection,
        concurrency: 1,
      }
    )

    feeOverdueWorker.on('error', (err) => {
      console.error('[Fee Overdue Worker] Unhandled worker error:', err?.message || err)
    })
    feeOverdueWorker.on('completed', (job, result) => {
      console.log(`[Fee Overdue Worker]: Completed job ${job.id}:`, result)
    })
    feeOverdueWorker.on('failed', (job, err) => {
      console.error(`[Fee Overdue Worker]: Failed job ${job?.id}:`, err.message)
    })
  } catch (err) {
    console.warn('[Fee Overdue Worker] Failed to initialize BullMQ worker:', err?.message || err)
  }
}

module.exports = {
  executeFeeOverdueCheck,
  feeOverdueWorker,
}
