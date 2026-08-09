import { expect, test } from '@playwright/test'

/*
 * Establishes the console-error pattern every later screen spec reuses. A screen that renders
 * but logs a missing asset or a React key warning is a screen with a real defect, and the old
 * mockups had no way to notice that.
 */
test('gallery loads without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'CFW UI Mockups' })).toBeVisible()
  expect(errors).toEqual([])
})
