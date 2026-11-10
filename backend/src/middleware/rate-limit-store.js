const { MemoryStore } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const { getRedisClient, checkRedisAvailable } = require('../config/redis')

/**
 * Rate-limit store that decides per request (SEC-04). The old code picked a store once at
 * module load, before the lazy Redis connection finished, so limits were always in-memory
 * and per-process. This store uses Redis (shared across instances) whenever it is
 * connected and falls back to memory when it is not or when a Redis call fails.
 */
class AdaptiveRateLimitStore {
  constructor({ prefix = 'rl:', getClient = getRedisClient, isAvailable = checkRedisAvailable, createRedisStore } = {}) {
    this.prefix = prefix
    this.getClient = getClient
    this.isAvailable = isAvailable
    this.memory = new MemoryStore()
    this.redisStore = null
    this.options = null
    this.createRedisStore = createRedisStore || ((client) => new RedisStore({
      prefix: this.prefix,
      sendCommand: (...args) => client.call(...args),
    }))
  }

  init(options) {
    this.options = options
    this.memory.init(options)
  }

  activeRedisStore() {
    const client = this.getClient()
    if (!client || !this.isAvailable()) return null
    if (!this.redisStore) {
      this.redisStore = this.createRedisStore(client)
      if (this.options && typeof this.redisStore.init === 'function') this.redisStore.init(this.options)
    }
    return this.redisStore
  }

  async run(method, ...args) {
    const redis = this.activeRedisStore()
    if (redis) {
      try {
        return await redis[method](...args)
      } catch {
        // Redis dropped mid-request: count in memory rather than failing the request
      }
    }
    return this.memory[method](...args)
  }

  increment(key) { return this.run('increment', key) }
  decrement(key) { return this.run('decrement', key) }
  resetKey(key) { return this.run('resetKey', key) }
  get(key) { return this.run('get', key) }

  shutdown() {
    if (typeof this.memory.shutdown === 'function') this.memory.shutdown()
  }
}

module.exports = { AdaptiveRateLimitStore }
