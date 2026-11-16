import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { queryClient } from '../lib/queryClient'

export const CLASSES_KEY = ['classes']

const fetchClassList = async () => {
  const res = await api.get('/classes')
  return res.data?.success ? (res.data.data || []) : []
}

/**
 * Drop-in for `api.get('/classes')` inside the multi-request loaders of pages that are not worth
 * restructuring: it resolves to the same `{ data: { success, data } }` shape, but a list fetched in
 * the last minute (or by another page) is reused instead of requested again.
 */
export const loadClasses = () =>
  queryClient
    .fetchQuery({ queryKey: CLASSES_KEY, queryFn: fetchClassList, staleTime: 60 * 1000 })
    .then((data) => ({ data: { success: true, data } }))

/**
 * The school's classes, fetched once and shared by every page that needs the list (ten pages each
 * called GET /classes on their own). The Classes page refreshes this cache after it changes
 * anything, and a short stale time keeps other tabs of data reasonably fresh.
 */
export function useClasses({ enabled = true } = {}) {
  return useQuery({
    queryKey: CLASSES_KEY,
    enabled,
    staleTime: 60 * 1000,
    queryFn: fetchClassList,
  })
}
