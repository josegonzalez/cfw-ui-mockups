import { describe, expect, it } from 'vitest'
import golden from './__fixtures__/layout.golden.json'
import { ELEMENTERIAL_DEVICES, resolve, placeContain, placeEs, type FontSize, type GridDirection } from './layout'

/**
 * The port against the original.
 *
 * `resolve()` is pure, so the original resolver was run under Node across every device, font
 * size and grid direction, and its output captured as a fixture. This compares the two value by
 * value - 24 combinations, several hundred numbers each.
 *
 * That is worth far more than a snapshot of the port's own output: a snapshot only proves the
 * port has not changed since the last time someone accepted it, whereas this proves it agrees
 * with the thing it is reproducing. Regenerate with `scripts/gen-layout-golden.mjs` if the
 * original is ever corrected.
 */
const FONT_SIZES: FontSize[] = ['small', 'medium', 'large']
const DIRECTIONS: GridDirection[] = ['horizontal', 'vertical']

describe('resolve, against the original resolver', () => {
  for (const device of ELEMENTERIAL_DEVICES) {
    for (const fontSize of FONT_SIZES) {
      for (const gridDirection of DIRECTIONS) {
        it(`${device} / ${fontSize} / ${gridDirection}`, () => {
          const key = `${device}|${fontSize}|${gridDirection}` as keyof typeof golden
          const expected = golden[key]

          expect(expected, `fixture missing for ${key}`).toBeDefined()
          // Round-tripped through JSON so `undefined` members compare the way the fixture
          // stored them, rather than failing on a key the original simply omitted.
          expect(JSON.parse(JSON.stringify(resolve(device, { fontSize, gridDirection })))).toEqual(
            expected,
          )
        })
      }
    }
  }
})

describe('resolve, properties worth stating outright', () => {
  it('fits exactly ten rows in the detailed list on every device', () => {
    // The line-height maths is the reason the theme's numbers come out round. If a font metric
    // were wrong, this is the assertion that would notice.
    for (const device of ELEMENTERIAL_DEVICES) {
      const l = resolve(device)
      expect(Math.floor(l.detailed.list.height / l.detailed.list.row), device).toBe(10)
    }
  })

  it('fits exactly seven rows in the video list on every device', () => {
    for (const device of ELEMENTERIAL_DEVICES) {
      const l = resolve(device)
      expect(Math.floor(l.video.list.height / l.video.list.row), device).toBe(7)
    }
  })

  it('only the 1:1 aspect shows a description in the detailed view', () => {
    expect(resolve('rg-cubexx').detailed.md_description).not.toBeNull()
    for (const device of ['rg35xx', 'rg351m', 'rg552'] as const) {
      expect(resolve(device).detailed.md_description, device).toBeNull()
    }
  })

  it('borrows the 4:3 overlay set for the 1:1 aspect, which ships none of its own', () => {
    expect(resolve('rg-cubexx').osdRatio).toBe('ratio43')
    expect(resolve('rg35xx').osdRatio).toBe('ratio43')
    expect(resolve('rg552').osdRatio).toBe('ratio53')
  })

  it('widens the grids on the 5:3 aspect', () => {
    expect(resolve('rg552').grid.cols).toBe(4)
    expect(resolve('rg552').boxes.cols).toBe(3)
    expect(resolve('rg552').elementflix.cols).toBe(5)

    expect(resolve('rg35xx').grid.cols).toBe(3)
    expect(resolve('rg35xx').boxes.cols).toBe(2)
    expect(resolve('rg35xx').elementflix.cols).toBe(3)
  })

  it('bleeds the carousel off both screen edges', () => {
    // The carousel box is wider than the screen, which is what puts a partial logo at each side.
    for (const device of ELEMENTERIAL_DEVICES) {
      const l = resolve(device)
      expect(l.system.carousel.width, device).toBeGreaterThan(l.w)
      expect(l.system.carousel.left, device).toBeLessThan(0)
    }
  })

  it('scales every font with the size setting', () => {
    const small = resolve('rg35xx', { fontSize: 'small' })
    const large = resolve('rg35xx', { fontSize: 'large' })

    for (const key of ['h1', 'h2', 'h3', 'body', 'caption']) {
      expect(large.font[key], key).toBeGreaterThan(small.font[key])
    }
  })

  it('changes the flix grid shape with the direction', () => {
    const horizontal = resolve('rg35xx', { gridDirection: 'horizontal' })
    const vertical = resolve('rg35xx', { gridDirection: 'vertical' })

    expect(horizontal.elementflix.fade.asset).toBe('fade-hor.png')
    expect(vertical.elementflix.fade.asset).toBe('fade-ver.png')
    expect(horizontal.elementflix.box.height).not.toBe(vertical.elementflix.box.height)
  })
})

describe('placement', () => {
  it('places a resolved box as literal pixels', () => {
    const box = resolve('rg35xx').detailed.md_image
    expect(placeEs(box)).toMatchObject({ position: 'absolute', left: `${box.left}px` })
  })

  it('anchors a contain image by its own edges rather than letterboxing it', () => {
    // ES shrinks the element to the fitted image, so the anchor and the rounded corners act on
    // the artwork. A fixed box with object-fit would round the empty box instead.
    const style = placeContain(resolve('rg35xx').detailed.md_marquee)

    expect(style.width).toBe('auto')
    expect(style.height).toBe('auto')
    expect(style.transform).toBe('translate(-50%, -50%)')
  })
})
