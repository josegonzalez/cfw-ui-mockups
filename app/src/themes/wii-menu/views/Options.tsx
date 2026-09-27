import { optionsImg } from '../assets'
import { H, W } from '../layout'
import { PALETTE } from '../palette'
import { abs, Img, Pill, Text, type Box } from './parts'

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
 * Transitions:   Fades in over the screen it replaces (283ms, the Settings cross-fade).
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

function Tile({ box, src, label, focused }: { box: Box; src: string; label: string; focused: boolean }) {
  return (
    <div
      className="wii-option-tile"
      data-focused={focused || undefined}
      style={{
        ...abs(box),
        opacity: focused ? 1 : 0.72,
        boxShadow: focused ? `0 0 0 3px ${PALETTE.cyan}, 0 0 12px ${PALETTE.cyanSoft}` : 'none',
        borderRadius: 6,
      }}
    >
      <Img src={src} box={{ x: 0, y: 0, w: box.w, h: box.h }} />
      <Text box={{ x: 0, y: box.h - 34, w: box.w, h: 26 }} size={17} weight={500} color="#4a4a4a">
        {label}
      </Text>
    </div>
  )
}

const TILES: readonly Box[] = [
  { x: 84, y: 128, w: 200, h: 156 },
  { x: 324, y: 128, w: 200, h: 156 },
]

export function Options({ focus }: { focus: 0 | 1 | 'back' }) {
  return (
    <div className="wii-options" style={{ ...abs({ x: 0, y: 0, w: W, h: H }) }}>
      <SettingsGround logo />
      <Tile box={TILES[0]!} src={optionsImg('data-management')} label="Data Management" focused={focus === 0} />
      <Tile box={TILES[1]!} src={optionsImg('wii-settings')} label="Wii Settings" focused={focus === 1} />
      <Pill box={BACK_BOX} label="Back" focused={focus === 'back'} tone="dark" />
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
      <Tile box={TILES[0]!} src={optionsImg('save-data')} label="Save Data" focused={focus === 0} />
      <Tile box={TILES[1]!} src={optionsImg('channels')} label="Channels" focused={focus === 1} />
      <Pill box={BACK_BOX} label="Back" focused={focus === 'back'} tone="dark" />
    </div>
  )
}
