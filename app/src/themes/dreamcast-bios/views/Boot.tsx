/**
 * PORTING NOTES
 * CFW: Sega Dreamcast BIOS menu   Devices: dreamcast
 * Source: closed; the wordmark and the boot sound from boot ROM v1.01d; recording c69qVhS_WOU (0-10s)
 * Mode: reproduce
 *
 * Layout:        Light grey from edge to edge, the swirl centred above the wordmark
 *                (`frames/boot-logo.png`): the swirl about 168x153 about (316, 211), the wordmark
 *                and its TM from x 174 to 466 on a baseline at 348.
 * Focus & selection: None; the BIOS takes no input here.
 * Buttons:       None.
 * Transitions:   The wordmark is written in left to right, then the swirl is drawn; after about nine
 *                seconds the screen after it - the first-boot clock, or the main menu - fades up over
 *                the sky. The boot sound plays from the start.
 * Notes:         In the BIOS a red dot runs ahead of the letters and traces the swirl; the port
 *                reveals the wordmark with a wipe and grows the swirl from its centre instead. The
 *                swirl is drawn - the ROM's swirl textures are the small top-bar logo's.
 */
import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { bios, drawn } from '../assets'
import { BOOT, H, W } from '../layout'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { Img, abs } from './parts'

const { wordmark, swirl } = MOTION.boot

/** A grey cover over the wordmark slides off to the right, uncovering it letter by letter. */
const WIPE: StoryboardMap = {
  open: {
    animations: [{ property: 'offsetX', from: 0, to: BOOT.wordmark.w / W, begin: wordmark.begin, duration: wordmark.duration, mode: 'linear' }],
  },
}

const GROW: StoryboardMap = {
  open: {
    animations: [
      { property: 'scale', from: 0, to: 1, begin: swirl.begin, duration: swirl.duration, mode: 'easeOut' },
      { property: 'opacity', from: 0, to: 1, begin: swirl.begin, duration: swirl.duration / 4, mode: 'linear' },
    ],
  },
}

export function Boot() {
  return (
    <div style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: PALETTE.boot }}>
      <Animated storyboard={GROW} event="open" style={abs(BOOT.swirl)}>
        <Img src={drawn('swirl')} box={{ x: 0, y: 0, w: BOOT.swirl.w, h: BOOT.swirl.h }} />
      </Animated>
      <Img src={bios('wordmark-dark')} box={BOOT.wordmark} />
      <Animated storyboard={WIPE} event="open" style={{ ...abs(BOOT.wordmark), background: PALETTE.boot }} />
    </div>
  )
}
