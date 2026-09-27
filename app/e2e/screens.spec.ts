import { expect, test } from '@playwright/test'
import { SCREEN_MANIFEST as ROUTES, screenId as routeId } from '../src/themes/manifest'

/**
 * Every screen, checked for the faults that unit tests structurally cannot see.
 *
 * Screenshot baselines arrive with the gallery phase; these are the assertions that hold
 * regardless of what a screen is meant to look like.
 */
/*
 * One page load per route, four checks on it. They were four tests that each loaded the route
 * afresh - over half the e2e suite's page loads - and none of them changes the page, so they share
 * one. Each is a step with soft assertions, so a failure still says which check it was and the
 * others still run.
 */
for (const route of ROUTES) {
  const id = routeId(route)

  test(`${id} passes the screen checks`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('requestfailed', (req) => errors.push(`failed request: ${req.url()}`))

    await page.goto(`/#${id}`)
    const screen = page.locator('.screen')
    await expect(screen).toBeVisible()

    await test.step('renders without console errors', () => {
      expect.soft(errors).toEqual([])
    })

    await test.step('draws content rather than an empty panel', async () => {
      const panels = screen.locator('[data-panel]')
      if ((await panels.count()) > 0) {
        /*
         * On a two-panel device the question is per panel: one blank panel is the failure, and an
         * element count over the whole screen cannot see it. A panel may legitimately be a single
         * full-bleed image - SimpleOS's splash is exactly that - so what is asked is whether it
         * draws anything with a size, not how many elements it took.
         */
        for (const panel of await panels.all()) {
          const drawn = await panel.evaluate((el) =>
            [...el.querySelectorAll<HTMLElement>('*')].some((n) => {
              const r = n.getBoundingClientRect()
              return r.width > 0 && r.height > 0
            }),
          )
          expect.soft(drawn).toBe(true)
        }
        return
      }

      /*
       * A screen that mounted but rendered nothing still passes a visibility check, so the question
       * is whether anything inside the theme's root draws with a size. The root itself always has
       * one, which is why it does not count. This used to be an element count over five, which
       * failed slot's game - one full-bleed picture and its mask is a whole screen.
       *
       * A screen that is dark on the device says so with `data-screen-off` on its root: slot dozes
       * with the panel off, and drawing something there to satisfy this would be the wrong screen.
       */
      const drawn = await screen.evaluate((el) => {
        const root = el.querySelector('[data-theme]')
        if (!root) return false
        if (root.hasAttribute('data-screen-off')) return true
        return [...root.querySelectorAll<HTMLElement>('*')].some((n) => {
          const r = n.getBoundingClientRect()
          return r.width > 0 && r.height > 0
        })
      })
      expect.soft(drawn).toBe(true)
    })

    await test.step('keeps every control inside the body', async () => {
      /*
       * Shells size their controls against the body, and a scale that is too large for the panel
       * pushes the face buttons off the edge of the plastic. Nothing in the unit suite can see
       * that - jsdom has no layout - and it is not a small visual difference but a device with
       * buttons floating beside it.
       */
      const escaped = await page.locator('.device').evaluate((device) => {
        const body = device.getBoundingClientRect()
        const out: string[] = []

        for (const el of device.querySelectorAll<HTMLElement>('[data-btn], .stick, .speaker')) {
          const r = el.getBoundingClientRect()
          // A pixel of slack for sub-pixel rounding on a scaled body.
          if (r.left < body.left - 1 || r.right > body.right + 1) {
            out.push(`${el.className || el.tagName} escapes horizontally`)
          }
          if (r.top < body.top - 1 || r.bottom > body.bottom + 1) {
            out.push(`${el.className || el.tagName} escapes vertically`)
          }
        }

        return out
      })

      expect.soft(escaped).toEqual([])
    })

    await test.step('has nothing opaque covering the content', async () => {
      /*
       * The guard for a fault that every numeric check misses.
       *
       * A previous build had an overlay that inherited a tinted background but no mask, and so
       * painted solid over every view at a high z-index. Element boxes, palette tokens, font
       * sizes, row pitch and console output were all correct; the screen was simply invisible.
       * Nothing about that is detectable in computed styles alone - only compositing shows it.
       */
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

      expect.soft(covering).toEqual([])
    })
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

  // Derived from the manifest rather than written in, and rather than from the catalogue -
  // which imports its preview art, and so cannot be loaded outside the bundler.
  const themes = new Set(ROUTES.map((route) => route.theme))
  const cards = page.locator('.gal-card')
  await expect(cards).toHaveCount(themes.size)

  /*
   * The previews are `loading="lazy"`, which is right for the page and means a card below the fold
   * never fetches its art until it is scrolled to. Unscrolled, every such card reported "never
   * decoded" - a fault in this check, not in the art - so each one is brought into view first.
   */
  for (const img of await page.locator('.gal-card__img').all()) {
    await img.scrollIntoViewIfNeeded()
  }

  // A broken preview still renders an <img> box, so check the decoded dimensions. Polled
  // rather than sampled once: an image that has not finished decoding also reports zero, and
  // under a loaded worker that is a coin flip rather than a fault.
  await expect
    .poll(
      () =>
        page
          .locator('.gal-card__img')
          .evaluateAll((imgs) =>
            imgs.filter((img) => !(img as HTMLImageElement).naturalWidth).map((img) => img.getAttribute('src')),
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

test('every notes page the landing links to exists', async ({ request }) => {
  /*
   * Each card's "Read the notes" button opens a page out of `docs/`, which lives outside the Vite
   * root and is mounted by a plugin. Nothing about a dead one is visible - the card renders
   * perfectly and the viewer opens empty - so the targets are fetched rather than assumed.
   */
  /*
   * Derived from the manifest rather than the catalogue: the catalogue imports preview art, and
   * this spec runs outside Vite, so importing it would drag a PNG through Playwright's transform.
   * That is the reason the manifest is kept free of React and assets in the first place.
   */
  const slugs = [...new Set(ROUTES.map((route) => route.theme))]
  expect(slugs.length).toBeGreaterThan(0)

  for (const slug of slugs) {
    const path = `docs/themes/${slug}.md`
    const response = await request.get(`/${path}`)
    expect(response.status(), `${path} should not be a dead link`).toBe(200)
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
