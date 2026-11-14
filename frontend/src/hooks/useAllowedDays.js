import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import { logError } from '../lib/logger'

export const ALLOWED_DAYS_KEY = ['settings', 'allowed-days']

const failOpen = () => ({
  today: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  allowedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  isAllowedToday: true,
})

/**
 * School operating days and whether today is one of them. One cached request is shared by the
 * login page, the route guard and the settings screen (they each fetched it separately before).
 * A failed request fails open so a network blip can't lock everyone out.
 */
export function useAllowedDays() {
  return useQuery({
    queryKey: ALLOWED_DAYS_KEY,
    queryFn: async () => {
      try {
        const res = await api.get('/settings/allowed-days')
        return res.data?.success ? res.data.data : failOpen()
      } catch (err) {
        logError('Failed to load allowed days:', err)
        return failOpen()
      }
    },
    staleTime: 5 * 60 * 1000,
    // Long sessions notice when the calendar day changes to a restricted one.
    refetchInterval: 15 * 60 * 1000,
  })
}
