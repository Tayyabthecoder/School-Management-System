const { Queue } = require('bullmq')
const { redisClient, checkRedisAvailable, createRedisClient } = require('../config/redis')

let feeOverdueQueue = null

const initQueues = () => {
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
}

// Initialize on load
initQueues()

module.exports = {
  feeOverdueQueue,
  initQueues,
}
