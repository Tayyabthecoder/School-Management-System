import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))
vi.mock('./axios', () => ({ refreshAccessToken: vi.fn(() => Promise.resolve('fresh')), default: {} }))

const { useAuthStore } = await import('../store/authStore')
const { refreshAccessToken } = await import('./axios')
const { connectSSE, disconnectSSE } = await import('./sseClient')

// A fetch() response whose body streams the given chunks, then ends (or stays open if `hang`).
const streamOf = (chunks, { status = 200, hang = false } = {}) => {
  const encoder = new TextEncoder()
  let i = 0
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      getReader: () => ({
        read: () => {
          if (i < chunks.length) return Promise.resolve({ value: encoder.encode(chunks[i++]), done: false })
          return hang ? new Promise(() => {}) : Promise.resolve({ done: true })
        },
      }),
    },
  }
}
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve() }

beforeEach(() => {
  vi.useFakeTimers()
  useAuthStore.setState({ accessToken: 'token-1', isAuthenticated: true })
  refreshAccessToken.mockClear()
  globalThis.fetch = vi.fn()
})
afterEach(() => {
  disconnectSSE()
  vi.useRealTimers()
})

describe('SSE client', () => {
  test('connects with the Bearer token (EventSource cannot) and hands tracked events to the callback', async () => {
    globalThis.fetch.mockResolvedValueOnce(streamOf([
      'event: fee:paid\ndata: {"amount":500}\n\n',
      'event: attendance:updated\ndata: {"classId":"c1"}\n\n',
    ], { hang: true }))
    const onEvent = vi.fn()

    connectSSE(onEvent)
    await flush()

    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('/api/v1/reports/dashboard/live')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer token-1', Accept: 'text/event-stream' })
    expect(init.credentials).toBe('include')
    expect(onEvent).toHaveBeenCalledWith('fee:paid', { amount: 500 })
    expect(onEvent).toHaveBeenCalledWith('attendance:updated', { classId: 'c1' })
  })

  test('ignores untracked events (heartbeats, the connected handshake) and survives bad JSON', async () => {
    globalThis.fetch.mockResolvedValueOnce(streamOf([
      'event: connected\ndata: {"clientId":"x"}\n\n',
      ': heartbeat\n\n',
      'event: dashboard:refresh\ndata: not json\n\n',
    ], { hang: true }))
    const onEvent = vi.fn()

    connectSSE(onEvent)
    await flush()

    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(onEvent).toHaveBeenCalledWith('dashboard:refresh', {})
  })

  test('reassembles an event split across network chunks', async () => {
    globalThis.fetch.mockResolvedValueOnce(streamOf(['event: challans:gener', 'ated\ndata: {"created":3}\n', '\n'], { hang: true }))
    const onEvent = vi.fn()

    connectSSE(onEvent)
    await flush()

    expect(onEvent).toHaveBeenCalledWith('challans:generated', { created: 3 })
  })

  test('connecting twice opens one stream', async () => {
    globalThis.fetch.mockResolvedValue(streamOf([], { hang: true }))
    connectSSE(vi.fn())
    connectSSE(vi.fn())
    await flush()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('without a token it does not call the API, it waits and tries again', async () => {
    useAuthStore.setState({ accessToken: null })
    globalThis.fetch.mockResolvedValue(streamOf([], { hang: true }))

    connectSSE(vi.fn())
    await flush()
    expect(globalThis.fetch).not.toHaveBeenCalled()

    useAuthStore.setState({ accessToken: 'late-token' })
    await vi.advanceTimersByTimeAsync(5000)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('a 401 refreshes the access token before the retry', async () => {
    globalThis.fetch.mockResolvedValueOnce(streamOf([], { status: 401 }))
    globalThis.fetch.mockResolvedValue(streamOf([], { hang: true }))

    connectSSE(vi.fn())
    await flush()

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  test('reconnects with exponential back-off while the server keeps failing, capped at a minute', async () => {
    globalThis.fetch.mockRejectedValue(new Error('network down'))

    connectSSE(vi.fn())
    await flush()
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(4999)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1) // 5 s
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(10000) // then 10 s
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(20000) // then 20 s
    expect(globalThis.fetch).toHaveBeenCalledTimes(4)
    await vi.advanceTimersByTimeAsync(40000) // then 40 s
    expect(globalThis.fetch).toHaveBeenCalledTimes(5)
    await vi.advanceTimersByTimeAsync(60000) // capped at 60 s, not 80
    expect(globalThis.fetch).toHaveBeenCalledTimes(6)
  })

  test('a stream that ends normally is reopened', async () => {
    globalThis.fetch.mockResolvedValueOnce(streamOf(['event: fee:paid\ndata: {}\n\n']))
    globalThis.fetch.mockResolvedValue(streamOf([], { hang: true }))

    connectSSE(vi.fn())
    await flush()
    await vi.advanceTimersByTimeAsync(5000)

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  test('disconnect aborts the open stream and cancels a pending reconnect', async () => {
    let signal
    globalThis.fetch.mockImplementationOnce((_url, init) => { signal = init.signal; return Promise.resolve(streamOf([], { hang: true })) })
    connectSSE(vi.fn())
    await flush()

    disconnectSSE()
    expect(signal.aborted).toBe(true)

    await vi.advanceTimersByTimeAsync(120000)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('disconnect while waiting to reconnect stops the retry', async () => {
    globalThis.fetch.mockRejectedValue(new Error('down'))
    connectSSE(vi.fn())
    await flush()

    disconnectSSE()
    await vi.advanceTimersByTimeAsync(120000)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})
