// Who receives which live-dashboard event, the stream limits, and how failures on a stream are handled.
// (The timer/expiry lifecycle is covered in sse-lifecycle.test.js.)
const jwt = require('jsonwebtoken')
const sse = require('../modules/reports/sse.controller')

const makeRes = () => {
  const handlers = {}
  return {
    handlers,
    writableEnded: false,
    destroyed: false,
    writeHead: jest.fn(),
    on: jest.fn((event, cb) => { handlers[event] = cb }),
    write: jest.fn(() => true),
    end: jest.fn(function end() { this.writableEnded = true }),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }
}
const makeReq = (user, headers = {}) => ({ user, headers, on: jest.fn() })
const open = (user, headers) => {
  const res = makeRes()
  sse.subscribe(makeReq(user, headers), res)
  return res
}
const sent = (res) => res.write.mock.calls.map(([chunk]) => String(chunk))
const received = (res, event) => sent(res).some((chunk) => chunk.startsWith(`event: ${event}\n`))

beforeEach(() => jest.useFakeTimers())
afterEach(() => {
  ;[...sse._clients].forEach((c) => sse.closeClient(c))
  jest.useRealTimers()
})

describe('opening a stream', () => {
  test('answers 200 as an uncached event stream and sends the connected handshake first', () => {
    const res = open({ _id: 'u1', roleName: 'teacher' })

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream',
      'Cache-Control': expect.stringContaining('no-cache'),
      'X-Accel-Buffering': 'no',
    }))
    const first = sent(res)[0]
    expect(first).toMatch(/^event: connected\ndata: \{"clientId":"[0-9a-f-]{36}","timestamp":"/)
  })

  test('a token without an expiry never expires the stream', () => {
    const token = jwt.sign({ id: 'u1' }, 'any-secret') // no exp claim
    const res = open({ _id: 'u1', roleName: 'teacher' }, { authorization: `Bearer ${token}` })

    jest.advanceTimersByTime(10 * 60 * 1000)

    expect(res.end).not.toHaveBeenCalled()
    expect(sse._clients.size).toBe(1)
  })

  test.each([
    ['no Authorization header', {}],
    ['a non-Bearer scheme', { authorization: 'Basic abc' }],
    ['a Bearer value that is not a JWT', { authorization: 'Bearer not-a-jwt' }],
  ])('%s leaves the stream open (no expiry to enforce)', (_label, headers) => {
    const res = open({ _id: 'u1', roleName: 'teacher' }, headers)
    jest.advanceTimersByTime(60000)
    expect(res.end).not.toHaveBeenCalled()
  })
})

describe('who receives which event', () => {
  const finance = () => open({ _id: 'acc', roleName: 'accountant' })
  const admin = () => open({ _id: 'adm', roleName: 'super_admin' })
  const teacher = () => open({ _id: 'tch', roleName: 'teacher' })
  const hr = () => open({ _id: 'hr', roleName: 'hr_manager' })

  test('fee:paid and challans:generated reach only finance roles', () => {
    const [a, s, t, h] = [finance(), admin(), teacher(), hr()]

    sse.broadcast('fee:paid', { amount: 5000, studentId: 's1' })
    sse.broadcast('challans:generated', { created: 10 })

    for (const res of [a, s]) {
      expect(received(res, 'fee:paid')).toBe(true)
      expect(received(res, 'challans:generated')).toBe(true)
    }
    for (const res of [t, h]) {
      expect(received(res, 'fee:paid')).toBe(false)
      expect(received(res, 'challans:generated')).toBe(false)
    }
  })

  test('an event with no audience rule goes to everyone, with the JSON payload', () => {
    const [a, t] = [finance(), teacher()]

    sse.broadcast('attendance:marked', { classId: 'c1', present: 24 })

    for (const res of [a, t]) {
      expect(sent(res).at(-1)).toBe('event: attendance:marked\ndata: {"classId":"c1","present":24}\n\n')
    }
  })

  test('the role is read from a populated role object and from a plain role string', () => {
    const populated = open({ _id: 'p', role: { name: 'accountant' } })
    const plain = open({ _id: 'q', role: 'super_admin' })
    const unknown = open({ _id: 'r' }) // no role at all

    sse.broadcast('fee:paid', {})

    expect(received(populated, 'fee:paid')).toBe(true)
    expect(received(plain, 'fee:paid')).toBe(true)
    expect(received(unknown, 'fee:paid')).toBe(false)
  })

  test('broadcasting with no payload sends an empty object', () => {
    const t = teacher()
    sse.broadcast('ping')
    expect(sent(t).at(-1)).toBe('event: ping\ndata: {}\n\n')
  })
})

describe('limits', () => {
  test('a fourth stream for one user replaces that user\'s oldest, other users are untouched', () => {
    const mine = [1, 2, 3].map(() => open({ _id: 'u1', roleName: 'teacher' }))
    const other = open({ _id: 'u2', roleName: 'teacher' })

    const fourth = open({ _id: 'u1', roleName: 'teacher' })

    expect(mine[0].end).toHaveBeenCalled() // oldest dropped
    expect(mine[1].end).not.toHaveBeenCalled()
    expect(other.end).not.toHaveBeenCalled()
    expect(fourth.end).not.toHaveBeenCalled()
    expect(sse._clients.size).toBe(sse.MAX_STREAMS_PER_USER + 1) // 3 of u1 + u2
  })

  test('streams without a user id are not capped per user', () => {
    for (let i = 0; i < sse.MAX_STREAMS_PER_USER + 2; i += 1) open({})
    expect(sse._clients.size).toBe(sse.MAX_STREAMS_PER_USER + 2)
  })

  test('once the server-wide cap is reached a new stream is refused with 503 and nothing is registered', () => {
    for (let i = 0; i < sse.MAX_STREAMS_TOTAL; i += 1) {
      sse._clients.add({ id: `fake-${i}`, userId: `user-${i}`, role: 'teacher', res: makeRes() })
    }
    const res = makeRes()

    sse.subscribe(makeReq({ _id: 'newcomer', roleName: 'teacher' }), res)

    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
    expect(res.writeHead).not.toHaveBeenCalled()
    expect(sse._clients.size).toBe(sse.MAX_STREAMS_TOTAL)
    sse._clients.clear()
  })
})

describe('failures on a stream', () => {
  test('a write that throws during broadcast closes only that stream', () => {
    const broken = open({ _id: 'b', roleName: 'teacher' })
    const healthy = open({ _id: 'h', roleName: 'teacher' })
    broken.write.mockImplementation(() => { throw new Error('EPIPE') })

    expect(() => sse.broadcast('news', {})).not.toThrow()

    expect(broken.end).toHaveBeenCalled()
    expect(received(healthy, 'news')).toBe(true)
    expect(sse._clients.size).toBe(1)
  })

  test('a destroyed response is skipped and removed instead of written to', () => {
    const gone = open({ _id: 'g', roleName: 'teacher' })
    const before = gone.write.mock.calls.length
    gone.destroyed = true

    sse.broadcast('news', {})

    expect(gone.write.mock.calls.length).toBe(before)
    expect(sse._clients.size).toBe(0)
  })

  test('a heartbeat write that throws closes the stream and stops its timer', () => {
    const res = open({ _id: 'u1', roleName: 'teacher' })
    res.write.mockImplementation(() => { throw new Error('socket closed') })

    jest.advanceTimersByTime(25000)

    expect(res.end).toHaveBeenCalled()
    expect(sse._clients.size).toBe(0)
    expect(jest.getTimerCount()).toBe(0)
  })

  test('closeClient is safe to call twice and never writes a final event to an ended response', () => {
    const res = open({ _id: 'u1', roleName: 'teacher' })
    const [client] = [...sse._clients]

    sse.closeClient(client, 'event: bye\ndata: {}\n\n')
    const writes = res.write.mock.calls.length
    sse.closeClient(client, 'event: bye\ndata: {}\n\n')

    expect(res.end).toHaveBeenCalledTimes(1)
    expect(res.write.mock.calls.length).toBe(writes)
  })

  test('closeExpiredClients only closes streams whose token has expired', () => {
    const fresh = open({ _id: 'a', roleName: 'teacher' }, { authorization: `Bearer ${jwt.sign({ id: 'a', exp: Math.floor(Date.now() / 1000) + 3600 }, 'k')}` })
    const stale = open({ _id: 'b', roleName: 'teacher' }, { authorization: `Bearer ${jwt.sign({ id: 'b', exp: Math.floor(Date.now() / 1000) + 5 }, 'k')}` })

    sse.closeExpiredClients(Date.now() + 10000)

    expect(stale.end).toHaveBeenCalled()
    expect(received(stale, 'auth:expired')).toBe(true)
    expect(fresh.end).not.toHaveBeenCalled()
  })
})
