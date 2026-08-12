import { describe, expect, it } from 'vitest'
import { resolve, type PsxState } from './layout'

/**
 * The system view against the upstream carousel option files, not against the original mockup.
 *
 * The block is a three-axis matrix - carousel size by console style by aspect ratio - and the
 * transcription only ever carried the first two. Every device but the 16:9 one therefore drew
 * the chooser's text and frame at the 16:9 coordinates.
 *
 * Sources are `_theme_options/carousel-sizes/{big,medium,small}.xml` and
 * `_theme_options/systemcarousels/carousel-ps{3,4,5}.xml`. Which file applies is chosen by
 * `theme.xml`'s include rather than by any condition inside it, so a row's file *is* part of its
 * condition - which is why the port keys these on `carousel` and `carousel-type`.
 */
const BASE = { 'top-info': 'default', view: 'system' } as const
const at = (device: string, carousel: string, type: string) =>
  resolve(device as never, { ...BASE, carousel, 'carousel-type': type } as PsxState).system

describe('the system name moves with the aspect ratio', () => {
  /** PS4 at medium - what every static screen and the default interactive state boots with. */
  it('places it per aspect, not at the 16:9 coordinate everywhere', () => {
    expect(at('trimui-smart-pro', 'medium', 'PS4').systemName.left / 1280).toBeCloseTo(0.335, 4)
    expect(at('rg35xx', 'medium', 'PS4').systemName.left / 640).toBeCloseTo(0.295, 4)
    expect(at('rg34xx', 'medium', 'PS4').systemName.left / 720).toBeCloseTo(0.364, 4)
    expect(at('rg552', 'medium', 'PS4').systemName.left / 1920).toBeCloseTo(0.345, 4)
  })

  it('keeps a distinct coordinate per carousel size', () => {
    // big, medium and small are three different files, each with its own aspect table.
    const big = at('rg35xx', 'big', 'PS4').systemName.left / 640
    const medium = at('rg35xx', 'medium', 'PS4').systemName.left / 640
    const small = at('rg35xx', 'small', 'PS4').systemName.left / 640
    expect(new Set([big, medium, small]).size).toBe(3)
    expect(big).toBeCloseTo(0.36, 4)
    expect(small).toBeCloseTo(0.266, 4)
  })

  it('sizes the font per aspect', () => {
    // `front.xml` writes two rows for 4-3 - 0.055 then 0.076 - and the later one wins.
    expect(at('rg35xx', 'medium', 'PS4').systemName.font / 480).toBeCloseTo(0.076, 4)
    expect(at('rg34xx', 'medium', 'PS4').systemName.font / 480).toBeCloseTo(0.06, 4)
    expect(at('trimui-smart-pro', 'medium', 'PS4').systemName.font / 720).toBeCloseTo(0.068, 4)
  })
})

describe('the selection frame', () => {
  it('sits far left on a 4:3 panel rather than at the 16:9 x', () => {
    expect(at('trimui-smart-pro', 'medium', 'PS4').marcoActivo.left / 1280).toBeCloseTo(0.162, 4)
    expect(at('rg35xx', 'medium', 'PS4').marcoActivo.left / 640).toBeCloseTo(0.063, 4)
  })

  it('takes a slightly smaller frame on 3:2', () => {
    // `maxSize` is a bounding box the art is fitted inside, so compare the two devices' fitted
    // widths against each other rather than against the authored 0.347 / 0.346.
    const wide = at('trimui-smart-pro', 'medium', 'PS4').marcoActivo.w / 1280
    const narrow = at('rg34xx', 'medium', 'PS4').marcoActivo.w / 720
    expect(narrow).toBeGreaterThan(wide)
  })
})

describe('the Start pill', () => {
  it('follows the frame to the left edge on 4:3', () => {
    expect(at('rg35xx', 'medium', 'PS4').start.left / 640).toBeCloseTo(0.067, 4)
    expect(at('trimui-smart-pro', 'medium', 'PS4').start.left / 1280).toBeCloseTo(0.165, 4)
  })

  it('widens per aspect', () => {
    expect(at('rg35xx', 'medium', 'PS4').start.w / 640).toBeCloseTo(0.215, 4)
    expect(at('rg34xx', 'medium', 'PS4').start.w / 720).toBeCloseTo(0.19, 4)
    expect(at('rg552', 'medium', 'PS4').start.w / 1920).toBeCloseTo(0.172, 4)
  })
})

describe('the carousel strip', () => {
  it('is wider and further left on the narrower aspects', () => {
    // A 4:3 panel fits fewer tiles across, so the strip grows and shifts to keep the selected
    // cell under a frame that does not move.
    expect(at('rg35xx', 'medium', 'PS4').carousel.left / 640).toBeCloseTo(-0.94, 3)
    expect(at('rg34xx', 'medium', 'PS4').carousel.left / 720).toBeCloseTo(-0.75, 3)
    expect(at('trimui-smart-pro', 'medium', 'PS4').carousel.left / 1280).toBeCloseTo(-0.595, 3)
  })

  it('caps the tile count per aspect on the PS5 style', () => {
    expect(at('rg35xx', 'medium', 'PS5').carousel.maxLogoCount).toBe(17)
    expect(at('rg34xx', 'medium', 'PS5').carousel.maxLogoCount).toBe(19)
    expect(at('trimui-smart-pro', 'medium', 'PS5').carousel.maxLogoCount).toBe(22)
  })
})
