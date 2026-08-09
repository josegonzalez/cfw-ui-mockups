import { CHANNELS, resolveChannelValue } from './channels'
import type {
  AnimationSpec,
  Channel,
  CompiledKeyframe,
  CompiledTrack,
  DeviceContext,
  Storyboard,
  StoryboardEventKey,
  StoryboardMap,
} from './types'

/**
 * Compile authored storyboards into a renderer-neutral timeline.
 *
 * Nothing in this file touches the DOM, and nothing in it knows about CSS. It is the half of
 * the animation system that a non-web renderer keeps; `waapi.ts` is the half it replaces.
 *
 * The compiler implements four rules rather than a general merge, and it can do that only
 * because two properties hold across the whole authored corpus:
 *
 *   - no property ever carries more than one repeating track
 *   - every finite autoreverse track is alone on its property
 *
 * Both were originally verified by scraping the upstream XML and recorded only as prose. They
 * are asserted in `storyboard-invariants.test.ts` against the transcribed data, so if a future
 * transcription breaks one, the assumption fails loudly here rather than producing subtly
 * wrong motion.
 */

/** Where a track begins, honouring the "no `from` means start at rest" rule. */
function startValue(a: AnimationSpec): number {
  return a.from ?? CHANNELS[a.property].rest
}

/** Where a track ends, honouring the "no `to` means return to rest" rule. */
function endValue(a: AnimationSpec): number {
  return a.to ?? CHANNELS[a.property].rest
}

/** Group a storyboard's tracks by channel, preserving authored order. */
function byChannel(anims: readonly AnimationSpec[]): Array<[Channel, AnimationSpec[]]> {
  const groups = new Map<Channel, AnimationSpec[]>()
  for (const a of anims) {
    if (!Object.hasOwn(CHANNELS, a.property)) continue
    const existing = groups.get(a.property)
    if (existing) existing.push(a)
    else groups.set(a.property, [a])
  }
  return [...groups]
}

interface Segment {
  begin: number
  dur: number
  from: number
  to: number
  mode: AnimationSpec['mode']
}

/**
 * Expand one track into timeline segments.
 *
 * With `autoreverse`, `duration` counts one leg, so the track becomes two segments. A lone
 * autoreverse track is expressed exactly by the two-iteration alternate form below and never
 * reaches here; this expansion exists for an autoreverse track that shares its channel with
 * another, where one merged track has to carry the return leg in its own keyframes.
 *
 * No such case exists in the authored data today. Expanding rather than dropping means a
 * future one cannot silently lose its return leg.
 */
function segmentsOf(a: AnimationSpec): Segment[] {
  const begin = a.begin ?? 0
  const dur = a.duration
  const from = startValue(a)
  const to = endValue(a)
  const head: Segment = { begin, dur, from, to, mode: a.mode }
  if (!a.autoreverse) return [head]
  return [head, { begin: begin + dur, dur, from: to, to: from, mode: a.mode }]
}

/**
 * Build keyframes for a set of finite tracks on one channel.
 *
 * Walks the timeline inserting explicit hold frames, so a track beginning at 300ms keeps its
 * previous value until then instead of interpolating from t=0. Without the holds, every
 * delayed track would visibly drift from the start of the timeline.
 */
function finiteKeyframes(
  anims: readonly AnimationSpec[],
  channel: Channel,
  ctx: DeviceContext,
): { total: number; keyframes: CompiledKeyframe[] } {
  const segs = anims.flatMap(segmentsOf)

  let total = 0
  for (const s of segs) total = Math.max(total, s.begin + s.dur)
  // A zero-length timeline would divide by zero below. 1ms is effectively instant.
  if (total <= 0) total = 1

  const frames: Array<{ offset: number; value: number; easing: CompiledKeyframe['easing'] }> = []
  let cursor = 0
  let value = segs.length > 0 ? segs[0]!.from : CHANNELS[channel].rest

  for (const s of segs) {
    if (s.begin > cursor) {
      frames.push({ offset: cursor / total, value, easing: 'linear' })
      frames.push({ offset: s.begin / total, value, easing: 'linear' })
      cursor = s.begin
    }
    frames.push({ offset: s.begin / total, value: s.from, easing: s.mode ?? 'linear' })
    cursor = Math.max(cursor, s.begin + s.dur)
    frames.push({ offset: Math.min(cursor / total, 1), value: s.to, easing: 'linear' })
    value = s.to
  }

  if (cursor < total) {
    frames.push({ offset: 1, value, easing: 'linear' })
  }

  // Collapse frames that land on the same offset, keeping the last write.
  const deduped: typeof frames = []
  for (const f of frames) {
    const prev = deduped.at(-1)
    if (prev && Math.abs(prev.offset - f.offset) < 1e-6) deduped.pop()
    deduped.push(f)
  }

  return {
    total,
    keyframes: deduped.map((f) => ({
      offset: Math.max(0, Math.min(1, f.offset)),
      value: resolveChannelValue(channel, f.value, ctx),
      easing: f.easing,
    })),
  }
}

/** A two-keyframe track, used by the lone-autoreverse and infinite-tail forms. */
function endpointKeyframes(
  a: AnimationSpec,
  channel: Channel,
  ctx: DeviceContext,
): CompiledKeyframe[] {
  return [
    {
      offset: 0,
      value: resolveChannelValue(channel, startValue(a), ctx),
      easing: a.mode ?? 'linear',
    },
    { offset: 1, value: resolveChannelValue(channel, endValue(a), ctx), easing: 'linear' },
  ]
}

/**
 * Compile one storyboard into tracks.
 *
 * Per channel:
 *   1. partition into finite tracks plus at most one repeating tail
 *   2. a lone finite autoreverse track becomes two alternating iterations of one leg
 *   3. any other finite set becomes one merged track that holds its final value
 *   4. a repeating tail becomes its own endlessly looping track
 *   5. a storyboard-level repeat overrides all of the above: every track on the channel merges
 *      into one looping timeline, so the whole group cycles together
 */
export function compileStoryboard(sb: Storyboard, ctx: DeviceContext): CompiledTrack[] {
  const tracks: CompiledTrack[] = []

  for (const [channel, anims] of byChannel(sb.animations)) {
    if (sb.repeat) {
      const built = finiteKeyframes(anims, channel, ctx)
      tracks.push({
        channel,
        keyframes: built.keyframes,
        timing: {
          duration: built.total,
          delay: 0,
          iterations: Infinity,
          direction: 'normal',
          easing: 'linear',
          fill: 'both',
        },
      })
      continue
    }

    const finite = anims.filter((a) => !a.repeat)
    const infinite = anims.find((a) => a.repeat)

    const lone = finite.length === 1 ? finite[0]! : undefined
    if (lone?.autoreverse) {
      // Out and back is exactly two alternating iterations of one leg. This is the faithful
      // form: without the return leg the element stays permanently displaced by the outbound
      // one, which is how a 150ms jolt turns into a permanent offset.
      tracks.push({
        channel,
        keyframes: endpointKeyframes(lone, channel, ctx),
        timing: {
          duration: lone.duration || 1,
          delay: lone.begin ?? 0,
          iterations: 2,
          direction: 'alternate',
          easing: lone.mode ?? 'linear',
          fill: 'backwards',
        },
      })
    } else if (finite.length > 0) {
      const built = finiteKeyframes(finite, channel, ctx)
      tracks.push({
        channel,
        keyframes: built.keyframes,
        timing: {
          duration: built.total,
          delay: 0,
          iterations: 1,
          direction: 'normal',
          easing: 'linear',
          fill: 'forwards',
        },
      })
    }

    if (infinite) {
      tracks.push({
        channel,
        keyframes: endpointKeyframes(infinite, channel, ctx),
        timing: {
          duration: infinite.duration || 1,
          delay: infinite.begin ?? 0,
          iterations: Infinity,
          direction: infinite.autoreverse ? 'alternate' : 'normal',
          easing: infinite.mode ?? 'linear',
          fill: 'both',
        },
      })
    }
  }

  return tracks
}

/**
 * Where each channel comes to rest once motion has stopped.
 *
 * One-shots settle at their final value. Repeating and autoreverse tracks settle at t=0, which
 * is where they visually begin. The autoreverse case is the one that bites: such a track plays
 * out and back, so it rests at its `from`, and treating it as resting at `to` displaces every
 * static screen by the outbound leg.
 */
export function restingValues(sb: Storyboard, ctx: DeviceContext): Map<Channel, number> {
  const out = new Map<Channel, number>()

  for (const [channel, anims] of byChannel(sb.animations)) {
    const first = anims[0]
    if (!first) continue

    const finite = anims.filter((a) => !a.repeat)
    const infinite = anims.find((a) => a.repeat)
    const last = finite.at(-1)

    let value: number
    if (sb.repeat) value = startValue(first)
    else if (infinite && finite.length === 0) value = startValue(infinite)
    else if (last) value = last.autoreverse ? startValue(last) : endValue(last)
    else value = startValue(first)

    out.set(channel, resolveChannelValue(channel, value, ctx))
  }

  return out
}

/**
 * Pick the storyboard that answers an event.
 *
 * The `_` fallback is load-bearing. A storyboard authored with no event fires when its element
 * appears and is not tied to cursor movement, so it must also answer when a specific event is
 * requested. Returning null instead silently kills every ambient animation in a theme - the
 * top-bar ticker, the background drift, the badge pulses.
 */
export function storyboardForEvent(
  defs: StoryboardMap | undefined,
  event: StoryboardEventKey | undefined,
): Storyboard | undefined {
  if (!defs) return undefined
  if (event && defs[event]) return defs[event]
  return defs._
}

/**
 * True when an element's only storyboard is the no-event `_` block.
 *
 * Such an element is ambient: it starts when it appears and runs on its own clock. Replaying it
 * on every cursor move would restart a 5350ms ticker and a 30s background drift on every
 * keypress, so callers play it once and then leave it alone.
 */
export function isAmbient(
  defs: StoryboardMap | undefined,
  event: StoryboardEventKey | undefined,
): boolean {
  if (!defs) return false
  const hasSpecific = event !== undefined && defs[event] !== undefined
  return !hasSpecific && defs._ !== undefined
}
