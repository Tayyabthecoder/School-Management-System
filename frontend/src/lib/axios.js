import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

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

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Handle 401 & Concurrent Token Refresh Queue
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 403 && error.response?.data?.error?.code === 'MUST_CHANGE_PASSWORD') {
      if (window.location.pathname !== '/change-password') {
        window.location.href = '/change-password'
      }
      return Promise.reject(error)
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        if (res.data?.success && res.data?.data?.accessToken) {
          const newToken = res.data.data.accessToken
          useAuthStore.getState().setAccessToken(newToken)
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
        throw new Error('Refresh response missing access token')
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
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
