import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ACCESS } from '../src/config/access.js'

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8')
const STAFF_ROLES = ['super_admin', 'teacher', 'accountant', 'hr_manager']

describe('access config', () => {
  test('only names known staff roles, without duplicates', () => {
    for (const [area, roles] of Object.entries(ACCESS)) {
      assert.ok(roles.length > 0, `${area} has no roles`)
      assert.equal(new Set(roles).size, roles.length, `${area} lists a role twice`)
      for (const role of roles) assert.ok(STAFF_ROLES.includes(role), `${area}: unknown role ${role}`)
    }
  })

  test('super_admin can open everything except staff self-service leave', () => {
    for (const [area, roles] of Object.entries(ACCESS)) {
      if (area === 'myLeave') assert.ok(!roles.includes('super_admin'))
      else assert.ok(roles.includes('super_admin'), `${area} is missing super_admin`)
    }
  })

  test('guardians and students never appear in the staff areas', () => {
    for (const roles of Object.values(ACCESS)) {
      assert.ok(!roles.includes('guardian') && !roles.includes('student'))
    }
  })

  test('teachers cannot register students (the API only allows super_admin and hr_manager)', () => {
    assert.deepEqual(ACCESS.studentRegistration, ['super_admin', 'hr_manager'])
  })

  test('accountants can open the student directory they are allowed to read', () => {
    assert.ok(ACCESS.students.includes('accountant'))
  })
})

describe('no copy of the role lists outside the config (drift guard)', () => {
  test('the route table uses ACCESS for every RoleRoute', () => {
    const routes = read('routes/index.jsx')
    assert.ok(!/allowedRoles=\{\[/.test(routes), 'inline allowedRoles array found in routes/index.jsx')
    assert.ok(/allowedRoles=\{ACCESS\./.test(routes))
  })

  test('the sidebar and command palette take roles from ACCESS', () => {
    for (const file of ['components/layout/Sidebar.jsx', 'components/ui/CommandPalette.jsx']) {
      const source = read(file)
      assert.ok(!/roles:\s*\[/.test(source), `inline roles array found in ${file}`)
      assert.ok(/roles: ACCESS\./.test(source), `${file} does not use ACCESS`)
    }
  })
})
