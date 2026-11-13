/**
 * Server-Sent Events (SSE) Controller for Real-Time Dashboard Updates (Gap 1)
 */
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const clients = new Set()

// Who may receive each event (LOW-08). fee:paid carries a student id and an amount, so it
// must not reach teachers. Events not listed here go to every dashboard subscriber.
const FINANCE_ROLES = ['super_admin', 'accountant']
const EVENT_AUDIENCE = {
  'fee:paid': FINANCE_ROLES,
  'challans:generated': FINANCE_ROLES,
}

// Each open stream holds a socket; bound them per user and overall so one account (or a script)
// cannot exhaust the server. The oldest stream of a user is dropped for a new one.
const MAX_STREAMS_PER_USER = 3
const MAX_STREAMS_TOTAL = 500

const roleOf = (user) => user?.roleName || (typeof user?.role === 'object' ? user.role?.name : user?.role) || null

// The access token is only checked when the stream opens, so a stream would otherwise outlive
// its token (and the user's deactivation or role change). Streams are closed once the token
// expires; the client reconnects with a fresh token, which is re-validated by verifyToken.
const tokenExpiryMs = (req) => {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  const exp = jwt.decode(header.slice(7))?.exp
  return exp ? exp * 1000 : null
}

const closeExpiredClients = (now = Date.now()) => {
  for (const client of [...clients]) {
    if (client.expiresAt && now > client.expiresAt) {
      try {
        client.res.write('event: auth:expired\ndata: {}\n\n')
        client.res.end()
      } catch (_) { /* already closed */ }
      clients.delete(client)
    }
  }
}

const subscribe = (req, res) => {
  const userId = String(req.user?._id || req.user?.id || '')
  if (clients.size >= MAX_STREAMS_TOTAL) {
    return res.status(503).json({ success: false, error: { message: 'Too many live connections. Please try again shortly.' } })
  }
  const own = [...clients].filter((c) => c.userId === userId)
  while (userId && own.length >= MAX_STREAMS_PER_USER) {
    const oldest = own.shift()
    clients.delete(oldest)
    try { oldest.res.end() } catch (_) { /* already closed */ }
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in Nginx reverse proxies
  })

  const clientId = crypto.randomUUID()
  const client = { id: clientId, res, role: roleOf(req.user), userId, expiresAt: tokenExpiryMs(req) }
  clients.add(client)

  // Send initial handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`)

  // Periodic heartbeat to prevent proxy timeout
  const heartbeat = setInterval(() => {
    closeExpiredClients()
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
  const audience = EVENT_AUDIENCE[event]
  for (const client of clients) {
    if (audience && !audience.includes(client.role)) continue
    try {
      client.res.write(payload)
    } catch (_) {
      clients.delete(client)
    }
  }
}

module.exports = {
  EVENT_AUDIENCE,
  MAX_STREAMS_PER_USER,
  MAX_STREAMS_TOTAL,
  subscribe,
  broadcast,
  closeExpiredClients,
  _clients: clients,
}
