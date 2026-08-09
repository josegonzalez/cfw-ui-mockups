import { test } from '@playwright/test'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SCREEN_MANIFEST, screenId } from '../src/themes/manifest'

/**
 * Capture each ported screen and its legacy counterpart for side-by-side inspection.
 *
 * Not an assertion suite - the baseline diffing lands with the gallery phase. This exists so a
 * human (or the author) can look at the two images, because compositing faults are invisible to
 * every check that reads computed styles. Run with `npx playwright test capture`.
 */
const OUT = resolve(process.cwd(), '../tmp/claude/capture')
const REPO = resolve(process.cwd(), '..')

const LEGACY: Record<string, string> = {
  'example-cfw/rg35xx/main-menu': 'legacy/example-cfw/rg35xx/main-menu.html',
  'example-cfw/rg35xx/game-list': 'legacy/example-cfw/rg35xx/game-list.html',
}

for (const entry of SCREEN_MANIFEST) {
  const id = screenId(entry)

  test(`capture ${id}`, async ({ page }) => {
    await page.goto(`/#${id}`)
    const screen = page.locator('.screen')
    await screen.waitFor({ state: 'visible' })
    // Let fonts settle so text metrics match between runs.
    await page.waitForTimeout(300)

    await screen.screenshot({ path: resolve(OUT, `react--${id.replaceAll('/', '__')}.png`) })
  })
}

for (const [id, file] of Object.entries(LEGACY)) {
  test(`capture legacy ${id}`, async ({ page }) => {
    await page.goto(pathToFileURL(resolve(REPO, file)).href)
    const screen = page.locator('.screen')
    await screen.waitFor({ state: 'visible' })
    await page.waitForTimeout(300)

    await screen.screenshot({ path: resolve(OUT, `legacy--${id.replaceAll('/', '__')}.png`) })
  })
}
