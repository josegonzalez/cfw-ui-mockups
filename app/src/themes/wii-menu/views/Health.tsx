import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { H, W } from '../layout'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { abs, Text } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. `docs/themes/wii-menu/reference/frames/health-safety.png`, from a Dolphin recording
 *         of the 4.3U boot.
 * Mode: reproduce
 *
 * Layout:        White bold capitals on black, centred: the warning heading with its yellow sign,
 *                three lines of body, "Also online at", the address in blue, and the prompt.
 * Focus & selection: none.
 * Buttons:       A continues to the Wii Menu. Nothing else does anything.
 * Transitions:   The prompt pulses while the screen waits. The menu fades in once A is pressed.
 * Notes:         Drawn, not taken from WM4K: the pack's copy of this texture carries its author's
 *                credit line. The prompt shows from the first frame here; on the console it
 *                appears after a few seconds (`health-safety-early.png` has none).
 */

const PULSE: StoryboardMap = {
  _: {
    repeat: 'forever',
    animations: [{ property: 'opacity', from: 1, to: 0.35, duration: MOTION.prompt, mode: 'easeInOut', autoreverse: true }],
  },
}

function Warning({ x, y }: { x: number; y: number }) {
  return (
    <svg width={34} height={30} style={{ position: 'absolute', left: x, top: y }}>
      <path d="M17 2 L32 28 L2 28 Z" fill="#f6d31c" stroke="#f6d31c" strokeWidth={3} strokeLinejoin="round" />
      <rect x={15.5} y={10} width={3} height={10} fill="#000" />
      <rect x={15.5} y={22} width={3} height={3} fill="#000" />
    </svg>
  )
}

export function Health() {
  return (
    <div className="wii-health" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: PALETTE.black }}>
      <Warning x={40} y={50} />
      <Text box={{ x: 76, y: 48, w: 500, h: 36 }} size={29} weight={700} color="#ffffff" align="left">
        WARNING-HEALTH AND SAFETY
      </Text>
      {['BEFORE PLAYING, READ YOUR OPERATIONS', 'MANUAL FOR IMPORTANT INFORMATION', 'ABOUT YOUR HEALTH AND SAFETY.'].map((line, i) => (
        <Text key={line} box={{ x: 0, y: 132 + i * 38, w: W, h: 36 }} size={22} weight={700} color="#ffffff">
          {line}
        </Text>
      ))}
      <Text box={{ x: 0, y: 282, w: W, h: 32 }} size={19} weight={700} color="#ffffff">
        Also online at
      </Text>
      <Text box={{ x: 0, y: 318, w: W, h: 34 }} size={22} weight={700} color={PALETTE.link}>
        www.nintendo.com/healthsafety/
      </Text>
      <Animated storyboard={PULSE} event="_" style={abs({ x: 0, y: 380, w: W, h: 34 })}>
        <Text box={{ x: 0, y: 0, w: W, h: 34 }} size={22} weight={700} color="#8d8d8d">
          Press{' '}
          <span className="wii-circled" style={{ borderColor: '#8d8d8d' }}>
            A
          </span>{' '}
          to continue.
        </Text>
      </Animated>
    </div>
  )
}
