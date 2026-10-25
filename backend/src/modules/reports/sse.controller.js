/**
 * Server-Sent Events (SSE) Controller for Real-Time Dashboard Updates (Gap 1)
 */

const clients = new Set()

const subscribe = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in Nginx reverse proxies
  })

  const clientId = Date.now() + Math.random().toString(36).substring(2, 7)
  const client = { id: clientId, res }
  clients.add(client)

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`)

  // Periodic heartbeat to prevent proxy timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch (_) {
      clearInterval(heartbeat)
      clients.delete(client)
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(client)
  })
}

const broadcast = (event, data = {}) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    try {
      client.res.write(payload)
    } catch (_) {
      clients.delete(client)
    }
  }
}

module.exports = {
  subscribe,
  broadcast,
}
