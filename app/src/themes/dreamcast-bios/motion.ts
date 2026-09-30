import type { StoryboardMap } from '../../anim/types'

/**
 * Every duration the port plays, in milliseconds, read off the reference recording at 20 frames a
 * second, so each is good to about 50 ms. Times are into `c69qVhS_WOU`
 * (`docs/themes/dreamcast-bios/reference/README.md`).
 */
export const MOTION = {
  /** Leaving a screen: its contents fade out over the sky, which never stops (36.65-36.75s). */
  screenOut: 100,
  /** Then only the sky, before the next screen starts to come up (36.75-36.9s). */
  gap: 150,
  /** The next screen's contents fade up (36.9-37.0s). */
  screenIn: 100,
  /** A dialog opening over the screen it belongs to fades up as quickly. */
  dialogIn: 100,
  /** A focused option's blob: yellow, then green, and again (37.05-37.85s). */
  blink: { on: 200, off: 200 },
  /**
   * The focused model on the main menu turns a little one way, back, and the other way (36.0-36.65s).
   * The period is an estimate: the turn is slow and small, and 20 frames a second does not pin it.
   */
  rock: { period: 1200, narrow: 0.86 },
} as const

/** The focused blob's yellow layer: on, off, repeating. A still shows it on. */
export const BLINK: StoryboardMap = {
  _: {
    repeat: 'forever',
    animations: [
      { property: 'opacity', from: 1, to: 1, duration: MOTION.blink.on },
      { property: 'opacity', from: 0, to: 0, begin: MOTION.blink.on, duration: MOTION.blink.off },
    ],
  },
}

/**
 * The focused model's turn, as the width it projects to: facing, turned, facing, turned the other
 * way. A turn either way narrows the model alike, so the channel is `scaleX` and a still rests
 * facing.
 */
export const ROCK: StoryboardMap = (() => {
  const q = MOTION.rock.period / 4
  const n = MOTION.rock.narrow
  return {
    _: {
      repeat: 'forever',
      animations: [0, 1, 2, 3].map((i) => ({
        property: 'scaleX' as const,
        from: i % 2 ? n : 1,
        to: i % 2 ? 1 : n,
        begin: i * q,
        duration: q,
        mode: 'easeInOut' as const,
      })),
    },
  }
})()

export const FADE_IN: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, duration: MOTION.screenIn, mode: 'linear' }] },
}

export const DIALOG_IN: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, duration: MOTION.dialogIn, mode: 'linear' }] },
}
