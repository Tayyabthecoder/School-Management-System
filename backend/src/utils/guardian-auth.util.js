const { ApiError } = require('../middleware/error.middleware')

/**
 * Extracts all valid student IDs associated with a guardian user account.
 * Deduplicates and handles both user.studentId (legacy/primary) and user.studentIds (array).
 *
 * @param {object} user - Authenticated user object from req.user
 * @returns {string[]} Array of string student ObjectIds
 */
const getGuardianStudentIds = (user) => {
  if (!user) return []
  const ids = new Set()

  if (user.studentId) {
    ids.add(user.studentId.toString())
  }

  if (Array.isArray(user.studentIds)) {
    user.studentIds.forEach((id) => {
      if (id) ids.add(id.toString())
    })
  }

  return Array.from(ids)
}

/**
 * Checks if a specific student ID belongs to the guardian's family.
 *
 * @param {object} user - Authenticated user object
 * @param {string|object} studentId - Student ObjectId or string ID
 * @returns {boolean}
 */
const isStudentAccessibleByGuardian = (user, studentId) => {
  if (!user || !studentId) return false
  const targetId = studentId._id ? studentId._id.toString() : studentId.toString()
  const allowedIds = getGuardianStudentIds(user)
  return allowedIds.includes(targetId)
}

/**
 * Universal authorization check for student and guardian scoped access.
 * Allows super_admin and teachers unconditionally.
 *
 * @param {object} user - Authenticated user from req.user
 * @param {string|object} targetStudentId - The student ID being accessed
 * @param {string} [contextMessage] - Optional custom context for error message
 */
const assertStudentAccess = (user, targetStudentId, contextMessage = 'records') => {
  if (!user) {
    throw new ApiError(401, 'Unauthorized: Authentication required')
  }

  const roleName = user.roleName || (typeof user.role === 'object' ? user.role?.name : user.role)

  if (['super_admin', 'teacher'].includes(roleName)) {
    return
  }

  const targetId = targetStudentId && targetStudentId._id
    ? targetStudentId._id.toString()
    : targetStudentId ? targetStudentId.toString() : null

  if (!targetId) {
    throw new ApiError(400, 'Student identifier is required')
  }

  if (roleName === 'student') {
    const selfStudentId = user.studentId ? user.studentId.toString() : null
    if (!selfStudentId || selfStudentId !== targetId) {
      throw new ApiError(403, `Forbidden: You can only view your own ${contextMessage}`)
    }
    return
  }

  if (roleName === 'guardian') {
    if (!isStudentAccessibleByGuardian(user, targetId)) {
      throw new ApiError(403, `Forbidden: You can only view ${contextMessage} for your own children`)
    }
    return
  }

  throw new ApiError(403, 'Forbidden: Insufficient permissions')
}

/**
 * Resolves child student ID for guardian endpoints with multi-child support.
 * Checks optional ?studentId= query parameter against guardian's linked children.
 *
 * @param {object} req - Express request object
 * @returns {string|null} Resolved student ID
 */
const resolveGuardianStudentId = (req) => {
  if (!req || !req.user) return null

  if (req.user.roleName === 'super_admin' && req.query?.studentId) {
    return req.query.studentId.toString()
  }

  const allowedIds = getGuardianStudentIds(req.user)

  if (req.query?.studentId) {
    const requested = req.query.studentId.toString()
    if (allowedIds.includes(requested)) {
      return requested
    }
    throw new ApiError(403, 'Forbidden: You can only view records for your own children')
  }

  return allowedIds[0] || null
}

module.exports = {
  getGuardianStudentIds,
  isStudentAccessibleByGuardian,
  assertStudentAccess,
  resolveGuardianStudentId,
}
