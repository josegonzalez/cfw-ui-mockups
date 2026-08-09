import { describe, expect, it } from 'vitest'
import { clamp, fitInto, place, placeAnchored, square } from './box'

describe('place', () => {
  it('emits absolute pixel geometry', () => {
    expect(place({ left: 10, top: 20, width: 300, height: 40 })).toEqual({
      position: 'absolute',
      left: '10px',
      top: '20px',
      width: '300px',
      height: '40px',
    })
  })

  it('emits the optional properties only when set', () => {
    const plain = place({ left: 0, top: 0, width: 1, height: 1 })
    expect(plain).not.toHaveProperty('fontSize')
    expect(plain).not.toHaveProperty('borderRadius')
    expect(plain).not.toHaveProperty('zIndex')

    expect(place({ left: 0, top: 0, width: 1, height: 1, font: 16.8, radius: 5, z: -9 })).toMatchObject({
      fontSize: '16.8px',
      borderRadius: '5px',
      zIndex: -9,
    })
  })

  it('keeps fractional pixels, because the resolvers produce them', () => {
    // Row pitch and tile sizes divide out to fractions. Rounding here would accumulate a
    // visible drift down a ten-row list.
    expect(place({ left: 21.333, top: 96, width: 640, height: 34.1567 })).toMatchObject({
      left: '21.333px',
      height: '34.1567px',
    })
  })
})

describe('placeAnchored', () => {
  it('shifts the element by its own origin fraction', () => {
    // The translate is on the element's own size, which is exactly what a fixed box with
    // object-fit cannot express.
    expect(placeAnchored({ posX: 100, posY: 50, originX: 0.5, originY: 0.5, maxWidth: 200, maxHeight: 80 })).toEqual({
      position: 'absolute',
      left: '100px',
      top: '50px',
      maxWidth: '200px',
      maxHeight: '80px',
      width: 'auto',
      height: 'auto',
      transform: 'translate(-50%, -50%)',
    })
  })

  it('leaves a top-left origin untranslated', () => {
    expect(
      placeAnchored({ posX: 0, posY: 0, originX: 0, originY: 0, maxWidth: 10, maxHeight: 10 }).transform,
    ).toBe('translate(0%, 0%)')
  })

  it('auto-sizes rather than filling the slot', () => {
    const style = placeAnchored({ posX: 0, posY: 0, originX: 0, originY: 0, maxWidth: 10, maxHeight: 10 })
    expect(style.width).toBe('auto')
    expect(style.height).toBe('auto')
  })
})

describe('fitInto', () => {
  it('constrains by the tighter axis', () => {
    expect(fitInto(100, 100, 400, 200)).toEqual({ width: 100, height: 50 })
    expect(fitInto(100, 100, 200, 400)).toEqual({ width: 50, height: 100 })
  })

  it('scales up as well as down', () => {
    expect(fitInto(400, 400, 100, 50)).toEqual({ width: 400, height: 200 })
  })

  it('falls back to the slot when the natural size is unusable', () => {
    expect(fitInto(100, 80, 0, 0)).toEqual({ width: 100, height: 80 })
  })
})

describe('square', () => {
  it('takes the smaller axis', () => {
    // On a 16:9 panel a single authored fraction resolves to two very different pixel sizes.
    expect(square(1280 * 0.027, 720 * 0.027)).toBeCloseTo(19.44, 5)
  })
})

describe('clamp', () => {
  it('bounds a value', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})
