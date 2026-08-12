import { expect, test, type Page } from '@playwright/test'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { openScreen, screenId, settle, STATIC_ROUTES } from './support'

/**
 * Each ported still against the pre-React page it reproduces.
 *
 * The two are served from the same origin and share duplicated assets, so the legacy page renders
 * exactly as it always did and this is a true A/B rather than a second harness. It is the only
 * gate that answers "does the port still look like the thing it ports", as opposed to "does the
 * port still look like it did yesterday", which is what the baselines answer.
 *
 * It is a *tolerance* gate, not an equality one, and deliberately so. Several differences are
 * intentional and documented in `docs/porting/<cfw>.md` - corrected coordinates, defects fixed,
 * elements the original never drew - so a strict diff would fail on work that is right. What this
 * catches is a screen that has drifted wholesale: a blank panel, a missing layer, a layout that
 * has come apart.
 */
/**
 * Which slugs the pre-React mockups actually shipped.
 *
 * An allowlist rather than an HTTP probe: the dev server answers unknown paths with the app's own
 * `index.html`, so a missing legacy page comes back `200` and a probe would cheerfully diff a
 * screen against the landing page. Vitro is where that bites - six of its nine stills are screens
 * this port added, posing states the original could only pass through.
 */
const LEGACY_SLUGS: Record<string, readonly string[] | 'all'> = {
  elementerial: 'all',
  'playstation-x': 'all',
  'example-cfw': 'all',
  vitrolauncher: ['last-played', 'all-titles', 'settings'],
}

/**
 * And which devices it shipped them on. The port added devices too - example-cfw was one device
 * and is now two, because the scaffold should demonstrate that a theme resolves on any panel.
 */
const LEGACY_DEVICES: Record<string, readonly string[]> = {
  elementerial: ['rg35xx', 'rg351m', 'rg552', 'rg-cubexx'],
  'playstation-x': ['trimui-smart-pro', 'rg35xx', 'rg34xx', 'rg552'],
  'example-cfw': ['rg35xx'],
  vitrolauncher: ['rg35xx', 'rg34xx'],
}

const LEGACY: Record<string, string> = {}
for (const route of STATIC_ROUTES) {
  const allowed = LEGACY_SLUGS[route.theme]
  if (!allowed) continue
  if (allowed !== 'all' && !allowed.includes(route.screen)) continue
  if (!LEGACY_DEVICES[route.theme]?.includes(route.device)) continue
  // Every set's legacy filenames match its screen slugs, which is why they were chosen that way.
  LEGACY[screenId(route)] = `legacy/${route.theme}/${route.device}/${route.screen}.html`
}

/**
 * How far a screen may differ before it counts as drift.
 *
 * Generous, because the port corrects the original in places. A screen that has genuinely come
 * apart differs by far more than this - the Elementerial blank-panel fault was ~100%.
 */
const MAX_DIFF = 0.35

/** Top-left crop, so two captures of slightly different rasterised size can be compared. */
function crop(src: PNG, w: number, h: number): PNG {
  if (src.width === w && src.height === h) return src
  const out = new PNG({ width: w, height: h })
  PNG.bitblt(src, out, 0, 0, w, h, 0, 0)
  return out
}

async function shoot(page: Page, url: string) {
  await page.goto(url)
  const screen = page.locator('.screen').first()
  await screen.waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
  return screen.screenshot()
}

for (const route of STATIC_ROUTES) {
  const id = screenId(route)
  const legacy = LEGACY[id]
  // A screen this port added has nothing to be compared against; it is covered by its baseline.
  if (!legacy) continue

  test(`fidelity ${id}`, async ({ page }) => {
    const ported = await openScreen(page, id).then(async (screen) => {
      await settle(page)
      return screen.screenshot()
    })
    const original = await shoot(page, `/${legacy}`)

    const rawA = PNG.sync.read(ported)
    const rawB = PNG.sync.read(original)

    /*
     * Crop to the common region before comparing. A screen is a 623.99px box inside a scaled
     * transform, so whether it rasterises to 623 or 625 depends on where the page happens to put
     * it - the two harnesses centre differently and land on different sub-pixel phases. That is a
     * rounding artefact of the capture, not drift, and a couple of edge pixels cannot hide a
     * screen that has come apart.
     */
    const w = Math.min(rawA.width, rawB.width)
    const h = Math.min(rawA.height, rawB.height)
    expect(Math.abs(rawA.height - rawB.height), 'the two are the same screen, give or take rounding').toBeLessThanOrEqual(4)

    const a = crop(rawA, w, h)
    const b = crop(rawB, w, h)

    const diff = new PNG({ width: w, height: h })
    const changed = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.2 })
    const ratio = changed / (w * h)

    expect(ratio, `${id} differs from its legacy page by ${(ratio * 100).toFixed(1)}%`).toBeLessThan(
      MAX_DIFF,
    )
  })
}
