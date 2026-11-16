// The live-dashboard stream must never write to a response it already ended: that emits an
// 'error' event on the response, which is uncaught and used to crash the whole server whenever a
// stream outlived its access token (ERR_STREAM_WRITE_AFTER_END at the next heartbeat).
const jwt = require('jsonwebtoken')
const sse = require('../modules/reports/sse.controller')

const makeRes = () => {
  const handlers = {}
  const res = {
    handlers,
    writableEnded: false,
    destroyed: false,
    writesAfterEnd: 0,
    writeHead: jest.fn(),
    on: jest.fn((event, cb) => { handlers[event] = cb }),
    write: jest.fn(function write() {
      if (this.writableEnded) this.writesAfterEnd += 1 // a real response would emit 'error' here
      return true
    }),
    end: jest.fn(function end() { this.writableEnded = true }),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }
  return res
}

const tokenExpiringIn = (seconds) => jwt.sign({ id: 'u1', exp: Math.floor(Date.now() / 1000) + seconds }, 'any-secret')
const makeReq = (id, token) => ({
  user: { _id: id, roleName: 'teacher' },
  headers: token ? { authorization: `Bearer ${token}` } : {},
  on: jest.fn(),
})

beforeEach(() => jest.useFakeTimers())
afterEach(() => {
  ;[...sse._clients].forEach((c) => sse.closeClient(c))
  jest.useRealTimers()
})

describe('stream expiry and the heartbeat', () => {
  test('a stream that outlives its token is closed once and never written to again', () => {
    const res = makeRes()
    sse.subscribe(makeReq('u1', tokenExpiringIn(10)), res) // expires after 10 s, first heartbeat at 25 s

    jest.advanceTimersByTime(25000)

    expect(res.end).toHaveBeenCalledTimes(1)
    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('auth:expired'))
    expect(res.writesAfterEnd).toBe(0)
    expect(sse._clients.size).toBe(0)

    // The old bug: the timer kept running and wrote to the ended response on the next tick
    jest.advanceTimersByTime(120000)
    expect(res.writesAfterEnd).toBe(0)
    expect(jest.getTimerCount()).toBe(0)
  })

  test('a valid stream keeps receiving heartbeats', () => {
    const res = makeRes()
    sse.subscribe(makeReq('u1', tokenExpiringIn(3600)), res)

    jest.advanceTimersByTime(50000)

    const heartbeats = res.write.mock.calls.filter(([chunk]) => String(chunk).includes('heartbeat'))
    expect(heartbeats).toHaveLength(2)
    expect(res.end).not.toHaveBeenCalled()
  })

  test('a stream error closes that stream and stops its timer instead of crashing the process', () => {
    const res = makeRes()
    sse.subscribe(makeReq('u1'), res)
    expect(res.on).toHaveBeenCalledWith('error', expect.any(Function))

    res.handlers.error(new Error('write after end'))

    expect(sse._clients.size).toBe(0)
    expect(jest.getTimerCount()).toBe(0)
  })

  test('the client closing the connection stops its heartbeat', () => {
    const req = makeReq('u1')
    let onClose
    req.on = jest.fn((event, cb) => { if (event === 'close') onClose = cb })
    sse.subscribe(req, makeRes())
    expect(jest.getTimerCount()).toBe(1)

    onClose()

    expect(sse._clients.size).toBe(0)
    expect(jest.getTimerCount()).toBe(0)
  })

  test('dropping the oldest stream of a user also stops its timer', () => {
    const first = makeRes()
    sse.subscribe(makeReq('u1'), first)
    for (let i = 0; i < sse.MAX_STREAMS_PER_USER; i++) sse.subscribe(makeReq('u1'), makeRes())

    expect(first.end).toHaveBeenCalledTimes(1)
    // one timer per stream that is still open, none for the dropped one
    expect(jest.getTimerCount()).toBe(sse.MAX_STREAMS_PER_USER)
  })

  test('broadcast skips and cleans up a stream whose response already ended', () => {
    const live = makeRes()
    const dead = makeRes()
    sse.subscribe(makeReq('u1'), live)
    sse.subscribe(makeReq('u2'), dead)
    dead.writableEnded = true

    sse.broadcast('dashboard:refresh', {})

    expect(dead.writesAfterEnd).toBe(0)
    expect(live.write).toHaveBeenCalledWith(expect.stringContaining('dashboard:refresh'))
    expect(sse._clients.size).toBe(1)
  })
})
