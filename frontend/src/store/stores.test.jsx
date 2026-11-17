import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))

const { default: axios } = await import('axios')
const { useUIStore } = await import('./uiStore')
const { useAuthStore } = await import('./authStore')
const { queryClient } = await import('../lib/queryClient')

describe('uiStore: sidebar, theme, palette, shortcuts', () => {
  beforeEach(() => useUIStore.setState({ isSidebarOpen: true, isCommandPaletteOpen: false, isShortcutsModalOpen: false }))

  test('the sidebar opens, closes and toggles', () => {
    const s = useUIStore.getState
    s().closeSidebar()
    expect(s().isSidebarOpen).toBe(false)
    s().openSidebar()
    expect(s().isSidebarOpen).toBe(true)
    s().toggleSidebar()
    expect(s().isSidebarOpen).toBe(false)
  })

  test('setting a theme flips the "dark" class on <html> and remembers the choice', () => {
    useUIStore.getState().setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('sms_theme')).toBe('dark')

    useUIStore.getState().setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('sms_theme')).toBe('light')
  })

  test('toggleTheme alternates between light and dark', () => {
    useUIStore.getState().setTheme('light')
    useUIStore.getState().toggleTheme()
    expect(useUIStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    useUIStore.getState().toggleTheme()
    expect(useUIStore.getState().theme).toBe('light')
  })

  test('the command palette and the shortcuts dialog open, close and toggle independently', () => {
    const s = useUIStore.getState
    s().openCommandPalette()
    expect(s().isCommandPaletteOpen).toBe(true)
    expect(s().isShortcutsModalOpen).toBe(false)
    s().toggleCommandPalette()
    expect(s().isCommandPaletteOpen).toBe(false)

    s().toggleShortcutsModal()
    expect(s().isShortcutsModalOpen).toBe(true)
    s().closeShortcutsModal()
    expect(s().isShortcutsModalOpen).toBe(false)
    s().openShortcutsModal()
    expect(s().isShortcutsModalOpen).toBe(true)
    s().closeCommandPalette()
    expect(s().isCommandPaletteOpen).toBe(false)
  })
})

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    axios.post.mockClear()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false })
  })

  test('setAuth stores the user for the next page load but keeps the token in memory only', () => {
    useAuthStore.getState().setAuth({ username: 'admin', roleName: 'super_admin' }, 'access-token')

    const s = useAuthStore.getState()
    expect(s.isAuthenticated).toBe(true)
    expect(s.accessToken).toBe('access-token')
    expect(JSON.parse(localStorage.getItem('sms_user'))).toEqual({ username: 'admin', roleName: 'super_admin' })
    expect(JSON.stringify({ ...localStorage })).not.toContain('access-token')
  })

  test('setAccessToken signs in with a token and signs out without one', () => {
    useAuthStore.getState().setAccessToken('t')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    useAuthStore.getState().setAccessToken(null)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  test('updateUser merges fields and persists them; with nobody signed in it does nothing', () => {
    useAuthStore.getState().updateUser({ mustChangePassword: false })
    expect(useAuthStore.getState().user).toBeNull()
    expect(localStorage.getItem('sms_user')).toBeNull()

    useAuthStore.setState({ user: { username: 'a', mustChangePassword: true } })
    useAuthStore.getState().updateUser({ mustChangePassword: false })
    expect(useAuthStore.getState().user).toEqual({ username: 'a', mustChangePassword: false })
    expect(JSON.parse(localStorage.getItem('sms_user')).mustChangePassword).toBe(false)
  })

  test('logout revokes the refresh cookie, wipes the stored user and the cached data of that user', () => {
    useAuthStore.getState().setAuth({ username: 'a' }, 't')
    queryClient.setQueryData(['api', '/students', null], { secret: 'previous user data' })

    useAuthStore.getState().logout()

    expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/logout', {}, { withCredentials: true })
    const s = useAuthStore.getState()
    expect(s.user).toBeNull()
    expect(s.accessToken).toBeNull()
    expect(s.isAuthenticated).toBe(false)
    expect(localStorage.getItem('sms_user')).toBeNull()
    expect(queryClient.getQueryData(['api', '/students', null])).toBeUndefined()
  })

  test('logout still signs the user out locally when the server cannot be reached', async () => {
    axios.post.mockReturnValueOnce(Promise.reject(new Error('offline')))
    useAuthStore.getState().setAuth({ username: 'a' }, 't')
    expect(() => useAuthStore.getState().logout()).not.toThrow()
    await Promise.resolve()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  test('setInitializing flips the flag the route guard waits on', () => {
    useAuthStore.getState().setInitializing(true)
    expect(useAuthStore.getState().isInitializing).toBe(true)
  })
})
