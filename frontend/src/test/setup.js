import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount rendered trees and clear storage between tests so one test cannot leak a session into the next.
afterEach(() => {
  cleanup()
  try { localStorage.clear() } catch { /* storage unavailable */ }
})
