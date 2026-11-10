/**
 * Production-safe bootstrap of the first super admin account.
 *
 * Usage (password comes from the environment, never from the seed or the UI):
 *   ADMIN_PASSWORD='<strong secret>' [ADMIN_USERNAME=admin] npm run admin:create
 *   ADMIN_PASSWORD='<new secret>' ADMIN_RESET=true npm run admin:create   # rotate it
 *
 * It syncs the built-in roles, refuses to run when a super admin already exists
 * (unless ADMIN_RESET=true), and never touches any other data.
 */
const bcrypt = require('bcryptjs')
const { BCRYPT_ROUNDS } = require('../src/config/constants')
const { syncDefaultRoles } = require('../src/config/roles')

const MIN_ADMIN_PASSWORD_LENGTH = 12

const validateAdminPassword = (password) => {
  if (!password) return 'ADMIN_PASSWORD environment variable is required'
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) return `ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'ADMIN_PASSWORD must contain letters and numbers'
  if (/^(admin|password|staff|student)@?1234$/i.test(password)) return 'ADMIN_PASSWORD must not be a seeded demo password'
  return null
}

/**
 * @returns {Promise<{ action: 'created' | 'reset' | 'skipped', username: string }>}
 */
const bootstrapAdmin = async ({ username = 'admin', password, reset = false }, { User, Role }) => {
  const problem = validateAdminPassword(password)
  if (problem) throw new Error(problem)

  const roles = await syncDefaultRoles(Role)
  const adminRole = roles.super_admin
  const existingAdmin = await User.findOne({ roleName: 'super_admin', deletedAt: null })
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  if (existingAdmin && !reset) {
    return { action: 'skipped', username: existingAdmin.username }
  }

  if (existingAdmin && reset) {
    existingAdmin.passwordHash = passwordHash
    existingAdmin.mustChangePassword = false
    existingAdmin.isActive = true
    existingAdmin.failedLoginAttempts = 0
    existingAdmin.lockUntil = null
    existingAdmin.tokenVersion = (existingAdmin.tokenVersion || 0) + 1
    await existingAdmin.save()
    return { action: 'reset', username: existingAdmin.username }
  }

  await User.create({
    username,
    passwordHash,
    role: adminRole._id,
    roleName: 'super_admin',
    // The operator chose this secret out-of-band, so no forced change on first login.
    mustChangePassword: false,
  })
  return { action: 'created', username }
}

const main = async () => {
  const mongoose = require('mongoose')
  const connectDB = require('../src/config/database')
  const User = require('../src/models/User.model')
  const Role = require('../src/models/Role.model')

  try {
    await connectDB()
    const result = await bootstrapAdmin({
      username: (process.env.ADMIN_USERNAME || 'admin').trim(),
      password: process.env.ADMIN_PASSWORD,
      reset: process.env.ADMIN_RESET === 'true',
    }, { User, Role })

    if (result.action === 'skipped') {
      console.log(`[Admin Bootstrap]: A super admin ("${result.username}") already exists. Set ADMIN_RESET=true to rotate its password.`)
    } else {
      console.log(`[Admin Bootstrap]: Super admin "${result.username}" ${result.action}.`)
    }
    process.exitCode = 0
  } catch (err) {
    console.error(`[Admin Bootstrap]: ${err.message}`)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

if (require.main === module) {
  main()
}

module.exports = { bootstrapAdmin, validateAdminPassword }
