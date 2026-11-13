import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { canExportEntity, roleNameOf, EXPORT_ENTITY_ROLES } from '../src/features/reports/exportAccess.js'

describe('roleNameOf', () => {
  test('reads every shape the user object can take', () => {
    assert.equal(roleNameOf(null), '')
    assert.equal(roleNameOf({ roleName: 'accountant' }), 'accountant')
    assert.equal(roleNameOf({ role: 'hr_manager' }), 'hr_manager')
    assert.equal(roleNameOf({ role: { name: 'teacher' } }), 'teacher')
  })
})

describe('canExportEntity', () => {
  test('accountants export fees but not staff data', () => {
    const accountant = { roleName: 'accountant' }
    assert.equal(canExportEntity(accountant, 'fees'), true)
    assert.equal(canExportEntity(accountant, 'staff'), false)
  })

  test('hr_manager exports staff but not fees', () => {
    const hr = { roleName: 'hr_manager' }
    assert.equal(canExportEntity(hr, 'staff'), true)
    assert.equal(canExportEntity(hr, 'fees'), false)
  })

  test('super_admin can export every known entity', () => {
    for (const entity of Object.keys(EXPORT_ENTITY_ROLES)) {
      assert.equal(canExportEntity({ roleName: 'super_admin' }, entity), true, entity)
    }
  })

  test('teachers, students, guardians and unknown entities are denied', () => {
    for (const roleName of ['teacher', 'student', 'guardian']) {
      assert.equal(canExportEntity({ roleName }, 'students'), false, roleName)
    }
    assert.equal(canExportEntity({ roleName: 'super_admin' }, 'nonexistent'), false)
  })
})
