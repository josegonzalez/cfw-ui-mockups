import { test } from '@playwright/test'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Generate the preview art the landing page uses.
 *
 * Captured from the mockups themselves rather than drawn by hand, so a preview cannot flatter
 * a screen that no longer looks like that. Regenerate with
 * `npx playwright test e2e/previews.spec.ts`.
 *
 * Not part of the normal suite: it writes into `src/assets/previews/`, and the results are
 * committed. It only needs rerunning when a theme's look changes.
 */
const REPO = resolve(process.cwd(), '..')
const OUT = resolve(process.cwd(), 'src/assets/previews')

/**
 * One representative screen per theme - the one that reads most distinctly at thumbnail size.
 *
 * A ported theme is captured from its own route, so the card shows what the app actually
 * renders. The rest are captured from the archived original until their port lands.
 */
const PREVIEWS: Array<{ slug: string; route?: string; file?: string }> = [
  { slug: 'elementerial', route: 'elementerial/rg35xx/system' },
  { slug: 'playstation-x', file: 'legacy/playstation-x/rg35xx/ps4-style.html' },
  { slug: 'vitrolauncher', file: 'legacy/vitrolauncher/rg35xx/last-played.html' },
  { slug: 'example-cfw', route: 'example-cfw/rg35xx/main-menu' },
]

for (const { slug, route, file } of PREVIEWS) {
  test(`preview ${slug}`, async ({ page }) => {
    await page.goto(route ? `/#${route}` : pathToFileURL(resolve(REPO, file!)).href)
    const screen = page.locator('.screen')
    await screen.waitFor({ state: 'visible' })
    // Fonts, generated art and the animated background all need a beat to settle.
    await page.waitForTimeout(1200)

    await screen.screenshot({ path: resolve(OUT, `${slug}.png`) })
  })
}
