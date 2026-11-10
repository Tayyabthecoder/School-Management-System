const { redisClient, checkRedisAvailable } = require('../config/redis')

const MAX_MEMORY_ITEMS = 500
const memoryCache = new Map()

// The in-memory fallback is per process: an invalidation on one instance can't reach the
// others. Capping its TTL bounds how long another instance can serve stale settings or
// day restrictions (LOW-07). Run Redis when the backend has more than one instance.
const parsedCap = parseInt(process.env.MEMORY_CACHE_MAX_TTL_SECONDS, 10)
const MEMORY_CACHE_MAX_TTL_SECONDS = Number.isFinite(parsedCap) && parsedCap >= 0 ? parsedCap : 30

const getOrSet = async (key, ttlSeconds = 300, fetcherFn) => {
  // 1. Try Redis cache
  if (redisClient && checkRedisAvailable()) {
    try {
      const cached = await redisClient.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (_) {
      // Redis error, proceed to fetcher
    }
  } else {
    // Check in-memory fallback (passive TTL eviction)
    const mem = memoryCache.get(key)
    if (mem) {
      if (mem.expiry > Date.now()) {
        return mem.data
      }
      memoryCache.delete(key)
    }
  }

  // 2. Fetch fresh data
  const freshData = await fetcherFn()

  // 3. Store in cache
  if (redisClient && checkRedisAvailable()) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(freshData))
    } catch (_) {
      // Redis set failed
    }
  } else {
    if (memoryCache.size >= MAX_MEMORY_ITEMS) {
      const oldestKey = memoryCache.keys().next().value
      if (oldestKey) memoryCache.delete(oldestKey)
    }
    memoryCache.set(key, {
      data: freshData,
      expiry: Date.now() + Math.min(ttlSeconds, MEMORY_CACHE_MAX_TTL_SECONDS) * 1000,
    })
  }

  return freshData
}

const invalidateCache = async (key) => {
  if (redisClient && checkRedisAvailable()) {
    try {
      await redisClient.del(key)
    } catch (_) {}
  }
  memoryCache.delete(key)
}

module.exports = {
  MEMORY_CACHE_MAX_TTL_SECONDS,
  getOrSet,
  invalidateCache,
}
