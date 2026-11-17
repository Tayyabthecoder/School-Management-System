import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt, Route } from '../test/render'

vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))
vi.mock('../lib/axios', () => ({ refreshAccessToken: vi.fn(), default: {} }))
vi.mock('../hooks/useAllowedDays', () => ({ useAllowedDays: vi.fn() }))

const { default: ProtectedRoute } = await import('./ProtectedRoute')
const { useAuthStore } = await import('../store/authStore')
const { refreshAccessToken } = await import('../lib/axios')
const { useAllowedDays } = await import('../hooks/useAllowedDays')

const open = { data: { today: 'Monday', allowedDays: ['Monday', 'Tuesday'], isAllowedToday: true }, isFetched: true }
const closed = { data: { today: 'Sunday', allowedDays: ['Monday', 'Tuesday'], isAllowedToday: false }, isFetched: true }

const signIn = (user, extra = {}) =>
  useAuthStore.setState({ user, accessToken: 'tok', isAuthenticated: true, isInitializing: false, ...extra })

const guarded = (
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<div>dashboard page</div>} />
    <Route path="/students" element={<div>students page</div>} />
    <Route path="/teacher/workspace" element={<div>workspace page</div>} />
    <Route path="/guardian-portal" element={<div>guardian page</div>} />
    <Route path="/student-portal" element={<div>student page</div>} />
    <Route path="/change-password" element={<div>change password page</div>} />
  </Route>
)
const routes = (
  <>
    <Route path="/login" element={<div>login page</div>} />
    {guarded}
  </>
)
const where = () => screen.getByTestId('where').textContent

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false })
  useAllowedDays.mockReturnValue(open)
  refreshAccessToken.mockReset()
})

describe('ProtectedRoute: who gets in', () => {
  test('a signed-out visitor is sent to /login', () => {
    renderAt('/students', routes)
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(where()).toBe('/login')
  })

  test('a signed-in user sees the page they asked for', () => {
    signIn({ roleName: 'accountant' })
    renderAt('/students', routes)
    expect(screen.getByText('students page')).toBeInTheDocument()
  })

  test('the role can also come from a populated role object', () => {
    signIn({ role: { name: 'teacher' } })
    renderAt('/students', routes)
    expect(screen.getByText('students page')).toBeInTheDocument()
  })

  test('shows a loader, not the page, until the school-day check has answered', () => {
    signIn({ roleName: 'accountant' })
    useAllowedDays.mockReturnValue({ data: undefined, isFetched: false })
    renderAt('/students', routes)
    expect(screen.queryByText('students page')).not.toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })
})

describe('ProtectedRoute: restoring a session on reload', () => {
  test('a remembered user triggers one token refresh and sees a loader meanwhile', async () => {
    refreshAccessToken.mockReturnValue(new Promise(() => {})) // never settles
    useAuthStore.setState({ user: { roleName: 'accountant' }, isAuthenticated: false, isInitializing: true })
    renderAt('/students', routes)

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('students page')).not.toBeInTheDocument()
    expect(where()).toBe('/students') // not bounced to /login while the refresh is pending
  })

  test('a refresh that fails signs the user out and lands on /login', async () => {
    refreshAccessToken.mockRejectedValue(new Error('refresh token revoked'))
    useAuthStore.setState({ user: { roleName: 'accountant' }, isAuthenticated: false, isInitializing: true })
    renderAt('/students', routes)

    await waitFor(() => expect(where()).toBe('/login'))
    expect(useAuthStore.getState().user).toBeNull()
  })
})

describe('ProtectedRoute: school-day restriction', () => {
  test('on a closed day a non-admin gets the Access Restricted screen with today and the open days', () => {
    signIn({ roleName: 'teacher' })
    useAllowedDays.mockReturnValue(closed)
    renderAt('/students', routes)

    expect(screen.getByText('Access Restricted')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(screen.queryByText('students page')).not.toBeInTheDocument()
  })

  test('its Sign Out button signs the user out', async () => {
    signIn({ roleName: 'teacher' })
    useAllowedDays.mockReturnValue(closed)
    renderAt('/students', routes)

    await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  test('a super admin is never locked out by the calendar', () => {
    signIn({ roleName: 'super_admin' })
    useAllowedDays.mockReturnValue(closed)
    renderAt('/students', routes)
    expect(screen.getByText('students page')).toBeInTheDocument()
  })
})

describe('ProtectedRoute: forced redirects', () => {
  test('a user who must change their password is sent to /change-password and can stay there', () => {
    signIn({ roleName: 'accountant', mustChangePassword: true })
    renderAt('/students', routes)
    expect(where()).toBe('/change-password')
    expect(screen.getByText('change password page')).toBeInTheDocument()
  })

  test.each([
    ['guardian', '/students', '/guardian-portal'],
    ['guardian', '/dashboard', '/guardian-portal'],
    ['student', '/students', '/student-portal'],
    ['student', '/dashboard', '/student-portal'],
    ['teacher', '/dashboard', '/teacher/workspace'],
  ])('a %s opening %s lands on %s', (roleName, from, to) => {
    signIn({ roleName })
    renderAt(from, routes)
    expect(where()).toBe(to)
  })

  test.each([
    ['guardian', '/guardian-portal'],
    ['guardian', '/change-password'],
    ['student', '/student-portal'],
    ['student', '/change-password'],
    ['teacher', '/students'],
  ])('a %s may stay on %s', (roleName, path) => {
    signIn({ roleName })
    renderAt(path, routes)
    expect(where()).toBe(path)
  })
})
