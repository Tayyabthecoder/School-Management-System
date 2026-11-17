import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('axios', () => ({ default: { post: vi.fn(() => Promise.resolve({})) } }))
vi.mock('../lib/axios', () => ({ default: { get: vi.fn() } }))

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useSchoolName', () => {
  beforeEach(() => vi.resetModules()) // the hook keeps the name in module state, so each test starts fresh

  test('shows the neutral default first, then the configured name, and asks only once', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValue({ data: { data: { schoolName: '  Al-Noor Academy ' } } })
    const { useSchoolName, DEFAULT_SCHOOL_NAME } = await import('./useSchoolName')

    const first = renderHook(() => useSchoolName())
    expect(first.result.current).toBe(DEFAULT_SCHOOL_NAME)
    await waitFor(() => expect(first.result.current).toBe('Al-Noor Academy'))

    const second = renderHook(() => useSchoolName())
    expect(second.result.current).toBe('Al-Noor Academy') // cached, immediately
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  test('two components mounting together share one in-flight request', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValue({ data: { data: { schoolName: 'Shared' } } })
    const { useSchoolName } = await import('./useSchoolName')

    const a = renderHook(() => useSchoolName())
    const b = renderHook(() => useSchoolName())

    await waitFor(() => expect(a.result.current).toBe('Shared'))
    await waitFor(() => expect(b.result.current).toBe('Shared'))
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  test('keeps the default when the request fails', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockRejectedValue(new Error('offline'))
    const { useSchoolName, DEFAULT_SCHOOL_NAME } = await import('./useSchoolName')

    const { result } = renderHook(() => useSchoolName())
    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(result.current).toBe(DEFAULT_SCHOOL_NAME)
  })

  test('a blank configured name also falls back to the default', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValue({ data: { data: { schoolName: '   ' } } })
    const { useSchoolName, DEFAULT_SCHOOL_NAME } = await import('./useSchoolName')

    const { result } = renderHook(() => useSchoolName())
    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(result.current).toBe(DEFAULT_SCHOOL_NAME)
  })
})

describe('useAllowedDays', () => {
  beforeEach(() => vi.resetModules())

  test('returns the school days the server reports', async () => {
    const { default: api } = await import('../lib/axios')
    const info = { today: 'Monday', allowedDays: ['Monday'], isAllowedToday: true }
    api.get.mockResolvedValue({ data: { success: true, data: info } })
    const { useAllowedDays } = await import('./useAllowedDays')

    const { result } = renderHook(() => useAllowedDays(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isFetched).toBe(true))
    expect(result.current.data).toEqual(info)
  })

  test('fails open: a network error never locks people out', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockRejectedValue(new Error('offline'))
    const { useAllowedDays } = await import('./useAllowedDays')

    const { result } = renderHook(() => useAllowedDays(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isFetched).toBe(true))
    expect(result.current.data.isAllowedToday).toBe(true)
    expect(result.current.data.allowedDays).toHaveLength(5)
  })

  test('an answer with success:false is treated the same way', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValue({ data: { success: false } })
    const { useAllowedDays } = await import('./useAllowedDays')

    const { result } = renderHook(() => useAllowedDays(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isFetched).toBe(true))
    expect(result.current.data.isAllowedToday).toBe(true)
  })
})

describe('useClasses / loadClasses', () => {
  beforeEach(() => vi.resetModules())

  test('useClasses returns the class list', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValueOnce({ data: { success: true, data: [{ _id: 'c1', name: 'Grade 1' }] } })
    const { useClasses } = await import('./useClasses')

    const { result } = renderHook(() => useClasses(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ _id: 'c1', name: 'Grade 1' }])
  })

  test('useClasses can be switched off', async () => {
    const { default: api } = await import('../lib/axios')
    const { useClasses } = await import('./useClasses')

    const { result } = renderHook(() => useClasses({ enabled: false }), { wrapper: wrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(api.get).not.toHaveBeenCalled()
  })

  test('loadClasses answers in the api.get shape and reuses a fresh list', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValue({ data: { success: true, data: [{ _id: 'c1' }] } })
    const { loadClasses } = await import('./useClasses')

    const a = await loadClasses()
    const b = await loadClasses()

    expect(a).toEqual({ data: { success: true, data: [{ _id: 'c1' }] } })
    expect(b).toEqual(a)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  test('an unsuccessful answer becomes an empty list', async () => {
    const { default: api } = await import('../lib/axios')
    api.get.mockResolvedValue({ data: { success: false } })
    const { loadClasses } = await import('./useClasses')
    expect((await loadClasses()).data.data).toEqual([])
  })
})

describe('useRole', () => {
  test('reads the role from the signed-in user, whatever shape it has', async () => {
    const { useAuthStore } = await import('../store/authStore')
    const { useRole } = await import('./useRole')

    useAuthStore.setState({ user: { roleName: 'teacher' } })
    expect(renderHook(() => useRole()).result.current).toBe('teacher')

    useAuthStore.setState({ user: { role: { name: 'accountant' } } })
    expect(renderHook(() => useRole()).result.current).toBe('accountant')

    useAuthStore.setState({ user: null })
    expect(renderHook(() => useRole()).result.current).toBe('')
  })
})
