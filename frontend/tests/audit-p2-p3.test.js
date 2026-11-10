import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readStoredJson, writeStoredJson } from '../src/lib/storage.js'
import { canExportEntity, roleNameOf, EXPORT_ENTITY_ROLES } from '../src/features/reports/exportAccess.js'

const memoryStorage = (initial = {}) => {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
    data,
  }
}

describe('LOW-06: safe localStorage helpers', () => {
  test('corrupt JSON falls back instead of crashing the settings page', () => {
    const storage = memoryStorage({ profile: '{not json' })
    assert.deepEqual(readStoredJson('profile', { schoolName: '' }, storage), { schoolName: '' })
  })

  test('stored objects are merged over the defaults so new fields keep their default', () => {
    const storage = memoryStorage({ cfg: JSON.stringify({ passingPercentage: 40 }) })
    assert.deepEqual(
      readStoredJson('cfg', { passingPercentage: 50, minAttendancePercentage: 75 }, storage),
      { passingPercentage: 40, minAttendancePercentage: 75 }
    )
  })

  test('a stored value of the wrong shape is ignored', () => {
    const storage = memoryStorage({ cfg: JSON.stringify([1, 2, 3]) })
    assert.deepEqual(readStoredJson('cfg', { a: 1 }, storage), { a: 1 })
  })

  test('blocked storage (getItem/setItem throwing) does not throw', () => {
    const blocked = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('QuotaExceeded') } }
    assert.deepEqual(readStoredJson('x', { ok: true }, blocked), { ok: true })
    assert.equal(writeStoredJson('x', { a: 1 }, blocked), false)
  })

  test('writeStoredJson round-trips', () => {
    const storage = memoryStorage()
    assert.equal(writeStoredJson('k', { a: 1 }, storage), true)
    assert.deepEqual(readStoredJson('k', {}, storage), { a: 1 })
  })
})

describe('SEC-03: export entity access mirrors the backend', () => {
  test('HR cannot export fee data and accountants cannot export staff records', () => {
    assert.equal(canExportEntity({ roleName: 'hr_manager' }, 'defaulters'), false)
    assert.equal(canExportEntity({ roleName: 'hr_manager' }, 'fees'), false)
    assert.equal(canExportEntity({ roleName: 'accountant' }, 'staff'), false)
    assert.equal(canExportEntity({ roleName: 'accountant' }, 'payroll'), true)
    assert.equal(canExportEntity({ roleName: 'super_admin' }, 'staff'), true)
  })

  test('role is read from roleName, a populated role or a plain role string', () => {
    assert.equal(roleNameOf({ role: { name: 'accountant' } }), 'accountant')
    assert.equal(roleNameOf({ role: 'teacher' }), 'teacher')
    assert.equal(roleNameOf(null), '')
    assert.equal(canExportEntity({ role: { name: 'hr_manager' } }, 'staff'), true)
  })

  test('unknown entities and anonymous users are denied', () => {
    assert.equal(canExportEntity({ roleName: 'super_admin' }, 'secrets'), false)
    assert.equal(canExportEntity(null, 'students'), false)
    assert.ok(Object.isFrozen(EXPORT_ENTITY_ROLES))
  })
})
