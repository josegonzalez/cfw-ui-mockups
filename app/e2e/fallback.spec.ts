import { expect, test } from '@playwright/test'
import { openScreen, screenId, settle, shotName, STATIC_ROUTES } from './support'

/**
 * Every still, again, in the degraded renderer.
 *
 * The point of shipping both modes is that the fallback is *designed* rather than discovered:
 * whoever writes the second renderer inherits a picture of what their output should look like,
 * not a list of features they are missing. A baseline per screen is what keeps that picture
 * honest - a fallback that quietly stops matching is a failing test rather than a surprise.
 *
 * Only the stills, because an interactive route's own controls can set a render mode and the two
 * would fight.
 */
for (const route of STATIC_ROUTES) {
  const id = screenId(route)

  test(`fallback ${id}`, async ({ page }) => {
    const screen = await openScreen(page, id, '?mode=fallback')
    await settle(page)
    await expect(screen).toHaveScreenshot(shotName(route, '--fallback'))
  })
}
