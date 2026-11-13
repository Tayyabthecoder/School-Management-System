const Redis = require('ioredis')
const env = require('./env')

let redisClient = null
let isRedisAvailable = false

// Tests run without a Redis server: skip the live connection so ioredis reconnect
// timers don't keep the Jest worker alive (cache and rate limiting fall back to memory).
const IS_TEST_ENV = env.NODE_ENV === 'test'

const connectSharedClient = () => {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        // Keep retrying with capped backoff so a Redis that starts late (or restarts) is picked up.
        isRedisAvailable = false
        return Math.min(times * 500, 10000)
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
}

if (!IS_TEST_ENV) {
  connectSharedClient()
}

const getRedisClient = () => redisClient
const checkRedisAvailable = () => isRedisAvailable

/**
 * Factory for dedicated isolated Redis connection instances (e.g. for BullMQ Queues and Workers)
 */
const createRedisClient = (role = 'Client') => {
  if (IS_TEST_ENV) return null
  try {
    const redisUrl = env.REDIS_URL
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
