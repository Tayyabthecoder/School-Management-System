import { describe, test, expect, vi, beforeEach } from 'vitest'
import { downloadBlobResponse } from './download'
import { announceCredentials } from './credentials'
import { useToastStore } from '../store/toastStore'

// jsdom has no object URLs and does not navigate on link clicks: stub the first, spy on the second.
let clicked
beforeEach(() => {
  clicked = []
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    clicked.push({ href: this.href, download: this.getAttribute('download') })
  })
  useToastStore.setState({ toasts: [] })
})

describe('downloadBlobResponse', () => {
  test('does nothing without a response body', () => {
    downloadBlobResponse(null)
    downloadBlobResponse({})
    expect(clicked).toEqual([])
  })

  test('uses the filename from Content-Disposition and cleans the link up afterwards', () => {
    downloadBlobResponse({ data: 'x', headers: { 'content-disposition': 'attachment; filename="report-card.pdf"', 'content-type': 'application/pdf' } })

    expect(clicked).toEqual([{ href: 'blob:fake', download: 'report-card.pdf' }])
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
    expect(document.querySelector('a[download]')).toBeNull()
  })

  test('falls back to the given name when the header has none', () => {
    downloadBlobResponse({ data: 'x', headers: {} }, 'challan.pdf')
    expect(clicked[0].download).toBe('challan.pdf')
  })

  test('reads a capitalised Content-Disposition header too', () => {
    downloadBlobResponse({ data: 'x', headers: { 'Content-Disposition': 'attachment; filename=export.xlsx' } })
    expect(clicked[0].download).toBe('export.xlsx')
  })

  test.each([
    ['../../etc/passwd', '.._.._etc_passwd'],
    ['a<b>c:d|e?.pdf', 'a_b_c_d_e_.pdf'],
    ['C:\\Windows\\evil.exe', 'C__Windows_evil.exe'],
  ])('a hostile filename %s cannot escape the downloads folder', (hostile, safe) => {
    downloadBlobResponse({ data: 'x', headers: { 'content-disposition': `attachment; filename="${hostile}"` } })
    expect(clicked[0].download).toBe(safe)
    expect(clicked[0].download).not.toMatch(/[/\\?%*:|"<>]/)
  })
})

describe('announceCredentials', () => {
  test('does nothing for no credentials', () => {
    announceCredentials(undefined)
    announceCredentials([])
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  test('one account: a long-lived toast with the username and one-time password, no download', () => {
    announceCredentials({ username: 'stu-2026-0001', password: 'Tmp#123' })

    const [toast] = useToastStore.getState().toasts
    expect(toast.message).toContain('stu-2026-0001')
    expect(toast.message).toContain('Tmp#123')
    expect(toast.duration).toBe(60000)
    expect(clicked).toEqual([])
  })

  test('many accounts: a CSV download plus a warning toast that never prints the passwords', async () => {
    announceCredentials([
      { username: 'a', password: 'p1' },
      { username: 'b"quote', password: 'p2' },
    ])

    expect(clicked).toEqual([{ href: 'blob:fake', download: 'new-account-credentials.csv' }])
    const blob = URL.createObjectURL.mock.calls[0][0]
    const csv = await blob.text()
    expect(csv).toBe('username,temporaryPassword\n"a","p1"\n"b""quote","p2"')

    const [toast] = useToastStore.getState().toasts
    expect(toast.type).toBe('warning')
    expect(toast.message).toContain('2 accounts created')
    expect(toast.message).not.toContain('p1')
  })
})
