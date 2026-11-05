import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatPKR, formatDate } from '../src/lib/formatters.js'

describe('Frontend Formatters Test Suite', () => {
  test('formatPKR formats numeric amounts to PKR currency string', () => {
    assert.equal(formatPKR(0), 'PKR 0')
    assert.equal(formatPKR(15000), 'PKR 15,000')
    assert.equal(formatPKR(2500000), 'PKR 2,500,000')
    assert.equal(formatPKR(null), 'PKR 0')
    assert.equal(formatPKR(undefined), 'PKR 0')
  })

  test('formatDate correctly formats date strings to DD MMM YYYY', () => {
    const formatted = formatDate('2026-09-15T00:00:00.000Z')
    assert.match(formatted, /15/)
    assert.match(formatted, /2026/)
    assert.equal(formatDate(null), 'N/A')
    assert.equal(formatDate(''), 'N/A')
  })
})
