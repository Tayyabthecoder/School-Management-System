const Redis = require('ioredis')

let redisClient = null
let isRedisAvailable = false

try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 2) {
        isRedisAvailable = false
        return null // Stop retrying after 2 attempts
      }
      return Math.min(times * 100, 500)
    },
    lazyConnect: true,
  })

  redisClient.on('connect', () => {
    isRedisAvailable = true
    console.log('[Redis]: Connected successfully')
  })

  redisClient.on('error', () => {
    isRedisAvailable = false
  })

  redisClient.connect().catch(() => {
    isRedisAvailable = false
  })
} catch (err) {
  isRedisAvailable = false
}

const getRedisClient = () => redisClient
const checkRedisAvailable = () => isRedisAvailable

/**
 * Factory for dedicated isolated Redis connection instances (e.g. for BullMQ Queues and Workers)
 */
const createRedisClient = (role = 'Client') => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 2) return null
        return Math.min(times * 100, 500)
      },
      lazyConnect: true,
    })
    client.on('error', () => {})
    client.connect().catch(() => {})
    return client
  } catch {
    return null
  }
}

module.exports = {
  redisClient,
  getRedisClient,
  checkRedisAvailable,
  createRedisClient,
}
