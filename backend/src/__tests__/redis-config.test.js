// config/redis.js: no connection under test, a resilient shared client otherwise, and isolated
// short-retry clients for BullMQ. ioredis is replaced by a fake so no socket is ever opened.
const loadRedis = (nodeEnv, { connectRejects = false, constructorThrows = false } = {}) => {
  const instances = []
  class FakeRedis {
    constructor(url, options) {
      if (constructorThrows) throw new Error('bad url')
      this.url = url
      this.options = options
      this.handlers = {}
      instances.push(this)
    }
    on(event, cb) { this.handlers[event] = cb; return this }
    connect() { return connectRejects ? Promise.reject(new Error('ECONNREFUSED')) : Promise.resolve() }
  }
  let mod
  jest.isolateModules(() => {
    jest.doMock('ioredis', () => FakeRedis)
    jest.doMock('../config/env', () => ({ NODE_ENV: nodeEnv, REDIS_URL: 'redis://fake:6379' }))
    mod = require('../config/redis')
  })
  return { mod, instances }
}

afterEach(() => jest.dontMock('ioredis'))

describe('under test', () => {
  test('never connects and reports Redis unavailable', () => {
    const { mod, instances } = loadRedis('test')
    expect(instances).toHaveLength(0)
    expect(mod.getRedisClient()).toBeNull()
    expect(mod.checkRedisAvailable()).toBe(false)
    expect(mod.createRedisClient('Queue')).toBeNull()
  })
})

describe('shared client', () => {
  test('connects lazily with an endless capped back-off and flips availability with its events', async () => {
    const { mod, instances } = loadRedis('development')
    const [client] = instances
    expect(client.url).toBe('redis://fake:6379')
    expect(client.options).toMatchObject({ maxRetriesPerRequest: null, lazyConnect: true })

    // Back-off grows by 500 ms per attempt and stops at 10 s, and never gives up
    expect(client.options.retryStrategy(1)).toBe(500)
    expect(client.options.retryStrategy(4)).toBe(2000)
    expect(client.options.retryStrategy(500)).toBe(10000)

    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    client.handlers.connect()
    expect(mod.checkRedisAvailable()).toBe(true)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Connected'))

    client.handlers.error(new Error('ECONNRESET'))
    expect(mod.checkRedisAvailable()).toBe(false)

    client.handlers.connect()
    client.options.retryStrategy(1) // a retry means it is down again
    expect(mod.checkRedisAvailable()).toBe(false)
    log.mockRestore()
  })

  test('a failed first connection leaves it unavailable instead of crashing', async () => {
    const { mod } = loadRedis('development', { connectRejects: true })
    await Promise.resolve()
    expect(mod.checkRedisAvailable()).toBe(false)
  })

  test('a constructor failure is swallowed', () => {
    const { mod } = loadRedis('development', { constructorThrows: true })
    expect(mod.getRedisClient()).toBeNull()
    expect(mod.checkRedisAvailable()).toBe(false)
  })
})

describe('createRedisClient (BullMQ queues and workers)', () => {
  test('returns an isolated client that gives up quickly instead of retrying forever', () => {
    const { mod, instances } = loadRedis('development')
    const shared = instances.length
    const client = mod.createRedisClient('Worker')

    expect(instances.length).toBe(shared + 1)
    expect(client.options.maxRetriesPerRequest).toBeNull()
    expect(client.options.retryStrategy(1)).toBe(100)
    expect(client.options.retryStrategy(2)).toBe(200)
    expect(client.options.retryStrategy(3)).toBeNull()
    expect(() => client.handlers.error(new Error('x'))).not.toThrow()
  })

  test('returns null when the client cannot even be constructed', () => {
    const { mod } = loadRedis('development', { constructorThrows: true })
    expect(mod.createRedisClient()).toBeNull()
  })
})
