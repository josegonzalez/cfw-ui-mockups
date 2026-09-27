import { expect, test } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { openScreen, settle } from './support'

/**
 * DS Style against DS Style.
 *
 * The launcher renders headlessly, so every still of the port has a frame drawn by the launcher
 * itself, posed with the same buttons (`docs/themes/ds-style/reference/render-reference.sh`,
 * `stills.txt`). This compares them pixel for pixel: a difference is either fixed or listed below
 * with its reason, and the list is the only tolerance there is.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const REF = resolve(HERE, '../../docs/themes/ds-style/reference')
const OUT = resolve(HERE, '../test-results/ds-style-reference')

const STILLS = readFileSync(resolve(REF, 'stills.txt'), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('|')[0]!)

/**
 * Differences that are understood, as a count of pixels allowed to differ.
 *
 * - Snake's food is seeded from the clock in the source (`about_snake.h:70`) and from a constant in
 *   the port, so its two 5x5 squares - 15x15 device pixels each - are in different places.
 */
const ALLOWED: Readonly<Record<string, number>> = {
  snake: 2 * 15 * 15,
}

/**
 * How far a channel may be off, where a whole still is allowed to round differently.
 *
 * - The LCD grid multiplies every channel by `gx*gy` and rounds once (`ui.h:344-351`). The port
 *   multiplies with a blend over a tiled 3x3 cell, whose grey is itself rounded to 8 bits before
 *   the product is rounded again, so channels land one level either side.
 */
const CHANNEL: Readonly<Record<string, number>> = {
  'lcd-grid': 1,
}

/**
 * The device frame rounds the panel's glass by 8px (`.device__screen`), which is the mockup's bezel
 * and not DS Style: those corner squares are left out.
 */
const CORNER = 8
const inCorner = (x: number, y: number, w: number, h: number) =>
  (x < CORNER || x >= w - CORNER) && (y < CORNER || y >= h - CORNER)

function differing(a: PNG, b: PNG, diff: PNG, tolerance: number): number {
  let n = 0
  const near = (i: number) => Math.abs(a.data[i]! - b.data[i]!) <= tolerance
  for (let i = 0; i < a.data.length; i += 4) {
    const p = i / 4
    const corner = inCorner(p % a.width, Math.floor(p / a.width), a.width, a.height)
    const same = corner || (near(i) && near(i + 1) && near(i + 2))
    diff.data[i] = same ? a.data[i]! >> 2 : 255
    diff.data[i + 1] = same ? a.data[i + 1]! >> 2 : 0
    diff.data[i + 2] = same ? a.data[i + 2]! >> 2 : 0
    diff.data[i + 3] = 255
    if (!same) n++
  }
  return n
}

for (const slug of STILLS) {
  test(`ds-style ${slug} matches the launcher's own frame`, async ({ page }) => {
    const screen = await openScreen(page, `ds-style/rg-sp/${slug}`)
    await settle(page)
    const ours = PNG.sync.read(await screen.screenshot())
    const theirs = PNG.sync.read(readFileSync(resolve(REF, 'render', `${slug}.png`)))
    expect([ours.width, ours.height]).toEqual([theirs.width, theirs.height])
    const diff = new PNG({ width: ours.width, height: ours.height })
    const n = differing(ours, theirs, diff, CHANNEL[slug] ?? 0)
    if (n > (ALLOWED[slug] ?? 0)) {
      mkdirSync(OUT, { recursive: true })
      writeFileSync(resolve(OUT, `${slug}-ours.png`), PNG.sync.write(ours))
      writeFileSync(resolve(OUT, `${slug}-diff.png`), PNG.sync.write(diff))
    }
    expect(n, `${n} pixels differ from the launcher's frame`).toBeLessThanOrEqual(ALLOWED[slug] ?? 0)
  })
}

test('the comparison can fail', async ({ page }) => {
  // Home with the cursor on Games against the frame with it on the card: only four corner
  // brackets move, and that has to be enough to fail.
  const screen = await openScreen(page, 'ds-style/rg-sp/home-games')
  await settle(page)
  const ours = PNG.sync.read(await screen.screenshot())
  const theirs = PNG.sync.read(readFileSync(resolve(REF, 'render', 'home.png')))
  const n = differing(ours, theirs, new PNG({ width: ours.width, height: ours.height }), 0)
  expect(n).toBeGreaterThan(0)
})
