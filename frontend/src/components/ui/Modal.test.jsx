import React, { useState } from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal'

describe('Modal', () => {
  test('renders nothing while closed', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Hidden">body</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('is an accessible modal dialog named by its title (open or isOpen)', () => {
    render(<Modal open onClose={() => {}} title="Add student">body text</Modal>)
    const dialog = screen.getByRole('dialog', { name: 'Add student' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('body text')
  })

  test('renders into document.body (a portal), not inside the parent', () => {
    const { container } = render(<Modal open onClose={() => {}} title="T">x</Modal>)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  test('Escape closes it, the close button closes it, a backdrop click closes it', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="T">x</Modal>)

    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }))
    await userEvent.click(document.querySelector('.bg-slate-900\\/60'))

    expect(onClose).toHaveBeenCalledTimes(3)
  })

  test('closeOnEscape and closeOnBackdrop can be switched off', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="T" closeOnEscape={false} closeOnBackdrop={false}>x</Modal>)

    await userEvent.keyboard('{Escape}')
    await userEvent.click(document.querySelector('.bg-slate-900\\/60'))

    expect(onClose).not.toHaveBeenCalled()
  })

  test('only the top-most of two stacked modals reacts to Escape', async () => {
    const outer = vi.fn()
    const inner = vi.fn()
    render(
      <>
        <Modal open onClose={outer} title="Outer">o</Modal>
        <Modal open onClose={inner} title="Inner">i</Modal>
      </>,
    )

    await userEvent.keyboard('{Escape}')

    expect(inner).toHaveBeenCalledTimes(1)
    expect(outer).not.toHaveBeenCalled()
  })

  test('two stacked modals closing in either order leave the page scrollable again', () => {
    for (const order of ['outer-first', 'inner-first']) {
      document.body.style.overflow = ''
      const a = render(<Modal open onClose={() => {}} title="Outer">o</Modal>)
      const b = render(<Modal open onClose={() => {}} title="Inner">i</Modal>)
      expect(document.body.style.overflow).toBe('hidden')

      const [first, second] = order === 'outer-first' ? [a, b] : [b, a]
      first.unmount()
      expect(document.body.style.overflow).toBe('hidden') // one modal is still open
      second.unmount()
      expect(document.body.style.overflow, order).toBe('')
    }
  })

  test('moves focus into the dialog and locks page scroll, then restores both on close', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>opener</button>
          <Modal open={open} onClose={() => setOpen(false)} title="T">
            <input aria-label="first field" />
          </Modal>
        </>
      )
    }
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'opener' })
    opener.focus()

    await userEvent.click(opener)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close modal' })).toHaveFocus())
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.body.style.overflow).not.toBe('hidden')
    expect(opener).toHaveFocus()
  })

  test('Tab wraps from the last control to the first and Shift+Tab the other way', async () => {
    render(
      <Modal open onClose={() => {}} title="T" footer={<button>Save</button>}>
        <input aria-label="name" />
      </Modal>,
    )
    const close = screen.getByRole('button', { name: 'Close modal' })
    const save = screen.getByRole('button', { name: 'Save' })
    await waitFor(() => expect(close).toHaveFocus()) // the dialog moves focus in after a short delay

    save.focus()
    await userEvent.tab()
    expect(close).toHaveFocus()

    await userEvent.tab({ shift: true })
    expect(save).toHaveFocus()
  })

  test('shows the subtitle and footer, and can hide the close button', () => {
    render(<Modal open onClose={() => {}} title="T" subtitle="Step 1 of 3" footer={<button>Next</button>} showCloseButton={false}>x</Modal>)
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close modal' })).not.toBeInTheDocument()
  })
})
