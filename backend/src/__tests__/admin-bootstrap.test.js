const bcrypt = require('bcryptjs')
const { bootstrapAdmin, validateAdminPassword } = require('../../scripts/create-admin')

const buildDeps = (existingAdmin = null) => {
  const Role = { findOneAndUpdate: jest.fn(async (filter) => ({ _id: `role-${filter.name}`, name: filter.name })) }
  const User = {
    findOne: jest.fn().mockResolvedValue(existingAdmin),
    create: jest.fn(async (doc) => doc),
  }
  return { Role, User }
}

describe('validateAdminPassword', () => {
  test.each([
    [undefined, /required/],
    ['Short1', /at least 12/],
    ['onlylettersonly', /letters and numbers/],
    ['Admin@1234', /at least 12/],
  ])('rejects %p', (password, message) => {
    expect(validateAdminPassword(password)).toMatch(message)
  })

  test('accepts a long mixed secret', () => {
    expect(validateAdminPassword('School-Ops-2026-Secret')).toBeNull()
  })
})

describe('bootstrapAdmin', () => {
  test('creates the first super admin without a forced password change', async () => {
    const deps = buildDeps()

    const result = await bootstrapAdmin({ username: 'principal', password: 'School-Ops-2026-Secret' }, deps)

    expect(result).toEqual({ action: 'created', username: 'principal' })
    const created = deps.User.create.mock.calls[0][0]
    expect(created).toMatchObject({ username: 'principal', roleName: 'super_admin', role: 'role-super_admin', mustChangePassword: false })
    await expect(bcrypt.compare('School-Ops-2026-Secret', created.passwordHash)).resolves.toBe(true)
    expect(deps.Role.findOneAndUpdate).toHaveBeenCalled()
  })

  test('does not overwrite an existing super admin unless reset is requested', async () => {
    const deps = buildDeps({ username: 'admin', save: jest.fn() })

    const result = await bootstrapAdmin({ password: 'School-Ops-2026-Secret' }, deps)

    expect(result).toEqual({ action: 'skipped', username: 'admin' })
    expect(deps.User.create).not.toHaveBeenCalled()
  })

  test('reset rotates the password and revokes existing sessions', async () => {
    const admin = { username: 'admin', tokenVersion: 3, mustChangePassword: true, save: jest.fn() }
    const deps = buildDeps(admin)

    const result = await bootstrapAdmin({ password: 'School-Ops-2026-Secret', reset: true }, deps)

    expect(result.action).toBe('reset')
    expect(admin.tokenVersion).toBe(4)
    expect(admin.mustChangePassword).toBe(false)
    expect(admin.save).toHaveBeenCalled()
  })

  test('refuses a weak password before touching the database', async () => {
    const deps = buildDeps()

    await expect(bootstrapAdmin({ password: 'Admin@1234' }, deps)).rejects.toThrow()
    expect(deps.Role.findOneAndUpdate).not.toHaveBeenCalled()
  })
})
