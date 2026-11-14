/**
 * Server-Sent Events client for real-time dashboard updates.
 *
 * The API authenticates with a Bearer access token, which the native EventSource
 * cannot send (it only carries cookies), so every EventSource connection was rejected
 * with 401 and retried forever. This client streams the same endpoint through fetch
 * with an Authorization header and parses the event-stream itself.
 */
import { useAuthStore } from '../store/authStore'
import { refreshAccessToken } from './axios'
import { parseSSEBuffer } from './sseParser'

const SSE_URL = '/api/v1/reports/dashboard/live'
const TRACKED_EVENTS = new Set(['attendance:updated', 'fee:paid', 'challans:generated', 'dashboard:refresh'])
const RETRY_BASE_MS = 5000
const RETRY_MAX_MS = 60000

let isActive = false
let abortController = null
let reconnectTimer = null
let failedAttempts = 0

const scheduleReconnect = (onEvent) => {
  if (!isActive || reconnectTimer) return
  // Exponential back-off so an unauthorised or offline client doesn't hammer the API.
  const delay = Math.min(RETRY_BASE_MS * 2 ** failedAttempts, RETRY_MAX_MS)
  failedAttempts += 1
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    openStream(onEvent)
  }, delay)
}

const dispatch = (onEvent, { event, data }) => {
  if (!onEvent || !TRACKED_EVENTS.has(event)) return
  let payload = {}
  try {
    payload = JSON.parse(data)
  } catch (_) {
    payload = {}
  }
  onEvent(event, payload)
}

const openStream = async (onEvent) => {
  if (!isActive) return
  const token = useAuthStore.getState().accessToken
  if (!token) {
    scheduleReconnect(onEvent)
    return
  }

  const controller = new AbortController()
  abortController = controller

  try {
    const response = await fetch(SSE_URL, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    if (response.status === 401) {
      // The access token expired while no API call refreshed it: renew it now so the retry
      // below (and the server's expiry-close) reconnects with a valid token.
      try { await refreshAccessToken() } catch (_) { /* axios logs the user out on a hard failure */ }
    }
    if (!response.ok || !response.body) {
      throw new Error(`SSE connection rejected (HTTP ${response.status})`)
    }

    failedAttempts = 0
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const { events, remainder } = parseSSEBuffer(buffer)
      buffer = remainder
      events.forEach((evt) => dispatch(onEvent, evt))
    }
  } catch (err) {
    if (err?.name === 'AbortError') return
  } finally {
    if (abortController === controller) abortController = null
  }

  scheduleReconnect(onEvent)
}

export const connectSSE = (onEvent) => {
  if (isActive) return
  isActive = true
  failedAttempts = 0
  openStream(onEvent)
}

export const disconnectSSE = () => {
  isActive = false
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}
