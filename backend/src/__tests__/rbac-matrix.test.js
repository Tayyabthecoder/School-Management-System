const fs = require('fs')
const path = require('path')
const { DEFAULT_ROLES, roleGrants, syncDefaultRoles } = require('../config/roles')

const MODULES_DIR = path.join(__dirname, '..', 'modules')

/** Extracts every checkPermission([roles], 'module', 'action') call from the route files. */
const collectRoutePermissions = () => {
  const pattern = /checkPermission\(\s*\[([^\]]*)\]\s*,\s*'([a-z_]+)'\s*,\s*'([a-z]+)'\s*\)/g
  const found = []
  for (const moduleName of fs.readdirSync(MODULES_DIR)) {
    const dir = path.join(MODULES_DIR, moduleName)
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.routes.js'))) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8')
      for (const match of source.matchAll(pattern)) {
        const roles = match[1].split(',').map((r) => r.trim().replace(/['"]/g, '')).filter(Boolean)
        found.push({ file: `${moduleName}/${file}`, roles, module: match[2], action: match[3] })
      }
    }
  }
  return found
}

describe('RBAC matrix consistency', () => {
  const routePermissions = collectRoutePermissions()

  test('the route scan finds the permission checks', () => {
    expect(routePermissions.length).toBeGreaterThan(40)
  })

  test('every role a route allows is granted that route\'s module permission', () => {
    const gaps = []
    for (const { file, roles, module, action } of routePermissions) {
      for (const role of roles) {
        if (!roleGrants(role, module, action)) gaps.push(`${role} -> ${module}:${action} (${file})`)
      }
    }
    expect(gaps).toEqual([])
  })

  test('every role referenced by routes is a defined built-in role', () => {
    const defined = new Set(DEFAULT_ROLES.map((r) => r.name))
    const unknown = routePermissions.flatMap((r) => r.roles).filter((role) => !defined.has(role))
    expect([...new Set(unknown)]).toEqual([])
  })
})

describe('syncDefaultRoles', () => {
  test('upserts every built-in role with its current permissions', async () => {
    const RoleModel = { findOneAndUpdate: jest.fn(async (filter) => ({ name: filter.name })) }

    const byName = await syncDefaultRoles(RoleModel)

    expect(RoleModel.findOneAndUpdate).toHaveBeenCalledTimes(DEFAULT_ROLES.length)
    const teacherCall = RoleModel.findOneAndUpdate.mock.calls.find(([f]) => f.name === 'teacher')
    expect(teacherCall[1].$set.permissions).toEqual(expect.arrayContaining([{ module: 'hr', actions: ['create', 'read'] }]))
    expect(teacherCall[2]).toMatchObject({ upsert: true })
    expect(Object.keys(byName).sort()).toEqual(DEFAULT_ROLES.map((r) => r.name).sort())
  })
})
