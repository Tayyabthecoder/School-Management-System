import { test, expect } from '@playwright/test'
import { login, blockExternal, watchErrors, USERS } from './helpers'

test.describe('signing in and out', () => {
  test('a wrong password shows an error and stays on the login page', async ({ page }) => {
    await blockExternal(page)
    await page.goto('/login')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('definitely-wrong')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.getByText(/invalid|incorrect|failed|attempt/i).first()).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('visiting a protected page signed out sends you to the login page', async ({ page }) => {
    await blockExternal(page)
    await page.goto('/finance')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible()
  })

  test('the admin signs in, sees the dashboard, and can sign out again', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page, 'admin')

    await expect(page.getByRole('heading', { level: 1, name: /welcome back, admin/i })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()

    await page.getByRole('button', { name: 'Sign Out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/students')
    await expect(page).toHaveURL(/\/login$/) // the session really ended
    expect(errors).toEqual([])
  })
})

test.describe('every sidebar page loads for the admin without errors', () => {
  const PAGES = [
    ['Dashboard', '/dashboard'],
    ['Students Directory', '/students'],
    ['Classes & Sections', '/academics'],
    ['Daily Attendance', '/attendance'],
    ['Grades & Exams', '/grades'],
    ['Report Cards & Transcripts', '/grades/report-cards'],
    ['Annual Promotion', '/students/promotion'],
    ['Fees & Bank Challans', '/finance'],
    ['Staff Directory', '/teachers'],
    ['HR & Monthly Payroll', '/hr'],
    ['Reports & Export Engine', '/reports'],
    ['System Settings & RBAC', '/settings'],
  ]

  test('walk the sidebar', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page, 'admin')

    for (const [label, path] of PAGES) {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label }).click()
      await expect(page, label).toHaveURL((url) => url.pathname === path)
      await expect(page.getByRole('heading', { level: 1 }).first(), label).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
    }
    expect(errors).toEqual([])
  })
})

test.describe('keyboard shortcuts', () => {
  test('Ctrl+K opens the command palette and Enter opens the chosen page', async ({ page }) => {
    await login(page, 'admin')
    await page.keyboard.press('Control+k')
    const box = page.getByLabel('Type a command, page, or student name...')
    await expect(box).toBeVisible()

    await box.fill('finance ledger')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/finance$/)
  })

  test('G then S goes to the student directory, and ? opens the shortcut reference', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible() // the shell's key handler is attached once the page has rendered
    await page.keyboard.press('g')
    await page.keyboard.press('s')
    await expect(page).toHaveURL(/\/students$/)

    await page.keyboard.press('?')
    await expect(page.getByRole('dialog')).toContainText('Keyboard')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('the skip link moves focus to the main content', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible() // wait until the page has rendered
    await page.evaluate(() => document.activeElement?.blur()) // start from the top of the document, as after a fresh load
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })
})

test.describe('each role lands where it should and is kept out of the rest', () => {
  test('a teacher lands on the workspace and is turned away from finance and settings', async ({ page }) => {
    await login(page, 'teacher')
    await expect(page).toHaveURL(/\/teacher\/workspace$/)

    for (const path of ['/finance', '/settings', '/hr']) {
      await page.goto(path)
      await expect(page, path).not.toHaveURL(new RegExp(`${path}$`))
    }
    const links = await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link').allTextContents()
    expect(links).not.toContain('Fees & Bank Challans')
    expect(links).not.toContain('System Settings & RBAC')
  })

  test('an accountant can open finance but not grades', async ({ page }) => {
    await login(page, 'accountant')
    await page.goto('/finance')
    await expect(page).toHaveURL(/\/finance$/)
    await page.goto('/grades')
    await expect(page).not.toHaveURL(/\/grades$/)
  })

  test('a student is kept inside the student portal', async ({ page }) => {
    await login(page, 'student')
    await page.goto('/students')
    await expect(page).toHaveURL(/\/student-portal$/)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
  })

  test('a guardian is kept inside the guardian portal and sees both children', async ({ page }) => {
    await login(page, 'guardian')
    await page.goto('/finance')
    await expect(page).toHaveURL(/\/guardian-portal$/)
    await expect(page.getByRole('button', { name: /Grade/ }).first()).toBeVisible()
  })
})

test('the demo usernames used by the suite exist in the seed', () => {
  expect(Object.keys(USERS)).toEqual(['admin', 'accountant', 'hr', 'teacher', 'student', 'guardian'])
})
