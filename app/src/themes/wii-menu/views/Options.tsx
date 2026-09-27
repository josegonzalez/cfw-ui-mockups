import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { useScreen } from '../../../device/ScreenContext'
import { optionsImg } from '../assets'
import { BORDER_X, BORDER_Y, H, W } from '../layout'
import { MOTION } from '../motion'
import { PALETTE } from '../palette'
import { abs, Img, motion, Pill, Text, type Box } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. The WM4K showcase recording and the 2025 setup tour (`KzORmt_gWDA`), both 16:9,
 *         for arrangement; WM4K's `Settings/` tile textures; the frame and Back button geometry of
 *         the Settings pages, which share this screen's chrome.
 * Mode: reproduce
 *
 * Layout:        The Settings ground - dark stripes between two white rules at y 58 and 368 - with
 *                "Wii" at the top right, two 200x156 tiles side by side, and Back at the bottom left.
 * Focus & selection: A tile or Back. Wii Options opens on Wii Settings, as the captures show the
 *                pointer arriving there; Data Management opens on its first tile.
 * Buttons:       Left / Right between the tiles, Down to Back, Up back to the tiles. A opens; B
 *                goes back.
 * Transitions:   The tiles grow out of the title tab, the second 67ms after the first (267ms).
 *                Choosing one fades the other (100ms), flies the chosen one into the tab
 *                (200ms), then fades the screen to black (333ms) before the next screen comes up
 *                (`EOZxJue_N6s` 144.95s, 146.5s, 147.7s).
 * Notes:         Only 16:9 captures of these two screens were found, so their 4:3 arrangement is
 *                derived: the tiles keep their texture's proportions and sit on the page's centre
 *                line. Data Management's two tiles open nothing in this port.
 */

/** The Settings ground every frame in `assets/settings/` is drawn on. */
export function SettingsGround({ logo = false }: { logo?: boolean }) {
  return (
    <div
      className="wii-settings-ground"
      style={{
        ...abs({ x: 0, y: 0, w: W, h: H }),
        background: `repeating-linear-gradient(${PALETTE.settingsGround} 0 3px, #1c1c1c 3px 4px)`,
      }}
    >
      <div style={{ ...abs({ x: 0, y: 0, w: W, h: 58 }), background: PALETTE.settingsGround }} />
      <div style={{ ...abs({ x: 0, y: 58, w: W, h: 3 }), background: '#ffffff' }} />
      <div style={{ ...abs({ x: 0, y: 366, w: W, h: 3 }), background: '#ffffff' }} />
      <div style={{ ...abs({ x: 0, y: 369, w: W, h: H - 369 }), background: 'linear-gradient(#1a1a1a, #050505)' }} />
      {logo ? <Img src={optionsImg('wii-logo')} box={{ x: 520, y: 18, w: 72, h: 33 }} /> : null}
    </div>
  )
}

/** The Back button at the bottom left of every Settings page (`settings/pages/1-back.webp`). */
export const BACK_BOX: Box = { x: 37, y: 380, w: 252, h: 53 }

/**
 * A tile: it grows in (`index` orders it), and when its screen is left it either flies into the tab
 * (the chosen one) or fades (the other).
 */
function Tile({ box, index, src, label, focused, leaving }: { box: Box; index: number; src: string; label: string; focused: boolean; leaving: boolean }) {
  const { animate } = useScreen()
  const { dx, dy } = toTab(box)
  const fly = leaving && focused
  return (
    <Animated storyboard={GROW[index]!} event="open" style={abs(box)}>
      <div
        className="wii-option-tile"
        data-focused={focused || undefined}
        style={{
          ...abs({ ...box, x: 0, y: 0 }),
          transform: fly ? `translate(${dx}px, ${dy}px) scale(0.1)` : 'none',
          transition: motion(animate, [
            { property: 'transform', duration: MOTION.tileOut.fly, easing: 'easeIn', delay: MOTION.tileOut.other },
            { property: 'opacity', duration: fly ? MOTION.tileOut.fly : MOTION.tileOut.other, easing: 'linear', delay: fly ? MOTION.tileOut.other : 0 },
          ]),
          opacity: leaving ? 0 : focused ? 1 : 0.72,
          boxShadow: focused ? `0 0 0 3px ${PALETTE.cyan}, 0 0 12px ${PALETTE.cyanSoft}` : 'none',
          borderRadius: 6,
        }}
      >
        <Img src={src} box={{ x: 0, y: 0, w: box.w, h: box.h }} />
        <Text box={{ x: 0, y: box.h - 34, w: box.w, h: 26 }} size={17} weight={500} color="#4a4a4a">
          {label}
        </Text>
      </div>
    </Animated>
  )
}

const TILES: readonly Box[] = [
  { x: 84, y: 128, w: 200, h: 156 },
  { x: 324, y: 128, w: 200, h: 156 },
]

/** Where tiles grow from and fly back to: the title tab at the top left. */
const TAB = { x: 40, y: 20 } as const
const toTab = (b: Box) => ({ dx: TAB.x - (b.x + b.w / 2), dy: TAB.y - (b.y + b.h / 2) })

/** A tile growing out of the tab. Offsets are fractions of the panel, the frame plus its border. */
function growIn(b: Box, i: number): StoryboardMap {
  const { dx, dy } = toTab(b)
  const begin = i * MOTION.tileIn.stagger
  const d = MOTION.tileIn.duration
  return {
    open: {
      animations: [
        { property: 'offsetX', from: dx / (W + 2 * BORDER_X), begin, duration: d, mode: 'easeOutCubic' },
        { property: 'offsetY', from: dy / (H + 2 * BORDER_Y), begin, duration: d, mode: 'easeOutCubic' },
        { property: 'scale', from: 0.1, begin, duration: d, mode: 'easeOutCubic' },
        { property: 'opacity', from: 0, begin, duration: d, mode: 'easeOutCubic' },
      ],
    },
  }
}
const GROW = TILES.map(growIn)

/** Wii Options; `leaving` plays the chosen tile's exit before the screen it opens. */
export function Options({ focus, leaving = false }: { focus: 0 | 1 | 'back'; leaving?: boolean }) {
  const { animate } = useScreen()
  return (
    <div
      className="wii-options"
      style={{
        ...abs({ x: 0, y: 0, w: W, h: H }),
        background: PALETTE.black,
      }}
    >
      <div
        style={{
          ...abs({ x: 0, y: 0, w: W, h: H }),
          opacity: leaving ? 0 : 1,
          transition: motion(animate, [
            { property: 'opacity', duration: MOTION.tileOut.black, easing: 'linear', delay: MOTION.tileOut.other + MOTION.tileOut.fly },
          ]),
        }}
      >
        <SettingsGround logo />
        <Tile box={TILES[0]!} index={0} src={optionsImg('data-management')} label="Data Management" focused={focus === 0} leaving={leaving} />
        <Tile box={TILES[1]!} index={1} src={optionsImg('wii-settings')} label="Wii Settings" focused={focus === 1} leaving={leaving} />
        <Pill box={BACK_BOX} label="Back" focused={focus === 'back'} tone="dark" />
      </div>
    </div>
  )
}

export function DataManagement({ focus }: { focus: 0 | 1 | 'back' }) {
  return (
    <div className="wii-data" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <SettingsGround logo />
      <div style={{ ...abs({ x: 0, y: 26, w: 240, h: 32 }), background: '#ffffff', borderTopRightRadius: 16 }} />
      <Text box={{ x: 18, y: 26, w: 220, h: 32 }} size={22} weight={500} color="#1e1e1e" align="left">
        Data Management
      </Text>
      <Tile box={TILES[0]!} index={0} src={optionsImg('save-data')} label="Save Data" focused={focus === 0} leaving={false} />
      <Tile box={TILES[1]!} index={1} src={optionsImg('channels')} label="Channels" focused={focus === 1} leaving={false} />
      <Pill box={BACK_BOX} label="Back" focused={focus === 'back'} tone="dark" />
    </div>
  )
}
