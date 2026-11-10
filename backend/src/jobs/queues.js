const { Queue } = require('bullmq')
const { redisClient, checkRedisAvailable, createRedisClient } = require('../config/redis')

let feeOverdueQueue = null

/**
 * Creates the fee-overdue queue and registers its daily repeat job.
 * Idempotent: server start-up calls this once Redis has had time to connect, and
 * repeated calls must not open duplicate Redis connections or Queue instances.
 */
const initQueues = () => {
  if (feeOverdueQueue) return feeOverdueQueue
  try {
    if (redisClient && checkRedisAvailable()) {
      const queueConnection = createRedisClient('QueueConnection') || redisClient

      feeOverdueQueue = new Queue('fee-overdue-check', {
        connection: queueConnection,
        defaultJobOptions: {
          attempts: 2,
          removeOnComplete: true,
        },
      })
      feeOverdueQueue.on('error', (err) => {
        console.warn('[Fee Overdue Queue Error]:', err?.message || err)
      })

      // Register daily cron at 01:00 AM if redis available
      feeOverdueQueue.add(
        'daily-fee-overdue-check',
        {},
        {
          repeat: { pattern: '0 1 * * *' },
        }
      ).catch(() => {})
    }
  } catch (err) {
    // Silent fallback
  }
  return feeOverdueQueue
}

const getFeeOverdueQueue = () => feeOverdueQueue

module.exports = {
  initQueues,
  getFeeOverdueQueue,
}
