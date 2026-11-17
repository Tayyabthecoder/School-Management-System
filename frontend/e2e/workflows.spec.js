import { test, expect } from '@playwright/test'
import { login, watchErrors } from './helpers'

test.describe('finance: from grade to a recorded payment', () => {
  test('drill down to a section, record a part payment and see the ledger change', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page, 'accountant')
    await page.goto('/finance')

    await page.getByRole('heading', { name: 'Grade 1' }).first().click()
    await page.getByText('Section A').first().click()

    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible()
    const firstRow = rows.first()
    const before = await firstRow.innerText()

    await firstRow.getByRole('button', { name: 'Record Payment' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="number"]').fill('100')
    await dialog.getByRole('button', { name: /Record Payment/ }).click()

    await expect(page.getByText(/Payment recorded successfully/).first()).toBeVisible()
    await expect(dialog).toHaveCount(0)
    await expect(firstRow).not.toHaveText(before) // the paid and outstanding columns moved
    await expect(firstRow).toContainText('PKR 100')
    expect(errors).toEqual([])
  })

  test('searching finds a student across grades', async ({ page }) => {
    await login(page, 'accountant')
    await page.goto('/finance')
    await page.getByPlaceholder(/search/i).first().fill('STU-2026-0001') // IDs are fixed by the seed; names are not
    await expect(page.getByText('Search Results')).toBeVisible()
    await expect(page.locator('table tbody tr').first()).toContainText('STU-2026-0001')
  })
})

test.describe('students and academics', () => {
  test('the student directory opens a profile and its tabs', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page, 'admin')
    await page.goto('/students')

    await page.getByRole('button', { name: 'Directory Table' }).click()
    await page.locator('table tbody tr a, table tbody tr button').first().click()
    await expect(page).toHaveURL(/\/students\/[0-9a-f]{24}$/)

    for (const tab of ['Enrolled Subjects', 'Academic Grades', 'Attendance Records', 'Fee Ledger', 'Documents']) {
      await page.getByRole('button', { name: new RegExp(tab) }).click()
      await expect(page.getByRole('main')).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test('classes drill down to a section and show its subjects and timetable', async ({ page }) => {
    await login(page, 'admin')
    await page.goto('/academics')
    await page.getByRole('heading', { name: 'Grade 1' }).first().click()
    await page.getByText('Section A').first().click()
    await expect(page.getByRole('button', { name: /Back to Sections/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Add Subject/ })).toBeVisible()
  })
})

test.describe('settings tabs', () => {
  test('all six settings tabs render, including the challan builder with its live preview', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page, 'admin')
    await page.goto('/settings')

    for (const tab of ['School Profile', 'Academic Sessions', 'Grading Scale', 'Fee Challan Settings', 'User & RBAC Management', 'Security & System']) {
      await page.getByRole('button', { name: tab }).click()
      await expect(page.getByRole('main')).toContainText(/\w+/)
    }
    await page.getByRole('button', { name: 'Fee Challan Settings' }).click()
    await expect(page.getByText(/Live Real-Time Voucher Preview/)).toBeVisible()
    expect(errors).toEqual([])
  })
})

test.describe('dark mode', () => {
  test('the toggle switches the theme and the choice survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' }) // no stored choice yet: the OS preference decides
    await login(page, 'admin')
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    await page.getByTitle('Switch to Dark Mode').click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByTitle('Switch to Light Mode')).toBeVisible()
  })
})

test.describe('student portal', () => {
  test('shows the student\'s own attendance, grades and challans', async ({ page }) => {
    const errors = watchErrors(page)
    await login(page, 'student')
    for (const tab of ['Class Schedule', 'My Attendance', 'Grades & Exams', 'Fee Challans']) {
      await page.getByRole('button', { name: tab }).click()
      await expect(page.getByRole('main')).toBeVisible()
    }
    expect(errors).toEqual([])
  })
})

test.describe('charts', () => {
  test('the dashboard and analytics charts are actually drawn (not collapsed to nothing)', async ({ page }) => {
    await login(page, 'admin')
    await expect(page.getByRole('img', { name: /Bar chart: enrolled students by grade/ })).toBeVisible()
    for (const chart of await page.getByRole('img', { name: /chart/i }).all()) {
      const box = await chart.boundingBox()
      expect(box.height, await chart.getAttribute('aria-label')).toBeGreaterThan(80)
      expect(box.width).toBeGreaterThan(150)
    }

    await page.goto('/reports')
    await page.getByRole('button', { name: /Analytics|Intelligence/i }).first().click()
    const charts = page.getByRole('img', { name: /chart/i })
    await expect(charts.first()).toBeVisible()
    for (const chart of await charts.all()) {
      const box = await chart.boundingBox()
      expect(box.height, await chart.getAttribute('aria-label')).toBeGreaterThan(80)
    }
  })
})
