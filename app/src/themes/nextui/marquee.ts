/**
 * The theme's one animation.
 *
 * From `ui_components_nextui_marquee_text_draw`: a label wider than its slot holds still for 45
 * frames, scrolls left 2 pixels per frame until its end is flush with the slot, holds 45 again,
 * then snaps back to the start and repeats. It resets whenever the text changes.
 *
 * The menu runs at 60fps, so the holds are 750ms and the scroll takes `overflow / 2` frames -
 * which makes the cycle length depend on how much longer the text is than its slot. That is why
 * this is computed rather than fixed: two labels of different lengths are genuinely out of step
 * with each other, and a shared duration would be a nicer lie.
 */
export const MARQUEE_HOLD_FRAMES = 45
export const MARQUEE_STEP_PX = 2
export const FRAME_MS = 1000 / 60

export const MARQUEE_HOLD_MS = MARQUEE_HOLD_FRAMES * FRAME_MS

export interface MarqueeTiming {
  /** Total cycle in milliseconds. */
  readonly durationMs: number
  /** How far it travels, in pixels. */
  readonly distance: number
  /** Keyframe offsets, 0-1: hold, scroll, hold, snap. */
  readonly offsets: readonly [number, number, number, number]
}

/**
 * The cycle for a label of `textWidth` in a slot of `slotWidth`.
 *
 * Returns null when it fits, which is the common case and the one the source checks first.
 */
export function marqueeTiming(textWidth: number, slotWidth: number): MarqueeTiming | null {
  const distance = textWidth - slotWidth
  if (distance <= 0) return null

  const scrollMs = (distance / MARQUEE_STEP_PX) * FRAME_MS
  const durationMs = MARQUEE_HOLD_MS + scrollMs + MARQUEE_HOLD_MS

  return {
    durationMs,
    distance,
    offsets: [0, MARQUEE_HOLD_MS / durationMs, (MARQUEE_HOLD_MS + scrollMs) / durationMs, 1],
  }
}

/**
 * The cycle as CSS keyframes.
 *
 * Linear throughout and with a hard snap back at the end - the source moves by a fixed 2px per
 * frame and then assigns `marquee_offset = 0`, so there is no easing anywhere in it. Anything
 * smoother would be an improvement on the firmware rather than a reproduction of it.
 */
export function marqueeKeyframes(timing: MarqueeTiming): string {
  const [, scrollStart, scrollEnd] = timing.offsets
  const pct = (n: number) => `${(n * 100).toFixed(3)}%`
  return [
    `0% { transform: translateX(0); }`,
    `${pct(scrollStart)} { transform: translateX(0); }`,
    `${pct(scrollEnd)} { transform: translateX(${-timing.distance}px); }`,
    `100% { transform: translateX(${-timing.distance}px); }`,
  ].join(' ')
}
