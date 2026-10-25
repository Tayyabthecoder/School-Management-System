const jwt = require('jsonwebtoken')
const env = require('../config/env')
const { ApiError } = require('./error.middleware')
const User = require('../models/User.model')
const SchoolSettings = require('../models/SchoolSettings.model')
const { DAYS_OF_WEEK, DEFAULT_ALLOWED_DAYS } = require('../config/constants')
const { getOrSet } = require('../utils/cache.util')

const mustChangePasswordGuard = (req, res, next) => {
  if (req.user && req.user.mustChangePassword) {
    const allowedPaths = [
      '/api/v1/auth/change-password',
      '/api/v1/auth/logout',
      '/api/v1/auth/me',
    ]
    const isAllowed = allowedPaths.some(p => req.originalUrl && req.originalUrl.startsWith(p))
    if (!isAllowed) {
      if (res && typeof res.status === 'function') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'MUST_CHANGE_PASSWORD',
            message: 'You must change your default password before accessing the system.',
          },
        })
      }
      throw new ApiError(403, 'You must change your default password before accessing the system.', null, 'MUST_CHANGE_PASSWORD')
    }
  }
  next()
}

const verifyToken = async (req, res, next) => {
  try {
    let token = null
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      throw new ApiError(401, 'Authentication token missing')
    }

    const decoded = jwt.verify(token, env.JWT_SECRET)
    const user = await User.findById(decoded.id).populate('role')

    if (!user || !user.isActive || user.deletedAt) {
      throw new ApiError(401, 'User account not found or inactive')
    }

    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, 'Token revoked due to password change or session invalidation')
    }

    req.user = user

    // R6: Day-based access restriction
    // Super Admin is always exempt so they can manage settings on any day
    const roleName = user.roleName || user.role?.name || ''
    if (roleName !== 'super_admin') {
      const today = DAYS_OF_WEEK[new Date().getDay()]
      const settings = await getOrSet('ref:school-settings', 60, async () => {
        return SchoolSettings.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean()
      })
      const allowedDays = settings?.allowedDays || DEFAULT_ALLOWED_DAYS

      if (!allowedDays.includes(today)) {
        throw new ApiError(
          403,
          `System access is not permitted on ${today}. The school system is available on: ${allowedDays.join(', ')}.`,
          null,
          'DAY_ACCESS_RESTRICTED'
        )
      }
    }

    // Enforce password change for accounts flagged with mustChangePassword
    mustChangePasswordGuard(req, res, () => {})

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { verifyToken, mustChangePasswordGuard }
