/**
 * Server-Sent Events (SSE) Client for Real-Time Dashboard Updates (Gap 1)
 */

let eventSource = null
let reconnectTimer = null

export const connectSSE = (onEvent) => {
  if (eventSource) return

  try {
    const url = '/api/v1/reports/dashboard/live'
    eventSource = new EventSource(url, { withCredentials: true })

    const events = ['attendance:updated', 'fee:paid', 'challans:generated', 'dashboard:refresh']
    events.forEach((evt) => {
      eventSource.addEventListener(evt, (e) => {
        try {
          const parsed = JSON.parse(e.data)
          if (onEvent) onEvent(evt, parsed)
        } catch (_) {
          if (onEvent) onEvent(evt, {})
        }
      })
    })

    eventSource.onerror = () => {
      eventSource?.close()
      eventSource = null

      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          connectSSE(onEvent)
        }, 5000)
      }
    }
  } catch (err) {
    console.warn('SSE connection failed:', err)
  }
}

export const disconnectSSE = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}
