const jwt = require('jsonwebtoken')
const env = require('../../config/env')
const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const { ApiError } = require('../../middleware/error.middleware')

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { BCRYPT_ROUNDS } = require('../../config/constants')
const { getRedisClient, checkRedisAvailable } = require('../../config/redis')

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

const login = async (username, password) => {
  const user = await User.findOne({ username, deletedAt: null }).populate('role')
  if (!user) {
    throw new ApiError(401, 'Invalid username or password')
  }

  if (user.isLocked()) {
    throw new ApiError(403, 'Account locked due to consecutive failed attempts. Try again in 15 minutes.')
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Contact Administrator.')
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    user.failedLoginAttempts += 1
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
    }
    await user.save()
    throw new ApiError(401, 'Invalid username or password')
  }

  // Reset failed attempts on success
  user.failedLoginAttempts = 0
  user.lockUntil = null
  await user.save()

  const accessToken = jwt.sign(
    { id: user._id, role: user.roleName, tokenVersion: user.tokenVersion || 0 },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  )

  const jti = crypto.randomUUID()
  const refreshToken = jwt.sign(
    { id: user._id, jti, tokenVersion: user.tokenVersion || 0 },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  )

  // Track active refresh token in Redis for revocation capability
  try {
    const redis = getRedisClient()
    if (redis && checkRedisAvailable()) {
      await redis.set(`rt:${jti}`, user._id.toString(), 'EX', REFRESH_TOKEN_TTL_SECONDS)
      await redis.sadd(`user_tokens:${user._id}`, jti)
      await redis.expire(`user_tokens:${user._id}`, REFRESH_TOKEN_TTL_SECONDS)
    }
  } catch (err) {
    // Redis optional fallback
  }

  return {
    user: {
      id: user._id,
      username: user.username,
      role: user.roleName,
      studentId: user.studentId,
      staffId: user.staffId,
      mustChangePassword: user.mustChangePassword || false,
    },
    accessToken,
    refreshToken,
  }
}

const refreshToken = async (token) => {
  if (!token) {
    throw new ApiError(401, 'Refresh token required')
  }
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET)

  // Check server-side revocation if JTI is present and Redis is running
  if (decoded.jti) {
    const redis = getRedisClient()
    if (redis && checkRedisAvailable()) {
      try {
        const active = await redis.get(`rt:${decoded.jti}`)
        if (!active) {
          throw new ApiError(401, 'Refresh token has expired or been revoked')
        }
        // ROTATION: Revoke old JTI immediately to prevent replay attacks
        await redis.del(`rt:${decoded.jti}`)
        if (decoded.id) {
          await redis.srem(`user_tokens:${decoded.id}`, decoded.jti)
        }
      } catch (err) {
        if (err instanceof ApiError) throw err
        throw new ApiError(503, 'Authentication service temporarily unavailable')
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new ApiError(503, 'Authentication service temporarily unavailable')
    }
  }

  const user = await User.findById(decoded.id).populate('role')

  if (!user || !user.isActive || user.deletedAt) {
    throw new ApiError(401, 'User account invalid')
  }

  if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
    throw new ApiError(401, 'Refresh token has expired or been revoked')
  }

  const newAccessToken = jwt.sign(
    { id: user._id, role: user.roleName, tokenVersion: user.tokenVersion || 0 },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  )

  // Issue new rotated refresh token with fresh JTI
  const newJti = crypto.randomUUID()
  const newRefreshToken = jwt.sign(
    { id: user._id, jti: newJti, tokenVersion: user.tokenVersion || 0 },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  )

  try {
    const redis = getRedisClient()
    if (redis && checkRedisAvailable()) {
      await redis.set(`rt:${newJti}`, user._id.toString(), 'EX', REFRESH_TOKEN_TTL_SECONDS)
      await redis.sadd(`user_tokens:${user._id}`, newJti)
      await redis.expire(`user_tokens:${user._id}`, REFRESH_TOKEN_TTL_SECONDS)
    }
  } catch (err) {
    // Redis optional fallback
  }

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user }
}

const invalidateUserSessions = async (userId) => {
  try {
    const redis = getRedisClient()
    if (redis && checkRedisAvailable()) {
      const jtis = await redis.smembers(`user_tokens:${userId}`)
      if (jtis && jtis.length > 0) {
        const pipeline = redis.pipeline()
        for (const jti of jtis) {
          pipeline.del(`rt:${jti}`)
        }
        pipeline.del(`user_tokens:${userId}`)
        await pipeline.exec()
      }
    }
  } catch (err) {
    // Redis optional fallback
  }
}

const revokeRefreshToken = async (token) => {
  if (!token) return
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { ignoreExpiration: true })
    if (decoded && decoded.jti) {
      const redis = getRedisClient()
      if (redis && checkRedisAvailable()) {
        await redis.del(`rt:${decoded.jti}`)
        if (decoded.id) {
          await redis.srem(`user_tokens:${decoded.id}`, decoded.jti)
        }
      }
    }
  } catch (err) {
    // Ignore invalid tokens on revocation
  }
}

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId)
  if (!user || !user.isActive || user.deletedAt) {
    throw new ApiError(404, 'User account not found')
  }

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    throw new ApiError(400, 'Current password does not match')
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from current password')
  }

  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  user.mustChangePassword = false
  user.tokenVersion = (user.tokenVersion || 0) + 1
  await user.save()

  await invalidateUserSessions(user._id)

  return { success: true, message: 'Password changed successfully' }
}

module.exports = { login, refreshToken, revokeRefreshToken, changePassword, invalidateUserSessions }
