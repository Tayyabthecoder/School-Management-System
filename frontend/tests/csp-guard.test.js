import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))

const cspLine = fs.readFileSync(path.join(ROOT, 'nginx', 'security-headers.conf'), 'utf8')
  .split(/\r?\n/)
  .find((line) => line.includes('Content-Security-Policy'))

describe('Content-Security-Policy', () => {
  test('exists and is sent as an enforcing header', () => {
    assert.ok(cspLine, 'no Content-Security-Policy header found')
    assert.ok(cspLine.startsWith('add_header Content-Security-Policy'))
  })

  test("neither scripts nor styles may be 'unsafe-inline'", () => {
    assert.ok(!cspLine.includes("'unsafe-inline'"), "the policy allows 'unsafe-inline'")
    assert.ok(!cspLine.includes("'unsafe-eval'"), "the policy allows 'unsafe-eval'")
  })

  test('styles come only from this origin and the Google Fonts stylesheet host', () => {
    const styleSrc = cspLine.match(/style-src ([^;]+);/)[1].trim().split(/\s+/)
    assert.deepEqual(styleSrc.sort(), ["'self'", 'https://fonts.googleapis.com'].sort())
  })
})

describe('the app does not depend on inline styles or HTML injection', () => {
  const sources = walk(path.join(ROOT, 'src')).filter((f) => f.endsWith('.jsx') || f.endsWith('.js'))

  test('no component renders a <style> element (blocked by the policy; use index.css)', () => {
    const offenders = sources.filter((f) => /<style[\s>]/.test(fs.readFileSync(f, 'utf8')))
    assert.deepEqual(offenders.map((f) => path.relative(ROOT, f)), [])
  })

  test('no component injects raw HTML', () => {
    const offenders = sources.filter((f) => fs.readFileSync(f, 'utf8').includes('dangerouslySetInnerHTML'))
    assert.deepEqual(offenders.map((f) => path.relative(ROOT, f)), [])
  })

  test('index.html has no inline <style> or inline <script>', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    assert.ok(!/<style[\s>]/.test(html), 'inline <style> in index.html')
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'inline <script> in index.html')
  })

  test('the voucher print rules live in the static stylesheet', () => {
    const css = fs.readFileSync(path.join(ROOT, 'src', 'index.css'), 'utf8')
    assert.ok(css.includes('#printable-challan-voucher'))
    assert.ok(css.includes('@page'))
  })
})
