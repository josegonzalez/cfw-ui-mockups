import { describe, expect, it } from 'vitest'
import { fitInto, matches, pick, PSX_DEVICE_SLUGS, resolve, type PsxState } from './layout'
import golden from './__fixtures__/layout.golden.json'

/**
 * The resolver against the original's own output.
 *
 * 108 combinations - four devices by three carousel sizes by three carousel types by three
 * top-info settings, which is every row in the spec that a live subset can reach. The fixture
 * is captured by `scripts/gen-psx-golden.mjs`, which runs `legacy/playstation-x/layout.js`
 * under `node:vm`. A snapshot of the port would only prove nobody had changed it lately; this
 * proves it still agrees with the thing it reproduces.
 *
 * `topInfo` is excluded, and that exclusion is the whole reason this comment is long.
 *
 * The legacy mockup is not the theme - it is one transcription of the theme's XML, and this
 * fixture only ever proved the port agrees with *that*. Checking the top bar against the
 * upstream file directly found rows the transcription never carried: the release year is hidden
 * on `4-3|3-2|5-4` and was being drawn on two devices, the frontend logo and its plus pictogram
 * belong to the system view alone and were painting over every gamelist, and the blinking
 * achievements pulse is a separate element stacked over a static trophy rather than the trophy
 * itself. Pinning the port to the transcription would have frozen every one of those in place.
 *
 * So `topInfo` is verified against the XML instead, by `topInfo.test.ts`, which cites a line
 * number for each value. The other ten view blocks keep the legacy gate until they get the same
 * treatment - see `docs/porting/playstation-x.md`.
 */
const EXCLUDED = ['topInfo'] as const

function comparable(resolved: unknown): Record<string, unknown> {
  const out = JSON.parse(JSON.stringify(resolved)) as Record<string, unknown>
  for (const key of EXCLUDED) delete out[key]
  return out
}
const CAROUSEL = ['big', 'medium', 'small'] as const
const CAROUSEL_TYPE = ['PS5', 'PS4', 'PS3'] as const
const TOP_INFO = ['default', 'no-numbers', 'clean'] as const

describe('resolve against the original', () => {
  it('covers every combination the fixture holds', () => {
    expect(Object.keys(golden)).toHaveLength(108)
  })

  for (const device of PSX_DEVICE_SLUGS) {
    for (const carousel of CAROUSEL) {
      for (const type of CAROUSEL_TYPE) {
        for (const topInfo of TOP_INFO) {
          const key = `${device}|${carousel}|${type}|${topInfo}`

          it(`matches ${key}`, () => {
            const state: PsxState = {
              carousel,
              'carousel-type': type,
              'top-info': topInfo,
            }
            expect(comparable(resolve(device, state))).toEqual(
              comparable((golden as Record<string, unknown>)[key]),
            )
          })
        }
      }
    }
  }
})

describe('the two resolution rules', () => {
  it('takes the last matching row, not the most specific', () => {
    // carousel-sizes/big.xml writes a bare <pos> twice purely so the second overrides the
    // first. Most-specific-wins would take the wrong one and nothing would look obviously off.
    const variants = [
      [null, 'first'],
      [null, 'second'],
    ] as const
    expect(pick(variants, {})).toBe('second')
  })

  it('reads a pipe as alternatives, the way the source writes ifSubset', () => {
    expect(matches({ 'aspect-ratio': '4-3|3-2' }, { 'aspect-ratio': '3-2' })).toBe(true)
    expect(matches({ 'aspect-ratio': '4-3|3-2' }, { 'aspect-ratio': '5-3' })).toBe(false)
  })

  it('requires every key of a condition to match', () => {
    const state = { 'carousel-type': 'PS5', carousel: 'big' }
    expect(matches({ 'carousel-type': 'PS5', carousel: 'big' }, state)).toBe(true)
    expect(matches({ 'carousel-type': 'PS5', carousel: 'small' }, state)).toBe(false)
  })
})

describe('derived geometry', () => {
  it('centres the selection on the strip views', () => {
    // Nine cells across, so the selected cell is the fifth and the strip translates behind it.
    const l = resolve('trimui-smart-pro')
    expect(l.ps4Style.gamegrid.cols).toBe(9)
    expect(l.ps4Style.gamegrid.centerIndex).toBe(4)
  })

  it('lands the selection frame exactly over the centred tile', () => {
    /*
     * The frame letterboxes a 410x481 image inside its maxSize box. At 16:9 that fit is
     * height-constrained to the cell width, and the authored x of 0.162 is the centred cell's
     * left edge - which is why the frame sits on the tile rather than near it.
     */
    const l = resolve('trimui-smart-pro')
    const grid = l.ps4Style.gamegrid

    // Within a pixel of the cell width, and the authored x is the centred cell's left edge.
    // Padding insets the image inside its cell rather than the grid's content box, so the cell
    // origin does not carry it.
    expect(Math.abs(l.ps4Style.marcoActivo.w - grid.cellW)).toBeLessThan(1)
    expect(Math.abs(l.ps4Style.marcoActivo.left - (grid.left + grid.centerIndex * grid.cellW))).toBeLessThan(1)
  })

  it('drops the grid to fewer columns on the small panels', () => {
    expect(resolve('trimui-smart-pro').grid.gamegrid.cols).toBe(5)
    expect(resolve('rg35xx').grid.gamegrid.cols).toBe(4)
    expect(resolve('rg35xx').fullGrid.gamegrid.cols).toBe(3)
  })

  it('sizes the carousel tile from screen height, not width', () => {
    const l = resolve('trimui-smart-pro', { carousel: 'big', 'carousel-type': 'PS4' })
    expect(l.system.carousel.tile).toBeCloseTo(0.249 * 720, 5)
  })

  it('gives PS3 no neighbour dimming, where PS4 and PS5 have it', () => {
    expect(resolve('rg35xx', { 'carousel-type': 'PS3' }).system.carousel.minLogoOpacity).toBe(1)
    expect(resolve('rg35xx', { 'carousel-type': 'PS4' }).system.carousel.minLogoOpacity).toBe(0.7)
  })

  it('rounds the tiles only on PS5', () => {
    expect(resolve('rg35xx', { 'carousel-type': 'PS5' }).system.carousel.roundCorners).toBe(0.15)
    expect(resolve('rg35xx', { 'carousel-type': 'PS4' }).system.carousel.roundCorners).toBe(0)
  })
})

describe('origin-anchored boxes', () => {
  it('positions by the origin point rather than the top-left corner', () => {
    // The engine treats `pos` as where the origin lands, so a centred element is offset by half
    // its own size. Getting this backwards moves everything by half a box.
    const l = resolve('trimui-smart-pro')
    const image = l.detailed.image
    expect(image.left).toBeCloseTo(image.x - image.w / 2, 5)
    expect(image.top).toBeCloseTo(image.y - image.h / 2, 5)
  })

  it('letterboxes into a maxSize box rather than filling it', () => {
    expect(fitInto(200, 100, 400, 400)).toEqual({ w: 100, h: 100 })
    expect(fitInto(100, 200, 400, 400)).toEqual({ w: 100, h: 100 })
  })
})

describe('per-device rows', () => {
  it('hides the region tag and shrinks the top bar on the small panels', () => {
    expect(resolve('rg35xx').region.visible).toBe(false)
    expect(resolve('trimui-smart-pro').region.visible).toBe(true)
  })

  it('hides the top cover art on 4:3, which has no room for it', () => {
    expect(resolve('rg35xx').topInfo.caratulaTop.visible).toBe(false)
    expect(resolve('rg552').topInfo.caratulaTop.visible).toBe(true)
  })

  it('drops the numbered chrome on the cleaner top-info settings', () => {
    for (const topInfo of ['clean', 'no-numbers'] as const) {
      const l = resolve('rg552', { 'top-info': topInfo })
      expect(l.topInfo.version.visible).toBe(false)
      expect(l.topInfo.year.visible).toBe(false)
      expect(l.topInfo.plusPicto.visible).toBe(false)
    }
    expect(resolve('rg552', { 'top-info': 'default' }).topInfo.version.visible).toBe(true)
  })
})
