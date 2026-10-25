import { create } from 'zustand'

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('sms_user')
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return JSON.parse(raw)
  } catch (err) {
    localStorage.removeItem('sms_user')
    return null
  }
}

// Remove legacy stored tokens if any exist
try {
  localStorage.removeItem('sms_token')
} catch (e) {}

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  accessToken: null,
  isAuthenticated: false,
  isInitializing: !!getStoredUser(),

  setAuth: (user, accessToken) => {
    localStorage.setItem('sms_user', JSON.stringify(user))
    set({ user, accessToken, isAuthenticated: true, isInitializing: false })
  },

  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: !!accessToken, isInitializing: false })
  },

  setInitializing: (isInitializing) => set({ isInitializing }),

  updateUser: (updatedFields) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...updatedFields } : null
      if (newUser) {
        localStorage.setItem('sms_user', JSON.stringify(newUser))
      }
      return { user: newUser }
    })
  },

  logout: () => {
    localStorage.removeItem('sms_user')
    localStorage.removeItem('sms_token')
    set({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false })
  },
}))
