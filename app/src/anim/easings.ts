import type { EasingName } from './types'

/**
 * Every easing curve used anywhere in the repo, with where it came from.
 *
 * The values are not invented. Eight are the source format's own `mode=` vocabulary, read out
 * of the upstream EmulationStation theme; the last two were derived by the other themes from
 * their own sources and happen to be the standard bezier approximations of the Penner curves
 * of the same name, so they are named for the curve rather than for the theme.
 *
 * `bump` is the one inference in the table. It has no documented curve upstream, but all
 * thirteen of its uses are `scale 0.9|0.94 -> 1.0` and it never appears on opacity, so it
 * reads as an overshoot pop. The 1.56 control point is what produces that overshoot.
 */
export const EASING_CSS: Record<EasingName, string> = {
  linear: 'linear',
  ease: 'cubic-bezier(0.25,0.1,0.25,1)',
  easeIn: 'cubic-bezier(0.42,0,1,1)',
  easeOut: 'cubic-bezier(0,0,0.58,1)',
  easeInOut: 'cubic-bezier(0.42,0,0.58,1)',
  easeInCubic: 'cubic-bezier(0.32,0,0.67,0)',
  easeOutCubic: 'cubic-bezier(0.33,1,0.68,1)',
  bump: 'cubic-bezier(0.34,1.56,0.64,1)',
  /** EmulationStation's `Math::easeOutQuint`, used by Elementerial for carousel movement. */
  easeOutQuint: 'cubic-bezier(0.23,1,0.32,1)',
  /** Vitro Launcher's `--ease-out`, its CSS approximation of a Love2D exponential ease-out. */
  easeOutQuad: 'cubic-bezier(0.25,0.46,0.45,0.94)',
}

/**
 * The four bezier control points per curve, for renderers that evaluate the curve themselves
 * rather than handing a string to a browser. `linear` is expressed as its identity bezier so
 * the table is total and a consumer never has to special-case it.
 */
export const EASING_BEZIER: Record<EasingName, readonly [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeOutCubic: [0.33, 1, 0.68, 1],
  bump: [0.34, 1.56, 0.64, 1],
  easeOutQuint: [0.23, 1, 0.32, 1],
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
}

export function easingToCss(name: EasingName | undefined): string {
  return name ? EASING_CSS[name] : EASING_CSS.linear
}
