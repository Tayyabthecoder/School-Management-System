import { useQuery } from '@tanstack/react-query'
import api from './axios.js'
import { queryClient } from './queryClient.js'

export const API_CACHE_KEY = 'api'
const STALE_MS = 15 * 1000

const keyFor = (url, params) => [API_CACHE_KEY, url, params ?? null]

/**
 * Drop-in for `api.get(url, { params })` that goes through the shared react-query cache:
 * identical requests made within a few seconds (several components, a remount, a double effect)
 * share one network call. It resolves to the same axios response and rejects with the same error,
 * so callers keep their own error handling. Any successful write (POST/PUT/PATCH/DELETE) empties the
 * cache (see lib/axios.js), so a list never shows data older than the user's own last change.
 * Downloads (`responseType`) and anything that must always be fresh should keep using `api.get`.
 */
export const cachedGet = (url, config = {}) =>
  queryClient.fetchQuery({
    queryKey: keyFor(url, config.params),
    queryFn: () => api.get(url, config),
    staleTime: STALE_MS,
    retry: false,
  })

/** Hook form for new code: the parsed `{ success, data }` envelope's `data`, cached and shared. */
export function useApiQuery(url, { params, enabled = true, select } = {}) {
  return useQuery({
    queryKey: keyFor(url, params),
    enabled,
    staleTime: STALE_MS,
    queryFn: async () => (await api.get(url, { params })).data,
    select: select || ((body) => body?.data),
  })
}

export const clearApiCache = () => queryClient.removeQueries({ queryKey: [API_CACHE_KEY] })
