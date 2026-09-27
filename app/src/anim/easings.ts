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
  /** TortOS's `ease_smooth`, `3u^2 - 2u^3`. With x linear this bezier is that curve exactly. */
  smoothstep: 'cubic-bezier(0.3333,0,0.6667,1)',
  /** Flutter's `Curves` (`packages/flutter/lib/src/animation/curves.dart`), for NeoStation. */
  easeOutQuart: 'cubic-bezier(0.165,0.84,0.44,1)',
  easeOutExpo: 'cubic-bezier(0.19,1,0.22,1)',
  easeInQuint: 'cubic-bezier(0.755,0.05,0.855,0.06)',
  easeInOutCubic: 'cubic-bezier(0.645,0.045,0.355,1)',
  easeOutBack: 'cubic-bezier(0.175,0.885,0.32,1.275)',
  fastOutSlowIn: 'cubic-bezier(0.4,0,0.2,1)',
  /** Flutter's `Curves.easeInCubic`, which is not the `easeInCubic` above. */
  flutterEaseInCubic: 'cubic-bezier(0.55,0.055,0.675,0.19)',
  /** Flutter's `Curves.easeOutCubic`, which is not the `easeOutCubic` above. */
  flutterEaseOutCubic: 'cubic-bezier(0.215,0.61,0.355,1)',
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
  smoothstep: [1 / 3, 0, 2 / 3, 1],
  easeOutQuart: [0.165, 0.84, 0.44, 1],
  easeOutExpo: [0.19, 1, 0.22, 1],
  easeInQuint: [0.755, 0.05, 0.855, 0.06],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeOutBack: [0.175, 0.885, 0.32, 1.275],
  fastOutSlowIn: [0.4, 0, 0.2, 1],
  flutterEaseInCubic: [0.55, 0.055, 0.675, 0.19],
  flutterEaseOutCubic: [0.215, 0.61, 0.355, 1],
}

export function easingToCss(name: EasingName | undefined): string {
  return name ? EASING_CSS[name] : EASING_CSS.linear
}

/**
 * A curve's value at `u`, for a theme that integrates motion itself rather than handing a
 * descriptor to the adapter - TortOS's shelf, which is retargeted mid-flight, is the one that
 * needed it.
 *
 * Solved from `EASING_BEZIER` rather than written out per curve, so the value a theme computes
 * and the curve a browser draws for the same name are the same curve. Newton's method on x, with
 * bisection as the fallback where the slope is too flat to trust.
 */
export function evaluateEasing(name: EasingName, u: number): number {
  if (u <= 0) return 0
  if (u >= 1) return 1
  const [x1, y1, x2, y2] = EASING_BEZIER[name]
  const bez = (t: number, a: number, b: number) => 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t
  const slope = (t: number, a: number, b: number) =>
    3 * (1 - t) * (1 - t) * a + 6 * (1 - t) * t * (b - a) + 3 * t * t * (1 - b)

  let t = u
  for (let i = 0; i < 8; i++) {
    const err = bez(t, x1, x2) - u
    if (Math.abs(err) < 1e-6) return bez(t, y1, y2)
    const d = slope(t, x1, x2)
    if (Math.abs(d) < 1e-6) break
    t -= err / d
  }
  let lo = 0
  let hi = 1
  t = u
  for (let i = 0; i < 40; i++) {
    const x = bez(t, x1, x2)
    if (Math.abs(x - u) < 1e-7) break
    if (x < u) lo = t
    else hi = t
    t = (lo + hi) / 2
  }
  return bez(t, y1, y2)
}
