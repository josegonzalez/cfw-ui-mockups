import { expect, test } from '@playwright/test'
import { openScreen, ROUTES, screenId, settle, shotName } from './support'

/**
 * A screenshot baseline for every route.
 *
 * This is the gate that catches what nothing else can: a change that leaves every number correct
 * and the screen wrong. Four such faults were found by hand during the ports - a grid trapped
 * under its own background, a title collapsed to half a pixel, a pill's glass filling the screen -
 * and every one of them passed the unit suite, the golden fixtures and the geometry checks.
 *
 * Only the `.screen` element is captured, not the viewport, so the bezel and the browser window
 * cannot move a baseline.
 *
 * Live builds are captured with `?still=1`. Their motion cannot be stopped from CSS - Vitro's
 * backgrounds are a canvas render loop and PlayStation X drives transforms through registered
 * custom properties - so without it those routes would be noise rather than baselines.
 */
for (const route of ROUTES) {
  const id = screenId(route)

  test(`baseline ${id}`, async ({ page }) => {
    const screen = await openScreen(page, id, route.interactive ? '?still=1' : '')
    await settle(page)
    await expect(screen).toHaveScreenshot(shotName(route))
  })
}
