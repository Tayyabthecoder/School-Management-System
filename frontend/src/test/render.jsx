import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const Where = () => <div data-testid="where">{useLocation().pathname}</div>

/**
 * Renders `routes` (a <Route> tree) at `path` inside a memory router and a fresh query client, plus a
 * hidden element that reports the current pathname so tests can assert where a guard redirected to.
 */
export function renderAt(path, routes) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>{routes}</Routes>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

export { Route }
