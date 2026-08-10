import { describe, expect, it } from 'vitest'
import { resolve, type PsxState } from './layout'

/**
 * The top bar against `_theme_views/top-info.xml` at `26ce759`, not against the legacy mockup.
 *
 * The legacy is one transcription of that XML and this block is where it was found wanting, so
 * `layout.test.ts` excludes `topInfo` from the golden gate and these assertions stand in its
 * place. Each cites the line it comes from, so a disagreement can be settled by reading the
 * source rather than by arguing about which mockup is right.
 *
 * The two 480-tall devices are the point. They are `4-3` and `3-2`, and several of the rows the
 * transcription missed are written for one aspect or the other - so a rule tested only on the
 * RG35XX would still have missed the RG34XX.
 */
const BASE: PsxState = { carousel: 'medium', 'carousel-type': 'PS4', 'top-info': 'default' }

const top = (
  device: 'rg35xx' | 'rg34xx' | 'rg552' | 'trimui-smart-pro',
  view: 'system' | 'gamelist' = 'gamelist',
) => resolve(device, { ...BASE, view }).topInfo

describe('what the small screens hide', () => {
  it('hides the release year on 4-3 and 3-2 - :529', () => {
    // It was drawn on both, landing under the trophy, which is how the clash was noticed.
    expect(top('rg35xx').year.visible).toBe(false)
    expect(top('rg34xx').year.visible).toBe(false)
  })

  it('keeps the year on 16-9 and 5-3', () => {
    expect(top('trimui-smart-pro').year.visible).not.toBe(false)
    expect(top('rg552').year.visible).not.toBe(false)
  })

  it('hides the star on the same three aspects - :509', () => {
    expect(top('rg35xx').starPicto.visible).toBe(false)
    expect(top('rg34xx').starPicto.visible).toBe(false)
    expect(top('trimui-smart-pro').starPicto.visible).not.toBe(false)
  })

  it('hides the frontend logo and its plus pictogram on tinyScreen - :84-91', () => {
    for (const device of ['rg35xx', 'rg34xx'] as const) {
      expect(top(device, 'system').frontendLogo.visible, device).toBe(false)
      expect(top(device, 'system').plusPicto.visible, device).toBe(false)
    }
  })

  it('hides the system cover art on tinyScreen - :259-265', () => {
    expect(top('rg35xx').caratulaTop.visible).toBe(false)
    expect(top('rg34xx').caratulaTop.visible).toBe(false)
    expect(top('trimui-smart-pro').caratulaTop.visible).not.toBe(false)
  })

  it('leaves the two 480-tall devices with an empty top-left corner', () => {
    // All three elements that could fill it are hidden, and the ticker moves to the screen edge
    // to take the space - :385 puts it at 0.065 rather than 0.162.
    for (const device of ['rg35xx', 'rg34xx'] as const) {
      const T = top(device)
      expect(T.caratulaTop.visible, device).toBe(false)
      expect(T.infoText.left / resolve(device, BASE).w).toBeCloseTo(0.065, 3)
    }
  })
})

describe('which view an element belongs to', () => {
  it('scopes the logo and plus pictogram to the system view - :53', () => {
    expect(top('trimui-smart-pro').frontendLogo.viewScope).toBe('system')
    expect(top('trimui-smart-pro').plusPicto.viewScope).toBe('system')
  })

  it('scopes the cover art to the gamelist views - :173', () => {
    expect(top('trimui-smart-pro').caratulaTop.viewScope).toBe('gamelist')
  })
})

describe('the achievements trophy', () => {
  it('is a static element one z below the pulse that overlays it - :197 and :187', () => {
    const T = top('trimui-smart-pro')
    expect(T.trophy.z).toBe(98)
    expect(T.cheevosPicto.z).toBe(99)
  })

  it('puts the pulse at the trophy’s own coordinates', () => {
    for (const device of ['rg35xx', 'rg34xx', 'rg552', 'trimui-smart-pro'] as const) {
      const T = top(device)
      expect([T.cheevosPicto.left, T.cheevosPicto.top], device).toEqual([T.trophy.left, T.trophy.top])
    }
  })
})

describe('the per-aspect coordinates the transcription dropped', () => {
  it('moves the star on 5-3 - :502', () => {
    expect(top('rg552').starPicto.left / 1920).toBeCloseTo(0.86, 4)
  })

  it('moves the year on 5-3 - :516', () => {
    expect(top('rg552').year.left / 1920).toBeCloseTo(0.88, 4)
  })

  it('moves the version tag on 4-3 - :420', () => {
    expect(top('rg35xx').version.left / 640).toBeCloseTo(0.547, 4)
    expect(top('trimui-smart-pro').version.left / 1280).toBeCloseTo(0.563, 4)
  })

  it('shrinks the clock on tinyScreen - :17', () => {
    expect(top('rg35xx').clock.font / 480).toBeCloseTo(0.027, 4)
    expect(top('trimui-smart-pro').clock.font / 720).toBeCloseTo(0.029, 4)
  })

  it('widens the username on 3-2 and grows its font - :481 and :485', () => {
    expect(top('rg34xx').username.w / 720).toBeCloseTo(0.205, 4)
    expect(top('rg34xx').username.font / 480).toBeCloseTo(0.03, 4)
  })
})

describe('the blue dots', () => {
  it('places each from its own authored position - :404 and :434', () => {
    const T = top('trimui-smart-pro')
    expect(T.versionDot.left / 1280).toBeCloseTo(0.551, 4)
    expect(T.avatarDot.left / 1280).toBeCloseTo(0.604, 4)
  })

  it('shifts the version dot on 4-3 - :406', () => {
    expect(top('rg35xx').versionDot.left / 640).toBeCloseTo(0.532, 4)
  })
})
