/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/widgets/header.dart, header_sort_dropdown.dart (the X control), bumper_glyph.dart,
 *         notification_bell.dart (the bell), lib/utils/header_layout.dart, lib/utils/nav_tabs.dart
 * Mode: reproduce
 *
 * Layout:        46.r tall, no fill of its own; it floats over the tab's content. Three
 *                independent children in a centred Stack: the View Mode control (Systems tab only,
 *                10.r in from the left), the tab strip (centred), and the status pill (8.r in from
 *                the right). The strip is LB, a NeoGlass pill of 32.r slots with 4.r padding, RB.
 *                Icons only - the source passes each tab a label and never draws it.
 * Focus & selection: a `primary` indicator, 4.r in from the pill's top and bottom, slides between
 *                slots in 160ms easeInOut; each icon's tint is `onSurface` lerped to `onPrimary` by
 *                how much of its slot the indicator covers.
 * Buttons:       LB/RB cycle the visible tabs and wrap (`app_screen.dart:663-686`); X opens the view
 *                dropdown on the Systems tab; Select opens the bell's panel. Tapping a tab selects it.
 * Transitions:   the indicator's 160ms slide. The tint follows it as a colour transition on the same
 *                curve, which is the source's coverage lerp exactly for a one-slot move; a wrap from
 *                the last tab to the first lights each tab it passes for a moment in the source and
 *                not here.
 * Notes:         the clock and battery are fixed at 4:50 and 30%, from `site-03.webp`, so a still
 *                is the same picture every time. The strip scrolls only past its slot budget, which
 *                seven tabs at 640 logical px wide never reach, so the scrolling window is not drawn.
 */
import { icon } from '../assets'
import type { State, Tab } from '../machine'
import { visibleTabs } from '../machine'
import { textWidth } from '../text'
import {
  BumperGlyph,
  GamepadControl,
  LINE,
  NeoGlass,
  Sym,
  Tinted,
  Txt,
  controlHeight,
  motion,
  useNeo,
  type Neo,
} from './parts'

/**
 * The time and battery the header shows, fixed so every capture is the same: 4:50 and 30%, from
 * `site-03.webp`. `formatClockTime` (`lib/utils/time_format.dart:7-16`) does not pad the hour.
 */
export const HOUR = 4
export const MINUTE = 50
export const BATTERY = 30

export function clockText(twelveHour: boolean): string {
  const mm = String(MINUTE).padStart(2, '0')
  if (!twelveHour) return `${HOUR}:${mm}`
  const h = HOUR % 12 === 0 ? 12 : HOUR % 12
  return `${h}:${mm} ${HOUR < 12 ? 'AM' : 'PM'}`
}

/** `nav_tabs.dart:65-113`: each tab's icon. Search is a Material Symbol, the rest are images. */
const TAB_ICON: Readonly<Record<Tab, string>> = {
  systems: 'grids.webp',
  search: '',
  sync: 'cloud-add.webp',
  achievements: 'enhance-prize.webp',
  scraper: 'box-search.webp',
  romm: 'romm-light.svg',
  settings: 'setting.webp',
}

/** `header.dart:157-171`. */
function batterySymbol(level: number) {
  if (level >= 90) return 'battery_full' as const
  if (level >= 75) return 'battery_android_frame_6' as const
  if (level >= 60) return 'battery_android_frame_5' as const
  if (level >= 45) return 'battery_android_frame_4' as const
  if (level >= 30) return 'battery_android_frame_3' as const
  if (level >= 15) return 'battery_android_frame_2' as const
  return 'battery_android_frame_1' as const
}

function batteryColor(neo: Neo, level: number): string {
  if (level > 20) return neo.p.batteryFull
  if (level > 5) return neo.p.batteryMedium
  return neo.p.batteryLow
}

/** `navStripWidth` (`header_layout.dart:21-26`), device px. */
export function navStripWidth(neo: Neo, tabs: number): number {
  const { u } = neo
  return u.r(36) * 2 + u.r(4) * 2 + u.r(32) * tabs
}

/** `statusPillWidth` (`header_layout.dart:38-57`). The pill's padding is plain px in the source. */
export function statusPillWidth(neo: Neo, clock: string, battery: string | null, glyph: boolean): number {
  const { u } = neo
  const text = (s: string) => textWidth(s, u.t(12), u.r(0.3))
  let w = u.px(10) * 2 + u.r(14) + u.r(10) + text(clock)
  if (glyph) w += u.r(14) + u.r(4)
  if (battery !== null) w += u.r(12) + u.r(16) + u.r(4) + text(battery)
  return w
}

export function Header({ state, dispatch }: { state: State; dispatch: (f: (s: State) => State) => void }) {
  const neo = useNeo()
  const { u, p } = neo
  const H = u.r(46)
  const tabs = visibleTabs(state)
  const slot = Math.max(0, tabs.indexOf(state.tab))

  // Header geometry (`header.dart:226-305`). The slot budget uses the widest clock and a full
  // battery without the glyph; the glyph is drawn only if today's pill still fits beside the strip.
  const battery = `${BATTERY}%`
  const widest = state.settings.toggles.use12h ? '12:59 PM' : '23:59'
  const maxSlots = Math.max(
    5,
    Math.floor(
      (u.W - 2 * (statusPillWidth(neo, widest, '100%', false) + u.r(8) + u.r(4)) - u.r(36) * 2 - u.r(4) * 2) / u.r(32),
    ),
  )
  const stripTabs = Math.min(tabs.length, maxSlots)
  const allowance = Math.max(0, (u.W - navStripWidth(neo, stripTabs)) / 2 - u.r(8) - u.r(4))
  const clock = clockText(!!state.settings.toggles.use12h)
  const glyph = statusPillWidth(neo, clock, battery, true) <= allowance

  const stripW = navStripWidth(neo, tabs.length)
  const stripLeft = (u.W - stripW) / 2
  const pillLeft = stripLeft + u.r(36)
  const pillW = u.r(4) * 2 + u.r(32) * tabs.length
  const pillTop = (H - u.r(32)) / 2

  return (
    <div data-part="header" style={{ position: 'absolute', left: 0, top: 0, width: u.W, height: H }}>
      {state.tab === 'systems' && (
        <GamepadControl
          glyph="Xbox_X_button"
          label="View Mode"
          bg={p.tertiaryFixed}
          fg={p.onTertiaryFixed}
          left={u.r(10)}
          top={(H - controlHeight(neo)) / 2}
          onTap={() =>
            dispatch((s) => ({
              ...s,
              overlays: [...s.overlays, { kind: 'view-dropdown', focus: 0 }],
            }))
          }
        />
      )}

      <BumperGlyph
        left
        box={{
          left: stripLeft + u.r(6),
          top: (H - u.r(24)) / 2,
          width: u.r(24),
          height: u.r(24),
        }}
      />
      <NeoGlass box={{ left: pillLeft, top: pillTop, width: pillW, height: u.r(32) }} radius={neo.radius.external}>
        <div
          data-part="tab-indicator"
          style={{
            position: 'absolute',
            left: 0,
            top: u.r(4),
            width: u.r(32),
            height: u.r(24),
            transform: `translateX(${u.r(4) + slot * u.r(32)}px)`,
            background: p.primary,
            borderRadius: neo.radius.internal,
            transition: motion(neo, [{ property: 'transform', duration: 160, easing: 'easeInOut' }]),
          }}
        />
        {tabs.map((tab, i) => {
          const tint = i === slot ? p.onPrimary : p.onSurface
          const box = {
            left: u.r(8),
            top: u.r(8),
            width: u.r(16),
            height: u.r(16),
          }
          return (
            <div
              key={tab}
              data-tab={tab}
              onClick={() => dispatch((s) => ({ ...s, tab, sel: 0 }))}
              style={{
                position: 'absolute',
                left: u.r(4) + i * u.r(32),
                top: 0,
                width: u.r(32),
                height: u.r(32),
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  color: tint,
                  transition: motion(neo, [{ property: 'color', duration: 160, easing: 'easeInOut' }]),
                }}
              >
                {tab === 'search' ? (
                  <div style={{ position: 'absolute', left: u.r(8), top: u.r(8) }}>
                    <Sym name="search_rounded" size={u.r(16)} color="currentColor" />
                  </div>
                ) : (
                  <Tinted src={icon(TAB_ICON[tab])} box={box} color="currentColor" />
                )}
              </div>
            </div>
          )
        })}
      </NeoGlass>
      <BumperGlyph
        left={false}
        box={{
          left: pillLeft + pillW + u.r(6),
          top: (H - u.r(24)) / 2,
          width: u.r(24),
          height: u.r(24),
        }}
      />

      <StatusPill
        H={H}
        glyph={glyph}
        clock={clock}
        battery={battery}
        active={state.notices.length > 0}
        onBell={() =>
          dispatch((s) => ({
            ...s,
            overlays: [...s.overlays, { kind: 'notifications', focus: 0 }],
          }))
        }
      />
    </div>
  )
}

function StatusPill({
  H,
  glyph,
  clock: CLOCK,
  battery,
  active,
  onBell,
}: {
  H: number
  glyph: boolean
  clock: string
  battery: string
  /** There are notifications: the bell rings in the warning colour, with a dot. */
  active: boolean
  onBell: () => void
}) {
  const neo = useNeo()
  const { u, p } = neo
  const w = statusPillWidth(neo, CLOCK, battery, glyph)
  const inner = u.r(16)
  const h = inner + u.px(4) * 2
  const left = u.W - u.r(8) - w
  const top = (H - h) / 2
  const text = (s: string) => textWidth(s, u.t(12), u.r(0.3))
  const lineH = u.t(12) * LINE
  const mid = (size: number) => u.px(4) + (inner - size) / 2

  let x = u.px(10)
  const bell = x
  x += u.r(14) + u.r(10)
  const clockGlyph = x
  if (glyph) x += u.r(14) + u.r(4)
  const clock = x
  x += text(CLOCK) + u.r(12)
  const batt = x
  x += u.r(16) + u.r(4)
  const battText = x
  const color = batteryColor(neo, BATTERY)

  return (
    <NeoGlass box={{ left, top, width: w, height: h }} radius={neo.radius.external}>
      <div
        onClick={onBell}
        style={{
          position: 'absolute',
          left: bell,
          top: mid(u.r(14)),
          cursor: 'pointer',
        }}
      >
        <Sym
          name={active ? 'notifications_active_rounded' : 'notifications_rounded'}
          size={u.r(14)}
          color={active ? p.warning : p.onSurface}
        />
        {active && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: u.r(5),
              height: u.r(5),
              boxSizing: 'border-box',
              borderRadius: u.r(2.5),
              background: p.warning,
              border: `${u.r(0.8)}px solid ${p.surface}`,
            }}
          />
        )}
      </div>
      {glyph && (
        <div style={{ position: 'absolute', left: clockGlyph, top: mid(u.r(14)) }}>
          <Sym name="schedule" size={u.r(14)} color={p.onSurface} />
        </div>
      )}
      <Txt
        size={u.t(12)}
        color={p.onSurface}
        weight={500}
        letterSpacing={u.r(0.3)}
        style={{ position: 'absolute', left: clock, top: mid(lineH) }}
      >
        {CLOCK}
      </Txt>
      <div style={{ position: 'absolute', left: batt, top: mid(u.r(16)) }}>
        <Sym name={batterySymbol(BATTERY)} size={u.r(16)} color={color} />
      </div>
      <Txt
        size={u.t(12)}
        color={color}
        weight={500}
        letterSpacing={u.r(0.3)}
        style={{ position: 'absolute', left: battText, top: mid(lineH) }}
      >
        {battery}
      </Txt>
    </NeoGlass>
  )
}
