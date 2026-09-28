import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'
import { useScreen } from '../../../device/ScreenContext'
import { optionsImg } from '../assets'
import { H, W } from '../layout'
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
 * Transitions:   Wii Options comes up from black: 200ms black, the ground over 500ms, the tiles
 *                over 250ms more. Choosing a tile flashes it white while the other darkens
 *                (167ms), then flies it into the title tab (200ms). Wii Settings is then reached
 *                through black (333ms); Data Management keeps the ground, grows its name out of
 *                the tab (133ms) and fades its tiles up in place after 300ms (167ms) - `v43`
 *                281.4-282.7s, 287.0-287.9s, 308.3-308.65s.
 * Notes:         The arrangement was set from 16:9 captures, before `v43` showed these screens in
 *                4:3; the tiles keep their texture's proportions on the page's centre line, and
 *                have not yet been held to `v43`'s positions. Data Management's two tiles open
 *                nothing in this port.
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

/** Where a chosen tile flies to: the title tab at the top left. */
const TAB = { x: 40, y: 20 } as const

const TILES: readonly Box[] = [
  { x: 84, y: 128, w: 200, h: 156 },
  { x: 324, y: 128, w: 200, h: 156 },
]

/** A tile screen's tiles fading up in place, `delay` after the screen shows. */
const fadeUp = (delay: number, duration: number): StoryboardMap => ({
  open: { animations: [{ property: 'opacity', from: 0, begin: delay, duration, mode: 'linear' }] },
})
const OPTIONS_TILES_IN = fadeUp(MOTION.optionsIn.black + MOTION.optionsIn.ground, MOTION.optionsIn.tiles)
const DATA_TILES_IN = fadeUp(MOTION.tileIn.delay, MOTION.tileIn.duration)

/** The chosen tile's flash as it is pressed: white, fading as the other tile darkens. */
const FLASH: StoryboardMap = {
  open: { animations: [{ property: 'opacity', from: 0.6, to: 0, duration: MOTION.tileOut.other, mode: 'linear' }] },
}

/** Data Management's name growing out of the title tab. */
const TAB_IN: StoryboardMap = {
  open: {
    animations: [
      { property: 'offsetX', from: -200 / 640, duration: MOTION.tileIn.tab, mode: 'easeOutCubic' },
      { property: 'opacity', from: 0, duration: MOTION.tileIn.tab, mode: 'linear' },
    ],
  },
}

/**
 * A tile. When its screen is left for a tile's own screen, the chosen one flashes, then flies into
 * the tab, and the other darkens and goes.
 */
function Tile({
  box,
  src,
  label,
  focused,
  leaving,
}: {
  box: Box
  src: string
  label: string
  focused: boolean
  leaving: boolean
}) {
  const { animate } = useScreen()
  const dx = TAB.x - (box.x + box.w / 2)
  const dy = TAB.y - (box.y + box.h / 2)
  const fly = leaving && focused
  const { other, fly: flight } = MOTION.tileOut
  return (
    <div
      className="wii-option-tile"
      data-focused={focused || undefined}
      style={{
        ...abs(box),
        transform: fly ? `translate(${dx}px, ${dy}px) scale(0.1)` : 'none',
        transition: motion(animate, [
          { property: 'transform', duration: flight, easing: 'easeIn', delay: other },
          { property: 'opacity', duration: fly ? flight : other, easing: 'linear', delay: fly ? other : 0 },
        ]),
        opacity: leaving ? 0 : focused ? 1 : 0.72,
        boxShadow: focused ? `0 0 0 3px ${PALETTE.cyan}` : 'none',
        borderRadius: 6,
      }}
    >
      <Img src={src} box={{ x: 0, y: 0, w: box.w, h: box.h }} />
      <Text box={{ x: 0, y: box.h - 34, w: box.w, h: 26 }} size={17} weight={500} color="#4a4a4a">
        {label}
      </Text>
      {fly ? (
        <Animated storyboard={FLASH} event="open" style={{ ...abs({ x: 0, y: 0, w: box.w, h: box.h }), background: '#ffffff', borderRadius: 6 }} />
      ) : null}
    </div>
  )
}

/**
 * Wii Options. `leaving` is the screen it is opening: its chosen tile's exit plays first, and Wii
 * Settings is reached through black.
 */
export function Options({ focus, leaving = null }: { focus: 0 | 1 | 'back'; leaving?: string | null }) {
  const { animate } = useScreen()
  const { other, fly, black } = MOTION.tileOut
  return (
    <div className="wii-options" style={{ ...abs({ x: 0, y: 0, w: W, h: H }), background: PALETTE.black }}>
      <div
        style={{
          ...abs({ x: 0, y: 0, w: W, h: H }),
          opacity: leaving === 'settings' ? 0 : 1,
          transition: motion(animate, [{ property: 'opacity', duration: black, easing: 'linear', delay: other + fly }]),
        }}
      >
        <SettingsGround logo />
        <Animated storyboard={OPTIONS_TILES_IN} event="open" style={abs({ x: 0, y: 0, w: W, h: H })}>
          <Tile box={TILES[0]!} src={optionsImg('data-management')} label="Data Management" focused={focus === 0} leaving={leaving !== null} />
          <Tile box={TILES[1]!} src={optionsImg('wii-settings')} label="Wii Settings" focused={focus === 1} leaving={leaving !== null} />
        </Animated>
        <Pill box={BACK_BOX} label="Back" focused={focus === 'back'} tone="dark" />
      </div>
    </div>
  )
}

/** Data Management: reached on Wii Options' ground, its name grows out of the tab and its tiles fade up. */
export function DataManagement({ focus }: { focus: 0 | 1 | 'back' }) {
  return (
    <div className="wii-data" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <SettingsGround logo />
      <div style={{ ...abs({ x: 0, y: 26, w: 240, h: 32 }), overflow: 'hidden' }}>
        <Animated storyboard={TAB_IN} event="open" style={abs({ x: 0, y: 0, w: 240, h: 32 })}>
          <div style={{ ...abs({ x: 0, y: 0, w: 240, h: 32 }), background: '#ffffff', borderTopRightRadius: 16 }} />
          <Text box={{ x: 18, y: 0, w: 220, h: 32 }} size={22} weight={500} color="#1e1e1e" align="left">
            Data Management
          </Text>
        </Animated>
      </div>
      <Animated storyboard={DATA_TILES_IN} event="open" style={abs({ x: 0, y: 0, w: W, h: H })}>
        <Tile box={TILES[0]!} src={optionsImg('save-data')} label="Save Data" focused={focus === 0} leaving={false} />
        <Tile box={TILES[1]!} src={optionsImg('channels')} label="Channels" focused={focus === 1} leaving={false} />
      </Animated>
      <Pill box={BACK_BOX} label="Back" focused={focus === 'back'} tone="dark" />
    </div>
  )
}
