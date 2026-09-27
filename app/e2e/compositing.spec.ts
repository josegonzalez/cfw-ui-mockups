import { expect, test, type Locator } from '@playwright/test'
import { openScreen, screenId, settle, STATIC_ROUTES } from './support'

/**
 * Nothing opaque may sit over the content.
 *
 * This exists because of a specific fault and its three relatives. Elementerial's every view once
 * rendered behind its own opaque background fill - the geometry was perfect, the unit suite was
 * green, and the screen was blank. PlayStation X's tile grid was later trapped under the same
 * class of thing, and Vitro's status pill painted a full-screen stadium over everything.
 *
 * All four were compositing faults, and no check that reads computed styles can see them: every
 * element was exactly where it was meant to be. What they have in common is an element that
 * covers most of the panel, is effectively opaque, and paints above the content - so that is what
 * this looks for directly.
 */
/**
 * Returns anything opaque, near full-bleed, and painted above content.
 *
 * Sampled with `elementsFromPoint` rather than walked, because it reports the real paint order
 * including stacking contexts - and reasoning about z-index from the DOM is precisely the mistake
 * that hid all four of these faults.
 */
const FIND_COVERING = (root: Element): string[] => {
  const box = root.getBoundingClientRect()
  const area = box.width * box.height
  const found: string[] = []
  const points = [
    [0.5, 0.4],
    [0.25, 0.5],
    [0.75, 0.5],
  ] as const

  for (const [fx, fy] of points) {
    const stack = document.elementsFromPoint(
      box.left + box.width * fx,
      box.top + box.height * fy,
    )
    for (const el of stack) {
      if (el === root || !root.contains(el)) break
      const r = el.getBoundingClientRect()
      if ((r.width * r.height) / area <= 0.85) continue

      const cs = getComputedStyle(el)
      const bg = cs.backgroundColor
      const opaque =
        Number(cs.opacity) > 0.98 && bg !== 'rgba(0, 0, 0, 0)' && !bg.startsWith('rgba(')
      if (!opaque) continue

      const below = stack.slice(stack.indexOf(el) + 1)
      if (below.some((n) => n !== root && root.contains(n))) {
        found.push(`${el.tagName}.${String(el.className).slice(0, 40)}`)
      }
    }
  }
  return [...new Set(found)]
}

/**
 * The guard has to be able to fail, or it is decoration.
 *
 * Injects the exact fault it exists for - an opaque full-bleed layer over the content - and
 * asserts the detector reports it.
 */
test('the guard catches an opaque layer over the content', async ({ page }) => {
  const screen = await openScreen(page, screenId(STATIC_ROUTES[0]!))
  await settle(page)

  expect(await screen.evaluate(FIND_COVERING)).toEqual([])

  await screen.evaluate((root) => {
    const sheet = document.createElement('div')
    sheet.className = 'injected-fault'
    sheet.style.cssText =
      'position:absolute;inset:0;z-index:9999;background:rgb(20,20,20);opacity:1;'
    root.querySelector('*')?.parentElement?.appendChild(sheet)
  })

  expect(await screen.evaluate(FIND_COVERING)).toContain('DIV.injected-fault')
})

/**
 * The surfaces to check: each panel of a two-panel device, or the screen itself.
 *
 * On a two-panel device one panel is under half the screen, so an opaque layer over the whole of
 * it would never reach the detector's share of the area. Checked per panel, it is the full-bleed
 * fault it is on any other device.
 */
async function surfaces(screen: Locator): Promise<Locator[]> {
  const panels = screen.locator('[data-panel]')
  return (await panels.count()) > 0 ? panels.all() : [screen]
}

/**
 * Sample a surface, scrolled into view first.
 *
 * `elementsFromPoint` sees only the viewport, and a point outside it returns nothing - which the
 * detector reads as "nothing covering". A two-panel device at native scale is taller than the
 * viewport, so without this its bottom panel passed every check without being looked at.
 */
async function covering(surface: Locator): Promise<string[]> {
  await surface.scrollIntoViewIfNeeded()
  return surface.evaluate(FIND_COVERING)
}

test('the guard catches an opaque layer over one panel of two', async ({ page }) => {
  const route = STATIC_ROUTES.find((r) => r.theme === 'simpleos')
  test.skip(!route, 'no two-panel route to inject into')
  const screen = await openScreen(page, screenId(route!))
  await settle(page)

  const bottom = screen.locator('[data-panel="bottom"]')
  expect(await covering(bottom)).toEqual([])

  await bottom.evaluate((root) => {
    const sheet = document.createElement('div')
    sheet.className = 'injected-fault'
    sheet.style.cssText =
      'position:absolute;inset:0;z-index:9999;background:rgb(20,20,20);opacity:1;'
    root.appendChild(sheet)
  })

  // Missed at screen scale, which is the reason for checking per panel...
  expect(await covering(screen)).toEqual([])
  // ...and caught at panel scale.
  expect(await covering(bottom)).toContain('DIV.injected-fault')
})

for (const route of STATIC_ROUTES) {
  const id = screenId(route)

  test(`${id} has nothing opaque covering it`, async ({ page }) => {
    const screen = await openScreen(page, id)
    await settle(page)

    for (const surface of await surfaces(screen)) {
      expect(await covering(surface)).toEqual([])
    }
  })
}
