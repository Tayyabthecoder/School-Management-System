import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderAt, Route } from '../test/render'

vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))

const { default: RoleRoute } = await import('./RoleRoute')
const { useAuthStore } = await import('../store/authStore')
const { ACCESS } = await import('../config/access')

const routes = (
  <>
    <Route path="/dashboard" element={<div>dashboard page</div>} />
    <Route element={<RoleRoute allowedRoles={['accountant', 'hr_manager']} />}>
      <Route path="/finance" element={<div>finance page</div>} />
    </Route>
  </>
)
const where = () => screen.getByTestId('where').textContent
const signIn = (user) => useAuthStore.setState({ user, accessToken: 't', isAuthenticated: true, isInitializing: false })

beforeEach(() => useAuthStore.setState({ user: null, isAuthenticated: false, isInitializing: false }))

describe('RoleRoute', () => {
  test('lets a listed role in', () => {
    signIn({ roleName: 'accountant' })
    renderAt('/finance', routes)
    expect(screen.getByText('finance page')).toBeInTheDocument()
  })

  test('a super admin passes every role gate', () => {
    signIn({ roleName: 'super_admin' })
    renderAt('/finance', routes)
    expect(screen.getByText('finance page')).toBeInTheDocument()
  })

  test.each(['teacher', 'student', 'guardian'])('sends a %s back to the dashboard', (roleName) => {
    signIn({ roleName })
    renderAt('/finance', routes)
    expect(where()).toBe('/dashboard')
    expect(screen.queryByText('finance page')).not.toBeInTheDocument()
  })

  test('a visitor with no user at all is sent to the dashboard (which then sends them to login)', () => {
    renderAt('/finance', routes)
    expect(where()).toBe('/dashboard')
  })

  test('reads the role from a populated role object or a plain string', () => {
    signIn({ role: { name: 'hr_manager' } })
    renderAt('/finance', routes)
    expect(screen.getByText('finance page')).toBeInTheDocument()
  })

  test('every role named in config/access is a real staff role', () => {
    const known = new Set(['super_admin', 'teacher', 'accountant', 'hr_manager'])
    for (const [area, roles] of Object.entries(ACCESS)) {
      for (const role of roles) expect(known.has(role), `${area}: unknown role ${role}`).toBe(true)
    }
  })

  test('the real access lists work as the gate: finance admits accountants, not teachers', () => {
    const real = (
      <>
        <Route path="/dashboard" element={<div>dashboard page</div>} />
        <Route element={<RoleRoute allowedRoles={ACCESS.finance} />}>
          <Route path="/finance" element={<div>finance page</div>} />
        </Route>
      </>
    )
    signIn({ roleName: 'accountant' })
    const first = renderAt('/finance', real)
    expect(screen.getByText('finance page')).toBeInTheDocument()
    first.unmount()

    signIn({ roleName: 'teacher' })
    renderAt('/finance', real)
    expect(screen.queryByText('finance page')).not.toBeInTheDocument()
  })
})
