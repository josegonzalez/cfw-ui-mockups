import { test } from '@playwright/test'
import { resolve } from 'node:path'

/**
 * Generate the preview art the landing page uses.
 *
 * Captured from the mockups themselves rather than drawn by hand, so a preview cannot flatter
 * a screen that no longer looks like that. Regenerate with
 * `UPDATE_PREVIEWS=1 npx playwright test e2e/previews.spec.ts`.
 *
 * Not part of the normal suite: it writes into `src/assets/previews/`, and the results are
 * committed. It only needs rerunning when a theme's look changes. It used to run with every full
 * suite anyway, and rewrote any preview whose screen animates between captures, so it now skips
 * unless asked.
 */
test.skip(!process.env.UPDATE_PREVIEWS, 'writes committed art; set UPDATE_PREVIEWS=1 to regenerate')
const OUT = resolve(process.cwd(), 'src/assets/previews')

/**
 * One representative screen per theme - the one that reads most distinctly at thumbnail size.
 *
 * Every theme is captured from its own route, so a card cannot flatter a screen that no longer
 * looks like that.
 */
const PREVIEWS: Array<{ slug: string; route: string; selector?: string }> = [
  { slug: 'elementerial', route: 'elementerial/rg35xx/system' },
  { slug: 'playstation-x', route: 'playstation-x/rg35xx/ps4-style' },
  { slug: 'vitrolauncher', route: 'vitrolauncher/rg35xx/last-played' },
  { slug: 'nextui', route: 'nextui/n64/browser' },
  { slug: 'slot', route: 'slot/rg-sp/shelf' },
  /*
   * One panel of two. Both panels with the hinge between them are twice as tall as every other
   * preview, and the card crops that to a strip of hinge; the grid is what reads as SimpleOS.
   */
  { slug: 'simpleos', route: 'simpleos/rg-ds/home', selector: '[data-panel="bottom"]' },
  { slug: 'tortos', route: 'tortos/trimui-brick/games' },
  { slug: 'example-cfw', route: 'example-cfw/rg35xx/main-menu' },
]

for (const { slug, route, selector } of PREVIEWS) {
  test(`preview ${slug}`, async ({ page }) => {
    await page.goto(`/#${route}`)
    const screen = page.locator('.screen')
    await screen.waitFor({ state: 'visible' })
    // Fonts, generated art and the animated background all need a beat to settle.
    await page.waitForTimeout(1200)

    const target = selector ? screen.locator(selector) : screen
    await target.screenshot({ path: resolve(OUT, `${slug}.png`) })
  })
}
