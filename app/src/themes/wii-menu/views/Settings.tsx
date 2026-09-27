import { useScreen } from '../../../device/ScreenContext'
import { settingsFrame } from '../assets'
import { H, W } from '../layout'
import type { ChoiceFocus, ChoiceSection, ListFocus, ListSection } from '../machine'
import { SETTINGS_PAGES } from '../machine'
import { MOTION } from '../motion'
import { abs, Img, motion } from './parts'

/**
 * PORTING NOTES
 * CFW: Wii Menu (System Menu 4.3U)   Devices: rg35xx
 * Source: closed. WM4K's `Settings/` frames: the System Menu renders each Settings page to a whole
 *         608x456 texture and moves that, so the pack redraws every page in every state - each item
 *         focused, each option selected - and those frames are what this view shows.
 * Mode: reproduce
 *
 * Layout:        The frame is the page: its title tab, the four items or the options, Back (and
 *                Confirm), and the page number. Nothing is drawn over it.
 * Focus & selection: The lavender button is the focus; the orange corners mark the option the
 *                console has saved, or the one just chosen. A page opens on its first item.
 * Buttons:       Up / Down through the items and on to Back. Left / Right, and L / R, turn the Wii
 *                Settings pages; on a page of options Left / Right move along Back and Confirm.
 *                A opens an item, picks an option, or presses the button; B is Back. Confirm
 *                saves the choice; Back discards it.
 * Transitions:   A page turn slides the frames 608px in 400ms, easing out, the incoming page
 *                brightening from dim and the outgoing one dimming (`EOZxJue_N6s` 155.73s). A page
 *                opening fades up over the last in 283ms (17 frames at 59.94fps).
 * Notes:         The frames carry a hover state for the page arrows, which the + Control Pad never
 *                needs: Left / Right turn the page directly. Items whose own pages the pack does not
 *                cover as whole frames - Console Nickname, Parental Controls, Internet, WiiConnect24,
 *                Language, Country, Format Wii System Memory, Screen Position, Date, Time and
 *                Sensitivity - do not open.
 */

const key = (f: number | string) => String(f)

/** The three Wii Settings pages side by side, the strip sliding to the current one. */
export function SettingsPages({ page, focus }: { page: number; focus: ListFocus }) {
  const { animate } = useScreen()
  return (
    <div className="wii-settings" data-page={page} style={{ ...abs({ x: 0, y: 0, w: W, h: H }), overflow: 'hidden' }}>
      <div
        style={{
          ...abs({ x: 0, y: 0, w: W * SETTINGS_PAGES, h: H }),
          transform: `translateX(${-page * W}px)`,
          transition: motion(animate, [{ property: 'transform', duration: MOTION.settingsTurn, easing: 'easeOutCubic' }]),
        }}
      >
        {/* A page off screen is dimmed, so the one arriving brightens as it slides in. */}
        {Array.from({ length: SETTINGS_PAGES }, (_, p) => (
          <Img
            key={p}
            src={settingsFrame('pages', `${p + 1}-${p === page ? key(focus) : 'none'}`)}
            box={{ x: p * W, y: 0, w: W, h: H }}
            style={{
              opacity: p === page ? 1 : 0.4,
              transition: motion(animate, [{ property: 'opacity', duration: MOTION.settingsTurn, easing: 'easeOutCubic' }]),
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function SettingsList({ id, focus }: { id: ListSection; focus: ListFocus }) {
  return <Img src={settingsFrame(id, key(focus))} box={{ x: 0, y: 0, w: W, h: H }} />
}

export function SettingsChoice({ id, selected, focus }: { id: ChoiceSection; selected: number; focus: ChoiceFocus }) {
  return <Img src={settingsFrame(id, `${selected}-${key(focus)}`)} box={{ x: 0, y: 0, w: W, h: H }} />
}

export function SystemUpdate({ focus }: { focus: 'yes' | 'no' }) {
  return <Img src={settingsFrame('system-update', focus)} box={{ x: 0, y: 0, w: W, h: H }} />
}
