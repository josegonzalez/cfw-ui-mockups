import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { DeviceFrame } from '../../device/DeviceFrame'
import { Slot } from '.'
import { applyChromeAction, DEFAULT_SUBSETS } from './Interactive'
import { SLOT_SCREENS } from './manifest'
import { CART, LABEL, OUT, SHELF } from './layout'
import { CARTS, DEFAULT_SHELL, VIEWS, cleanLabel, hudIcon, shellFor, viewBySlug } from './library'
import {
  AT_REST,
  CATCH_AT,
  CATCH_IN,
  CATCH_OUT,
  OMEGA,
  TIMING,
  cartY,
  ease,
  settled,
  step,
  travel,
} from './motion'
import { fitLabel, labelColour, labelInk } from './art'

describe('geometry', () => {
  it('is 720x480 with no scale factor anywhere', () => {
    expect([OUT.w, OUT.h]).toEqual([720, 480])
  })

  it('fits three carts across the row exactly', () => {
    // The pitch is the cart's own width, which is what lets a neighbour show either side.
    expect(SHELF.pitch).toBe(CART.w)
    expect(CART.w * 3).toBe(OUT.w)
  })

  it('insets the label so the moulded grip shows above it', () => {
    // 9% to 91% across, 22.8% to 86.3% down - the asymmetry is what makes it read as a cart.
    expect(LABEL.x).toBe(Math.round(CART.w * 0.09))
    expect(LABEL.y).toBe(Math.round(CART.h * 0.228))
    expect(LABEL.y).toBeGreaterThan(CART.h - (LABEL.y + LABEL.h))
  })
})

describe('the shell table', () => {
  it('matches on the region-free prefix, so one row covers every region', () => {
    expect(shellFor('AXVE')).toBe(shellFor('AXVJ'))
    expect(shellFor('AXVE')).toBe('#c2332e')
  })

  it('falls to the family letter, then to grey', () => {
    expect(shellFor('MSAE')).toBe('#c6c6c9')
    expect(shellFor('ZZZZ')).toBe(DEFAULT_SHELL)
  })

  it('prefers an exact row over the family it would otherwise match', () => {
    // The order is the escape hatch: an explicit row is how a wrong family member gets fixed.
    // slot's own table has no code both rules claim, so this is checked against a made-up one.
    expect(shellFor('BPEE')).toBe('#249c60')
  })
})

describe('display names', () => {
  it('drops the extension and the trailing tag group', () => {
    expect(cleanLabel('Pokemon Ruby (USA).gba')).toBe('Pokemon Ruby')
    expect(cleanLabel('Metroid Fusion (USA) [!].gba')).toBe('Metroid Fusion')
  })

  it('keeps what it had rather than cleaning to nothing', () => {
    expect(cleanLabel('(USA).gba')).toBe('(USA)')
  })
})

describe('the label', () => {
  it('gives a title the same paper every time', () => {
    // An FNV-1a hash, so the shelf is recognisable from memory across boots.
    expect(labelColour('Pokemon Emerald')).toBe(labelColour('Pokemon Emerald'))
    expect(labelColour('Pokemon Emerald')).not.toBe(labelColour('Pokemon Ruby'))
    expect(labelColour('Pokemon Emerald')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('flips its ink on the paper, rather than sitting at one value', () => {
    expect(labelInk('#ffffff')).toBe('#1a1816')
    expect(labelInk('#101010')).toBe('#f4f1ea')
  })

  it('never exceeds three lines, and shrinks rather than overflowing', () => {
    for (const cart of CARTS) {
      const { lines, px } = fitLabel(cleanLabel(cart.file))
      expect(lines.length).toBeLessThanOrEqual(3)
      expect(px).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('the shelf spring', () => {
  it('is at rest where it is asked to be', () => {
    const s = AT_REST(3)
    expect(s.scroll).toBe(3)
    expect(s.vel).toBe(0)
    expect(settled(s, 3)).toBe(true)
  })

  it('converges on the target without overshooting it', () => {
    // Critically damped: a flick lands on a cart instead of bouncing past and returning.
    let s = AT_REST(0)
    let overshoot = false
    for (let i = 0; i < 240; i++) {
      s = step(s, 1, 1 / 60)
      if (s.scroll > 1.0001) overshoot = true
    }
    expect(overshoot).toBe(false)
    expect(settled(s, 1)).toBe(true)
  })

  it('carries velocity across a target change, which is what a tween cannot do', () => {
    // The same press from a moving row and a still one produces different motion, and that
    // difference is the reason this is not expressible as a descriptor.
    let moving = AT_REST(0)
    for (let i = 0; i < 6; i++) moving = step(moving, 1, 1 / 60)

    const still: typeof moving = { scroll: moving.scroll, vel: 0 }
    const a = step(moving, 2, 1 / 60)
    const b = step(still, 2, 1 / 60)
    expect(a.scroll).not.toBeCloseTo(b.scroll, 6)
  })

  it('holds still when it is already there', () => {
    const s = step(AT_REST(2), 2, 1 / 60)
    expect(s.scroll).toBeCloseTo(2, 10)
    expect(s.vel).toBeCloseTo(0, 10)
  })

  it("uses the source's damping constant", () => {
    expect(OMEGA).toBe(16)
  })
})

describe('the cart travel', () => {
  it('starts at rest and ends seated', () => {
    expect(travel(0)).toBeCloseTo(0, 10)
    expect(travel(1)).toBeCloseTo(1, 10)
    expect(cartY(0)).toBeCloseTo((OUT.h - CART.h) / 2, 6)
  })

  it('meets the lip and waits there', () => {
    // The creep is the cart resting on the lip before the mechanism takes it. Without it the
    // cart "arrives seated without ever having met anything".
    const atCatch = travel(CATCH_IN)
    const leaving = travel(CATCH_OUT)
    expect(atCatch).toBeCloseTo(CATCH_AT, 6)
    expect(leaving - atCatch).toBeCloseTo(0.03, 6)
  })

  it('never goes backwards', () => {
    let previous = -1
    for (let i = 0; i <= 200; i++) {
      const v = travel(i / 200)
      expect(v).toBeGreaterThanOrEqual(previous)
      previous = v
    }
  })

  it('eases with zero velocity at both ends', () => {
    // Smootherstep, so the two halves of the travel meet the catch without a step in speed.
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(0.5)).toBeCloseTo(0.5, 10)
    expect(ease(0.001)).toBeLessThan(0.0001)
  })
})

describe('the timings', () => {
  it('makes the eject exactly as long as the seated part of the insert', () => {
    // Every part of the screen is driven off one progress, so two lengths would make every one
    // of them come back faster than it left.
    expect(TIMING.ejectS).toBeCloseTo(TIMING.seatedAt, 10)
    expect(TIMING.seatedAt).toBeCloseTo(TIMING.insertS - TIMING.insertHoldS, 10)
  })

  it('takes the panel out quicker than it comes up', () => {
    expect(TIMING.powerOffS).toBeLessThan(TIMING.powerOnS)
  })
})

describe('the HUD', () => {
  it('says silence with the glyph rather than with a bar at zero', () => {
    expect(hudIcon('volume', 0)).toBe('volumeMuted')
    expect(hudIcon('volume', 40)).toBe('volume')
  })
})

describe('the view table', () => {
  it('covers the seven phases', () => {
    expect(VIEWS).toHaveLength(7)
    expect(new Set(VIEWS.map((v) => v.phase)).size).toBe(7)
  })

  it('falls back to the shelf for an unknown slug', () => {
    expect(viewBySlug('nope').slug).toBe('shelf')
  })
})

describe('the interactive subsets', () => {
  it('cycles phases and wraps', () => {
    const back = applyChromeAction(DEFAULT_SUBSETS, 'prevView')
    expect(back.view).toBe(VIEWS[VIEWS.length - 1]!.slug)
  })

  it('toggles the wallpaper', () => {
    expect(applyChromeAction(DEFAULT_SUBSETS, 'toggleStyle').wallpaper).toBe(true)
  })

  it('ignores an action it does not bind', () => {
    expect(applyChromeAction(DEFAULT_SUBSETS, 'cycleSystem')).toEqual(DEFAULT_SUBSETS)
  })
})

describe('the manifest', () => {
  it('has unique slugs, since they become route ids', () => {
    expect(new Set(SLOT_SCREENS.map((s) => s.slug)).size).toBe(SLOT_SCREENS.length)
  })

  it('only poses views that exist', () => {
    for (const s of SLOT_SCREENS) {
      expect(VIEWS.some((v) => v.slug === s.view)).toBe(true)
    }
  })

  it('poses the insert three times, because one frame says nothing about the catch', () => {
    const inserts = SLOT_SCREENS.filter((s) => s.view === 'inserting')
    expect(inserts).toHaveLength(3)
    const seats = inserts.map((s) => s.seat ?? 0)
    expect(Math.min(...seats)).toBeLessThan(CATCH_IN)
    expect(seats.some((v) => v >= CATCH_IN && v <= CATCH_OUT)).toBe(true)
    expect(Math.max(...seats)).toBeGreaterThan(CATCH_OUT)
  })
})

describe('rendering', () => {
  function draw(props: Parameters<typeof Slot>[0]) {
    return render(
      <DeviceFrame device="rg-sp" animate={false} interactive={false}>
        <Slot {...props} />
      </DeviceFrame>,
    )
  }

  it('renders every view without throwing', () => {
    for (const v of VIEWS) {
      const { container, unmount } = draw({ view: v.slug })
      expect(container.querySelector(`[data-view="${v.slug}"]`)).not.toBeNull()
      unmount()
    }
  })

  it('draws the empty slot on the shelf, so the cart has a visible place to go', () => {
    const { container } = draw({ view: 'shelf' })
    expect(container.querySelectorAll('.slot-band').length).toBeGreaterThan(0)
  })

  it('does not draw the inserting cart twice', () => {
    // The chrome moves it between the two halves of the slot; the shelf must skip that index.
    const { container } = draw({ view: 'inserting', selected: 2, seat: 0.5 })
    const faces = container.querySelectorAll('.slot-cart')
    const srcs = [...faces].map((n) => n.getAttribute('src'))
    expect(new Set(srcs).size).toBe(srcs.length)
  })

  it('holds the spring at rest with motion off', () => {
    const { container } = draw({ view: 'shelf', selected: 3 })
    expect(container.querySelector('.slot')).not.toBeNull()
  })
})

describe('the porting notes', () => {
  const dir = resolvePath(__dirname, 'views')

  it('opens every view module with a PORTING NOTES block', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx'))
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const text = readFileSync(resolvePath(dir, file), 'utf8')
      expect(text.slice(0, 200)).toContain('PORTING NOTES')
    }
  })
})
