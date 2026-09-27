import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { homeImg } from '../assets'
import { H, W } from '../layout'
import type { HomeFocus } from '../machine'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { abs, Img, Text, type Box } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. `docs/themes/wii-menu/reference/frames/home-menu.png` (Dolphin, over a game);
 *         Wikipedia, "Wii system software", Home Menu; WM4K's `Home Menu/` textures.
 * Mode: reproduce
 *
 * Layout:        A black bar across the top with "HOME Menu" and the Close button; a black bar
 *                across the bottom with the four controllers' batteries and "Wii Remote Settings",
 *                and a Wii Remote at its left. Between them, over a channel, the Wii Menu and
 *                Reset buttons.
 * Focus & selection: Close, then Wii Menu and Reset when they are there, then Wii Remote Settings.
 *                Opens on Close.
 * Buttons:       The + Control Pad moves; A presses. B and MENU (HOME) close it, as the HOME
 *                button does on the Wii Remote.
 * Transitions:   The bars slide in from the top and bottom edges while the screen behind dims,
 *                217ms (13 frames at 59.94fps). Closing is immediate.
 * Notes:         "Depending on when the Home Menu is accessed, a different number of buttons are
 *                displayed" (Wikipedia): Wii Menu and Reset act on a running title, so over the
 *                Wii Menu itself neither is shown. Wii Remote Settings is focusable but its own
 *                screen is not reproduced.
 */

const TOP: StoryboardMap = { open: { animations: [{ property: 'offsetY', from: -0.18, duration: MOTION.home, mode: 'easeOutCubic' }] } }
const BOTTOM: StoryboardMap = { open: { animations: [{ property: 'offsetY', from: 0.22, duration: MOTION.home, mode: 'easeOutCubic' }] } }
const FADE: StoryboardMap = { open: { animations: [{ property: 'opacity', from: 0, duration: MOTION.home, mode: 'easeOutCubic' }] } }

/** The two large buttons: a fat pill, white when focused and pale blue otherwise. */
function BigButton({ box, label, focused }: { box: Box; label: string; focused: boolean }) {
  return (
    <div
      className="wii-home-button"
      data-focused={focused || undefined}
      style={{
        ...abs(box),
        borderRadius: box.h / 2,
        background: focused ? 'linear-gradient(#ffffff, #f2f4f6)' : 'linear-gradient(#e9f3fb, #bcd6ec 55%, #cfe2f2)',
        border: `3px solid ${focused ? '#ffffff' : '#d7e7f4'}`,
        boxShadow: focused ? `0 0 0 3px ${PALETTE.cyan}, 0 3px 8px rgba(0,0,0,0.4)` : '0 3px 8px rgba(0,0,0,0.4)',
        boxSizing: 'border-box',
      }}
    >
      <Text box={{ x: 0, y: 0, w: box.w - 6, h: box.h - 6 }} size={30} weight={500} color="#1f3150">
        {label}
      </Text>
    </div>
  )
}

export function Home({ focus, running }: { focus: HomeFocus; running: boolean }) {
  const close = focus === 'close'
  const remote = focus === 'remote'
  return (
    <div className="wii-home" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <Animated storyboard={FADE} event="open" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: PALETTE.homeDim }}>
        {running ? (
          <>
            <BigButton box={{ x: 20, y: 166, w: 280, h: 108 }} label="Wii Menu" focused={focus === 'wii-menu'} />
            <BigButton box={{ x: 308, y: 166, w: 280, h: 108 }} label="Reset" focused={focus === 'reset'} />
          </>
        ) : null}
      </Animated>
      <Animated storyboard={TOP} event="open" style={abs({ x: 0, y: 0, w: W, h: 72 })}>
        <div style={{ ...abs({ x: 0, y: 0, w: W, h: 72 }), background: PALETTE.homeBar, borderBottom: '2px solid #5b5f63' }} />
        <Text box={{ x: 20, y: 18, w: 260, h: 44 }} size={33} weight={500} color="#ffffff" align="left">
          HOME Menu
        </Text>
        <div
          className="wii-home-close"
          data-focused={close || undefined}
          style={{
            ...abs({ x: 420, y: 16, w: 172, h: 46 }),
            borderRadius: 23,
            background: close ? 'linear-gradient(#ffffff, #eef1f3)' : 'linear-gradient(#f4f6f7, #d9dde0)',
            boxShadow: close ? `0 0 0 3px ${PALETTE.cyan}` : 'none',
          }}
        >
          <Img src={homeImg('home-icon')} box={{ x: 6, y: 5, w: 36, h: 36 }} />
          <Text box={{ x: 44, y: 0, w: 120, h: 46 }} size={28} weight={500} color="#3c3c3c">
            Close
          </Text>
        </div>
      </Animated>
      <Animated storyboard={BOTTOM} event="open" style={abs({ x: 0, y: 352, w: W, h: 104 })}>
        <div
          style={{
            ...abs({ x: 0, y: 0, w: W, h: 104 }),
            background: remote ? 'linear-gradient(#1c8fe0, #0b5fb8)' : PALETTE.homeBar,
            borderTop: '2px solid #5b5f63',
          }}
        />
        <div style={{ ...abs({ x: 118, y: 6, w: 462, h: 30 }), border: '2px solid #9aa0a5', borderRadius: 8, boxSizing: 'border-box' }} />
        {[0, 1, 2, 3].map((p) => (
          <div key={p}>
            <Text box={{ x: 126 + p * 114, y: 8, w: 36, h: 26 }} size={21} weight={500} color={p === 0 ? '#ffffff' : '#6b7075'} align="left">
              {`P${p + 1}`}
            </Text>
            <Img src={homeImg('battery')} box={{ x: 166 + p * 114, y: 12, w: 36, h: 18 }} style={{ opacity: p === 0 ? 1 : 0.35 }} />
            {p === 0 ? (
              <div style={{ ...abs({ x: 171, y: 16, w: 24, h: 10 }), background: 'repeating-linear-gradient(90deg, #ffffff 0 5px, transparent 5px 7px)' }} />
            ) : null}
          </div>
        ))}
        <Text box={{ x: 110, y: 48, w: 480, h: 44 }} size={29} weight={500} color="#ffffff">
          Wii Remote Settings
        </Text>
        <div style={{ ...abs({ x: 18, y: 4, w: 76, h: 110 }), background: '#ffffff', borderRadius: 10, overflow: 'hidden' }}>
          <Img src={homeImg('remote')} box={{ x: 14, y: -6, w: 48, h: 164 }} />
          <Img src={homeImg('remote-buttons')} box={{ x: 14, y: -6, w: 48, h: 164 }} />
        </div>
      </Animated>
    </div>
  )
}
