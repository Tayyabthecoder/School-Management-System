import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
const jsx = walk(SRC).filter((f) => f.endsWith('.jsx'))
const rel = (f) => path.relative(SRC, f).split(path.sep).join('/')

describe('accessibility guards (things a live axe scan found once)', () => {
  test('every chart is wrapped in <ChartFrame> so it has a text alternative', () => {
    const bad = []
    for (const file of jsx) {
      const text = fs.readFileSync(file, 'utf8')
      const charts = (text.match(/<ResponsiveContainer\b/g) || []).length
      const framed = (text.match(/<ChartFrame\s+label=/g) || []).length
      if (charts !== framed) bad.push(`${rel(file)}: ${charts} chart(s), ${framed} ChartFrame(s)`)
    }
    assert.deepEqual(bad, [])
  })

  test('every <select> has an accessible name', () => {
    const bad = []
    for (const file of jsx) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/<select\b[\s\S]*?(?<!=)>/g)) {
        if (!/aria-label|aria-labelledby|\bid=/.test(m[0])) {
          bad.push(`${rel(file)}:${text.slice(0, m.index).split('\n').length}`)
        }
      }
    }
    assert.deepEqual(bad, [])
  })

  test('every <nav> landmark has its own accessible name', () => {
    const bad = []
    for (const file of jsx) {
      const text = fs.readFileSync(file, 'utf8')
      for (const m of text.matchAll(/<nav\b[\s\S]*?(?<!=)>/g)) {
        if (!/aria-label|aria-labelledby/.test(m[0])) bad.push(`${rel(file)}:${text.slice(0, m.index).split('\n').length}`)
      }
    }
    assert.deepEqual(bad, [])
  })

  test('stat numbers and card titles never skip heading levels (no <h3> in StatCard)', () => {
    const text = fs.readFileSync(path.join(SRC, 'components/ui/StatCard.jsx'), 'utf8')
    assert.ok(!/<h[3-6]\b/.test(text))
  })

  test('small text does not use the washed-out grays that fail WCAG AA on white', () => {
    // text-gray-400 / text-slate-400 (and gray-300) are below 4.5:1 on white. Allowed only where the
    // class sits on an icon (graphics need 3:1, not 4.5:1), a dark surface (the sidebar and the ID-card preview) or with a variant prefix.
    const allowed = new Set(['components/layout/Sidebar.jsx', 'components/layout/Header.jsx', 'components/ui/CommandPalette.jsx',
      'features/students/components/StudentProfile/StudentIdCardModal.jsx', 'components/ui/Modal.jsx', 'components/ui/EmptyState.jsx', 'components/ui/ToastContainer.jsx'])
    const bad = []
    for (const file of jsx) {
      if (allowed.has(rel(file))) continue
      fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/(^|["'` ])text-(gray|slate)-400(?![\w-])/.test(line) && !(/\bw-\d/.test(line) && /\bh-\d/.test(line))) bad.push(`${rel(file)}:${i + 1}`)
      })
    }
    assert.deepEqual(bad, [])
  })
})
