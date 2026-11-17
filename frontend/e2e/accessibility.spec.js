import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login, setTheme } from './helpers'

// The scan that found the contrast, label and heading problems by hand, now permanent: every main
// screen, in light and dark mode, must have zero WCAG 2.x A/AA violations.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const summarize = (violations) =>
  violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`)

async function scan(page, label) {
  // (not 'networkidle': the live dashboard keeps an event stream open for as long as the page is)
  await expect(page.getByRole('main')).toBeVisible()
  await page.waitForTimeout(700) // let data-driven content render before measuring
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(summarize(results.violations), label).toEqual([])
}

for (const theme of ['light', 'dark']) {
  test.describe(`axe, ${theme} mode`, () => {
    test.beforeEach(async ({ page }) => { await setTheme(page, theme) })

    test('login page', async ({ page }) => {
      await page.goto('/login')
      await scan(page, 'login')
    })

    test('admin screens', async ({ page }) => {
      test.setTimeout(180_000)
      await login(page, 'admin')
      for (const path of ['/dashboard', '/students', '/academics', '/academics/timetable', '/attendance', '/grades', '/grades/report-cards', '/students/promotion', '/finance', '/teachers', '/hr', '/reports', '/settings']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
        await scan(page, path)
      }
    })

    test('settings and reports tabs', async ({ page }) => {
      test.setTimeout(120_000)
      await login(page, 'admin')
      await page.goto('/settings')
      for (const tab of ['Academic Sessions', 'Grading Scale', 'Fee Challan Settings', 'User & RBAC Management', 'Security & System']) {
        await page.getByRole('button', { name: tab }).click()
        await scan(page, `settings / ${tab}`)
      }
      await page.goto('/reports')
      for (const tab of [/Analytics|Intelligence/i, /Export/i, /Custom|Builder/i]) {
        await page.getByRole('button', { name: tab }).first().click()
        await scan(page, `reports / ${tab}`)
      }
    })

    test('teacher workspace, student portal and guardian portal', async ({ page, browser }) => {
      await login(page, 'teacher')
      await scan(page, 'teacher workspace')

      for (const who of ['student', 'guardian']) {
        const context = await browser.newContext({ colorScheme: theme })
        const other = await context.newPage()
        await setTheme(other, theme)
        await login(other, who)
        await scan(other, who)
        await context.close()
      }
    })

    test('a dialog: record payment', async ({ page }) => {
      await login(page, 'accountant')
      await page.goto('/finance')
      await page.getByRole('heading', { name: 'Grade 1' }).first().click()
      await page.getByText('Section A').first().click()
      await page.getByRole('button', { name: 'Record Payment' }).first().click() // the first fee that still has a balance
      await expect(page.getByRole('dialog')).toBeVisible()
      const results = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(TAGS).analyze()
      expect(summarize(results.violations)).toEqual([])
    })
  })
}
