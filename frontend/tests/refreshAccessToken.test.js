import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createSingleFlight } from '../src/lib/singleFlight.js'

// refreshAccessToken (lib/axios.js) is createSingleFlight(<POST /auth/refresh>).
describe('createSingleFlight (token refresh de-duplication)', () => {
  test('concurrent callers share one invocation and receive the same result', async () => {
    let calls = 0
    const refresh = createSingleFlight(() => {
      calls += 1
      return new Promise((resolve) => setTimeout(() => resolve(`tok-${calls}`), 20))
    })

    const results = await Promise.all([refresh(), refresh(), refresh()])

    assert.equal(calls, 1)
    assert.deepEqual(results, ['tok-1', 'tok-1', 'tok-1'])
  })

  test('starts a fresh invocation after the previous one settled', async () => {
    let calls = 0
    const refresh = createSingleFlight(async () => {
      calls += 1
      return calls
    })

    assert.equal(await refresh(), 1)
    assert.equal(await refresh(), 2)
  })

  test('a failure is shared by all waiters and does not poison later calls', async () => {
    let calls = 0
    const refresh = createSingleFlight(async () => {
      calls += 1
      if (calls === 1) throw new Error('refresh rejected')
      return 'ok'
    })

    const outcomes = await Promise.allSettled([refresh(), refresh()])
    assert.deepEqual(outcomes.map((o) => o.status), ['rejected', 'rejected'])
    assert.equal(await refresh(), 'ok')
    assert.equal(calls, 2)
  })
})
