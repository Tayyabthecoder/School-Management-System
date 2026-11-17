// The settings/day-restriction cache: Redis when it is up, a small bounded in-memory fallback when it is not.
jest.mock('../config/redis', () => ({
  redisClient: { get: jest.fn(), setex: jest.fn(), del: jest.fn() },
  checkRedisAvailable: jest.fn(),
}))

const { redisClient, checkRedisAvailable } = require('../config/redis')
const { getOrSet, invalidateCache, MEMORY_CACHE_MAX_TTL_SECONDS } = require('../utils/cache.util')

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-17T10:00:00Z'))
  redisClient.get.mockReset()
  redisClient.setex.mockReset()
  redisClient.del.mockReset()
  checkRedisAvailable.mockReset()
})
afterEach(() => jest.useRealTimers())

describe('with Redis available', () => {
  beforeEach(() => checkRedisAvailable.mockReturnValue(true))

  test('a hit returns the cached value without calling the fetcher', async () => {
    redisClient.get.mockResolvedValue(JSON.stringify({ a: 1 }))
    const fetcher = jest.fn()

    expect(await getOrSet('k-hit', 60, fetcher)).toEqual({ a: 1 })
    expect(fetcher).not.toHaveBeenCalled()
  })

  test('a miss fetches, stores with the TTL and returns the fresh value', async () => {
    redisClient.get.mockResolvedValue(null)
    const fetcher = jest.fn().mockResolvedValue({ fresh: true })

    expect(await getOrSet('k-miss', 120, fetcher)).toEqual({ fresh: true })
    expect(redisClient.setex).toHaveBeenCalledWith('k-miss', 120, JSON.stringify({ fresh: true }))
  })

  test('the default TTL is five minutes', async () => {
    redisClient.get.mockResolvedValue(null)
    await getOrSet('k-default', undefined, async () => 1)
    expect(redisClient.setex).toHaveBeenCalledWith('k-default', 300, '1')
  })

  test('a Redis read error falls through to the fetcher', async () => {
    redisClient.get.mockRejectedValue(new Error('ECONNRESET'))
    expect(await getOrSet('k-err', 60, async () => 'from-db')).toBe('from-db')
  })

  test('a Redis write error does not fail the request', async () => {
    redisClient.get.mockResolvedValue(null)
    redisClient.setex.mockRejectedValue(new Error('READONLY'))
    expect(await getOrSet('k-set-err', 60, async () => 'ok')).toBe('ok')
  })

  test('invalidate deletes the Redis key, and survives a Redis error', async () => {
    await invalidateCache('k-del')
    expect(redisClient.del).toHaveBeenCalledWith('k-del')

    redisClient.del.mockRejectedValue(new Error('down'))
    await expect(invalidateCache('k-del')).resolves.toBeUndefined()
  })

  test('a fetcher that throws propagates its error and caches nothing', async () => {
    redisClient.get.mockResolvedValue(null)
    await expect(getOrSet('k-boom', 60, async () => { throw new Error('db down') })).rejects.toThrow('db down')
    expect(redisClient.setex).not.toHaveBeenCalled()
  })
})

describe('without Redis (in-memory fallback)', () => {
  beforeEach(() => checkRedisAvailable.mockReturnValue(false))

  test('the second call is served from memory until the entry expires', async () => {
    const fetcher = jest.fn().mockResolvedValue('v1')

    expect(await getOrSet('m-1', 10, fetcher)).toBe('v1')
    expect(await getOrSet('m-1', 10, fetcher)).toBe('v1')
    expect(fetcher).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(10 * 1000 + 1)
    fetcher.mockResolvedValue('v2')
    expect(await getOrSet('m-1', 10, fetcher)).toBe('v2')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  test('the memory TTL is capped so another instance cannot serve stale settings for long', async () => {
    const fetcher = jest.fn().mockResolvedValue('x')
    await getOrSet('m-cap', 3600, fetcher) // asks for an hour

    jest.advanceTimersByTime((MEMORY_CACHE_MAX_TTL_SECONDS + 1) * 1000)
    await getOrSet('m-cap', 3600, fetcher)

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  test('invalidate drops the memory entry', async () => {
    const fetcher = jest.fn().mockResolvedValue('x')
    await getOrSet('m-inv', 10, fetcher)
    await invalidateCache('m-inv')
    await getOrSet('m-inv', 10, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(redisClient.del).not.toHaveBeenCalled()
  })

  test('the memory cache is bounded: the oldest entry is evicted past 500 keys', async () => {
    const fetcher = jest.fn(async () => 'v')
    for (let i = 0; i < 501; i += 1) await getOrSet(`bulk-${i}`, 10, fetcher)
    fetcher.mockClear()

    await getOrSet('bulk-0', 10, fetcher) // evicted
    expect(fetcher).toHaveBeenCalledTimes(1)
    fetcher.mockClear()
    await getOrSet('bulk-500', 10, fetcher) // newest is still there
    expect(fetcher).not.toHaveBeenCalled()
  })
})
