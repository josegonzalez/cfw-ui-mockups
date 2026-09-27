import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { H, W } from '../layout'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { useScreen } from '../../../device/ScreenContext'
import { abs, loop, motion, Text } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. `docs/themes/wii-menu/reference/frames/health-safety.png`, from a Dolphin recording
 *         of the 4.3U boot.
 * Mode: reproduce
 *
 * Layout:        White bold capitals on black, centred: the warning heading with its white sign,
 *                three lines of body, "Also online at", the address, and the prompt.
 * Focus & selection: none.
 * Buttons:       A continues to the Wii Menu. Nothing else does anything.
 * Transitions:   The prompt first shows 1.93s in, then pulses to nothing and back once a second.
 *                A fades the screen to black (400ms, near linear); it stays black 2.4s while the
 *                menu loads, and the menu fades up over 300ms, linear (`v43` 0-9.9s).
 * Notes:         Drawn, not taken from WM4K: the pack's copy of this texture carries its author's
 *                credit line. The sign and the address are white, as `v43` - a console recording -
 *                shows them (3.5s); the Dolphin recording (`frames/health-safety.png`) shows them
 *                yellow and blue, and it is the one that disagrees.
 */

/**
 * The prompt's pulse: every second it falls away, stays off, rises and holds (`v43` 2.0-7.0s). The
 * loop starts on the hold, so a still shows the prompt.
 */
const PULSE: StoryboardMap = (() => {
  const { rise, hold, fall, period } = MOTION.prompt
  return loop(period, {
    opacity: [
      [0, 1],
      [hold, 1, 'easeIn'],
      [hold + fall, 0],
      [period - rise, 0, 'easeOut'],
      [period, 1],
    ],
  })
})()

/** The prompt first shows almost two seconds after the warning (`v43` 1.93s). */
const PROMPT_APPEARS: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0, begin: MOTION.prompt.first - 1, duration: 1 }] },
}

function Warning({ x, y }: { x: number; y: number }) {
  return (
    <svg width={34} height={30} style={{ position: 'absolute', left: x, top: y }}>
      <path d="M17 2 L32 28 L2 28 Z" fill="#ffffff" stroke="#ffffff" strokeWidth={3} strokeLinejoin="round" />
      <rect x={15.5} y={10} width={3} height={10} fill="#000" />
      <rect x={15.5} y={22} width={3} height={3} fill="#000" />
    </svg>
  )
}

/** Health & Safety; `leaving` fades it to black, which A starts. */
export function Health({ leaving }: { leaving: boolean }) {
  const { animate } = useScreen()
  return (
    <div className="wii-health" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: PALETTE.black }}>
      <div
        style={{
          ...abs({ x: 0, y: 0, w: W, h: H }),
          opacity: leaving ? 0 : 1,
          transition: motion(animate, [{ property: 'opacity', duration: MOTION.healthOut, easing: 'linear' }]),
        }}
      >
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
        <Text box={{ x: 0, y: 318, w: W, h: 34 }} size={22} weight={700} color="#ffffff">
          www.nintendo.com/healthsafety/
        </Text>
        <Animated storyboard={PROMPT_APPEARS} event="open" style={abs({ x: 0, y: 380, w: W, h: 34 })}>
          <Animated storyboard={PULSE} event="_" style={abs({ x: 0, y: 0, w: W, h: 34 })}>
            <Text box={{ x: 0, y: 0, w: W, h: 34 }} size={22} weight={700} color="#8d8d8d">
              Press{' '}
              <span className="wii-circled" style={{ borderColor: '#8d8d8d' }}>
                A
              </span>{' '}
              to continue.
            </Text>
          </Animated>
        </Animated>
      </div>
    </div>
  )
}
