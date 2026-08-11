/**
 * PORTING NOTES
 * CFW: Vitro Launcher, a Love2D launcher for muOS by KevDoy
 * Devices: rg35xx, rg34xx
 * Source: the mockup's own chrome, from the launcher's status and nav bars
 * Mode: reproduce
 *
 * The two pills that persist across all three screens, and the four full-screen overlays.
 *
 * Layout:
 *   - Status pill top-right at 12,12, 34 tall. Nav pill bottom-centre, 218x54, 18 from the bottom.
 * Focus & selection:
 *   - The nav pill's bubble slides to the active screen; the slots only change opacity.
 * Buttons:
 *   - L1/R1 move between screens; the pill shows both glyphs unless Tooltips is off.
 * Transitions:
 *   - The bubble slides 250ms after a 150ms delay, so the screen swaps first and the bubble
 *     catches up. Auto-hide fades the whole pill after the configured idle time.
 */
import { GlassPanel } from '../../../widgets/GlassPanel'
import { navIcon, button } from '../assets'
import type { VitroSettings } from '../library'
import type { VitroTokens } from '../palette'

export const SCREEN_ORDER = ['recent', 'all', 'settings'] as const
export type VitroScreen = (typeof SCREEN_ORDER)[number]

const NAV_ICON: Record<VitroScreen, string> = {
  recent: 'lastplayed',
  all: 'allTitles',
  settings: 'settings',
}

/** For the accessible name, since the icons carry no text. */
const NAV_LABEL: Record<VitroScreen, string> = {
  recent: 'Last Played',
  all: 'All Titles',
  settings: 'Settings',
}

export interface StatusPillProps {
  readonly time: string
  readonly percent: number
  readonly charging?: boolean
  readonly tokens: VitroTokens
  readonly transparent: boolean
}

/**
 * The clock and battery.
 *
 * The battery level is a prop rather than the hardcoded 85% the original painted, which is what
 * lets the low and charging states exist at all - both were styled in the stylesheet and never
 * reachable, because nothing ever set the class.
 */
export function StatusPill({ time, percent, charging, tokens, transparent }: StatusPillProps) {
  const low = percent <= 20
  return (
    /*
      The glass is a child of the pill, not a sibling. `GlassPanel` positions itself against its
      nearest positioned ancestor, so a wrapper without one lets it fill the whole UI layer - a
      full-screen stadium, which is exactly as odd as it sounds.
    */
    <div className="status-pill">
      <GlassPanel light={tokens.uiLight} transparent={transparent} inkRgb={tokens.fgRgb} />
      <span className="status-time">{time}</span>
      <span className="status-batt">
        <span className="batt-icon">
          <span
            className={`batt-fill${low ? ' low' : ''}${charging ? ' charging' : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </span>
        <span>{percent}%</span>
      </span>
    </div>
  )
}

export interface NavPillProps {
  readonly screen: VitroScreen
  readonly settings: VitroSettings
  readonly tokens: VitroTokens
  readonly hidden: boolean
  /**
   * Switch screens by pointer. Mockup chrome, not launcher behaviour - a handheld has no pointer
   * and the app would never handle a tap - but the pill reads as a tab bar on a desktop, and this
   * repo's convention is that on-screen controls in a mockup are clickable so a screen is usable
   * without knowing the key map. Omitted on a static screen, which has no controls at all.
   */
  readonly onSelect?: ((screen: VitroScreen) => void) | undefined
}

export function NavPill({ screen, settings, tokens, hidden, onSelect }: NavPillProps) {
  const pos = SCREEN_ORDER.indexOf(screen)
  const l1 = button('button_L1')
  const r1 = button('button_R1')

  return (
    <div className={`nav-pill${hidden ? ' hidden' : ''}`}>
      <GlassPanel light={tokens.uiLight} transparent={settings.transparency} inkRgb={tokens.fgRgb} />
      <div className="nav-bubble" style={{ transform: `translateX(${pos * 70}px)` }} />
      <div className="nav-slots">
        {SCREEN_ORDER.map((name, i) => {
          const src = navIcon(NAV_ICON[name])
          const icon = src ? <img className="invertible" src={src} alt="" /> : null
          const className = `nav-slot${i === pos ? ' active' : ''}`

          return onSelect ? (
            <button
              key={name}
              type="button"
              className={className}
              onClick={() => onSelect(name)}
              aria-label={NAV_LABEL[name]}
              aria-current={i === pos || undefined}
            >
              {icon}
            </button>
          ) : (
            <div key={name} className={className}>
              {icon}
            </div>
          )
        })}
      </div>
      {settings.tooltips && l1 ? <img className="nav-l1 invertible" src={l1} alt="L1" /> : null}
      {settings.tooltips && r1 ? <img className="nav-r1 invertible" src={r1} alt="R1" /> : null}
    </div>
  )
}

export interface OverlaysProps {
  /** 0-1. The hold-to-power-off fade. */
  readonly powerOff: number
  /** 0-1. The exit-to-muOS progress. Null hides the banner entirely. */
  readonly exit: number | null
  /** 0-1. The launch fade. */
  readonly loading: number
}

/** Power-off, exit-combo and launch, all driven by a number so a static screen can pose them. */
export function Overlays({ powerOff, exit, loading }: OverlaysProps) {
  return (
    <>
      <div className="poweroff-black" style={{ opacity: powerOff }} />
      {exit !== null ? (
        <div className="exit-banner show">
          <div className="exit-banner-text">Keep holding to exit to muOS...</div>
          <div className="exit-bar">
            <div className="exit-bar-fill" style={{ width: `${exit * 100}%` }} />
          </div>
        </div>
      ) : null}
      <div className={`loading-cover${loading > 0 ? ' show' : ''}`} style={{ opacity: loading }}>
        <div className="loading-text">Loading...</div>
      </div>
    </>
  )
}
