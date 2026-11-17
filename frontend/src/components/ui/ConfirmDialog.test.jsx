import React from 'react'
import { describe, test, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from './ConfirmDialog'
import { confirmAction, useConfirmStore } from '../../store/confirmStore'

const ask = (options) => {
  let promise
  act(() => { promise = confirmAction(options) })
  return promise
}

describe('confirmAction + ConfirmDialog', () => {
  test('nothing is shown until someone asks', () => {
    render(<ConfirmDialog />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('shows the question and resolves true when confirmed', async () => {
    render(<ConfirmDialog />)
    const answer = ask({ title: 'Delete class?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true })

    expect(screen.getByRole('dialog', { name: 'Delete class?' })).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await expect(answer).resolves.toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('resolves false on Cancel, on Escape and on the close button', async () => {
    render(<ConfirmDialog />)

    let answer = ask({ message: 'one' })
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await expect(answer).resolves.toBe(false)

    answer = ask({ message: 'two' })
    await userEvent.keyboard('{Escape}')
    await expect(answer).resolves.toBe(false)

    answer = ask({ message: 'three' })
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    await expect(answer).resolves.toBe(false)
  })

  test('uses sensible defaults for the title and button labels', () => {
    render(<ConfirmDialog />)
    ask({ message: 'Proceed?' })
    expect(screen.getByRole('dialog', { name: 'Please confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('a newer question cancels an unanswered older one', async () => {
    render(<ConfirmDialog />)
    const first = ask({ message: 'first' })
    const second = ask({ message: 'second' })

    await expect(first).resolves.toBe(false)
    expect(screen.getByText('second')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    await expect(second).resolves.toBe(true)
    expect(useConfirmStore.getState().request).toBeNull()
  })
})
