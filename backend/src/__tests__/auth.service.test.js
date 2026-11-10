const jwt = require('jsonwebtoken')
const request = require('supertest')
const env = require('../config/env')
const User = require('../models/User.model')
const auditUtil = require('../utils/audit-log.util')
const authService = require('../modules/auth/auth.service')

jest.mock('../models/User.model')
jest.mock('../utils/audit-log.util')

const buildUser = (overrides = {}) => ({
  _id: 'user-1',
  username: 'jdoe',
  roleName: 'teacher',
  isActive: true,
  failedLoginAttempts: 0,
  lockUntil: null,
  tokenVersion: 0,
  isLocked() {
    return Boolean(this.lockUntil && this.lockUntil > Date.now())
  },
  comparePassword: jest.fn().mockResolvedValue(false),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
})

const mockFindOneWithUser = (user) => {
  User.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(user) })
}

describe('auth.service login lockout', () => {
  beforeEach(() => jest.clearAllMocks())

  test('rejects login while the account lock is still active', async () => {
    const user = buildUser({ failedLoginAttempts: 5, lockUntil: new Date(Date.now() + 60_000) })
    mockFindOneWithUser(user)

    await expect(authService.login('jdoe', 'wrong')).rejects.toMatchObject({ statusCode: 403 })
    expect(user.comparePassword).not.toHaveBeenCalled()
  })

  test('one wrong password after an expired lock does not immediately re-lock the account', async () => {
    const user = buildUser({ failedLoginAttempts: 5, lockUntil: new Date(Date.now() - 1000) })
    mockFindOneWithUser(user)

    await expect(authService.login('jdoe', 'wrong')).rejects.toMatchObject({ statusCode: 401 })

    expect(user.failedLoginAttempts).toBe(1)
    expect(user.lockUntil).toBeNull()
  })

  test('locks the account after five consecutive failures', async () => {
    const user = buildUser({ failedLoginAttempts: 4 })
    mockFindOneWithUser(user)

    await expect(authService.login('jdoe', 'wrong')).rejects.toMatchObject({ statusCode: 401 })

    expect(user.failedLoginAttempts).toBe(5)
    expect(user.lockUntil).toBeInstanceOf(Date)
    expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now())
  })
})

describe('auth.service revokeRefreshToken', () => {
  test('returns the owning user id for a validly signed (even expired) refresh token', async () => {
    const token = jwt.sign({ id: 'user-42', jti: 'jti-1' }, env.JWT_REFRESH_SECRET, { expiresIn: -10 })
    await expect(authService.revokeRefreshToken(token)).resolves.toBe('user-42')
  })

  test('returns null for a forged or malformed token', async () => {
    const forged = jwt.sign({ id: 'user-42', jti: 'jti-1' }, 'not-the-real-secret-but-long-enough-123')
    await expect(authService.revokeRefreshToken(forged)).resolves.toBeNull()
    await expect(authService.revokeRefreshToken('garbage')).resolves.toBeNull()
    await expect(authService.revokeRefreshToken(undefined)).resolves.toBeNull()
  })
})

describe('POST /api/v1/auth/logout', () => {
  const app = require('../app')

  beforeEach(() => {
    jest.clearAllMocks()
    auditUtil.logAudit.mockResolvedValue(true)
  })

  test('succeeds without an access token and clears the refresh cookie', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'user-7', username: 'jdoe' }) }),
    })
    const refresh = jwt.sign({ id: 'user-7', jti: 'jti-7' }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`refreshToken=${refresh}`])

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    const setCookie = (res.headers['set-cookie'] || []).join(';')
    expect(setCookie).toMatch(/refreshToken=;/)
    expect(auditUtil.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_LOGOUT' }))
  })

  test('succeeds with no cookie at all and writes no audit entry', async () => {
    const res = await request(app).post('/api/v1/auth/logout')

    expect(res.status).toBe(200)
    expect(auditUtil.logAudit).not.toHaveBeenCalled()
  })
})
