const path = require('path')
const { toStartOfLocalDay } = require('../utils/date.util')
const { UPLOADS_DIR } = require('../middleware/upload.middleware')
const { buildFileUrl } = require('../modules/uploads/uploads.controller')

describe('toStartOfLocalDay', () => {
  test('reads a YYYY-MM-DD string as that local calendar day (independent of server TZ)', () => {
    const day = toStartOfLocalDay('2026-05-04')
    expect(day.getFullYear()).toBe(2026)
    expect(day.getMonth()).toBe(4)
    expect(day.getDate()).toBe(4)
    expect(day.getHours()).toBe(0)
  })

  test('keeps the same calendar day on a server west of UTC', () => {
    const originalTz = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      expect(toStartOfLocalDay('2026-05-04').getDate()).toBe(4)
    } finally {
      if (originalTz === undefined) delete process.env.TZ
      else process.env.TZ = originalTz
    }
  })

  test('zeroes the time of full timestamps and Date objects', () => {
    const day = toStartOfLocalDay(new Date(2026, 0, 15, 17, 45))
    expect([day.getDate(), day.getHours(), day.getMinutes()]).toEqual([15, 0, 0])
  })

  test('defaults to today for empty input', () => {
    const today = new Date()
    const day = toStartOfLocalDay(undefined)
    expect(day.getDate()).toBe(today.getDate())
    expect(day.getHours()).toBe(0)
  })

  test('returns null for invalid or rolled-over dates', () => {
    expect(toStartOfLocalDay('garbage')).toBeNull()
    expect(toStartOfLocalDay('2026-02-31')).toBeNull()
  })
})

describe('upload file URLs', () => {
  test('are built relative to UPLOADS_DIR and served under /uploads', () => {
    const stored = path.join(UPLOADS_DIR, 'photos', 'kid-1234.png')
    expect(buildFileUrl(stored)).toBe('/uploads/photos/kid-1234.png')
  })

  test('never contain parent-directory segments', () => {
    const stored = path.join(UPLOADS_DIR, 'documents', 'bform.pdf')
    expect(buildFileUrl(stored)).not.toMatch(/\.\./)
  })
})
