import { expect, test, type Page } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { SPRUCEOS_DEVICES, stillsFor } from '../src/themes/spruceos/manifest'
import { openScreen, settle } from './support'

/**
 * spruceOS against PyUI.
 *
 * PyUI renders headlessly, so every still of the port has a frame drawn by PyUI itself, posed with
 * the same buttons on the same device (`docs/themes/spruceos/reference/render-reference.sh`,
 * `stills.txt`). This compares them pixel for pixel.
 *
 * Text is where they cannot agree exactly: PyUI's is SDL_ttf's FreeType rasterisation, which rounds
 * every advance to a whole pixel, and the port's is the browser's, which does not - so glyph edges
 * land a level or several apart, and a long string ends a few pixels from where PyUI's does. So the
 * two are held apart: inside the port's text boxes a still may differ in `TEXT_SHARE` of the area,
 * and everywhere else - images, bars, icons, rows - in `REST_SHARE`, which is far tighter. Both were
 * measured across every still on every device, and the last test shows the tight one catches a
 * focus change on the main menu.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const REF = resolve(HERE, '../../docs/themes/spruceos/reference/render')
const OUT = resolve(HERE, '../test-results/spruceos-reference')

/** The RG40XX is the same PyUI device as the RG35XX, so it is held to the RG35XX's frames. */
const FRAMES: Readonly<Record<string, string>> = { rg40xx: 'rg35xx' }

/**
 * How far a channel may be off before a pixel counts as different: antialiasing and filtering, not
 * layout. Low enough that the main menu's grey icon turning green (46 apart) counts.
 */
const CHANNEL = 40

/** How far past its box a string's glyphs may land: PyUI's string can be a few pixels wider. */
const TEXT_MARGIN = 4

/**
 * The share of the text boxes' area that may differ: glyph shapes, and strings a few pixels wider.
 * Measured at most 8.7%, on the Mini v4's power prompt, whose longer line is centred.
 */
const TEXT_SHARE = 0.12

/**
 * The share of everything else that may differ: images, bars, icons and rows. Measured at most
 * 0.30% - scaled box art, filtered a level apart - where the main menu with a different focus is
 * 1.17%.
 */
const REST_SHARE = 0.005

/** The device frame rounds the panel's glass by 8px, which is the mockup's bezel and not PyUI. */
const CORNER = 8
const inCorner = (x: number, y: number, w: number, h: number) =>
  (x < CORNER || x >= w - CORNER) && (y < CORNER || y >= h - CORNER)

/** Whether a pixel of `a` has a match within `CHANNEL` anywhere in `b`'s 3x3 neighbourhood of it. */
function matched(a: PNG, b: PNG, x: number, y: number): boolean {
  const i = (y * a.width + x) * 4
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const bx = x + dx
      const by = y + dy
      if (bx < 0 || by < 0 || bx >= b.width || by >= b.height) continue
      const j = (by * b.width + bx) * 4
      const far = Math.max(
        Math.abs(a.data[i]! - b.data[j]!),
        Math.abs(a.data[i + 1]! - b.data[j + 1]!),
        Math.abs(a.data[i + 2]! - b.data[j + 2]!),
      )
      if (far <= CHANNEL) return true
    }
  }
  return false
}

/** A text box in device pixels, grown by `TEXT_MARGIN` on every side. */
interface Rect {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

/**
 * The pixels that differ - those with no match nearby in the other frame, looked for both ways, so
 * a glyph a pixel along from PyUI's matches and a missing or extra one does not - counted apart
 * inside the port's text boxes and outside them.
 */
function differing(a: PNG, b: PNG, diff: PNG, text: readonly Rect[]): { text: number; rest: number } {
  const inText = new Uint8Array(a.width * a.height)
  for (const r of text) {
    for (let y = Math.max(0, r.y0); y < Math.min(a.height, r.y1); y++) {
      for (let x = Math.max(0, r.x0); x < Math.min(a.width, r.x1); x++) inText[y * a.width + x] = 1
    }
  }
  const n = { text: 0, rest: 0 }
  for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4
      const same = inCorner(x, y, a.width, a.height) || (matched(a, b, x, y) && matched(b, a, x, y))
      const t = inText[y * a.width + x] === 1
      diff.data[i] = same ? a.data[i]! >> 2 : 255
      diff.data[i + 1] = same ? a.data[i + 1]! >> 2 : t ? 160 : 0
      diff.data[i + 2] = same ? a.data[i + 2]! >> 2 : 0
      diff.data[i + 3] = 255
      if (!same) n[t ? 'text' : 'rest']++
    }
  }
  return n
}

/** Every text box on the screen, in device pixels. */
async function textRects(page: Page, w: number): Promise<Rect[]> {
  return page.evaluate(
    ({ w, margin }) => {
      const screen = document.querySelector('.screen')!.getBoundingClientRect()
      const k = w / screen.width
      return [...document.querySelectorAll('.screen .spruce-text')].map((el) => {
        const r = el.getBoundingClientRect()
        return {
          x0: Math.floor((r.left - screen.left) * k) - margin,
          y0: Math.floor((r.top - screen.top) * k) - margin,
          x1: Math.ceil((r.right - screen.left) * k) + margin,
          y1: Math.ceil((r.bottom - screen.top) * k) + margin,
        }
      })
    },
    { w, margin: TEXT_MARGIN },
  )
}

async function compare(page: Page, device: string, slug: string, frame: string) {
  const screen = await openScreen(page, `spruceos/${device}/${slug}`)
  await settle(page)
  const ours = PNG.sync.read(await screen.screenshot())
  const theirs = PNG.sync.read(readFileSync(resolve(REF, FRAMES[device] ?? device, `${frame}.png`)))
  expect([ours.width, ours.height]).toEqual([theirs.width, theirs.height])
  const rects = await textRects(page, ours.width)
  const area = rects.reduce((sum, r) => sum + (r.x1 - r.x0) * (r.y1 - r.y0), 0)
  const diff = new PNG({ width: ours.width, height: ours.height })
  const n = differing(ours, theirs, diff, rects)
  return {
    ours,
    diff,
    n,
    textAllowed: Math.round(area * TEXT_SHARE),
    restAllowed: Math.round(ours.width * ours.height * REST_SHARE),
  }
}

for (const device of SPRUCEOS_DEVICES) {
  for (const { slug } of stillsFor(device)) {
    test(`spruceos ${device} ${slug} matches PyUI's own frame`, async ({ page }) => {
      const { ours, diff, n, textAllowed, restAllowed } = await compare(page, device, slug, slug)
      if (process.env.SPRUCEOS_SAVE)
        console.log(`MEASURE ${device} ${slug} text ${n.text}/${textAllowed} rest ${n.rest}/${restAllowed}`)
      if (n.text > textAllowed || n.rest > restAllowed || process.env.SPRUCEOS_SAVE) {
        mkdirSync(OUT, { recursive: true })
        writeFileSync(resolve(OUT, `${device}--${slug}-ours.png`), PNG.sync.write(ours))
        writeFileSync(resolve(OUT, `${device}--${slug}-diff.png`), PNG.sync.write(diff))
      }
      expect(
        n.rest,
        `${n.rest} pixels outside text differ from PyUI's frame (${restAllowed} allowed)`,
      ).toBeLessThanOrEqual(restAllowed)
      expect(n.text, `${n.text} pixels of text differ from PyUI's frame (${textAllowed} allowed)`).toBeLessThanOrEqual(
        textAllowed,
      )
    })
  }
}

test('the comparison can fail', async ({ page }) => {
  // The main menu with Games focused against the frame with Favorites focused: two icons change
  // and two labels change colour, and that has to be enough to fail.
  expect(existsSync(resolve(REF, 'miyoo-a30', 'main-menu.png'))).toBe(true)
  const { n, restAllowed } = await compare(page, 'miyoo-a30', 'main-games', 'main-menu')
  if (process.env.SPRUCEOS_SAVE) console.log(`MEASURE fail-case text ${n.text} rest ${n.rest}/${restAllowed}`)
  expect(n.rest).toBeGreaterThan(restAllowed)
})
