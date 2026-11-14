import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { registerNavigator, navigateTo } from '../src/lib/navigation.js'

describe('navigateTo', () => {
  afterEach(() => registerNavigator(null))

  test('goes through the registered router navigate, replacing history', () => {
    const calls = []
    registerNavigator((path, options) => calls.push([path, options]))

    navigateTo('/change-password')

    assert.deepEqual(calls, [['/change-password', { replace: true }]])
  })

  test('uses the latest registered navigator and stops after it is cleared', () => {
    const first = []
    const second = []
    registerNavigator((p) => first.push(p))
    registerNavigator((p) => second.push(p))
    navigateTo('/login')
    assert.deepEqual([first.length, second.length], [0, 1])

    registerNavigator(null)
    // No navigator and no window (node): must be a harmless no-op, not a crash.
    assert.doesNotThrow(() => navigateTo('/login'))
    assert.equal(second.length, 1)
  })
})
