import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderAt, Route } from '../test/render'

// Every page is replaced by a labelled stub: this file tests the route table (who may open what and
// where a refused visitor lands), not the pages. The pages are lazy modules, so mocking them also
// keeps the test fast.
const { stub } = vi.hoisted(() => ({
  stub: (label) => async () => {
    const { createElement } = await import('react')
    return { default: () => createElement('div', null, `page:${label}`) }
  },
}))
vi.mock('../features/auth/LoginPage', stub('login'))
vi.mock('../features/auth/ChangePasswordPage', stub('change-password'))
vi.mock('../features/dashboard/DashboardPage', stub('dashboard'))
vi.mock('../features/students/StudentListPage', stub('students'))
vi.mock('../features/students/StudentProfilePage', stub('student-profile'))
vi.mock('../features/students/PromotionPage', stub('promotion'))
vi.mock('../features/teachers/TeachersPage', stub('teachers'))
vi.mock('../features/teachers/TeacherWorkspacePage', stub('workspace'))
vi.mock('../features/academics/ClassesPage', stub('classes'))
vi.mock('../features/academics/TimetablePage', stub('timetable'))
vi.mock('../features/attendance/AttendancePage', stub('attendance'))
vi.mock('../features/grades/GradesPage', stub('grades'))
vi.mock('../features/grades/ReportCardPage', stub('report-cards'))
vi.mock('../features/finance/FinancePage', stub('finance'))
vi.mock('../features/hr/HRPage', stub('hr'))
vi.mock('../features/hr/MyLeavePage', stub('my-leave'))
vi.mock('../features/reports/ReportsPage', stub('reports'))
vi.mock('../features/settings/SettingsPage', stub('settings'))
vi.mock('../features/guardian/GuardianPortalPage', stub('guardian'))
vi.mock('../features/students/StudentPortalPage', stub('student'))
vi.mock('../features/guardian/GuardianLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})
vi.mock('../features/students/StudentLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})
vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))
vi.mock('../lib/axios', () => ({ default: { get: vi.fn(() => Promise.resolve({ data: { success: true, data: {} } })) }, refreshAccessToken: vi.fn() }))
vi.mock('../hooks/useAllowedDays', () => ({
  useAllowedDays: () => ({ data: { today: 'Monday', allowedDays: ['Monday'], isAllowedToday: true }, isFetched: true }),
}))

const { default: AppRoutes } = await import('./index')
const { useAuthStore } = await import('../store/authStore')

const signIn = (roleName) =>
  useAuthStore.setState({ user: { username: 'u', roleName }, accessToken: 't', isAuthenticated: true, isInitializing: false })
const mount = (path) => renderAt(path, <Route path="/*" element={<AppRoutes />} />)
const where = () => screen.getByTestId('where').textContent

beforeEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isInitializing: false }))

// path -> the staff roles allowed to open it (a super admin may open all of them)
const MATRIX = {
  '/teacher/workspace': ['teacher'],
  '/academics': ['teacher'],
  '/academics/timetable': ['teacher'],
  '/students': ['teacher', 'accountant', 'hr_manager'],
  '/students/abc123': ['teacher', 'accountant', 'hr_manager'],
  '/students/promotion': [],
  '/teachers': ['teacher', 'hr_manager'],
  '/attendance': ['teacher', 'hr_manager'],
  '/grades': ['teacher'],
  '/grades/report-cards': ['teacher'],
  '/finance': ['accountant'],
  '/hr': ['hr_manager'],
  '/my-leave': ['teacher', 'accountant', 'hr_manager'],
  '/reports': ['accountant', 'hr_manager'],
  '/settings': [],
}
const ROLES = ['super_admin', 'teacher', 'accountant', 'hr_manager']

describe('route table: who can open which page', () => {
  const cases = ROLES.flatMap((role) => Object.entries(MATRIX).map(([path, allowed]) => [role, path, role === 'super_admin' || allowed.includes(role)]))

  test.each(cases)('%s opening %s -> allowed: %s', async (role, path, allowed) => {
    signIn(role)
    mount(path)

    if (allowed) {
      await waitFor(() => expect(where()).toBe(path))
      expect(await screen.findByText(/^page:/)).toBeInTheDocument()
    } else {
      await waitFor(() => expect(where()).not.toBe(path))
      expect(screen.queryByText(/^page:(finance|hr|settings|promotion|reports)$/)).toBeNull()
    }
  })
})

describe('route table: landing pages and redirects', () => {
  test('a signed-out visitor to any protected page lands on the login page', async () => {
    mount('/finance')
    expect(await screen.findByText('page:login')).toBeInTheDocument()
    expect(where()).toBe('/login')
  })

  test('/ goes to the dashboard for office staff', async () => {
    signIn('accountant')
    mount('/')
    expect(await screen.findByText('page:dashboard')).toBeInTheDocument()
  })

  test('a teacher\'s dashboard is their workspace', async () => {
    signIn('teacher')
    mount('/dashboard')
    expect(await screen.findByText('page:workspace')).toBeInTheDocument()
    expect(where()).toBe('/teacher/workspace')
  })

  test('an unknown URL falls back to the dashboard', async () => {
    signIn('hr_manager')
    mount('/no/such/page')
    expect(await screen.findByText('page:dashboard')).toBeInTheDocument()
  })

  test('guardians and students are kept inside their own portals', async () => {
    signIn('guardian')
    const first = mount('/finance')
    expect(await screen.findByText('page:guardian')).toBeInTheDocument()
    first.unmount()

    signIn('student')
    mount('/students')
    expect(await screen.findByText('page:student')).toBeInTheDocument()
  })

  test('the promotion page wins over the student-profile pattern for /students/promotion', async () => {
    signIn('super_admin')
    mount('/students/promotion')
    expect(await screen.findByText('page:promotion')).toBeInTheDocument()
  })

  test('a user who must change their password is held on that page', async () => {
    useAuthStore.setState({ user: { username: 'u', roleName: 'accountant', mustChangePassword: true }, accessToken: 't', isAuthenticated: true, isInitializing: false })
    mount('/finance')
    expect(await screen.findByText('page:change-password')).toBeInTheDocument()
  })
})
