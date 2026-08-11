/**
 * The contract every background renderer implements.
 *
 * Vitro's backgrounds are a continuous render loop rather than a timeline, so they sit outside
 * the storyboard system entirely - there is no keyframe to settle to, only a clock. That makes
 * `time` the whole interface: a renderer is a pure function of (time, colours, size) onto a
 * surface, which is also what makes a static screenshot reproducible. Render at t=0 and you get
 * the same frame every time.
 */
export interface BgColors {
  /** 0-1 RGB, already parsed. */
  readonly accent: readonly [number, number, number]
  readonly bg: readonly [number, number, number]
  readonly light: boolean
}

export interface BgFrame extends BgColors {
  readonly w: number
  readonly h: number
  /** Seconds since the loop started. Zero on a static screen. */
  readonly time: number
  /** Seconds since the previous frame. Zero on the first frame and on a static screen. */
  readonly dt: number
}

/** A renderer that draws onto a 2D context. */
export type Canvas2dRenderer = (ctx: CanvasRenderingContext2D, frame: BgFrame) => void

export function mul(
  rgb: readonly [number, number, number],
  k: number,
): [number, number, number] {
  return [rgb[0] * k, rgb[1] * k, rgb[2] * k]
}

export function css(rgb: readonly [number, number, number], a = 1): string {
  const to = (v: number) => Math.round(v * 255)
  return `rgba(${to(rgb[0])},${to(rgb[1])},${to(rgb[2])},${a})`
}
