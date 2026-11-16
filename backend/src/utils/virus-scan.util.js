const net = require('net')
const fs = require('fs')

const CHUNK_SIZE = 64 * 1024

/**
 * Scans a file with a ClamAV daemon (clamd) over TCP using the INSTREAM protocol:
 *   "zINSTREAM\0", then the file as [4-byte big-endian length][bytes] chunks, then a zero length.
 * clamd answers "stream: OK", "stream: <signature> FOUND" or "<message> ERROR".
 *
 * Resolves { clean: true } or { clean: false, signature }. Rejects when the daemon cannot be
 * reached, times out or reports an error, so the caller decides what to do about an unavailable
 * scanner (uploads fail closed: a file that could not be scanned is not accepted).
 */
const scanFile = (filePath, { host, port = 3310, timeoutMs = 30000 } = {}) =>
  new Promise((resolve, reject) => {
    if (!host) return reject(new Error('No ClamAV host configured'))

    const socket = net.connect({ host, port })
    let reply = ''
    let settled = false
    const finish = (fn, value) => {
      if (settled) return
      settled = true
      socket.destroy()
      fn(value)
    }

    socket.setTimeout(timeoutMs, () => finish(reject, new Error(`ClamAV timed out after ${timeoutMs} ms`)))
    socket.on('error', (err) => finish(reject, new Error(`ClamAV connection failed: ${err.message}`)))
    socket.on('data', (chunk) => { reply += chunk.toString('utf8') })
    socket.on('close', () => {
      if (settled) return
      const text = reply.replace(/\0/g, '').trim()
      if (/ERROR$/.test(text)) return finish(reject, new Error(`ClamAV error: ${text}`))
      if (/\sFOUND$/.test(text)) {
        const signature = text.replace(/^stream:\s*/, '').replace(/\s+FOUND$/, '')
        return finish(resolve, { clean: false, signature })
      }
      if (/OK$/.test(text)) return finish(resolve, { clean: true })
      return finish(reject, new Error(`Unexpected ClamAV reply: ${text || '(empty)'}`))
    })

    socket.on('connect', async () => {
      try {
        socket.write('zINSTREAM\0')
        for await (const chunk of fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE })) {
          const header = Buffer.alloc(4)
          header.writeUInt32BE(chunk.length, 0)
          if (!socket.write(Buffer.concat([header, chunk]))) {
            await new Promise((ok) => socket.once('drain', ok))
          }
        }
        socket.write(Buffer.alloc(4)) // zero-length chunk ends the stream
      } catch (err) {
        finish(reject, new Error(`Could not send the file to ClamAV: ${err.message}`))
      }
    })
  })

module.exports = { scanFile }
