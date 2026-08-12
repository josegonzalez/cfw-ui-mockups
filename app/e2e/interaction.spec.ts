import { expect, test } from '@playwright/test'
import { openScreen, settle, watchErrors } from './support'

/**
 * Drive the cursor and screenshot where it lands.
 *
 * Every theme's focus model was written independently in the originals and every one of them was
 * subtly different, so this walks each live build through the movement its own screens use - a
 * strip that scrolls, a grid that pages, a list that windows - and captures each position. A
 * cursor that stops moving at the fourth item, or a page that turns to the wrong row, shows up
 * here and nowhere else.
 *
 * Keys are the repo-standard map: arrows are the d-pad, `Q`/`W` are the shoulders, `Z` is A.
 */
interface Trace {
  readonly id: string
  readonly name: string
  /** Pressed in order; a screenshot is taken after each. */
  readonly keys: readonly string[]
}

const TRACES: readonly Trace[] = [
  {
    // A carousel: the strip moves and the selection stays mid-screen.
    id: 'elementerial/rg35xx/interactive',
    name: 'elementerial-carousel',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowLeft'],
  },
  {
    // A windowed text list, and then the same library as a grid.
    id: 'elementerial/rg35xx/interactive',
    name: 'elementerial-list',
    keys: [']', 'ArrowDown', 'ArrowDown', 'ArrowDown'],
  },
  {
    // PS4 style: centre-selected strip, the frame never moves.
    id: 'playstation-x/rg35xx/interactive',
    name: 'psx-strip',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowRight'],
  },
  {
    // The paged grid, including the page turn at the row's edge.
    id: 'playstation-x/rg35xx/interactive',
    name: 'psx-grid',
    keys: [']', ']', ']', 'ArrowDown', 'ArrowRight', 'ArrowRight'],
  },
  {
    // Vitro's cover shelf, which grows the focused tile in place.
    id: 'vitrolauncher/rg35xx/interactive',
    name: 'vitro-carousel',
    keys: ['ArrowRight', 'ArrowRight'],
  },
  {
    // And its grid, reached with the right shoulder.
    id: 'vitrolauncher/rg35xx/interactive',
    name: 'vitro-grid',
    keys: ['w', 'ArrowRight', 'ArrowDown', 'ArrowRight'],
  },
  {
    // The settings list, which windows seven rows at a time.
    id: 'vitrolauncher/rg35xx/interactive',
    name: 'vitro-settings',
    keys: ['w', 'w', 'ArrowDown', 'ArrowDown', 'ArrowDown'],
  },
]

for (const trace of TRACES) {
  test(`trace ${trace.name}`, async ({ page }) => {
    const errors = watchErrors(page)
    // Motion off, input on: `?still=1` stops the clock without stopping the cursor.
    const screen = await openScreen(page, trace.id, '?still=1')
    await settle(page)

    for (const [i, key] of trace.keys.entries()) {
      await page.keyboard.press(key)
      // Motion is disabled by `settle`, so the next frame is the settled one.
      await page.waitForTimeout(80)
      await expect(screen).toHaveScreenshot(`${trace.name}--${i + 1}-${key}.png`)
    }

    expect(errors).toEqual([])
  })
}

/**
 * The two gestures that are held rather than pressed.
 *
 * Both were handled outside the input map in the original and both are easy to break without
 * noticing, because neither leaves a trace once released.
 */
test('vitro hold gestures', async ({ page }) => {
  await openScreen(page, 'vitrolauncher/rg35xx/interactive')

  await page.keyboard.down('Escape')
  await page.waitForTimeout(900)
  const fading = await page.locator('.poweroff-black').evaluate((el) => Number(getComputedStyle(el).opacity))
  expect(fading).toBeGreaterThan(0.2)
  await page.keyboard.up('Escape')
  await page.waitForTimeout(300)
  const cleared = await page.locator('.poweroff-black').evaluate((el) => Number(getComputedStyle(el).opacity))
  expect(cleared).toBe(0)

  // L1 + X + Start, held.
  await page.keyboard.down('q')
  await page.keyboard.down('a')
  await page.keyboard.down('Enter')
  await page.waitForTimeout(700)
  await expect(page.locator('.exit-banner.show')).toBeVisible()
  await page.keyboard.up('q')
  await page.keyboard.up('a')
  await page.keyboard.up('Enter')
  await page.waitForTimeout(200)
  await expect(page.locator('.exit-banner.show')).toHaveCount(0)
})
