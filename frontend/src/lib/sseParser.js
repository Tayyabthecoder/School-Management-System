/**
 * Incremental Server-Sent Events parser (text/event-stream framing).
 *
 * Feed it everything received so far; it returns the complete events and the
 * unfinished tail to prepend to the next chunk. Comment lines (": heartbeat")
 * are ignored, multi-line data fields are joined with "\n".
 *
 * @param {string} buffer
 * @returns {{ events: Array<{ event: string, data: string }>, remainder: string }}
 */
export const parseSSEBuffer = (buffer) => {
  const blocks = buffer.replace(/\r\n?/g, '\n').split('\n\n')
  const remainder = blocks.pop() ?? ''
  const events = []

  for (const block of blocks) {
    let event = 'message'
    const dataLines = []

    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue
      const colon = line.indexOf(':')
      const field = colon === -1 ? line : line.slice(0, colon)
      let value = colon === -1 ? '' : line.slice(colon + 1)
      if (value.startsWith(' ')) value = value.slice(1)

      if (field === 'event') event = value
      else if (field === 'data') dataLines.push(value)
    }

    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join('\n') })
    }
  }

  return { events, remainder }
}

export default parseSSEBuffer
