import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { useToast, useToastStore } from '../src/store/toastStore.js'

describe('useToast', () => {
  test('returns the same object on every call, even after toasts change', () => {
    const first = useToast()
    first.error('Forbidden')
    first.success('Saved')
    assert.equal(useToast(), first)
  })

  test('helpers still push toasts into the store', () => {
    const before = useToastStore.getState().toasts.length
    useToast().warning('Heads up')
    const toasts = useToastStore.getState().toasts
    assert.equal(toasts.length, before + 1)
    assert.deepEqual(
      { message: toasts.at(-1).message, type: toasts.at(-1).type },
      { message: 'Heads up', type: 'warning' }
    )
  })
})
