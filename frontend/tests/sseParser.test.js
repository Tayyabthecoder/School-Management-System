import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseSSEBuffer } from '../src/lib/sseParser.js'

describe('parseSSEBuffer', () => {
  test('parses named events with JSON data', () => {
    const { events, remainder } = parseSSEBuffer('event: fee:paid\ndata: {"amountPaid":500}\n\n')
    assert.deepEqual(events, [{ event: 'fee:paid', data: '{"amountPaid":500}' }])
    assert.equal(remainder, '')
  })

  test('ignores heartbeat comments and keeps an incomplete trailing event', () => {
    const { events, remainder } = parseSSEBuffer(': heartbeat\n\nevent: connected\ndata: {"a":1}\n\nevent: attendance:upd')
    assert.deepEqual(events, [{ event: 'connected', data: '{"a":1}' }])
    assert.equal(remainder, 'event: attendance:upd')
  })

  test('reassembles an event split across chunks', () => {
    const first = parseSSEBuffer('event: challans:generated\nda')
    assert.equal(first.events.length, 0)
    const second = parseSSEBuffer(first.remainder + 'ta: {"count":3}\n\n')
    assert.deepEqual(second.events, [{ event: 'challans:generated', data: '{"count":3}' }])
  })

  test('handles CRLF framing and multi-line data', () => {
    const { events } = parseSSEBuffer('data: line1\r\ndata: line2\r\n\r\n')
    assert.deepEqual(events, [{ event: 'message', data: 'line1\nline2' }])
  })
})
