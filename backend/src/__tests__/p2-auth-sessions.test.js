// SEC-04: refresh tokens are revocable without Redis, and rate limits pick their store per request.
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const User = require('../models/User.model')
const RefreshToken = require('../models/RefreshToken.model')
const authService = require('../modules/auth/auth.service')
const { AdaptiveRateLimitStore } = require('../middleware/rate-limit-store')

jest.mock('../models/User.model')
jest.mock('../models/RefreshToken.model')

const activeUser = (overrides = {}) => ({
  _id: 'user-1',
  username: 'jdoe',
  roleName: 'teacher',
  isActive: true,
  deletedAt: null,
  tokenVersion: 0,
  failedLoginAttempts: 0,
  lockUntil: null,
  isLocked: () => false,
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
})

const signRefresh = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

beforeEach(() => {
  jest.clearAllMocks()
  RefreshToken.create.mockResolvedValue({})
})

describe('refresh-token tracking in MongoDB', () => {
  test('login records the issued jti with its expiry', async () => {
    User.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(activeUser()) })

    const { refreshToken } = await authService.login('jdoe', 'secret')

    const { jti, exp } = jwt.decode(refreshToken)
    expect(RefreshToken.create).toHaveBeenCalledWith({ jti, userId: 'user-1', expiresAt: new Date(exp * 1000) })
  })

  test('refresh consumes the old jti atomically and records a new one', async () => {
    RefreshToken.findOneAndDelete.mockResolvedValue({ jti: 'old-jti' })
    User.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(activeUser()) })

    const result = await authService.refreshToken(signRefresh({ id: 'user-1', jti: 'old-jti', tokenVersion: 0 }))

    expect(RefreshToken.findOneAndDelete).toHaveBeenCalledWith({ jti: 'old-jti', userId: 'user-1' })
    const newJti = jwt.decode(result.refreshToken).jti
    expect(newJti).not.toBe('old-jti')
    expect(RefreshToken.create).toHaveBeenCalledWith(expect.objectContaining({ jti: newJti, userId: 'user-1' }))
  })

  test('a revoked or already-rotated token is rejected even without Redis', async () => {
    RefreshToken.findOneAndDelete.mockResolvedValue(null)

    await expect(authService.refreshToken(signRefresh({ id: 'user-1', jti: 'gone', tokenVersion: 0 })))
      .rejects.toMatchObject({ statusCode: 401 })
    expect(User.findById).not.toHaveBeenCalled()
  })

  test('a token without a jti is rejected', async () => {
    await expect(authService.refreshToken(signRefresh({ id: 'user-1' }))).rejects.toMatchObject({ statusCode: 401 })
  })

  test('logout revokes the presented token', async () => {
    await authService.revokeRefreshToken(signRefresh({ id: 'user-1', jti: 'jti-9' }))
    expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ jti: 'jti-9' })
  })

  test('invalidateUserSessions revokes every session of the user', async () => {
    await authService.invalidateUserSessions('user-1')
    expect(RefreshToken.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' })
  })
})

describe('AdaptiveRateLimitStore', () => {
  const options = { windowMs: 60000, max: 5 }

  test('counts in memory while Redis is unavailable', async () => {
    const createRedisStore = jest.fn()
    const store = new AdaptiveRateLimitStore({ getClient: () => ({}), isAvailable: () => false, createRedisStore })
    store.init(options)

    await store.increment('1.2.3.4')
    const { totalHits } = await store.increment('1.2.3.4')

    expect(totalHits).toBe(2)
    expect(createRedisStore).not.toHaveBeenCalled()
    store.shutdown()
  })

  test('switches to Redis once it connects, decided per request rather than at startup', async () => {
    let available = false
    const redisStore = { init: jest.fn(), increment: jest.fn().mockResolvedValue({ totalHits: 7, resetTime: new Date() }) }
    const store = new AdaptiveRateLimitStore({ getClient: () => ({}), isAvailable: () => available, createRedisStore: () => redisStore })
    store.init(options)

    expect((await store.increment('ip')).totalHits).toBe(1)
    available = true
    expect((await store.increment('ip')).totalHits).toBe(7)
    expect(redisStore.init).toHaveBeenCalledWith(options)
    store.shutdown()
  })

  test('falls back to memory when a Redis call fails', async () => {
    const redisStore = { increment: jest.fn().mockRejectedValue(new Error('ECONNRESET')) }
    const store = new AdaptiveRateLimitStore({ getClient: () => ({}), isAvailable: () => true, createRedisStore: () => redisStore })
    store.init(options)

    expect((await store.increment('ip')).totalHits).toBe(1)
    store.shutdown()
  })
})
