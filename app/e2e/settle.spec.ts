import { expect, test } from '@playwright/test'
import { INTERACTIVE_ROUTES, openScreen, screenId, settle } from './support'

/**
 * A still is the live build with motion settled, not a second implementation.
 *
 * This is the invariant the whole snapshot mechanism rests on, inherited from all three original
 * mockups: `animate={false}` routes every animation through its resting value instead of playing
 * it, and nothing else changes. If the two ever diverged there would be no way to tell which one
 * was lying, and the 90-odd stills in this repo would be decoration rather than evidence.
 *
 * The comparison is the interactive route posed with `?still=1` against the still whose subsets
 * match its defaults. Each theme's live build opens on the same view and palette as one of its
 * stills, which is what makes them comparable at all.
 */
const PAIRS: Record<string, string> = {
  // theme -> the still slug whose props match the interactive build's defaults
  elementerial: 'system',
  'playstation-x': 'ps4-style',
  vitrolauncher: 'last-played',
  nextui: 'browser',
  slot: 'shelf',
  simpleos: 'boot',
  tortos: 'systems',
  neostation: 'systems',
  'ds-style': 'home',
  'wii-menu': 'health',
  'example-cfw': 'main-menu',
}

for (const route of INTERACTIVE_ROUTES) {
  const twin = PAIRS[route.theme]
  if (!twin) continue

  test(`${route.theme}/${route.device} settles to its still`, async ({ page }) => {
    const stillId = `${route.theme}/${route.device}/${twin}`
    const still = await openScreen(page, stillId)
    await settle(page)
    const a = await still.screenshot()

    const live = await openScreen(page, screenId(route), '?still=1')
    await settle(page)
    const b = await live.screenshot()

    /*
     * Compared as bytes rather than through the snapshot differ, because there is no baseline
     * here - the assertion is that two live renders agree with each other, whatever they show.
     */
    expect(Buffer.compare(a, b)).toBe(0)
  })
}
