import axios from 'axios'
import { navigateTo } from './navigation'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { createSingleFlight } from './singleFlight'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

// Attach Access Token Header
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Exchanges the refresh-token cookie for a new access token. Concurrent callers share
 * one request: refresh tokens rotate server-side, so a second parallel call would
 * present the already-revoked token, get 401 and log the user out.
 */
export const refreshAccessToken = createSingleFlight(async () => {
  const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
  const newToken = res.data?.success ? res.data?.data?.accessToken : null
  if (!newToken) throw new Error('Refresh response missing access token')
  useAuthStore.getState().setAccessToken(newToken)
  return newToken
})

// Handle 401 & Concurrent Token Refresh Queue
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 403 && error.response?.data?.error?.code === 'MUST_CHANGE_PASSWORD') {
      if (window.location.pathname !== '/change-password') {
        navigateTo('/change-password')
      }
      return Promise.reject(error)
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        // Every request waiting on the failed refresh lands here; log out only once.
        if (useAuthStore.getState().isAuthenticated || useAuthStore.getState().user) {
          useAuthStore.getState().logout()
        }
        if (window.location.pathname !== '/login') {
          navigateTo('/login')
        }
        return Promise.reject(refreshErr)
      }
    }

    // Global API error handling (Gap 10)
    const status = error.response?.status
    const errorMessage = error.response?.data?.error?.message || error.response?.data?.message

    const isLoginEndpoint = originalRequest?.url?.includes('/auth/login')
    const isCheckAuth = originalRequest?.url?.includes('/auth/me')

    if (!error.response) {
      useToastStore.getState().warning('Network connectivity error. Please check your connection.')
    } else if (status === 403 && !isCheckAuth) {
      useToastStore.getState().error(errorMessage || 'You do not have permission to perform this action.')
    } else if (status >= 500) {
      useToastStore.getState().error(errorMessage || 'A server error occurred. Please try again.')
    } else if (status === 400 && !isLoginEndpoint && errorMessage) {
      useToastStore.getState().error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default api
