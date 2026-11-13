const { contentMatchesExtension } = require('../middleware/upload.middleware')
const sse = require('../modules/reports/sse.controller')
const { verifyToken } = require('../middleware/auth.middleware')

describe('upload magic-byte check', () => {
  test('accepts real signatures', () => {
    expect(contentMatchesExtension(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), '.jpg')).toBe(true)
    expect(contentMatchesExtension(Buffer.from('%PDF-1.7 ...'), '.pdf')).toBe(true)
    const ooxml = Buffer.concat([Buffer.from([0x50, 0x4B, 0x03, 0x04]), Buffer.from('....[Content_Types].xml...')])
    expect(contentMatchesExtension(ooxml, '.xlsx')).toBe(true)
    expect(contentMatchesExtension(ooxml, '.docx')).toBe(true)
    expect(contentMatchesExtension(Buffer.from('RIFF\0\0\0\0WEBPVP8 '), '.webp')).toBe(true)
    expect(contentMatchesExtension(Buffer.from('a,b\n1,2\n'), '.csv')).toBe(true)
  })
  test('rejects mismatched or disguised content', () => {
    expect(contentMatchesExtension(Buffer.from('<html><script>alert(1)</script>'), '.png')).toBe(false)
    expect(contentMatchesExtension(Buffer.from('MZ\x90\0\x03'), '.pdf')).toBe(false)
    expect(contentMatchesExtension(Buffer.from([0x50, 0x4B, 0x03, 0x04]), '.pdf')).toBe(false)
    expect(contentMatchesExtension(Buffer.from('bin\0ary'), '.txt')).toBe(false)
  })
})

describe('SSE connection caps', () => {
  const makeRes = () => ({ writeHead: jest.fn(), write: jest.fn(), end: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() })
  const makeReq = (id) => ({ user: { _id: id, roleName: 'teacher' }, on: jest.fn() })
  afterEach(() => sse._clients.clear())

  test('keeps at most MAX_STREAMS_PER_USER streams per user, dropping the oldest', () => {
    const first = makeRes()
    sse.subscribe(makeReq('u1'), first)
    for (let i = 0; i < sse.MAX_STREAMS_PER_USER; i++) sse.subscribe(makeReq('u1'), makeRes())
    expect([...sse._clients].filter((c) => c.userId === 'u1')).toHaveLength(sse.MAX_STREAMS_PER_USER)
    expect(first.end).toHaveBeenCalled()
  })
})

describe('verifyToken', () => {
  test('ignores an accessToken cookie', async () => {
    const next = jest.fn()
    await verifyToken({ headers: {}, cookies: { accessToken: 'x.y.z' } }, {}, next)
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401, message: 'Authentication token missing' })
  })
})
