import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'

export const CLASSES_KEY = ['classes']

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
    queryFn: async () => {
      const res = await api.get('/classes')
      return res.data?.success ? (res.data.data || []) : []
    },
  })
}
