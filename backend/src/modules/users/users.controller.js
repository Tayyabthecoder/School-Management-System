const User = require('../../models/User.model')
const Role = require('../../models/Role.model')
const bcrypt = require('bcryptjs')
const { getPagination, formatPaginatedResponse } = require('../../utils/pagination.util')
const { ApiError } = require('../../middleware/error.middleware')
const { escapeRegex } = require('../../utils/regex.util')
const { BCRYPT_ROUNDS } = require('../../config/constants')
const { invalidateUserSessions } = require('../auth/auth.service')

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const filter = { deletedAt: null }

    if (req.query.role) filter.roleName = req.query.role
    if (req.query.search) {
      filter.username = { $regex: escapeRegex(req.query.search), $options: 'i' }
    }

    const [users, total] = await Promise.all([
      User.find(filter).populate('role').select('-passwordHash').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ])

    res.json(formatPaginatedResponse(users, total, page, limit))
  } catch (error) {
    next(error)
  }
}

const createUser = async (req, res, next) => {
  try {
    const { username, password, roleName } = req.body
    const role = await Role.findOne({ name: roleName })
    if (!role) throw new ApiError(400, 'Invalid role name')

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await User.create({
      username,
      passwordHash,
      role: role._id,
      roleName,
    })

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        role: user.roleName,
      },
    })
  } catch (error) {
    next(error)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        passwordHash,
        failedLoginAttempts: 0,
        lockUntil: null,
        mustChangePassword: true,
        $inc: { tokenVersion: 1 },
      },
      { new: true }
    )

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    await invalidateUserSessions(req.params.id)

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = { getUsers, createUser, resetPassword }
