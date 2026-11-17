import { expect } from '@playwright/test'

// The demo accounts created by backend/seed/seed.js (a local throwaway database, never real users).
export const USERS = {
  admin: { username: 'admin', password: 'Admin@1234', home: '/dashboard' },
  accountant: { username: 'accountant1', password: 'Staff@1234', home: '/dashboard' },
  hr: { username: 'hr_manager', password: 'Staff@1234', home: '/dashboard' },
  teacher: { username: 'teacher1', password: 'Staff@1234', home: '/teacher/workspace' },
  student: { username: 'stu-2026-0001', password: 'Student@1234', home: '/student-portal' },
  guardian: { username: 'e2e_guardian', password: 'Admin@1234', home: '/guardian-portal' },
}

let nextClient = 1

/**
 * The API rate-limits sign-ins per client address (10 per 15 minutes, a protection worth keeping). The
 * suite signs in dozens of times from one machine, so every browser context claims its own address
 * through X-Forwarded-For; the API trusts one proxy hop in this setup (see playwright.config.js).
 */
export async function ownClientAddress(page) {
  const n = nextClient++
  await page.context().setExtraHTTPHeaders({ 'X-Forwarded-For': `10.20.${(n >> 8) & 255}.${n & 255}` })
}

/** Google Fonts is a remote stylesheet; tests must not depend on (or wait for) the internet. */
export async function blockExternal(page) {
  await ownClientAddress(page)
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
}

export async function setTheme(page, theme) {
  await page.addInitScript((value) => { try { localStorage.setItem('sms_theme', value) } catch { /* ignore */ } }, theme)
}

/** Signs in through the real login form and waits for the role's landing page. */
export async function login(page, who) {
  const { username, password, home } = USERS[who]
  await blockExternal(page)
  await page.goto('/login')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${home.replace(/\//g, '\\/')}$`))
}

/** Collects uncaught page errors and console errors (ignoring the blocked font request). */
export function watchErrors(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (/fonts\.(googleapis|gstatic)|net::ERR_FAILED|Failed to load resource/.test(text)) return
    errors.push(`console: ${text}`)
  })
  return errors
}
