import React from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt, Route } from '../../test/render'

vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))
vi.mock('../../lib/axios', () => ({ default: { get: vi.fn() } }))

const { default: api } = await import('../../lib/axios')
const { default: AppShell } = await import('./AppShell')
const { default: Sidebar } = await import('./Sidebar')
const { default: Header } = await import('./Header')
const { useAuthStore } = await import('../../store/authStore')
const { useUIStore } = await import('../../store/uiStore')

const signIn = (roleName, username = 'tester') =>
  useAuthStore.setState({ user: { username, roleName }, accessToken: 't', isAuthenticated: true, isInitializing: false })

const shell = (
  <Route element={<AppShell />}>
    <Route path="/dashboard" element={<h1>Dashboard page</h1>} />
    <Route path="/students" element={<h1>Students page</h1>} />
    <Route path="/finance" element={<h1>Finance page</h1>} />
    <Route path="/attendance" element={<h1>Attendance page</h1>} />
    <Route path="/grades" element={<h1>Grades page</h1>} />
    <Route path="/settings" element={<h1>Settings page</h1>} />
  </Route>
)
const where = () => screen.getByTestId('where').textContent

beforeEach(() => {
  api.get.mockReset()
  api.get.mockResolvedValue({ data: { success: true, data: { schoolName: 'Al-Noor Academy' } } })
  useUIStore.setState({ isSidebarOpen: true, isCommandPaletteOpen: false, isShortcutsModalOpen: false })
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

describe('Sidebar: what each role sees', () => {
  const links = () => within(screen.getByRole('navigation', { name: 'Main navigation' })).getAllByRole('link').map((a) => a.textContent)

  test('a super admin sees every area', async () => {
    signIn('super_admin')
    renderAt('/dashboard', <Route path="/dashboard" element={<Sidebar />} />)
    const all = links()
    for (const label of ['Dashboard', 'Students Directory', 'Fees & Bank Challans', 'HR & Monthly Payroll', 'System Settings & RBAC', 'Annual Promotion']) {
      expect(all).toContain(label)
    }
    await screen.findByText('Al-Noor Academy') // school name arrives from the settings API
  })

  test('a teacher sees the workspace and teaching tools but not finance, HR, settings or promotion', () => {
    signIn('teacher')
    renderAt('/dashboard', <Route path="/dashboard" element={<Sidebar />} />)
    const all = links()
    expect(all).toContain('Faculty Workspace')
    expect(all).toContain('Grades & Exams')
    for (const hidden of ['Fees & Bank Challans', 'HR & Monthly Payroll', 'System Settings & RBAC', 'Annual Promotion', 'Dashboard']) {
      expect(all).not.toContain(hidden)
    }
  })

  test('an accountant sees finance and reports but not grades or settings', () => {
    signIn('accountant')
    renderAt('/dashboard', <Route path="/dashboard" element={<Sidebar />} />)
    const all = links()
    expect(all).toContain('Fees & Bank Challans')
    expect(all).toContain('Reports & Export Engine')
    expect(all).not.toContain('Grades & Exams')
    expect(all).not.toContain('System Settings & RBAC')
  })

  test('the signed-in name and role are shown, and the collapsed rail keeps labels as tooltips', () => {
    signIn('hr_manager', 'sana')
    useUIStore.setState({ isSidebarOpen: false })
    renderAt('/dashboard', <Route path="/dashboard" element={<Sidebar />} />)

    expect(screen.queryByText('hr manager')).not.toBeInTheDocument() // collapsed: no text, only the initial
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(document.querySelector('a[title="HR & Monthly Payroll"]')).not.toBeNull()
  })

  test('the active page is highlighted', () => {
    signIn('super_admin')
    renderAt('/students', <Route path="/students" element={<Sidebar />} />)
    const active = screen.getByRole('link', { name: 'Students Directory' })
    expect(active).toHaveAttribute('aria-current', 'page')
  })
})

describe('Header', () => {
  const header = () => renderAt('/dashboard', <Route path="/dashboard" element={<Header />} />)

  test('the sidebar button toggles the sidebar', async () => {
    signIn('super_admin')
    header()
    await userEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar Navigation' }))
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })

  test('the theme button flips between light and dark and relabels itself', async () => {
    signIn('super_admin')
    useUIStore.getState().setTheme('light')
    header()

    await userEvent.click(screen.getByTitle('Switch to Dark Mode'))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByTitle('Switch to Light Mode')).toBeInTheDocument()
  })

  test('search and shortcuts buttons open their dialogs', async () => {
    signIn('super_admin')
    header()
    await userEvent.click(screen.getByRole('button', { name: /Search students, pages, actions/ }))
    expect(useUIStore.getState().isCommandPaletteOpen).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Keyboard Shortcuts (?)' }))
    expect(useUIStore.getState().isShortcutsModalOpen).toBe(true)
  })

  test('Sign Out signs the user out', async () => {
    signIn('teacher', 'omar')
    header()
    expect(screen.getByText('teacher')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('AppShell: skip link, landmarks and keyboard shortcuts', () => {
  test('has a skip link to the focusable main landmark', () => {
    signIn('super_admin')
    renderAt('/dashboard', shell)
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('heading', { name: 'Dashboard page' })).toBeInTheDocument()
  })

  test('Ctrl+K toggles the command palette', async () => {
    signIn('super_admin')
    renderAt('/dashboard', shell)
    await userEvent.keyboard('{Control>}k{/Control}')
    expect(await screen.findByLabelText('Type a command, page, or student name...')).toBeInTheDocument()
  })

  test('? opens the shortcuts reference', async () => {
    signIn('super_admin')
    renderAt('/dashboard', shell)
    await userEvent.keyboard('?')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Open Command Palette & Global Search')).toBeInTheDocument()
  })

  test.each([
    ['d', '/dashboard'],
    ['s', '/students'],
    ['a', '/attendance'],
    ['f', '/finance'],
    ['g', '/grades'],
    ['p', '/settings'],
  ])('the chord G then %s goes to %s', async (second, path) => {
    signIn('super_admin')
    renderAt('/students' === path ? '/finance' : '/students', shell)
    await userEvent.keyboard(`g${second}`)
    await waitFor(() => expect(where()).toBe(path))
  })

  test('single-key shortcuts are ignored while typing in a field', async () => {
    signIn('super_admin')
    renderAt('/dashboard', (
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<input aria-label="notes" />} />
        <Route path="/students" element={<h1>Students page</h1>} />
      </Route>
    ))
    await userEvent.click(screen.getByLabelText('notes'))
    await userEvent.keyboard('gs?')

    expect(where()).toBe('/dashboard')
    expect(screen.getByLabelText('notes')).toHaveValue('gs?')
    expect(useUIStore.getState().isShortcutsModalOpen).toBe(false)
  })

  test('the chord expires if the second key takes too long', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      signIn('super_admin')
      renderAt('/dashboard', shell)
      await userEvent.keyboard('g')
      act(() => { vi.advanceTimersByTime(1500) })
      await userEvent.keyboard('s')
      expect(where()).toBe('/dashboard')
    } finally {
      vi.useRealTimers()
    }
  })

  test('on a small screen, tapping the dim backdrop closes the open sidebar', async () => {
    signIn('super_admin')
    renderAt('/dashboard', shell)
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0')
    await userEvent.click(backdrop)
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })
})

describe('Command palette', () => {
  const openPalette = async (roleName) => {
    signIn(roleName)
    renderAt('/dashboard', shell)
    act(() => useUIStore.getState().openCommandPalette())
    return screen.findByLabelText('Type a command, page, or student name...')
  }

  test('lists only the commands the role may use', async () => {
    await openPalette('teacher')
    expect(screen.getByText('Record Class Attendance')).toBeInTheDocument()
    expect(screen.queryByText('Register New Student (5-Step Wizard)')).not.toBeInTheDocument()
    expect(screen.queryByText('Finance Ledger & Bank Challans')).not.toBeInTheDocument()
  })

  test('typing filters, and Enter runs the highlighted command and closes the palette', async () => {
    const input = await openPalette('super_admin')
    await userEvent.type(input, 'finance ledger')
    expect(screen.queryByText('Weekly Timetable Schedule')).not.toBeInTheDocument()

    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(where()).toBe('/finance'))
    expect(useUIStore.getState().isCommandPaletteOpen).toBe(false)
  })

  test('arrow keys move the highlight and wrap around', async () => {
    const input = await openPalette('super_admin')
    await userEvent.type(input, 'dashboard')
    const first = screen.getByText('Dashboard & Analytics').closest('button')
    expect(first.className).toContain('bg-indigo-600')

    await userEvent.keyboard('{ArrowUp}') // wraps to the last match (only one) -> still selected
    expect(first.className).toContain('bg-indigo-600')
    await userEvent.keyboard('{ArrowDown}')
    expect(first.className).toContain('bg-indigo-600')
  })

  test('Escape and the backdrop close it', async () => {
    await openPalette('super_admin')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(useUIStore.getState().isCommandPaletteOpen).toBe(false))

    act(() => useUIStore.getState().openCommandPalette())
    await screen.findByLabelText('Type a command, page, or student name...')
    await userEvent.click(document.querySelector('.fixed.inset-0.bg-slate-950\\/60'))
    expect(useUIStore.getState().isCommandPaletteOpen).toBe(false)
  })

  test('says so when nothing matches', async () => {
    const input = await openPalette('super_admin')
    await userEvent.type(input, 'zzzzzz')
    expect(screen.getByText(/No matching commands or students found for "zzzzzz"/)).toBeInTheDocument()
  })

  test('searches students after a pause and opens the chosen profile', async () => {
    api.get.mockImplementation((url) =>
      url === '/students'
        ? Promise.resolve({ data: { success: true, data: [{ _id: 's1', fullName: 'Hassan Farooq', studentId: 'STU-2026-0049', classId: { name: '1' }, section: 'A' }] } })
        : Promise.resolve({ data: { success: true, data: { schoolName: 'X' } } }))
    const input = await openPalette('super_admin')

    await userEvent.type(input, 'hassan')
    const hit = await screen.findByText('Hassan Farooq (STU-2026-0049)')
    expect(screen.getByText('Grade 1 · Section A')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/students', { params: { search: 'hassan', limit: 5 } })

    await userEvent.click(hit)
    await waitFor(() => expect(where()).toBe('/students/s1'))
  })

  test('a failed student search is swallowed and the static commands still work', async () => {
    api.get.mockImplementation((url) => (url === '/students' ? Promise.reject(new Error('500')) : Promise.resolve({ data: { data: {} } })))
    const input = await openPalette('super_admin')
    await userEvent.type(input, 'settings')
    expect(await screen.findByText('System Administration & Settings')).toBeInTheDocument()
  })
})

afterEach(() => vi.useRealTimers())
