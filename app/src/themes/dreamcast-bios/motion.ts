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
   * Power-on, on grey (`frames/boot-logo.png`): the wordmark is written in left to right (1.5-4s,
   * "Dr" at 2s and "Dreamc" at 3s), the swirl drawn after it (4.8-6s), and the whole held until
   * the screen after it takes over (9s). The boot sound starts at 0.47s, heard in the recording.
   */
  boot: { sound: 470, wordmark: { begin: 1500, duration: 2500 }, swirl: { begin: 4800, duration: 1200 }, hold: 9000 },
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

export const FADE_IN: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, duration: MOTION.screenIn, mode: 'linear' }] },
}

export const DIALOG_IN: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, duration: MOTION.dialogIn, mode: 'linear' }] },
}
