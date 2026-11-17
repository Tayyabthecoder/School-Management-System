// The older logic tests in tests/*.test.js were written for node:test. Vitest runs them unchanged by
// resolving `node:test` to this file, so one runner (and one coverage report) covers every test.
export { test, it, describe, beforeEach, afterEach, beforeAll as before, afterAll as after } from 'vitest'
