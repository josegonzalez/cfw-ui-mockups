import { expect, test, type Page } from '@playwright/test'
import { SCREEN_TYPES, UI_ELEMENTS, type Facet } from '../src/themes/taxonomy'
import { screensFor, viewsHref } from '../src/themes/views'
import { screenId } from './support'

/**
 * The views page: every set's take on one view, as a wall of live stills.
 *
 * The geometry of a tile is simple. What went wrong was compositing, as it always is here: the
 * settings comparison holds dozens of Dreamcast BIOS stills, each of which asked for a WebGL
 * context, and past the browser's limit the oldest were dropped - so the tiles near the top lost
 * their sky and showed black while every size check passed. The guard below looks at pixels.
 */

/** Scroll the whole page so every tile mounts, then wait for them to paint. */
async function mountAll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y)
      await new Promise((done) => setTimeout(done, 60))
    }
    await document.fonts.ready
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })
}

/**
 * Every canvas a tile shows, by the tile it is in, that has nothing painted on it.
 *
 * Read back through a 2D canvas, which works for a 2D source and for a GL one alike - and a GL
 * canvas whose context was taken away reads back as empty, which is exactly the fault.
 */
const BLANK_CANVASES = (): string[] => {
  const found: string[] = []
  for (const tile of document.querySelectorAll('a.gal-tile')) {
    for (const canvas of tile.querySelectorAll('canvas')) {
      if (getComputedStyle(canvas).display === 'none') continue
      if (canvas.width === 0 || canvas.height === 0) continue
      const probe = document.createElement('canvas')
      probe.width = 32
      probe.height = 32
      const ctx = probe.getContext('2d')!
      ctx.drawImage(canvas, 0, 0, 32, 32)
      const px = ctx.getImageData(0, 0, 32, 32).data
      let painted = false
      for (let i = 3; i < px.length; i += 4) {
        if (px[i]! > 0) {
          painted = true
          break
        }
      }
      if (!painted) found.push(tile.getAttribute('href')!)
    }
  }
  return found
}

test('the blank-canvas guard catches an empty canvas in a tile', async ({ page }) => {
  await page.goto(`/${viewsHref('type', 'boot')}`)
  await mountAll(page)
  expect(await page.evaluate(BLANK_CANVASES)).toEqual([])

  const href = await page.evaluate(() => {
    const tile = document.querySelector('a.gal-tile')!
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    tile.querySelector('.gal-still')!.appendChild(canvas)
    return tile.getAttribute('href')
  })

  expect(await page.evaluate(BLANK_CANVASES)).toContain(href)
})

test('a crowded comparison keeps every still painted', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (msg) => {
    if (/WebGL/i.test(msg.text())) warnings.push(msg.text())
  })

  // The comparison with the most GL stills on it: every Dreamcast BIOS settings screen, twice.
  await page.goto(`/${viewsHref('type', 'settings')}`)
  await mountAll(page)

  const mounted = await page.locator('.gal-still[data-mounted="true"]').count()
  expect(mounted).toBe(screensFor('type', 'settings').length)
  expect(await page.evaluate(BLANK_CANVASES)).toEqual([])
  expect(warnings).toEqual([])
})

test('a mounted still is drawn at the size of its tile', async ({ page }) => {
  await page.goto(`/${viewsHref('type', 'game-list')}`)
  await mountAll(page)

  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll('.gal-still')].map((tile) => {
      const screen = tile.querySelector('.screen')!.getBoundingClientRect()
      return { href: tile.closest('a')!.getAttribute('href'), w: screen.width, box: tile.clientWidth }
    }),
  )
  // Within a pixel of the inside of the tile: not collapsed, and not spilling under its border.
  for (const s of sizes) expect(Math.abs(s.w - s.box), s.href!).toBeLessThan(1.5)
})

for (const facet of ['type', 'element'] as const satisfies readonly Facet[]) {
  const terms = Object.keys(facet === 'type' ? SCREEN_TYPES : UI_ELEMENTS)

  test(`every ${facet} page links each of its screens`, async ({ page }) => {
    for (const slug of terms) {
      await page.goto(`/${viewsHref(facet, slug)}`)
      const hrefs = await page
        .locator('a.gal-tile')
        .evaluateAll((tiles) => tiles.map((a) => a.getAttribute('href')))
      expect(hrefs, slug).toEqual(screensFor(facet, slug).map((s) => `#${screenId(s)}`))
    }
  })
}

test('the viewer jumps to the same view in another set', async ({ page }) => {
  await page.goto('/#example-cfw/rg35xx/game-list')

  const group = page.getByRole('group', { name: 'Same view in other sets' })
  const first = group.getByRole('link').first()
  const href = await first.getAttribute('href')
  expect(href).not.toMatch(/^#example-cfw\//)

  await first.click()
  await expect(page).toHaveURL(new RegExp(`${href!.replace(/[/.]/g, '\\$&')}$`))
  await expect(page.locator('.screen').first()).toBeVisible()
})
