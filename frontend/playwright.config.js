// End-to-end smoke suite: the real built frontend talking to the real API and a real MongoDB that is
// reset and seeded before every run. Needs MongoDB reachable at E2E_MONGO_URI (default
// mongodb://127.0.0.1:27017) and a Chrome or Edge install (no browser download: `channel` uses the
// system browser; CI's ubuntu image ships Chrome).
//
//   npm run build && npm run test:e2e
import { defineConfig, devices } from '@playwright/test'

const API_PORT = Number(process.env.E2E_API_PORT || 5100)
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 4173)
const MONGO = process.env.E2E_MONGO_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = 'sms_e2e'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1, // one shared database: tests that write (payments) must not interleave
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './e2e/global-setup.js',
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: process.env.E2E_BROWSER || 'chrome' } },
  ],
  webServer: [
    {
      command: 'node src/server.js',
      cwd: '../backend',
      url: `http://127.0.0.1:${API_PORT}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'development',
        PORT: String(API_PORT),
        MONGODB_URI: `${MONGO}/${DB_NAME}`,
        MONGODB_DB_NAME: DB_NAME,
        JWT_SECRET: 'e2e_access_secret_0123456789_0123456789_abcdef',
        JWT_REFRESH_SECRET: 'e2e_refresh_secret_0123456789_0123456789_abcde',
        CORS_ORIGIN: `http://127.0.0.1:${WEB_PORT}`,
        TRUST_PROXY_HOPS: '1', // the suite stands in for the proxy: each test sends its own X-Forwarded-For
      },
    },
    {
      command: `npx vite preview --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
    },
  ],
})
