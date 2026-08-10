import { describe, expect, it } from 'vitest'
import {
  COLOR_SETS,
  cssColor,
  paletteVariables,
  SECONDARY_COLORS,
  SECONDARY_KEYS,
  tokens,
} from './palette'
import golden from './__fixtures__/palette.golden.json'

/** The token maps against the original's own output, across all 18 combinations. */
describe('tokens against the original', () => {
  for (const colorset of COLOR_SETS) {
    for (const secondary of SECONDARY_COLORS) {
      it(`matches ${colorset}|${secondary}`, () => {
        expect(tokens(colorset, secondary)).toEqual(
          (golden as Record<string, unknown>)[`${colorset}|${secondary}`],
        )
      })
    }
  }
})

describe('the secondary accent', () => {
  it('overrides exactly eight keys and nothing else', () => {
    /*
     * The count is the point: a ninth key added to the override list and not to
     * `SECONDARY_KEYS` would change a colour the documentation says is fixed, and nothing else
     * would flag it.
     *
     * Purple rather than red, because red is `DF0024` and so is the blue set's own star fill -
     * an override to the value a key already holds is invisible to a value comparison, and the
     * test would report seven.
     */
    const base = tokens('blue', 'default')
    const accented = tokens('blue', 'purple')

    const changed = Object.keys(base).filter((k) => base[k] !== accented[k])
    expect(changed.sort()).toEqual([...SECONDARY_KEYS].sort())
    expect(SECONDARY_KEYS).toHaveLength(8)
  })

  it('leaves everything alone on default', () => {
    expect(tokens('black', 'default')).toEqual(tokens('black', 'default'))
    const base = tokens('black', 'default')
    expect(base.gamelistSelectorColor).toBe('666666')
  })

  it('gives black its own grid selection, which is the one that is not the accent', () => {
    const t = tokens('blue', 'black')
    expect(t.gamelistSelectorColor).toBe('666666')
    expect(t.backgroundgridSelect).toBe('cccccc')
  })
})

describe('colour parsing', () => {
  it('reads the eight-digit form as RGBA', () => {
    // `ffffff69` is white at 41%. Read as six digits with stray characters it becomes opaque
    // white, and the screen is silently wrong rather than broken.
    expect(cssColor('ffffff69')).toBe('rgba(255,255,255,0.412)')
  })

  it('passes the six-digit form through as a hex colour', () => {
    expect(cssColor('DF0024')).toBe('#DF0024')
    expect(cssColor('#DF0024')).toBe('#DF0024')
  })

  it('treats a missing colour as transparent rather than black', () => {
    expect(cssColor(undefined)).toBe('transparent')
    expect(cssColor('')).toBe('transparent')
  })
})

describe('published variables', () => {
  it('publishes every token, not a hand-picked subset', () => {
    // The original published 19 of 34 and then hardcoded several of the rest, so changing the
    // accent left them behind. See docs/porting/playstation-x.md.
    const t = tokens('blue', 'default')
    const vars = paletteVariables('blue', 'default')

    expect(Object.keys(vars)).toHaveLength(Object.keys(t).length)
    expect(vars['--psx-gamelistSelectorColor']).toBe('#F3C300')
  })

  it('flattens the dotted token names into usable property names', () => {
    const vars = paletteVariables('blue', 'default')
    expect(vars['--psx-sistema-lineainferior']).toBe('#0070d1')
    expect(vars['--psx-grid-starFill']).toBe('#F3C300')
  })

  it('follows the accent everywhere it reaches', () => {
    const vars = paletteVariables('blue', 'purple')
    expect(vars['--psx-gamelistSelectorColor']).toBe('#8159ED')
    expect(vars['--psx-grid-starFill']).toBe('#8159ED')
    expect(vars['--psx-sistema-lineainferior']).toBe('#8159ED')
  })
})
