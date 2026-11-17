import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// The auth store reads localStorage while it loads; plain Node has none, so give it an in-memory one first
// (under Vitest's jsdom there already is one).
const memory = new Map()
if (typeof localStorage === 'undefined') globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
}
const { default: api } = await import('../src/lib/axios.js')
const { cachedGet, clearApiCache } = await import('../src/lib/cachedGet.js')
const { queryClient } = await import('../src/lib/queryClient.js')

// Count the requests that really leave the app by replacing axios' transport.
let calls
const respond = (config, status = 200) => Promise.resolve({
  data: { success: true, data: [config.url] }, status, statusText: 'OK', headers: {}, config,
})
beforeEach(() => {
  calls = []
  clearApiCache()
  api.defaults.adapter = (config) => {
    calls.push(`${String(config.method).toUpperCase()} ${config.url}`)
    return respond(config)
  }
})

describe('cachedGet (shared GET cache)', () => {
  test('identical simultaneous requests share one network call', async () => {
    const [a, b, c] = await Promise.all([cachedGet('/students'), cachedGet('/students'), cachedGet('/students')])
    assert.equal(calls.length, 1)
    assert.deepEqual(a.data.data, ['/students'])
    assert.equal(a, b)
    assert.equal(b, c)
  })

  test('a repeat inside the stale window is served from the cache', async () => {
    await cachedGet('/classes')
    await cachedGet('/classes')
    assert.equal(calls.length, 1)
  })

  test('different params are different requests', async () => {
    await cachedGet('/students', { params: { classId: 'a' } })
    await cachedGet('/students', { params: { classId: 'b' } })
    await cachedGet('/students', { params: { classId: 'a' } })
    assert.equal(calls.length, 2)
  })

  test('any successful write empties the cache, so the next read is fresh', async () => {
    await cachedGet('/students')
    await api.post('/students', { fullName: 'x' })
    await cachedGet('/students')
    assert.deepEqual(calls, ['GET /students', 'POST /students', 'GET /students'])
  })

  test('a failed write does not throw away the cache', async () => {
    await cachedGet('/students')
    api.defaults.adapter = (config) => Promise.reject(Object.assign(new Error('boom'), { config, response: { status: 422, data: {} } }))
    await assert.rejects(api.post('/students', {}))
    api.defaults.adapter = (config) => { calls.push('GET again'); return respond(config) }
    await cachedGet('/students')
    assert.ok(!calls.includes('GET again'))
  })

  test('a failed read is not cached or retried, and rejects like api.get', async () => {
    let n = 0
    api.defaults.adapter = (config) => { n += 1; return Promise.reject(Object.assign(new Error('down'), { config, response: { status: 500, data: {} } })) }
    await assert.rejects(cachedGet('/reports/x'), /down/)
    assert.equal(n, 1)
    api.defaults.adapter = respond
    const ok = await cachedGet('/reports/x')
    assert.equal(ok.status, 200)
  })

  test('signing out clears everything cached for the previous user', async () => {
    await cachedGet('/students')
    queryClient.clear() // what authStore.logout() does
    await cachedGet('/students')
    assert.equal(calls.length, 2)
  })
})
