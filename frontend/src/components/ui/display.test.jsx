import React from 'react'
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Users } from 'lucide-react'
import Badge from './Badge'
import StatCard from './StatCard'
import ChartFrame from './ChartFrame'
import PageLoader from './PageLoader'
import ErrorBoundary from './ErrorBoundary'
import Breadcrumb from '../layout/Breadcrumb'

describe('Badge', () => {
  test('renders its text and falls back to the default style for an unknown variant', () => {
    render(<><Badge variant="success">Paid</Badge><Badge variant="mystery">Odd</Badge></>)
    expect(screen.getByText('Paid').className).toContain('text-green-700')
    expect(screen.getByText('Odd').className).toContain('bg-gray-100')
  })
})

describe('StatCard', () => {
  test('shows the title and value, and a trend only when given one', () => {
    const { rerender } = render(<StatCard title="Students" value="1,204" />)
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('1,204')).toBeInTheDocument()
    expect(screen.queryByText('+4%')).not.toBeInTheDocument()

    rerender(<StatCard title="Students" value="1,204" trend="+4%" />)
    expect(screen.getByText('+4%')).toBeInTheDocument()
  })

  test('the value is a paragraph, not a heading (it must not break the page heading order)', () => {
    render(<StatCard title="Fees" value="PKR 5" />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  test('a negative trend uses the rose style', () => {
    render(<StatCard title="Fees" value="1" trend="-2%" isPositive={false} />)
    expect(screen.getByText('-2%').className).toContain('text-rose-700')
  })

  test('draws a sparkline only when there are at least two numeric points', () => {
    const { container, rerender } = render(<StatCard title="A" value="1" sparklineData={[1]} />)
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeNull()

    rerender(<StatCard title="A" value="1" sparklineData={[1, 'x', null, 5, 3]} />)
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull()

    rerender(<StatCard title="A" value="1" icon={Users} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  test('a flat series does not divide by zero', () => {
    const { container } = render(<StatCard title="A" value="1" sparklineData={[4, 4, 4]} />)
    expect(container.querySelector('path').getAttribute('d')).not.toContain('NaN')
  })
})

describe('ChartFrame', () => {
  test('exposes a chart as one image with a text alternative', () => {
    render(<ChartFrame label="Bar chart: students by grade"><svg /></ChartFrame>)
    expect(screen.getByRole('img', { name: 'Bar chart: students by grade' })).toBeInTheDocument()
  })
})

describe('PageLoader', () => {
  test('renders a skeleton without crashing', () => {
    const { container } = render(<PageLoader />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })
})

describe('ErrorBoundary', () => {
  const Boom = () => { throw new Error('render exploded') }

  test('passes children through when nothing fails', () => {
    render(<ErrorBoundary><p>fine</p></ErrorBoundary>)
    expect(screen.getByText('fine')).toBeInTheDocument()
  })

  test('shows the error message and recovery buttons when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)

    expect(screen.getByText('Something went wrong loading this view')).toBeInTheDocument()
    expect(screen.getByText('render exploded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument()
  })

  test('Reload Page asks the browser to reload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    const original = window.location
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } })
    try {
      render(<ErrorBoundary><Boom /></ErrorBoundary>)
      await userEvent.click(screen.getByRole('button', { name: 'Reload Page' }))
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: original })
    }
  })
})

describe('Breadcrumb', () => {
  const at = (path, props) => render(<MemoryRouter initialEntries={[path]}><Breadcrumb {...props} /></MemoryRouter>)

  test('shows the page title as the one h1, plus the optional subtitle', () => {
    at('/finance', { title: 'Finance', subtitle: 'Fees and challans' })
    expect(screen.getByRole('heading', { level: 1, name: 'Finance' })).toBeInTheDocument()
    expect(screen.getByText('Fees and challans')).toBeInTheDocument()
  })

  test('builds a labelled trail: earlier segments link, the last one is plain text', () => {
    at('/academics/timetable', { title: 'Timetable' })
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'academics' })).toHaveAttribute('href', '/academics')
    expect(screen.getByText('timetable')).not.toHaveAttribute('href')
  })

  test('turns hyphens into spaces', () => {
    at('/grades/report-cards', { title: 'Report Cards' })
    expect(screen.getByText('report cards')).toBeInTheDocument()
  })
})
