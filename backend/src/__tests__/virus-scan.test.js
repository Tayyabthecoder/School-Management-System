// Antivirus scanning of uploads, tested against a fake clamd that speaks the real INSTREAM protocol.
const net = require('net')
const fs = require('fs')
const os = require('os')
const path = require('path')
const env = require('../config/env')
const { scanFile } = require('../utils/virus-scan.util')
const { verifyUploadContent } = require('../middleware/upload.middleware')

// Harmless stand-in for a malware signature (the real EICAR string trips desktop antivirus).
const VIRUS_MARKER = 'FAKE-VIRUS-MARKER-FOR-TESTS'

/**
 * Fake clamd. Reads "zINSTREAM\0" then [4-byte length][data]... until a zero length, then answers
 * like clamd does. mode: 'normal' | 'silent' (never answers) | 'error' | 'garbage'.
 */
const startFakeClamd = ({ mode = 'normal' } = {}) => new Promise((resolve) => {
  const seen = { commands: 0, bytes: 0, chunks: 0 }
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0)
    let gotCommand = false
    let content = Buffer.alloc(0)
    socket.on('data', (data) => {
      buffer = Buffer.concat([buffer, data])
      if (!gotCommand) {
        const nul = buffer.indexOf(0)
        if (nul === -1) return
        expect(buffer.subarray(0, nul).toString()).toBe('zINSTREAM')
        gotCommand = true
        seen.commands += 1
        buffer = buffer.subarray(nul + 1)
      }
      while (buffer.length >= 4) {
        const len = buffer.readUInt32BE(0)
        if (len === 0) {
          if (mode === 'silent') return
          const reply = mode === 'error' ? 'INSTREAM size limit exceeded. ERROR\0'
            : mode === 'garbage' ? 'what is this\0'
              : content.includes(VIRUS_MARKER) ? 'stream: Fake.Test.Virus-1 FOUND\0' : 'stream: OK\0'
          socket.end(reply)
          return
        }
        if (buffer.length < 4 + len) return
        content = Buffer.concat([content, buffer.subarray(4, 4 + len)])
        seen.bytes += len
        seen.chunks += 1
        buffer = buffer.subarray(4 + len)
      }
    })
    socket.on('error', () => {})
  })
  server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, seen, close: () => new Promise((r) => server.close(r)) }))
})

let tmpDir
const tmpFile = (name, content) => {
  const p = path.join(tmpDir, name)
  fs.writeFileSync(p, content)
  return p
}

beforeAll(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sms-scan-')) })
afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

describe('scanFile (clamd INSTREAM client)', () => {
  test('a clean file is reported clean', async () => {
    const clamd = await startFakeClamd()
    try {
      const result = await scanFile(tmpFile('clean.txt', 'just some report text'), { host: '127.0.0.1', port: clamd.port })
      expect(result).toEqual({ clean: true })
      expect(clamd.seen.commands).toBe(1)
    } finally { await clamd.close() }
  })

  test('an infected file reports the signature', async () => {
    const clamd = await startFakeClamd()
    try {
      const result = await scanFile(tmpFile('bad.txt', `hello ${VIRUS_MARKER} world`), { host: '127.0.0.1', port: clamd.port })
      expect(result).toEqual({ clean: false, signature: 'Fake.Test.Virus-1' })
    } finally { await clamd.close() }
  })

  test('a large file is streamed in several length-prefixed chunks without losing a byte', async () => {
    const clamd = await startFakeClamd()
    try {
      const big = Buffer.alloc(300 * 1024, 'a') // larger than one 64 KB chunk
      const result = await scanFile(tmpFile('big.bin', big), { host: '127.0.0.1', port: clamd.port })
      expect(result.clean).toBe(true)
      expect(clamd.seen.bytes).toBe(big.length)
      expect(clamd.seen.chunks).toBeGreaterThan(1)
    } finally { await clamd.close() }
  })

  test('an empty file is scanned too', async () => {
    const clamd = await startFakeClamd()
    try {
      expect((await scanFile(tmpFile('empty.txt', ''), { host: '127.0.0.1', port: clamd.port })).clean).toBe(true)
    } finally { await clamd.close() }
  })

  test('rejects when the daemon cannot be reached', async () => {
    const clamd = await startFakeClamd()
    const { port } = clamd
    await clamd.close() // nothing listens on this port any more
    await expect(scanFile(tmpFile('x.txt', 'x'), { host: '127.0.0.1', port })).rejects.toThrow(/connection failed/i)
  })

  test('rejects when the daemon never answers (timeout)', async () => {
    const clamd = await startFakeClamd({ mode: 'silent' })
    try {
      await expect(scanFile(tmpFile('slow.txt', 'x'), { host: '127.0.0.1', port: clamd.port, timeoutMs: 300 })).rejects.toThrow(/timed out/i)
    } finally { await clamd.close() }
  })

  test('rejects on a clamd ERROR reply and on an unexpected reply', async () => {
    const errorServer = await startFakeClamd({ mode: 'error' })
    const garbageServer = await startFakeClamd({ mode: 'garbage' })
    try {
      await expect(scanFile(tmpFile('e.txt', 'x'), { host: '127.0.0.1', port: errorServer.port })).rejects.toThrow(/ClamAV error/)
      await expect(scanFile(tmpFile('g.txt', 'x'), { host: '127.0.0.1', port: garbageServer.port })).rejects.toThrow(/Unexpected ClamAV reply/)
    } finally { await errorServer.close(); await garbageServer.close() }
  })

  test('rejects without a host', async () => {
    await expect(scanFile(tmpFile('n.txt', 'x'), {})).rejects.toThrow(/No ClamAV host/)
  })
})

describe('verifyUploadContent with CLAMAV_HOST set', () => {
  const saved = { host: env.CLAMAV_HOST, port: env.CLAMAV_PORT, timeout: env.CLAMAV_TIMEOUT_MS }
  afterEach(() => { env.CLAMAV_HOST = saved.host; env.CLAMAV_PORT = saved.port; env.CLAMAV_TIMEOUT_MS = saved.timeout })

  const upload = (name, content) => {
    const filePath = tmpFile(name, content)
    return { filePath, req: { file: { path: filePath, originalname: name }, user: { _id: 'u1' } } }
  }
  const run = async (req) => {
    const next = jest.fn()
    await verifyUploadContent(req, {}, next)
    return next.mock.calls[0][0]
  }

  test('scanning is off by default: nothing is sent anywhere', async () => {
    env.CLAMAV_HOST = ''
    const { req, filePath } = upload('plain-a.txt', `contains ${VIRUS_MARKER}`)

    expect(await run(req)).toBeUndefined() // accepted, no scanner involved
    expect(fs.existsSync(filePath)).toBe(true)
  })

  test('a clean file passes and is kept', async () => {
    const clamd = await startFakeClamd()
    try {
      env.CLAMAV_HOST = '127.0.0.1'; env.CLAMAV_PORT = clamd.port
      const { req, filePath } = upload('plain-b.txt', 'a perfectly normal note')

      expect(await run(req)).toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
      expect(clamd.seen.commands).toBe(1)
    } finally { await clamd.close() }
  })

  test('an infected file is rejected with 422 and deleted', async () => {
    const clamd = await startFakeClamd()
    try {
      env.CLAMAV_HOST = '127.0.0.1'; env.CLAMAV_PORT = clamd.port
      const { req, filePath } = upload('plain-c.txt', `payload ${VIRUS_MARKER}`)

      const error = await run(req)

      expect(error).toMatchObject({ statusCode: 422 })
      expect(error.message).toContain('Fake.Test.Virus-1')
      expect(fs.existsSync(filePath)).toBe(false)
    } finally { await clamd.close() }
  })

  test('an unreachable scanner refuses the upload with 503 and deletes the file (fails closed)', async () => {
    const clamd = await startFakeClamd()
    const { port } = clamd
    await clamd.close()
    env.CLAMAV_HOST = '127.0.0.1'; env.CLAMAV_PORT = port
    const { req, filePath } = upload('plain-d.txt', 'cannot be scanned right now')

    const error = await run(req)

    expect(error).toMatchObject({ statusCode: 503 })
    expect(fs.existsSync(filePath)).toBe(false)
  })

  test('the content-type check still runs first (a renamed binary never reaches the scanner)', async () => {
    const clamd = await startFakeClamd()
    try {
      env.CLAMAV_HOST = '127.0.0.1'; env.CLAMAV_PORT = clamd.port
      const { req } = upload('fake.pdf', 'MZ\u0090\u0000 not a pdf')

      expect(await run(req)).toMatchObject({ statusCode: 400 })
      expect(clamd.seen.commands).toBe(0)
    } finally { await clamd.close() }
  })
})

describe('antivirus configuration', () => {
  test('CLAMAV settings default to disabled with the standard port', () => {
    jest.isolateModules(() => {
      const keys = ['CLAMAV_HOST', 'CLAMAV_PORT', 'CLAMAV_TIMEOUT_MS']
      const previous = Object.fromEntries(keys.map((k) => [k, process.env[k]]))
      keys.forEach((k) => delete process.env[k])
      try {
        const fresh = require('../config/env')
        expect(fresh.CLAMAV_HOST).toBe('')
        expect(fresh.CLAMAV_PORT).toBe(3310)
        expect(fresh.CLAMAV_TIMEOUT_MS).toBe(30000)
      } finally {
        keys.forEach((k) => { if (previous[k] !== undefined) process.env[k] = previous[k] })
      }
    })
  })

  test('the clamav service is opt-in (profile) and pinned by digest', () => {
    const compose = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docker-compose.yml'), 'utf8')
    expect(compose).toMatch(/clamav:[\s\S]*?profiles: \['antivirus'\]/)
    expect(compose).toMatch(/image: clamav\/clamav:stable@sha256:[0-9a-f]{64}/)
  })
})
