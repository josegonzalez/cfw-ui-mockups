import { describe, expect, it } from 'vitest'
import { compileStoryboard } from '../../anim/compile'
import { STORYBOARDS } from './storyboards'
import type { AnimationSpec, StoryboardMap } from '../../anim/types'

const DEVICE = { w: 1280, h: 720 }

function everyStoryboard(): Array<{ name: string; event: string; animations: readonly AnimationSpec[]; repeat?: string }> {
  const out: Array<{ name: string; event: string; animations: readonly AnimationSpec[]; repeat?: string }> = []
  for (const [name, map] of Object.entries(STORYBOARDS as Record<string, StoryboardMap>)) {
    for (const [event, sb] of Object.entries(map)) {
      if (sb) out.push({ name, event, animations: sb.animations, ...(sb.repeat ? { repeat: sb.repeat } : {}) })
    }
  }
  return out
}

function byProperty(animations: readonly AnimationSpec[]) {
  const groups = new Map<string, AnimationSpec[]>()
  for (const a of animations) {
    const list = groups.get(a.property) ?? []
    list.push(a)
    groups.set(a.property, list)
  }
  return groups
}

/**
 * The two invariants the compiler's simplifying assumptions rest on.
 *
 * Both were verified once by throwaway Python scripts against the upstream XML, and recorded
 * only as prose in the source notes. They are load-bearing - the compiler implements four
 * specific rules instead of a general merge precisely because these hold - so they are
 * assertions here rather than a paragraph somebody has to remember.
 *
 * The Python originals are kept in `docs/themes/playstation-x/reference/checks/` as source
 * analysis tooling. They scrape a separate checkout that is not in this repo, so they cannot
 * run as part of any suite; these cover the transcribed set instead.
 */
describe('storyboard corpus invariants', () => {
  it('never gives one property two repeating tracks in the same storyboard', () => {
    // A property group can carry at most one infinite track, which is what lets the compiler
    // put the finite tracks in one effect and the infinite one in a second rather than solving
    // a general merge.
    for (const sb of everyStoryboard()) {
      for (const [property, anims] of byProperty(sb.animations)) {
        const repeating = anims.filter((a) => a.repeat)
        expect(repeating.length, `${sb.name}.${sb.event} ${property}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('leaves every finite autoreverse track alone on its property', () => {
    /*
     * A merged track cannot express autoreverse through the renderer's `alternate` direction -
     * the reverse would have to be expanded into the keyframes instead. Every finite
     * autoreverse in the corpus is alone on its property, so the simple form is always
     * available.
     */
    for (const sb of everyStoryboard()) {
      for (const [property, anims] of byProperty(sb.animations)) {
        const finiteAutoreverse = anims.filter((a) => a.autoreverse && !a.repeat)
        if (finiteAutoreverse.length === 0) continue
        expect(anims.length, `${sb.name}.${sb.event} ${property}`).toBe(1)
      }
    }
  })
})

describe('the transcribed set', () => {
  it('normalises the source\'s two spellings of forever', () => {
    // The XML writes `repeat="-1"` in some places and `repeat="forever"` in others. Carrying
    // both through would mean every consumer handling two spellings of one thing.
    for (const sb of everyStoryboard()) {
      for (const a of sb.animations) {
        if (a.repeat !== undefined) expect(a.repeat).toBe('forever')
      }
      if (sb.repeat !== undefined) expect(sb.repeat).toBe('forever')
    }
  })

  it('compiles every storyboard without throwing', () => {
    for (const sb of everyStoryboard()) {
      const tracks = compileStoryboard({ animations: sb.animations, ...(sb.repeat ? { repeat: 'forever' as const } : {}) }, DEVICE)
      expect(tracks.length, `${sb.name}.${sb.event}`).toBeGreaterThan(0)
    }
  })

  it('binds every storyboard it carries', async () => {
    /*
     * Three of these - systemcarousel, caratula-overlay and gamegrid-enter - were transcribed
     * and never bound in the original mockup, so their motion existed as data and never ran.
     * This asserts the port reaches all of them.
     */
    const source = await import('./bindings')
    const bound = new Set(Object.values(source.BINDINGS))

    for (const name of Object.keys(STORYBOARDS)) {
      expect(bound.has(name as never), `${name} is never bound`).toBe(true)
    }
  })
})

describe('the signature motion', () => {
  it('runs three transform channels at once on the selection frame', () => {
    // scale, offsetX and offsetY together, which is why the renderer drives each through its
    // own custom property rather than composing a single transform.
    const activate = STORYBOARDS['marco-activo'].activateNext!
    const channels = new Set(activate.animations.map((a) => a.property))

    expect(channels.has('scale')).toBe(true)
    expect(channels.has('offsetX')).toBe(true)
    expect(channels.has('offsetY')).toBe(true)
  })

  it('rests an autoreverse track at its start, not its end', () => {
    /*
     * The frame's nudge is `to: -0.003` with autoreverse and no `from`, so it returns to the
     * channel's resting value. Resting at `to` instead would leave the frame permanently
     * displaced after the first cursor move - a bug that compounds rather than showing up once.
     */
    const nudge = STORYBOARDS['marco-activo'].activateNext!.animations.find(
      (a) => a.property === 'offsetX',
    )!
    expect(nudge.autoreverse).toBe(true)

    const tracks = compileStoryboard({ animations: [nudge] }, DEVICE)
    const track = tracks.find((t) => t.channel === 'offsetX')!
    expect(track.timing.direction).toBe('alternate')
    expect(track.keyframes[0]!.value).toBe(0)
  })
})
