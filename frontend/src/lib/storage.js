// Safe localStorage helpers: storage can be unavailable (private mode, blocked site data)
// and stored values can be corrupt or from an older build, so never let them crash a page.

export function readStoredJson(key, fallback, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...fallback, ...parsed } : fallback
    }
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function writeStoredJson(key, value, storage = globalThis.localStorage) {
  try {
    storage?.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
