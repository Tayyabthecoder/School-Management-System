const { redisClient, checkRedisAvailable } = require('../config/redis')

const MAX_MEMORY_ITEMS = 500
// In-memory fallback cache Map
const memoryCache = new Map()

const cleanExpiredMemoryCache = () => {
  const now = Date.now()
  for (const [k, v] of memoryCache.entries()) {
    if (v.expiry <= now) {
      memoryCache.delete(k)
    }
  }
}

const getOrSet = async (key, ttlSeconds = 300, fetcherFn) => {
  // 1. Try Redis cache
  if (redisClient && checkRedisAvailable()) {
    try {
      const cached = await redisClient.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (err) {
      // Redis error, proceed to fetcher
    }
  } else {
    // Check in-memory fallback
    const mem = memoryCache.get(key)
    if (mem && mem.expiry > Date.now()) {
      return mem.data
    }
  }

  // 2. Fetch fresh data
  const freshData = await fetcherFn()

  // 3. Store in cache
  if (redisClient && checkRedisAvailable()) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(freshData))
    } catch (err) {
      // Redis set failed
    }
  } else {
    if (memoryCache.size >= MAX_MEMORY_ITEMS) {
      cleanExpiredMemoryCache()
      if (memoryCache.size >= MAX_MEMORY_ITEMS) {
        const oldestKey = memoryCache.keys().next().value
        if (oldestKey) memoryCache.delete(oldestKey)
      }
    }
    memoryCache.set(key, {
      data: freshData,
      expiry: Date.now() + ttlSeconds * 1000,
    })
  }

  return freshData
}

const invalidateCache = async (key) => {
  if (redisClient && checkRedisAvailable()) {
    try {
      await redisClient.del(key)
    } catch (err) {}
  }
  memoryCache.delete(key)
}

module.exports = {
  getOrSet,
  invalidateCache,
}
