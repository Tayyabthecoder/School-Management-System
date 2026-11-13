import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { confirmAction, useConfirmStore } from '../src/store/confirmStore.js'
import { resolveRole } from '../src/lib/role.js'

describe('confirmAction', () => {
  test('resolves true when confirmed and clears the request', async () => {
    const answer = confirmAction({ message: 'Delete?' })
    assert.equal(useConfirmStore.getState().request.message, 'Delete?')
    useConfirmStore.getState().close(true)
    assert.equal(await answer, true)
    assert.equal(useConfirmStore.getState().request, null)
  })

  test('resolves false when cancelled', async () => {
    const answer = confirmAction({ message: 'Reset?' })
    useConfirmStore.getState().close(false)
    assert.equal(await answer, false)
  })

  test('a newer request cancels an unanswered one', async () => {
    const first = confirmAction({ message: 'First' })
    const second = confirmAction({ message: 'Second' })
    assert.equal(await first, false)
    useConfirmStore.getState().close(true)
    assert.equal(await second, true)
  })
})

describe('resolveRole', () => {
  test('handles every shape of user.role', () => {
    assert.equal(resolveRole(null), '')
    assert.equal(resolveRole({ roleName: 'teacher' }), 'teacher')
    assert.equal(resolveRole({ role: 'accountant' }), 'accountant')
    assert.equal(resolveRole({ role: { name: 'hr_manager' } }), 'hr_manager')
    assert.equal(resolveRole({ role: {} }), '')
  })
})
