// Single place for client-side diagnostics (LOW-14). Development builds log to the console;
// production builds stay quiet, so error objects (URLs, response bodies) don't end up in
// end users' consoles. Swap the body for an error-reporting service if one is added.
/* eslint-disable no-console */
const isDev = Boolean(import.meta.env?.DEV)

export function logError(...args) {
  if (isDev) console.error(...args)
}

export function logWarn(...args) {
  if (isDev) console.warn(...args)
}
