import { describe, expect, it } from 'vitest'
import {
  compileStoryboard,
  isAmbient,
  restingValues,
  storyboardForEvent,
} from './compile'
import type { DeviceContext, Storyboard, StoryboardMap } from './types'

const ctx: DeviceContext = { w: 640, h: 480 }

describe('compileStoryboard', () => {
  it('resolves length channels against the device, and leaves unitless ones alone', () => {
    const sb: Storyboard = {
      animations: [
        { property: 'offsetX', from: 0.5, to: 0, duration: 100 },
        { property: 'offsetY', from: 0.25, to: 0, duration: 100 },
        { property: 'opacity', from: 0, to: 1, duration: 100 },
      ],
    }
    const tracks = compileStoryboard(sb, ctx)

    expect(tracks.find((t) => t.channel === 'offsetX')!.keyframes[0]!.value).toBe(320)
    expect(tracks.find((t) => t.channel === 'offsetY')!.keyframes[0]!.value).toBe(120)
    expect(tracks.find((t) => t.channel === 'opacity')!.keyframes[0]!.value).toBe(0)
  })

  it('treats a missing `to` as a return to the channel resting value', () => {
    // Upstream this means "animate to the element's authored value". Because authored position
    // is left/top rather than a transform, that value is the channel identity.
    const sb: Storyboard = { animations: [{ property: 'offsetY', from: 0.1, duration: 350 }] }
    const [track] = compileStoryboard(sb, ctx)

    expect(track!.keyframes.at(-1)!.value).toBe(0)
  })

  it('treats a missing `from` as starting at the channel resting value', () => {
    const sb: Storyboard = { animations: [{ property: 'opacity', to: 0, duration: 100 }] }
    const [track] = compileStoryboard(sb, ctx)

    expect(track!.keyframes[0]!.value).toBe(1)
  })

  it('holds the previous value until a delayed track begins', () => {
    // Without the hold frames, a track beginning at 300ms would interpolate from t=0 and drift
    // visibly for the whole delay.
    const sb: Storyboard = {
      animations: [
        { property: 'opacity', from: 0, to: 0, duration: 100 },
        { property: 'opacity', from: 0, to: 1, begin: 300, duration: 500 },
      ],
    }
    const [track] = compileStoryboard(sb, ctx)
    const total = track!.timing.duration

    expect(total).toBe(800)
    // Everything before 300ms sits at 0.
    for (const kf of track!.keyframes.filter((k) => k.offset < 300 / total)) {
      expect(kf.value).toBe(0)
    }
    expect(track!.keyframes.at(-1)!.value).toBe(1)
  })

  it('compiles a lone autoreverse track as two alternating iterations of one leg', () => {
    // `duration` counts one leg, so the round trip is 300ms in total, not 150ms.
    const sb: Storyboard = {
      animations: [{ property: 'offsetX', to: -0.003, duration: 150, mode: 'ease', autoreverse: true }],
    }
    const [track] = compileStoryboard(sb, ctx)

    expect(track!.timing.duration).toBe(150)
    expect(track!.timing.iterations).toBe(2)
    expect(track!.timing.direction).toBe('alternate')
    expect(track!.keyframes).toHaveLength(2)
    expect(track!.keyframes[0]!.value).toBe(0)
    expect(track!.keyframes[1]!.value).toBeCloseTo(-0.003 * 640, 6)
  })

  it('expands the return leg when an autoreverse track shares its channel', () => {
    // No case in the authored data hits this today, but expanding rather than dropping means a
    // future one cannot silently lose its return leg.
    const sb: Storyboard = {
      animations: [
        { property: 'opacity', from: 0, to: 1, duration: 100 },
        { property: 'opacity', to: 0.3, begin: 100, duration: 200, autoreverse: true },
      ],
    }
    const [track] = compileStoryboard(sb, ctx)

    expect(track!.timing.duration).toBe(500) // 100 + 200 out + 200 back
    expect(track!.timing.iterations).toBe(1)
    expect(track!.keyframes.at(-1)!.value).toBe(1) // back where the reversing leg started
  })

  it('gives a repeating track its own endless timeline alongside the finite ones', () => {
    const sb: Storyboard = {
      animations: [
        { property: 'opacity', from: 0, to: 1, duration: 500, mode: 'easeInOut' },
        {
          property: 'opacity',
          from: 1,
          to: 0.3,
          begin: 1000,
          duration: 500,
          mode: 'easeInOut',
          autoreverse: true,
          repeat: 'forever',
        },
      ],
    }
    const tracks = compileStoryboard(sb, ctx)

    expect(tracks).toHaveLength(2)
    expect(tracks[0]!.timing.iterations).toBe(1)
    expect(tracks[0]!.timing.fill).toBe('forwards')
    expect(tracks[1]!.timing.iterations).toBe(Infinity)
    expect(tracks[1]!.timing.delay).toBe(1000)
    expect(tracks[1]!.timing.direction).toBe('alternate')
  })

  it('merges every track on a channel into one loop when the storyboard itself repeats', () => {
    // The two-block ticker: a group repeat cycles the whole storyboard rather than any one
    // track, so both halves stay in phase.
    const sb: Storyboard = {
      repeat: 'forever',
      animations: [
        { property: 'opacity', from: 1, to: 0, begin: 2000, duration: 350, mode: 'easeOut' },
        { property: 'opacity', from: 0, to: 1, begin: 5000, duration: 350, mode: 'easeIn' },
      ],
    }
    const tracks = compileStoryboard(sb, ctx)

    expect(tracks).toHaveLength(1)
    expect(tracks[0]!.timing.duration).toBe(5350)
    expect(tracks[0]!.timing.iterations).toBe(Infinity)
  })

  it('never emits a zero-length timeline', () => {
    const sb: Storyboard = { animations: [{ property: 'opacity', to: 1, duration: 0 }] }
    const [track] = compileStoryboard(sb, ctx)

    expect(track!.timing.duration).toBeGreaterThan(0)
  })

  it('ignores tracks naming an unknown channel rather than throwing', () => {
    const sb = {
      animations: [
        { property: 'notAChannel', to: 1, duration: 100 },
        { property: 'opacity', to: 0, duration: 100 },
      ],
    } as unknown as Storyboard

    expect(compileStoryboard(sb, ctx)).toHaveLength(1)
  })

  it('keeps concurrent transform channels as separate tracks', () => {
    // Three transform channels run at once. Collapsing them into a single animated transform
    // would silently drop two of the three.
    const sb: Storyboard = {
      animations: [
        { property: 'scale', from: 0.94, to: 1, duration: 300, mode: 'bump' },
        { property: 'offsetX', to: -0.003, duration: 150, mode: 'ease', autoreverse: true },
        { property: 'offsetY', to: -0.008, duration: 150, mode: 'ease', autoreverse: true },
      ],
    }
    const tracks = compileStoryboard(sb, ctx)

    expect(tracks.map((t) => t.channel)).toEqual(['scale', 'offsetX', 'offsetY'])
  })
})

describe('restingValues', () => {
  it('rests an autoreverse track at its `from`, not its `to`', () => {
    // The one that bites. An autoreverse track plays out and back, so it comes to rest where it
    // began. Resting it at `to` leaves every static screen displaced by the outbound leg.
    const sb: Storyboard = {
      animations: [{ property: 'offsetX', to: -0.003, duration: 150, autoreverse: true }],
    }
    expect(restingValues(sb, ctx).get('offsetX')).toBe(0)
  })

  it('rests a one-shot at its final value', () => {
    const sb: Storyboard = { animations: [{ property: 'opacity', from: 0, to: 1, duration: 500 }] }
    expect(restingValues(sb, ctx).get('opacity')).toBe(1)
  })

  it('rests a repeat-only track where it visually begins', () => {
    const sb: Storyboard = {
      animations: [
        { property: 'opacity', from: 1, to: 0.6, duration: 400, autoreverse: true, repeat: 'forever' },
      ],
    }
    expect(restingValues(sb, ctx).get('opacity')).toBe(1)
  })

  it('rests a group-repeat storyboard at the first authored value', () => {
    const sb: Storyboard = {
      repeat: 'forever',
      animations: [
        { property: 'opacity', from: 1, to: 0, begin: 2000, duration: 350 },
        { property: 'opacity', from: 0, to: 1, begin: 5000, duration: 350 },
      ],
    }
    expect(restingValues(sb, ctx).get('opacity')).toBe(1)
  })

  it('resolves length channels the same way the compiler does', () => {
    const sb: Storyboard = { animations: [{ property: 'offsetY', from: 0.1, to: 0.5, duration: 100 }] }
    expect(restingValues(sb, ctx).get('offsetY')).toBe(240)
  })
})

describe('storyboardForEvent', () => {
  const marquee: Storyboard = { animations: [{ property: 'scale', from: 0.9, to: 1, duration: 350 }] }
  const opened: Storyboard = { animations: [{ property: 'opacity', from: 0, to: 1, duration: 500 }] }

  it('prefers an exact event match', () => {
    const defs: StoryboardMap = { open: opened, _: marquee }
    expect(storyboardForEvent(defs, 'open')).toBe(opened)
  })

  it('falls back to the no-event block when the event has none', () => {
    // Without this fallback every ambient animation in a theme goes silent: the ticker, the
    // background drift, the badge pulses are all authored with no event.
    const defs: StoryboardMap = { _: marquee }
    expect(storyboardForEvent(defs, 'activateNext')).toBe(marquee)
  })

  it('returns undefined when nothing answers', () => {
    expect(storyboardForEvent({ open: opened }, 'activateNext')).toBeUndefined()
    expect(storyboardForEvent(undefined, 'open')).toBeUndefined()
  })
})

describe('isAmbient', () => {
  const block: Storyboard = { animations: [{ property: 'opacity', to: 1, duration: 100 }] }

  it('is true when only the no-event block answers', () => {
    expect(isAmbient({ _: block }, 'activateNext')).toBe(true)
  })

  it('is false when the event has its own block', () => {
    expect(isAmbient({ activateNext: block, _: block }, 'activateNext')).toBe(false)
  })

  it('is false when there is no ambient block at all', () => {
    expect(isAmbient({ open: block }, 'activateNext')).toBe(false)
  })
})
