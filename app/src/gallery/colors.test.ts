import { describe, expect, it } from 'vitest'
import {
  compositeOver,
  contrastRatio,
  parseHexColor,
  readableInk,
  relativeLuminance,
  swatchFor,
} from './colors'

describe('parseHexColor', () => {
  it('parses the three hex forms, with or without a hash', () => {
    expect(parseHexColor('#4cc9f0')).toEqual({ r: 76, g: 201, b: 240, a: 1 })
    expect(parseHexColor('4cc9f0')).toEqual({ r: 76, g: 201, b: 240, a: 1 })
    expect(parseHexColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
  })

  it('reads the alpha byte of an eight-digit colour', () => {
    // The source palettes store alpha this way, e.g. `ffffff69`.
    const parsed = parseHexColor('ffffff69')!
    expect(parsed).toMatchObject({ r: 255, g: 255, b: 255 })
    expect(parsed.a).toBeCloseTo(0x69 / 255, 5)
  })

  it('is case insensitive', () => {
    expect(parseHexColor('#ED5353')).toEqual(parseHexColor('#ed5353'))
  })

  it('rejects anything that is not a colour', () => {
    // A seven-character commit hash is the collision that matters: these documents cite them.
    expect(parseHexColor('e710525')).toBeNull()
    expect(parseHexColor('26ce759')).toBeNull()
    expect(parseHexColor('#12')).toBeNull()
    expect(parseHexColor('nothex')).toBeNull()
    expect(parseHexColor('')).toBeNull()
  })
})

describe('compositeOver', () => {
  it('leaves an opaque colour alone', () => {
    expect(compositeOver({ r: 10, g: 20, b: 30, a: 1 }, { r: 0, g: 0, b: 0 })).toEqual({
      r: 10,
      g: 20,
      b: 30,
    })
  })

  it('blends a translucent colour onto the surface', () => {
    expect(compositeOver({ r: 255, g: 255, b: 255, a: 0.5 }, { r: 0, g: 0, b: 0 })).toEqual({
      r: 128,
      g: 128,
      b: 128,
    })
  })
})

describe('relativeLuminance', () => {
  it('spans black to white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })

  it('weights green above red above blue', () => {
    const red = relativeLuminance({ r: 255, g: 0, b: 0 })
    const green = relativeLuminance({ r: 0, g: 255, b: 0 })
    const blue = relativeLuminance({ r: 0, g: 0, b: 255 })

    expect(green).toBeGreaterThan(red)
    expect(red).toBeGreaterThan(blue)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 4)
    expect(contrastRatio({ r: 76, g: 201, b: 240 }, { r: 76, g: 201, b: 240 })).toBeCloseTo(1, 5)
  })

  it('does not care which way round the two colours are given', () => {
    const a = { r: 30, g: 60, b: 90 }
    const b = { r: 200, g: 180, b: 20 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })
})

describe('readableInk', () => {
  it('puts dark ink on light colours and light ink on dark ones', () => {
    expect(readableInk({ r: 255, g: 255, b: 255 })).toBe('#000000')
    expect(readableInk({ r: 18, g: 20, b: 28 })).toBe('#ffffff')
  })

  it('distinguishes mid-tones that a lightness threshold would get wrong', () => {
    // Both sit near the middle of the range, and they want different ink.
    expect(readableInk({ r: 76, g: 201, b: 240 })).toBe('#000000')
    expect(readableInk({ r: 34, g: 69, b: 204 })).toBe('#ffffff')
  })

  it('always achieves at least readable contrast across every documented palette colour', () => {
    const palette = [
      '#ED5353', '#F37329', '#F9C440', '#68B723', '#28BCA3', '#3689E6', '#A56DE2',
      '#DE3E80', '#8A715E', '#667885', '#0070d1', '#003791', '#F3C300', '#00AD9E',
      '#F2001A', '#666666', '#2245cc', '#7a3fd4', '#c0264b', '#d97b1f', '#1f9e46',
      '#12939c', '#d4569b', '#7f8c9b', '#101216', '#1a9fff', '#4cc9f0', '#12141c',
      '#1b1e2b', '#2a2e40', '#e7e9f0', '#8b90a3',
    ]

    for (const hex of palette) {
      const swatch = swatchFor(hex)!
      // 4.5:1 is the WCAG threshold for body text; the point of choosing ink by contrast is
      // that every entry clears it rather than most of them.
      expect(swatch.contrast, `${hex} with ${swatch.ink}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('swatchFor', () => {
  it('renders an opaque colour as a solid background', () => {
    expect(swatchFor('#4cc9f0')).toMatchObject({
      background: 'rgb(76 201 240)',
      ink: '#000000',
    })
  })

  it('keeps the alpha, and picks ink for what the eye sees over the surface', () => {
    const swatch = swatchFor('#ffffff20')!
    expect(swatch.background).toBe('rgb(255 255 255 / 12.5%)')
    // Nearly transparent white over a near-black surface stays dark, so the ink is light.
    expect(swatch.ink).toBe('#ffffff')
  })

  it('returns null for a non-colour', () => {
    expect(swatchFor('e710525')).toBeNull()
  })
})
