import { CHANNELS } from './channels'
import { easingToCss } from './easings'
import type { Channel, CompiledTrack, TransitionSpec } from './types'

/**
 * The web adapter: turns the neutral timeline into Web Animations input.
 *
 * This is the replaceable half of the animation system. Everything web-specific lives here -
 * the CSS property names, the `px` suffix, the keyframe shape. `compile.ts` knows none of it.
 *
 * The runtime never animates `transform` directly. Up to three transform channels run
 * concurrently on one element, and two animations cannot both target `transform`, so each
 * channel drives its own registered custom property and CSS recomposes them in `anim.css`.
 * That sidesteps `composite: 'add'` entirely. Collapsing these into one animated `transform`
 * looks like a simplification and silently drops two of the three channels.
 */
export const CHANNEL_CSS: Record<Channel, string> = {
  opacity: 'opacity',
  offsetX: '--px-ox',
  offsetY: '--px-oy',
  x: '--px-x',
  y: '--px-y',
  scale: '--px-sc',
  scaleX: '--px-scx',
  zIndex: 'z-index',
}

/** Format a resolved channel value as a CSS value string. */
export function channelToCss(channel: Channel, value: number): string {
  if (CHANNELS[channel].axis !== null) return `${value.toFixed(3)}px`
  if (channel === 'zIndex') return String(Math.round(value))
  return String(value)
}

export interface WaapiEffect {
  readonly keyframes: Keyframe[]
  readonly timing: KeyframeAnimationOptions
}

/** Convert one compiled track into `element.animate()` arguments. */
export function trackToWaapi(track: CompiledTrack): WaapiEffect {
  const css = CHANNEL_CSS[track.channel]

  const keyframes: Keyframe[] = track.keyframes.map((kf) => ({
    offset: kf.offset,
    easing: easingToCss(kf.easing),
    [css]: channelToCss(track.channel, kf.value),
  }))

  return {
    keyframes,
    timing: {
      duration: track.timing.duration,
      delay: track.timing.delay,
      iterations: track.timing.iterations,
      direction: track.timing.direction,
      easing: easingToCss(track.timing.easing),
      fill: track.timing.fill,
    },
  }
}

export function tracksToWaapi(tracks: readonly CompiledTrack[]): WaapiEffect[] {
  return tracks.map(trackToWaapi)
}

/** The inline style declaring a channel's resting value, for a screen rendered without motion. */
export function restingStyle(values: ReadonlyMap<Channel, number>): Record<string, string> {
  const style: Record<string, string> = {}
  for (const [channel, value] of values) {
    style[CHANNEL_CSS[channel]] = channelToCss(channel, value)
  }
  return style
}

const CSS_TRANSITION_PROPERTY: Record<TransitionSpec['property'], string> = {
  opacity: 'opacity',
  transform: 'transform',
  width: 'width',
  height: 'height',
  borderRadius: 'border-radius',
  filter: 'filter',
  backgroundColor: 'background-color',
  color: 'color',
  borderColor: 'border-color',
}

/**
 * Compile transition descriptors into a CSS `transition` shorthand.
 *
 * The two themes that animate with transitions rather than storyboards declare them as data
 * too, so all motion in the repo is inspectable in one vocabulary. An empty list yields
 * `'none'` rather than an empty string, so a component can hand the result straight to
 * `style.transition` and still positively disable transitions.
 */
export function transitionsToCss(specs: readonly TransitionSpec[]): string {
  if (specs.length === 0) return 'none'
  return specs
    .map((s) => {
      const delay = s.delay ? ` ${s.delay}ms` : ''
      return `${CSS_TRANSITION_PROPERTY[s.property]} ${s.duration}ms ${easingToCss(s.easing)}${delay}`
    })
    .join(', ')
}
