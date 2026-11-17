import React from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToastContainer from './ToastContainer'
import { useToastStore, useToast } from '../../store/toastStore'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  useToastStore.setState({ toasts: [] })
})
afterEach(() => vi.useRealTimers())

describe('ToastContainer', () => {
  test('is a polite live region, empty at first', () => {
    render(<ToastContainer />)
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
  })

  test('shows each kind of toast and removes it after its duration', () => {
    render(<ToastContainer />)
    const toast = useToast()

    act(() => {
      toast.success('Saved')
      toast.error('Failed')
      toast.warning('Careful')
      toast.info('FYI')
    })
    for (const text of ['Saved', 'Failed', 'Careful', 'FYI']) expect(screen.getByText(text)).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(3600) })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  test('a toast can be dismissed by hand through a labelled button', async () => {
    render(<ToastContainer />)
    act(() => { useToast().info('Dismiss me') })

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
  })

  test('useToast returns the same stable object every time (safe as a hook dependency)', () => {
    expect(useToast()).toBe(useToast())
  })

  test('addToast honours a custom duration', () => {
    render(<ToastContainer />)
    act(() => { useToastStore.getState().addToast('Quick', 'info', 500) })
    expect(screen.getByText('Quick')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(600) })
    expect(screen.queryByText('Quick')).not.toBeInTheDocument()
  })
})
