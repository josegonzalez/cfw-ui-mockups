import { expect, test } from '@playwright/test'
import { SCREEN_MANIFEST as ROUTES, screenId as routeId } from '../src/themes/manifest'

/**
 * Every screen, checked for the faults that unit tests structurally cannot see.
 *
 * Screenshot baselines arrive with the gallery phase; these are the assertions that hold
 * regardless of what a screen is meant to look like.
 */
for (const route of ROUTES) {
  const id = routeId(route)

  test(`${id} renders without console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('requestfailed', (req) => errors.push(`failed request: ${req.url()}`))

    await page.goto(`/#${id}`)
    await expect(page.locator('.screen')).toBeVisible()

    expect(errors).toEqual([])
  })

  test(`${id} draws content rather than an empty panel`, async ({ page }) => {
    await page.goto(`/#${id}`)
    const screen = page.locator('.screen')
    await expect(screen).toBeVisible()

    // A screen that mounted but rendered nothing still passes a visibility check.
    const painted = await screen.evaluate((el) => el.querySelectorAll('*').length)
    expect(painted).toBeGreaterThan(5)
  })

  test(`${id} has nothing opaque covering the content`, async ({ page }) => {
    /*
     * The guard for a fault that every numeric check misses.
     *
     * A previous build had an overlay that inherited a tinted background but no mask, and so
     * painted solid over every view at a high z-index. Element boxes, palette tokens, font
     * sizes, row pitch and console output were all correct; the screen was simply invisible.
     * Nothing about that is detectable in computed styles alone - only compositing shows it.
     */
    await page.goto(`/#${id}`)
    await expect(page.locator('.screen')).toBeVisible()

    const covering = await page.locator('.screen').evaluate((screen) => {
      const bounds = screen.getBoundingClientRect()
      const area = bounds.width * bounds.height
      const offenders: string[] = []

      for (const el of screen.querySelectorAll<HTMLElement>('*')) {
        const rect = el.getBoundingClientRect()
        // Only elements that blanket essentially the whole panel can hide it.
        if (rect.width * rect.height < area * 0.95) continue

        const style = getComputedStyle(el)
        if (style.opacity === '0' || style.visibility === 'hidden' || style.display === 'none') {
          continue
        }

        /*
         * A masked tint is legitimate: the mask is what stops it painting solid, and a scrim
         * over the whole panel is how every theme here darkens artwork. The failure mode - a
         * mask that does not load, leaving the flat fill behind it - is caught by the
         * console-errors test above, which fails on any failed request.
         */
        const mask = style.maskImage ?? style.webkitMaskImage
        if (mask && mask !== 'none') continue

        const bg = style.backgroundColor
        const alpha = /rgba?\([^)]*,\s*([\d.]+)\s*\)/.exec(bg)
        const isOpaque = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && (!alpha || Number(alpha[1]) > 0.95)
        if (!isOpaque) continue

        // A full-bleed opaque background is fine as the backdrop; it is only a fault when it
        // sits above content rather than behind it.
        const z = Number(style.zIndex)
        const hasChildren = el.childElementCount > 0
        if (!hasChildren && Number.isFinite(z) && z > 0) {
          offenders.push(`${el.tagName}.${el.className} z=${style.zIndex} bg=${bg}`)
        }
      }

      return offenders
    })

    expect(covering).toEqual([])
  })
}

test('the landing page reaches every route', async ({ page }) => {
  await page.goto('/')

  for (const route of ROUTES) {
    // At least one link, not exactly one: a theme card also links its own live build, so a
    // route can legitimately be reachable from two places.
    await expect(page.locator(`a[href="#${routeId(route)}"]`).first()).toBeAttached()
  }
})

test('every theme is represented with preview art that actually loads', async ({ page }) => {
  await page.goto('/')

  const cards = page.locator('.gal-card')
  await expect(cards).toHaveCount(4)

  // A broken preview still renders an <img> box, so check the decoded dimensions. Polled
  // rather than sampled once: an image that has not finished decoding also reports zero, and
  // under a loaded worker that is a coin flip rather than a fault.
  await expect
    .poll(
      () =>
        page.locator('.gal-card__img').evaluateAll((imgs) =>
          imgs
            .filter((img) => !(img as HTMLImageElement).naturalWidth)
            .map((img) => img.getAttribute('src')),
        ),
      { message: 'preview art that never decoded' },
    )
    .toEqual([])
})

test('the notes open as a rendered page', async ({ page }) => {
  // These used to link straight at the `.md` file, which left it to the browser whether the
  // notes displayed, downloaded, or did nothing at all.
  await page.goto('/')
  await page.locator('a.gal-btn', { hasText: 'Read the notes' }).first().click()

  await expect(page).toHaveURL(/#notes\/docs\//)
  await expect(page.locator('.notes__body h1')).toBeVisible()
  await expect(page.locator('.notes__body')).not.toBeEmpty()
})

test('every link off the landing page resolves', async ({ page, request }) => {
  /*
   * The "Read the notes" and "Open the original" buttons point at `docs/` and `legacy/`, which
   * live outside the Vite root and are mounted by a plugin. Nothing about a dead link is
   * visible on the page - it renders perfectly and then does nothing when clicked - so the
   * targets are fetched rather than assumed.
   */
  await page.goto('/')

  const targets = await page.locator('a[href^="/"]').evaluateAll((links) =>
    [...new Set(links.map((a) => (a as HTMLAnchorElement).getAttribute('href')!))],
  )

  expect(targets.length).toBeGreaterThan(0)

  for (const href of targets) {
    const response = await request.get(href)
    expect(response.status(), `${href} should not be a dead link`).toBe(200)
  }
})

test('the device switcher swaps the panel without leaving the screen', async ({ page }) => {
  await page.goto('/#example-cfw/rg35xx/game-list')
  await expect(page.locator('.device-viewport')).toHaveAttribute('style', /--screen-w: *640/)

  await page.getByRole('group', { name: 'Device' }).getByText('RG CubeXX').click()

  await expect(page).toHaveURL(/#example-cfw\/rg-cubexx\/game-list/)
  await expect(page.locator('.device-viewport')).toHaveAttribute('style', /--screen-w: *720/)
  // Same screen, different panel.
  await expect(page.locator('[data-view]')).toHaveAttribute('data-view', 'game-list')
})
