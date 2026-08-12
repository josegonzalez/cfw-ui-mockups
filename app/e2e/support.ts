import type { Locator, Page } from '@playwright/test'
import { SCREEN_MANIFEST, screenId } from '../src/themes/manifest'

/** Every route, and the subset that is a still rather than a live build. */
export const ROUTES = SCREEN_MANIFEST
export const STATIC_ROUTES = SCREEN_MANIFEST.filter((r) => !r.interactive)
export const INTERACTIVE_ROUTES = SCREEN_MANIFEST.filter((r) => r.interactive)
export { screenId }

/** A screenshot name that is stable and readable: `theme--device--screen.png`. */
export function shotName(route: (typeof SCREEN_MANIFEST)[number], suffix = ''): string {
  return `${route.theme}--${route.device}--${route.screen}${suffix}.png`
}

/**
 * Open a route and wait until it has actually painted.
 *
 * Fonts are the thing that bites here: a screenshot taken before the theme's own face loads is a
 * different image every run, because the fallback metrics differ. `document.fonts.ready` is the
 * only reliable signal for that, and it costs nothing when they are already cached.
 */
export async function openScreen(page: Page, id: string, query = ''): Promise<Locator> {
  await page.goto(`/${query}#${id}`)
  const screen = page.locator('.screen').first()
  await screen.waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)
  // Generated art is data URIs and decodes synchronously; the real images are the background art.
  await page
    .waitForFunction(
      () => [...document.images].every((img) => img.complete || img.naturalWidth > 0),
      undefined,
      { timeout: 5000 },
    )
    .catch(() => undefined)
  return screen
}

/**
 * Freeze anything that would make two captures of the same screen differ.
 *
 * Motion is the obvious half. The other half is *sub-pixel placement*, and it is far less obvious:
 * a screen is drawn inside a `transform: scale()`, so where the device lands on the page decides
 * the sub-pixel phase every glyph and edge inside it is rasterised at. The gallery centres the
 * device vertically, so a page that is taller - an interactive route carries a subset panel -
 * puts it on a half-pixel boundary and every antialiased edge in the panel shifts. That reads as
 * a 4% pixel difference between two screens that are pixel-identical in content.
 *
 * So the layout is pinned to a fixed integer origin before capture. This also makes every
 * baseline immune to gallery chrome changing height, which would otherwise invalidate all 110 of
 * them for a reason that has nothing to do with the screens.
 */
export async function settle(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      /* Pin the device to a fixed integer origin - see above. */
      .gal-viewer { display: block !important; padding: 40px 0 0 0 !important; }
      .gal-viewer > *:not(.device-viewport) { display: none !important; }
      /*
       * And capture at native resolution. The viewing zoom is a comfort setting that differs
       * between the app and the legacy pages - and between devices - so leaving it in would mean
       * comparing a 480x320 panel magnified 1.6x against the same panel magnified 1.3x. At scale
       * 1 every capture is exactly the device's own pixels, which is the only size the two
       * harnesses agree on.
       */
      .device-viewport { margin: 0 auto !important; --scale: 1 !important; }
    `,
  })
  await page.waitForTimeout(120)
}

/** Collect console noise for a page. Call before navigating. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('requestfailed', (req) => errors.push(`failed request: ${req.url()}`))
  return errors
}
