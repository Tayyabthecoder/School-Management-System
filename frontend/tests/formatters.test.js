import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatPKR, formatDate, formatPercentage } from '../src/lib/formatters.js'

describe('Frontend Formatters Test Suite', () => {
  test('formatPKR formats numeric amounts to PKR currency string', () => {
    assert.equal(formatPKR(0), 'PKR 0')
    assert.equal(formatPKR(15000), 'PKR 15,000')
    assert.equal(formatPKR(2500000), 'PKR 2,500,000')
    assert.equal(formatPKR(null), 'PKR 0')
    assert.equal(formatPKR(undefined), 'PKR 0')
    assert.equal(formatPKR('invalid'), 'PKR 0')
    assert.equal(formatPKR(NaN), 'PKR 0')
  })

  test('formatDate correctly formats date strings to DD MMM YYYY and handles invalid dates safely', () => {
    const formatted = formatDate('2026-09-15T00:00:00.000Z')
    assert.match(formatted, /15/)
    assert.match(formatted, /2026/)
    assert.equal(formatDate(null), 'N/A')
    assert.equal(formatDate(''), 'N/A')
    assert.equal(formatDate('invalid-date-string'), 'N/A')
  })

  test('formatPercentage formats numbers to percentage string and handles invalid inputs', () => {
    assert.equal(formatPercentage(75), '75%')
    assert.equal(formatPercentage(84.6), '85%')
    assert.equal(formatPercentage(null), '0%')
    assert.equal(formatPercentage('invalid'), '0%')
  })
})
