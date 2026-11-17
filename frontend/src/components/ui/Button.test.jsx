import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import Button from './Button'

describe('Button', () => {
  test('is a type="button" by default so it never submits a form by accident', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  test('can be a submit button', () => {
    render(<Button type="submit">Go</Button>)
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'submit')
  })

  test('calls onClick, and forwards extra props such as aria-label and title', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} aria-label="Close" title="Close it">x</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByTitle('Close it')).toBeInTheDocument()
  })

  test('disabled and loading both block clicks; loading shows a spinner instead of the icon', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick} disabled>Off</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    await userEvent.click(screen.getByRole('button'), { pointerEventsCheck: 0 })
    expect(onClick).not.toHaveBeenCalled()

    rerender(<Button onClick={onClick} loading icon={Plus}>Saving</Button>)
    const busy = screen.getByRole('button')
    expect(busy).toBeDisabled()
    expect(busy.querySelectorAll('svg')).toHaveLength(1) // the spinner replaces the icon
    expect(busy.querySelector('.animate-spin')).not.toBeNull()
  })

  test('renders a component icon, an element icon and a right icon', () => {
    render(
      <>
        <Button icon={Plus}>component</Button>
        <Button icon={<span data-testid="el-icon" />}>element</Button>
        <Button iconRight={Plus}>right</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'component' }).querySelector('svg')).not.toBeNull()
    expect(screen.getByTestId('el-icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'right' }).querySelector('svg')).not.toBeNull()
  })

  test('falls back to the primary variant and md size for unknown names', () => {
    render(<Button variant="nonsense" size="huge">Fallback</Button>)
    const cls = screen.getByRole('button').className
    expect(cls).toContain('bg-indigo-600')
    expect(cls).toContain('h-10')
  })

  test('applies the danger variant and extra class names', () => {
    render(<Button variant="danger" className="extra-class">Delete</Button>)
    const cls = screen.getByRole('button').className
    expect(cls).toContain('bg-rose-600')
    expect(cls).toContain('extra-class')
  })

  test('forwards a ref to the button element', () => {
    const ref = React.createRef()
    render(<Button ref={ref}>Ref</Button>)
    expect(ref.current).toBe(screen.getByRole('button'))
  })
})
