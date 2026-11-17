import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Splitting big pages into files once left an import pointing one folder too high: ESLint did not
// notice, only the production build failed. This fails in the unit tests instead.
const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))

test('every relative import in src resolves to a file', () => {
  const broken = []
  for (const file of walk(SRC).filter((f) => /\.jsx?$/.test(f))) {
    const text = fs.readFileSync(file, 'utf8')
    for (const m of text.matchAll(/(?:from|import)\s*\(?\s*'(\.[^']*)'/g)) {
      const base = path.resolve(path.dirname(file), m[1])
      const found = ['', '.js', '.jsx', '/index.js', '/index.jsx', '.json', '.css']
        .some((ext) => fs.existsSync(base + ext) && fs.statSync(base + ext).isFile())
      if (!found) broken.push(`${path.relative(SRC, file)} -> ${m[1]}`)
    }
  }
  assert.deepEqual(broken, [])
})
