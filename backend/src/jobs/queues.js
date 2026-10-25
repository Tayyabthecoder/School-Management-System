const { Queue } = require('bullmq')
const { redisClient, createRedisClient } = require('../config/redis')

let feeOverdueQueue = null

try {
  if (redisClient) {
    const queueConnection = createRedisClient('QueueConnection') || redisClient

    feeOverdueQueue = new Queue('fee-overdue-check', {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
      },
    })
    feeOverdueQueue.on('error', () => {})

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

module.exports = {
  feeOverdueQueue,
}
