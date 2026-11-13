const jwt = require('jsonwebtoken')
const env = require('../../config/env')
const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const { ApiError } = require('../../middleware/error.middleware')

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { BCRYPT_ROUNDS } = require('../../config/constants')
const RefreshToken = require('../../models/RefreshToken.model')

// Account-level lock threshold. It is deliberately high: the per-(IP, username) limiter in app.js
// stops a single client long before this, so reaching it means many sources are guessing
// (a distributed attack), not one attacker locking a victim out.
const MAX_FAILED_LOGINS = 20

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days
// A just-rotated token may legitimately be presented again by a second tab or a retried request.
// Replays after this window mean the token was copied, so every session of the user is revoked.
const REFRESH_REUSE_GRACE_MS = 15 * 1000

/**
 * Refresh tokens are tracked in MongoDB (SEC-04). Previously they were tracked only in
 * Redis, so without Redis they could not be revoked, and in production every refresh
 * failed with 503 instead.
 */
const issueRefreshToken = async (user) => {
  const jti = crypto.randomUUID()
  const token = jwt.sign(
    { id: user._id, jti, tokenVersion: user.tokenVersion || 0 },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  )
  const { exp } = jwt.decode(token)
  const expiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
  await RefreshToken.create({ jti, userId: user._id, expiresAt })
  return token
}

// One message for every failed sign-in (unknown user, wrong password, locked, deactivated) so the
// response cannot be used to discover which usernames exist.
const LOGIN_FAILED = 'Invalid username or password, or the account is temporarily locked.'
// Valid bcrypt hash of a random string: compared when the user is unknown so response time
// does not reveal whether the username exists.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), BCRYPT_ROUNDS)

const login = async (username, password) => {
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw new ApiError(401, LOGIN_FAILED)
  }
  const user = await User.findOne({ username, deletedAt: null }).populate('role')
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)
    throw new ApiError(401, LOGIN_FAILED)
  }

  if (user.isLocked()) {
    // Still burn a comparison so a locked account is not distinguishable by timing.
    await bcrypt.compare(password, DUMMY_HASH)
    throw new ApiError(401, LOGIN_FAILED)
  }

  // An expired lock starts a fresh attempt window; otherwise the stale counter would
  // re-lock the account on the very first wrong password after the lockout ends.
  if (user.lockUntil) {
    user.failedLoginAttempts = 0
    user.lockUntil = null
  }

  const isMatch = await user.comparePassword(password)
  if (isMatch && !user.isActive) {
    // Only someone holding the correct password learns the account is deactivated.
    throw new ApiError(403, 'Account is deactivated. Contact Administrator.')
  }
  if (!isMatch) {
    user.failedLoginAttempts += 1
    // super_admin is never hard-locked: otherwise anyone could keep the admin locked out
    // with wrong passwords. The per-IP login rate limiter still throttles guessing.
    if (user.failedLoginAttempts >= MAX_FAILED_LOGINS && user.roleName !== 'super_admin') {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
    }
    await user.save()
    throw new ApiError(401, LOGIN_FAILED)
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

  const refreshToken = await issueRefreshToken(user)

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

  // ROTATION: mark the token as used atomically, so a revoked, rotated or replayed token is rejected.
  const consumed = decoded.jti
    ? await RefreshToken.findOneAndUpdate(
        { jti: decoded.jti, userId: decoded.id, rotatedAt: null },
        { $set: { rotatedAt: new Date() } }
      )
    : null
  if (!consumed) {
    // Reuse detection: a token that was already rotated, and presented again after the grace
    // window, indicates theft. Revoke all of the user's sessions.
    const previous = decoded.jti
      ? await RefreshToken.findOne({ jti: decoded.jti, userId: decoded.id })
      : null
    if (previous && previous.rotatedAt && Date.now() - new Date(previous.rotatedAt).getTime() > REFRESH_REUSE_GRACE_MS) {
      await invalidateUserSessions(decoded.id)
    }
    throw new ApiError(401, 'Refresh token has expired or been revoked')
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
  const newRefreshToken = await issueRefreshToken(user)

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user }
}

const invalidateUserSessions = async (userId) => {
  await RefreshToken.deleteMany({ userId })
}

/**
 * Revokes a refresh token server-side. Returns the owning user id when the token
 * signature is valid (even if expired) so the logout can still be attributed.
 */
const revokeRefreshToken = async (token) => {
  if (!token) return null
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { ignoreExpiration: true })
    if (decoded && decoded.jti) {
      await RefreshToken.deleteOne({ jti: decoded.jti })
    }
    return decoded?.id || null
  } catch (err) {
    // Ignore invalid tokens on revocation
    return null
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
