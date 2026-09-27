/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/widgets/header_sort_dropdown.dart (X), lib/widgets/context_menu/anchored_context_menu.dart
 *         and my_systems_grid.dart:290-348 (Y), lib/widgets/system_emulator_settings_dialog.dart and
 *         system_emulator_settings_dialog/{chrome,tabs,row_builders}.dart (Start),
 *         lib/widgets/notification_bell.dart (Select), lib/widgets/custom_toggle_switch.dart
 * Mode: reproduce
 *
 * Layout:        the dropdown hangs from 42.r, 6.r in, 180.r wide, as tall as its rows up to the
 *                screen less 58.r - on the Odin's 360 logical px that is short of its rows, so it
 *                scrolls with 5% edge fades. The context menu is 200.r wide, under the card it was
 *                opened on, flipped above or centred on it when it will not fit, clamped 8.r from
 *                the edges, and placed with room for its submenu to its right. The settings dialog
 *                is the screen less 16.r a side up to 640.r x 480.r. The bell's panel hangs 14px
 *                under the bell, 8px from the right.
 * Focus & selection: a `primary` 0.15 row with a `primary` 0.3 hairline, in all four. Up/down wrap.
 * Buttons:       dropdown - A applies and closes, B closes, left/right step the card size and apply
 *                at once. Context menu - A/right open View Mode's submenu, A on Settings opens the
 *                dialog, B closes a level, left closes the submenu, Y closes both. Dialog - LB/RB
 *                change tab and wrap, A toggles, B closes. Panel - B or Select close it.
 * Transitions:   the dropdown and menus fade in over 200ms and 120ms in the source; the dropdown's
 *                scroll is 150ms easeInOut. Opening is drawn at its end state here.
 * Notes:         the dialog's Emulators tab shows the RetroArch group row with no core picked, as a
 *                fresh install has; Appearance's two picker rows have no custom image; Hidden is
 *                empty, since the sample library hides no games. The toggle's own animation is a
 *                package default the source does not set, and is not reproduced.
 */
import { emulator, gamepad } from '../assets'
import {
  ConfirmDialog,
  GameDropdownPanel,
  GameMenuPanel,
  GameSettingsDialog,
  LaunchDialog,
  RandomDialog,
} from './GameOverlays'
import { gridGeometry } from '../grid'
import { CARD_SIZES, systemDef, type SortBy } from '../library'
import {
  entries,
  dropdownRows,
  generalRows,
  settingsTabs,
  systemOf,
  sysSettingsOf,
  type ContextMenu,
  type DropdownRow,
  type GeneralRow,
  type State,
  type SystemSettings,
  type ViewDropdown,
} from '../machine'
import { alpha } from '../palette'
import type { SymbolName } from '../symbols'
import { textWidth } from '../text'
import {
  GamepadControl,
  LINE,
  Sym,
  Tinted,
  Txt,
  abs,
  controlHeight,
  controlWidth,
  motion,
  shadow,
  useNeo,
  type Box,
  type Neo,
} from './parts'

export function Overlays({ state }: { state: State }) {
  return (
    <>
      {state.overlays.map((o, i) => {
        const key = `${o.kind}:${i}`
        switch (o.kind) {
          case 'view-dropdown':
            return <Dropdown key={key} state={state} o={o} />
          case 'context-menu':
            return <SystemMenu key={key} state={state} o={o} />
          case 'system-settings':
            return <SettingsDialog key={key} state={state} o={o} />
          case 'notifications':
            return <NotificationPanel key={key} state={state} />
          case 'game-dropdown':
            return <GameDropdownPanel key={key} state={state} o={o} />
          case 'game-menu':
            return <GameMenuPanel key={key} state={state} o={o} />
          case 'game-settings':
            return <GameSettingsDialog key={key} state={state} o={o} />
          case 'launch':
            return <LaunchDialog key={key} state={state} o={o} />
          case 'random':
            return <RandomDialog key={key} state={state} o={o} />
          case 'confirm':
            return <ConfirmDialog key={key} state={state} o={o} />
        }
      })}
    </>
  )
}

/* ---- X: the view and sort dropdown ------------------------------------------- */

const GROUP: Readonly<Record<DropdownRow['kind'], string>> = {
  view: 'VIEW MODE',
  size: 'CARD SIZE',
  sort: 'SORT BY',
  order: 'ORDER',
}

const SORT_LABEL: Readonly<Record<SortBy, string>> = {
  alphabetical: 'Alphabetical',
  year: 'Release Year',
  manufacturer: 'Manufacturer',
  manufacturer_type: 'Manufacturer / Type',
}

function rowLook(row: DropdownRow): { label: string; icon: SymbolName } {
  switch (row.kind) {
    case 'view':
      return row.value === 'grid'
        ? { label: 'Grid View', icon: 'grid_view_rounded' }
        : { label: 'Carousel View', icon: 'view_carousel_rounded' }
    case 'size':
      return { label: '', icon: 'crop_free_rounded' }
    case 'sort':
      return {
        label: SORT_LABEL[row.value],
        icon: (
          {
            alphabetical: 'sort_by_alpha_rounded',
            year: 'calendar_today_rounded',
            manufacturer: 'business_rounded',
            manufacturer_type: 'category_rounded',
          } as const
        )[row.value],
      }
    case 'order':
      return row.value === 'asc'
        ? { label: 'Ascending', icon: 'arrow_upward_rounded' }
        : { label: 'Descending', icon: 'arrow_downward_rounded' }
  }
}

function isActive(s: State, row: DropdownRow): boolean {
  switch (row.kind) {
    case 'view':
      return s.view === row.value
    case 'sort':
      return s.sortBy === row.value
    case 'order':
      return s.order === row.value
    default:
      return false
  }
}

function Dropdown({ state, o }: { state: State; o: ViewDropdown }) {
  const neo = useNeo()
  const { u, p } = neo
  const rows = dropdownRows(state)
  const headerH = u.r(6) * 2 + u.t(10) * LINE

  // Lay the column out: a divider between groups, a header at each, then the rows.
  const items: {
    kind: 'divider' | 'header' | 'row'
    top: number
    height: number
    row?: DropdownRow
    index?: number
  }[] = []
  let y = 0
  rows.forEach((row, i) => {
    if (i === 0 || rows[i - 1]!.kind !== row.kind) {
      if (i > 0) {
        items.push({ kind: 'divider', top: y, height: u.r(4) })
        y += u.r(4)
      }
      items.push({ kind: 'header', top: y, height: headerH, row })
      y += headerH
    }
    const h = (row.kind === 'size' ? u.r(28) : u.r(24)) + u.r(2) * 2
    items.push({ kind: 'row', top: y, height: h, row, index: i })
    y += h
  })
  const content = y

  const width = u.r(180)
  const maxH = u.H - u.r(42) - u.r(16)
  const height = Math.min(content + u.r(8) * 2, maxH)
  const viewport = height - u.r(8) * 2
  const max = Math.max(0, content - viewport)

  // `_scrollToSelected`'s own estimate: 16.r a header, 4.r a divider, 28.r or 32.r a row.
  let offset = 0
  if (o.moved) {
    let pos = u.r(8)
    for (let i = 0; i < o.focus; i++) {
      if (i === 0 || rows[i]!.kind !== rows[i - 1]!.kind) pos += u.r(16) + (i > 0 ? u.r(4) : 0)
      pos += rows[i]!.kind === 'size' ? u.r(32) : u.r(28)
    }
    if (o.focus === 0 || rows[o.focus]!.kind !== rows[o.focus - 1]!.kind) pos += u.r(16)
    offset = Math.min(max, Math.max(0, pos))
  }
  const up = offset > 0.5
  const down = offset < max - 0.5
  const fade =
    up || down
      ? `linear-gradient(to bottom, transparent 0%, #000 ${up ? 5 : 0}%, #000 ${down ? 95 : 100}%, transparent 100%)`
      : undefined

  return (
    <div
      data-part="view-dropdown"
      style={{
        ...abs({ left: u.r(6), top: u.r(42), width, height }),
        boxSizing: 'border-box',
        background: p.surface,
        border: `${u.r(1)}px solid ${p.outline}`,
        borderRadius: neo.radius.external,
        boxShadow: shadow(neo, alpha(p.shadow, 0.5), u.r(4), u.r(2), u.r(2)),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: u.r(8) - u.r(1),
          height: viewport,
          overflow: 'hidden',
          borderRadius: u.r(12),
          ...(fade && neo.web ? { maskImage: fade, WebkitMaskImage: fade } : {}),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: content,
            transform: `translateY(${-offset}px)`,
            transition: motion(neo, [{ property: 'transform', duration: 150, easing: 'easeInOut' }]),
          }}
        >
          {items.map((it, k) => {
            if (it.kind === 'divider')
              return (
                <div
                  key={k}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: it.top + (it.height - u.px(1)) / 2,
                    height: u.px(1),
                    background: p.outline,
                  }}
                />
              )
            if (it.kind === 'header')
              return (
                <Txt
                  key={k}
                  size={u.t(10)}
                  color={alpha(p.onSurface, 0.4)}
                  letterSpacing={u.r(1)}
                  style={{
                    position: 'absolute',
                    left: u.r(16),
                    top: it.top + u.r(6),
                  }}
                >
                  {GROUP[it.row!.kind]}
                </Txt>
              )
            return (
              <DropdownItem
                key={k}
                state={state}
                row={it.row!}
                focused={it.index === o.focus}
                top={it.top}
                width={width - u.r(2)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DropdownItem({
  state,
  row,
  focused,
  top: y,
  width,
}: {
  state: State
  row: DropdownRow
  focused: boolean
  top: number
  width: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const seg = row.kind === 'size'
  const h = seg ? u.r(28) : u.r(24)
  const box: Box = {
    left: u.r(4),
    top: y + u.r(2),
    width: width - u.r(8),
    height: h,
  }
  const active = isActive(state, row)
  const look = rowLook(row)
  const iconColor = seg ? alpha(p.onSurface, 0.5) : active ? p.primary : p.onSurface
  return (
    <div
      style={{
        ...abs(box),
        boxSizing: 'border-box',
        background: focused ? alpha(p.primary, 0.15) : 'transparent',
        border: `${u.px(1)}px solid ${focused ? alpha(p.primary, 0.3) : 'transparent'}`,
        borderRadius: seg ? neo.radius.external : u.r(8),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: u.r(12) - u.px(1),
          top: (h - u.r(14)) / 2 - u.px(1),
        }}
      >
        <Sym name={look.icon} size={u.r(14)} color={iconColor} />
      </div>
      {seg ? (
        <Segments
          left={u.r(12) + u.r(14) + u.r(8) - u.px(1)}
          width={box.width - u.r(12) * 2 - u.r(14) - u.r(8)}
          height={h - u.px(2)}
          value={state.size}
        />
      ) : (
        <>
          <Txt
            size={u.t(12)}
            color={active ? p.primary : p.onSurface}
            weight={active ? 700 : 500}
            style={{
              position: 'absolute',
              left: u.r(12) + u.r(14) + u.r(8) - u.px(1),
              top: (h - u.t(12) * LINE) / 2 - u.px(1),
            }}
          >
            {look.label}
          </Txt>
          {active && (
            <div
              style={{
                position: 'absolute',
                right: u.r(12) - u.px(1),
                top: (h - u.r(14)) / 2 - u.px(1),
              }}
            >
              <Sym name="check_rounded" size={u.r(14)} color={p.primary} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** The S / M / L / XL control, spaced evenly (`header_sort_dropdown.dart:605-663`). */
export function Segments({
  left,
  width,
  height,
  value,
  values = CARD_SIZES,
  labels,
  on,
  onText,
}: {
  left: number
  width: number
  height: number
  value: string
  values?: readonly string[]
  labels?: readonly string[]
  on?: string
  onText?: string
}) {
  const neo = useNeo()
  const { u, p } = neo
  const size = u.t(11)
  const boxes = values.map((s, i) => ({
    s,
    label: labels?.[i] ?? s,
    w: textWidth(labels?.[i] ?? s, size) + u.r(6) * 2,
    h: size * LINE + u.r(2) * 2,
  }))
  const gap = (width - boxes.reduce((n, b) => n + b.w, 0)) / (boxes.length + 1)
  // Each segment's left edge: the gaps and the widths of the segments before it.
  const lefts = boxes.map((_, i) => left + gap * (i + 1) + boxes.slice(0, i).reduce((n, b) => n + b.w, 0))
  return (
    <>
      {boxes.map((b, i) => {
        const at = lefts[i]!
        const sel = b.s === value
        return (
          <div
            key={b.s}
            style={{
              ...abs({ left: at, top: (height - b.h) / 2, width: b.w, height: b.h }),
              background: sel ? (on ?? p.primary) : 'transparent',
              borderRadius: on ? u.r(4) : neo.radius.internal,
            }}
          >
            <Txt
              size={size}
              color={sel ? (onText ?? p.onPrimary) : p.onSurface}
              weight={700}
              style={{ position: 'absolute', left: u.r(6), top: u.r(2) }}
            >
              {b.label}
            </Txt>
          </div>
        )
      })}
    </>
  )
}

/* ---- Y: the card's context menu ------------------------------------------------ */

export interface MenuRow {
  readonly label: string
  readonly icon: SymbolName
  readonly separatorBefore?: boolean
  readonly submenu?: boolean
  readonly checked?: boolean
  /** A checkbox row, ticked or not (`anchored_context_menu.dart:758-773`). */
  readonly box?: boolean
}

/** Where the focused card is on screen, for the menu to hang from. */
function anchorRect(neo: Neo, state: State): Box {
  const { u } = neo
  const list = entries(state)
  if (state.view === 'carousel') {
    // The centred page: the whole height between the header inset and the chip bar.
    const h = u.H - u.r(42) - u.r(42) - u.r(40)
    const w = h - u.r(60)
    return { left: (u.W - w) / 2, top: u.r(42), width: w, height: h }
  }
  const geo = gridGeometry(u, list, state.size, { compact: state.settings.recentCompact, square: state.settings.hideLogos })
  const c = geo.cards.find((x) => x.index === state.sel) ?? geo.cards[0]!
  return {
    left: geo.left + c.left,
    top: geo.top + c.top - geo.offsetFor(state.sel),
    width: c.width,
    height: c.height,
  }
}

function menuHeight(neo: Neo, rows: readonly MenuRow[]): number {
  const { u } = neo
  return u.r(8) * 2 + rows.reduce((n, r) => n + u.r(30) + (r.separatorBefore ? u.r(9) : 0), 0)
}

/** `AnchoredContextMenu`'s placement (`anchored_context_menu.dart:549-612`). */
export function place(neo: Neo, anchor: Box, rows: readonly MenuRow[], over: boolean): Box {
  const { u } = neo
  const width = u.r(200)
  const margin = u.r(8)
  const gap = u.r(6)
  const height = Math.min(menuHeight(neo, rows), u.H - margin * 2)
  const chain = rows.some((r) => r.submenu) ? width * 2 + gap : width
  let left = over ? anchor.left : anchor.left + anchor.width + gap
  if (left + width > u.W - margin) left = anchor.left - width - gap
  if (left + chain > u.W - margin) left = u.W - margin - chain
  const maxLeft = Math.max(0, u.W - width - margin)
  left = Math.min(maxLeft, Math.max(Math.min(margin, maxLeft), left))
  let y = over ? anchor.top + anchor.height + gap : anchor.top
  if (y + height > u.H - margin) y = over ? anchor.top - height - gap : anchor.top + anchor.height - height
  if (y < margin) y = anchor.top + anchor.height / 2 - height / 2
  const maxTop = Math.max(0, u.H - height - margin)
  y = Math.min(maxTop, Math.max(Math.min(margin, maxTop), y))
  return { left, top: y, width, height }
}

function SystemMenu({ state, o }: { state: State; o: ContextMenu }) {
  const neo = useNeo()
  const rows: MenuRow[] = [
    { label: 'Settings', icon: 'settings_rounded' },
    {
      label: 'View Mode',
      icon: 'grid_view_rounded',
      separatorBefore: true,
      submenu: true,
    },
  ]
  const box = place(neo, anchorRect(neo, state), rows, true)
  const sub: MenuRow[] = [
    {
      label: 'Grid View',
      icon: 'grid_view_rounded',
      checked: state.view === 'grid',
    },
    {
      label: 'Carousel View',
      icon: 'view_carousel_rounded',
      checked: state.view === 'carousel',
    },
  ]
  const rowTop = box.top + neo.u.r(8) + neo.u.r(30) + neo.u.r(9)
  const subBox =
    o.sub !== null
      ? place(
          neo,
          {
            left: box.left,
            top: rowTop,
            width: box.width,
            height: neo.u.r(30),
          },
          sub,
          false,
        )
      : null
  return (
    <>
      <MenuPanel box={box} rows={rows} focus={o.focus} />
      {subBox && <MenuPanel box={subBox} rows={sub} focus={o.sub!} />}
    </>
  )
}

export function MenuPanel({ box, rows, focus }: { box: Box; rows: readonly MenuRow[]; focus: number }) {
  const neo = useNeo()
  const { u, p } = neo
  // Each row's top: the panel's padding, the rows above, and a separator where one comes first.
  const tops = rows.map(
    (_, i) =>
      u.r(8) +
      rows.slice(0, i + 1).reduce((n, r, k) => n + (r.separatorBefore ? u.r(9) : 0) + (k < i ? u.r(30) : 0), 0),
  )
  return (
    <div
      data-part="context-menu"
      style={{
        ...abs(box),
        boxSizing: 'border-box',
        background: p.surface,
        borderRadius: u.r(12),
        border: `${u.px(1)}px solid ${alpha(p.primary, 0.2)}`,
        boxShadow: shadow(neo, 'rgba(0,0,0,0.5)', u.px(15), 0, u.px(5)),
      }}
    >
      {rows.map((r, i) => {
        const rowTop = tops[i]!
        const sepTop = rowTop - u.r(9) + (u.r(9) - u.px(1)) / 2
        const focused = i === focus
        return (
          <div key={r.label}>
            {r.separatorBefore && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: sepTop - u.px(1),
                  height: u.px(1),
                  background: alpha(p.outline, 0.15),
                }}
              />
            )}
            <div
              style={{
                ...abs({
                  left: u.r(4) - u.px(1),
                  top: rowTop - u.px(1),
                  width: box.width - u.r(8),
                  height: u.r(30),
                }),
                boxSizing: 'border-box',
                background: focused ? alpha(p.primary, 0.15) : 'transparent',
                border: `${u.px(1)}px solid ${focused ? alpha(p.primary, 0.3) : 'transparent'}`,
                borderRadius: u.r(8),
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: u.r(8) - u.px(1),
                  top: (u.r(30) - u.r(14)) / 2 - u.px(1),
                }}
              >
                <Sym name={r.icon} size={u.r(14)} color={alpha(p.onSurface, 0.9)} />
              </div>
              <Txt
                size={u.t(12)}
                color={p.onSurface}
                weight={focused ? 700 : 500}
                style={{
                  position: 'absolute',
                  left: u.r(8) + u.r(14) + u.r(8) - u.px(1),
                  top: (u.r(30) - u.t(12) * LINE) / 2 - u.px(1),
                }}
              >
                {r.label}
              </Txt>
              {r.box !== undefined && (
                <div style={{ position: 'absolute', right: u.r(8) - u.px(1), top: (u.r(30) - u.r(14)) / 2 - u.px(1) }}>
                  <Sym
                    name={r.box ? 'check_box_rounded' : 'check_box_outline_blank_rounded'}
                    size={u.r(14)}
                    color={r.box ? p.primary : alpha(p.onSurface, 0.45)}
                  />
                </div>
              )}
              {(r.submenu || r.checked) && (
                <div
                  style={{
                    position: 'absolute',
                    right: u.r(8) - u.px(1),
                    top: (u.r(30) - u.r(14)) / 2 - u.px(1),
                  }}
                >
                  {r.submenu ? (
                    <Sym name="chevron_right_rounded" size={u.r(14)} color={alpha(p.onSurface, 0.7)} />
                  ) : (
                    <Sym name="check_rounded" size={u.r(14)} color={p.primary} />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---- Start: the System Settings dialog ------------------------------------------- */

const TAB_LABEL = {
  general: 'General',
  emulators: 'Emulators',
  appearance: 'Appearance',
  hidden: 'Hidden',
} as const

const GENERAL: Readonly<Record<GeneralRow, { title: string; subtitle: string }>> = {
  alwaysShowRomName: {
    title: 'Always show ROM file name',
    subtitle: 'Use the ROM file name in lists (ignores scraped titles for the main line)',
  },
  hideExtension: {
    title: 'Hide file extension (ROM file name only)',
    subtitle: 'When the list uses the file name, hide extensions such as .iso or .zip',
  },
  hideParentheses: {
    title: 'Hide parentheses in file name ()',
    subtitle: 'When the list uses the file name, remove text inside parentheses',
  },
  hideBrackets: {
    title: 'Hide brackets in file name []',
    subtitle: 'When the list uses the file name, remove text inside square brackets',
  },
  recursiveScan: {
    title: 'Recursive ROMs Scan',
    subtitle: 'Scan for ROMs in subdirectories',
  },
  subfolderView: {
    title: 'Show Subfolders',
    subtitle: 'Group ROMs in subfolders into browsable folders instead of mixing them with games',
  },
}

function SettingsDialog({ state, o }: { state: State; o: SystemSettings }) {
  const neo = useNeo()
  const { u, p } = neo
  const system = systemOf(entries(state)[state.sel]!)
  const def = systemDef(system)
  const tabs = settingsTabs(system)
  const tab = tabs[o.tab]!
  const w = Math.min(u.r(640), u.W - u.r(16) * 2)
  const h = Math.min(u.r(480), u.H - u.r(16) * 2)
  const box = { left: (u.W - w) / 2, top: (u.H - h) / 2, width: w, height: h }

  const headerH = u.r(8) * 2 + u.t(12) * LINE + u.r(1) + u.t(10) * LINE
  const tabH = u.r(8) * 2 + u.t(10) * LINE + u.r(2)
  const footerH = u.r(10) * 2 + controlHeight(neo)
  const bodyTop = headerH + tabH
  const bodyH = h - bodyTop - footerH

  // Each tab's left edge: after the LB glyph and its 8.r, then 16.r between labels.
  const tabW = tabs.map((t) => textWidth(TAB_LABEL[t].toUpperCase(), u.t(10), u.r(0.5)))
  const tabLeft = tabs.map((_, i) => u.r(12) + u.r(24) + u.r(8) + tabW.slice(0, i).reduce((n, w) => n + w + u.r(16), 0))
  return (
    <>
      {/* `showDialog`'s barrier: Flutter's default `Colors.black54`. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.54)',
        }}
      />
      <div
        data-part="system-settings"
        // Inset 16.r on every side over the dimmed screen: covering it is the point (`e2e/compositing.spec.ts`).
        data-dialog
        style={{
          ...abs(box),
          boxSizing: 'border-box',
          background: p.surface,
          borderRadius: u.r(12),
          border: `${u.px(1)}px solid ${alpha(p.outline, 0.1)}`,
          boxShadow: shadow(neo, alpha(p.shadow, 0.5), u.r(10), 0, u.px(4)),
          overflow: 'hidden',
        }}
      >
        <Txt
          size={u.t(12)}
          color={p.onSurface}
          weight={700}
          style={{ position: 'absolute', left: u.r(12), top: u.r(8) }}
        >
          System Settings
        </Txt>
        <Txt
          size={u.t(10)}
          color={alpha(p.onSurface, 0.6)}
          weight={500}
          style={{
            position: 'absolute',
            left: u.r(12),
            top: u.r(8) + u.t(12) * LINE + u.r(1),
          }}
        >
          {def.name}
        </Txt>
        <div
          style={{
            position: 'absolute',
            right: u.r(12) + u.r(6),
            top: (headerH - u.r(18)) / 2,
          }}
        >
          <Sym name="close_rounded" size={u.r(18)} color={alpha(p.onSurface, 0.5)} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: headerH,
            height: tabH,
            borderBottom: `${u.px(1)}px solid ${alpha(p.outline, 0.1)}`,
          }}
        >
          <Tinted
            src={gamepad('Xbox_LB_bumper')}
            box={{
              left: u.r(12),
              top: (tabH - u.r(24)) / 2,
              width: u.r(24),
              height: u.r(24),
            }}
            color={alpha(p.onSurface, 0.5)}
          />
          {tabs.map((t, i) => {
            const label = TAB_LABEL[t].toUpperCase()
            const on = i === o.tab
            const tw = tabW[i]!
            const at = tabLeft[i]!
            return (
              <div
                key={t}
                style={{
                  ...abs({ left: at, top: 0, width: tw, height: tabH }),
                  borderBottom: on ? `${u.r(2)}px solid ${p.primary}` : undefined,
                  boxSizing: 'border-box',
                }}
              >
                <Txt
                  size={u.t(10)}
                  color={on ? p.primary : alpha(p.onSurface, 0.5)}
                  weight={on ? 700 : 500}
                  letterSpacing={u.r(0.5)}
                  style={{ position: 'absolute', left: 0, top: u.r(8) }}
                >
                  {label}
                </Txt>
              </div>
            )
          })}
          <Tinted
            src={gamepad('Xbox_RB_bumper')}
            box={{
              left: w - u.r(12) - u.r(24),
              top: (tabH - u.r(24)) / 2,
              width: u.r(24),
              height: u.r(24),
            }}
            color={alpha(p.onSurface, 0.5)}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: bodyTop,
            height: bodyH,
            overflow: 'hidden',
          }}
        >
          {tab === 'general' && <GeneralTab state={state} system={system} focus={o.focus} width={w} />}
          {tab === 'emulators' && (
            <EmulatorsTab state={state} system={system} focus={o.focus} width={w} height={bodyH} />
          )}
          {tab === 'appearance' && <AppearanceTab width={w} focus={o.focus} />}
          {tab === 'hidden' && <HiddenTab width={w} height={bodyH} />}
        </div>

        <GamepadControl
          glyph="Xbox_D-pad_ALL"
          label="Navigate"
          bg={p.tertiary}
          fg={p.onPrimary}
          left={u.r(10)}
          top={h - footerH + u.r(10)}
        />
        <GamepadControl
          glyph="Xbox_B_button"
          label="Close"
          bg={p.error}
          fg={p.onError}
          left={w - u.r(10) - controlWidth(neo, 'Close')}
          top={h - footerH + u.r(10)}
        />
      </div>
    </>
  )
}

function GeneralTab({ state, system, focus, width }: { state: State; system: string; focus: number; width: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const values = sysSettingsOf(state, system)
  const rowH = u.r(6) * 2 + Math.max(u.r(28), u.t(10) * LINE + u.t(9) * LINE)
  return (
    <>
      {generalRows(system).map((key, i) => {
        const on = i === focus
        const disabled = key === 'subfolderView' && !values.recursiveScan
        const top = u.r(6) + i * (rowH + u.r(4))
        const toggleW = u.r(24) * 2 + u.r(16) + u.r(2) * 2
        return (
          <div
            key={key}
            style={{
              ...abs({
                left: u.r(12),
                top,
                width: width - u.r(24),
                height: rowH,
              }),
              background: on ? alpha(p.primary, 0.2) : 'transparent',
              borderRadius: neo.radius.internal,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Txt
              size={u.t(10)}
              color={on ? p.primary : p.onSurface}
              weight={600}
              style={{
                position: 'absolute',
                left: u.r(12),
                top: (rowH - u.t(10) * LINE - u.t(9) * LINE) / 2,
              }}
            >
              {GENERAL[key].title}
            </Txt>
            <Txt
              size={u.t(9)}
              color={alpha(p.onSurface, 0.6)}
              style={{
                position: 'absolute',
                left: u.r(12),
                top: (rowH - u.t(10) * LINE - u.t(9) * LINE) / 2 + u.t(10) * LINE,
                width: width - u.r(24) - u.r(12) * 3 - toggleW,
                textOverflow: 'ellipsis',
              }}
            >
              {GENERAL[key].subtitle}
            </Txt>
            <Toggle value={values[key]} left={width - u.r(24) - u.r(12) - toggleW} top={(rowH - u.r(28)) / 2} />
          </div>
        )
      })}
    </>
  )
}

/** `CustomToggleSwitch` (`custom_toggle_switch.dart:41-81`): `AnimatedToggleSwitch.dual`. */
export function Toggle({ value, left, top: y }: { value: boolean; left: number; top: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const ind = u.r(24)
  const bw = u.r(2)
  const w = ind * 2 + u.r(16) + bw * 2
  const h = u.r(28)
  const thumb = value ? p.primary : p.onSurface
  const label = value ? 'ON' : 'OFF'
  const labelW = textWidth(label, u.t(8))
  const free = value ? { left: bw, width: w - bw * 2 - ind } : { left: bw + ind, width: w - bw * 2 - ind }
  return (
    <div
      style={{
        ...abs({ left, top: y, width: w, height: h }),
        boxSizing: 'border-box',
        borderRadius: h / 2,
        border: `${bw}px solid ${value ? p.primary : p.onSurface}`,
        background: value
          ? `linear-gradient(${alpha(p.primary, 0.2)}, ${alpha(p.primary, 0.2)}), ${p.surface}`
          : p.surface,
      }}
    >
      <Txt
        size={u.t(8)}
        color={p.onSurface}
        weight={700}
        style={{
          position: 'absolute',
          left: free.left + (free.width - labelW) / 2 - bw,
          top: (h - bw * 2 - u.t(8) * LINE) / 2,
        }}
      >
        {label}
      </Txt>
      <div
        style={{
          ...abs({
            left: (value ? w - bw * 2 - ind : 0) + (h - bw * 2 - ind) / 2,
            top: (h - bw * 2 - ind) / 2,
            width: ind,
            height: ind,
          }),
          borderRadius: ind / 2,
          background: thumb,
          transition: motion(neo, []),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: (ind - u.r(12)) / 2,
            top: (ind - u.r(12)) / 2,
          }}
        >
          <Sym name={value ? 'check_rounded' : 'close_rounded'} size={u.r(12)} color={p.surface} />
        </div>
      </div>
    </div>
  )
}

/**
 * The Emulators tab (`tabs.dart:844-905`, `row_builders.dart`): a row per RetroArch package, then one
 * per standalone. The Odin is taken to have RetroArch 64 installed and nothing else, which is what
 * `_fixRetroarchAndroidDefault` promotes; the rg40xx to have RetroArch configured. No core is picked,
 * as on a fresh install.
 */
function EmulatorsTab({
  state,
  system,
  focus,
  width,
  height,
}: {
  state: State
  system: string
  focus: number
  width: number
  height: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const android = state.platform === 'android'
  const e = systemDef(system).emulators[state.platform]
  const rows = [
    ...e.groups.map((name) => ({
      kind: 'group' as const,
      name,
      ok: android ? name === 'RetroArch 64' : true,
    })),
    ...e.standalone.map((name) => ({
      kind: 'standalone' as const,
      name,
      ok: false,
    })),
  ]
  const lineH = u.t(12) * LINE + u.t(11) * LINE
  const rowH = u.r(4) * 2 + Math.max(u.r(28), lineH)
  const pitch = rowH + u.r(6)
  // The list keeps the focused row centred once it can (`CenteredScrollController`).
  const viewport = height - u.r(4) * 2
  const total = rows.length * pitch - u.r(6)
  const offset = Math.min(Math.max(0, total - viewport), Math.max(0, focus * pitch + rowH / 2 - viewport / 2))
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: u.r(4) - offset }}>
      {rows.map((r, i) => {
        const on = i === focus
        const tint = on ? p.primary : p.onSurface
        const status = android ? (r.ok ? 'Installed' : 'Not installed') : r.ok ? 'Configured' : 'Not configured'
        const statusIcon = r.ok ? 'check_circle_rounded' : android ? 'error_outline_rounded' : 'warning_rounded'
        const pickerW = textWidth('Select Core', u.t(10)) + u.r(16) + u.r(8) * 2
        const buttonW = u.r(12) + u.r(4) + textWidth('Select', u.t(10)) + u.r(8) * 2
        return (
          <div
            key={`${r.kind}:${r.name}`}
            style={{
              ...abs({
                left: u.r(8),
                top: i * pitch,
                width: width - u.r(16),
                height: rowH,
              }),
              background: on ? alpha(p.primary, r.kind === 'group' ? 0.2 : 0.15) : 'transparent',
              borderRadius: neo.radius.internal,
            }}
          >
            <div style={{ opacity: r.ok || r.kind === 'standalone' ? 1 : 0.5 }}>
              <div
                style={{
                  ...abs({
                    left: u.r(8),
                    top: (rowH - u.r(24)) / 2,
                    width: u.r(24),
                    height: u.r(24),
                  }),
                  background: alpha(p.primary, on ? 0.2 : 0.1),
                  borderRadius: neo.radius.internal,
                }}
              >
                {r.kind === 'group' ? (
                  <Tinted
                    src={emulator('retroarch.webp')}
                    box={{
                      left: u.r(4),
                      top: u.r(4),
                      width: u.r(16),
                      height: u.r(16),
                    }}
                    color={tint}
                  />
                ) : (
                  <div style={{ position: 'absolute', left: u.r(5), top: u.r(5) }}>
                    <Sym name="apps_rounded" size={u.r(14)} color={tint} />
                  </div>
                )}
              </div>
              <Txt
                size={u.t(12)}
                color={tint}
                weight={600}
                style={{
                  position: 'absolute',
                  left: u.r(8) + u.r(24) + u.r(10),
                  top: (rowH - lineH) / 2,
                }}
              >
                {r.name}
              </Txt>
              <div
                style={{
                  position: 'absolute',
                  left: u.r(8) + u.r(24) + u.r(10),
                  top: (rowH - lineH) / 2 + u.t(12) * LINE,
                  display: 'flex',
                  alignItems: 'center',
                  gap: u.r(4),
                }}
              >
                <Sym name={statusIcon} size={u.r(11)} color={r.ok ? p.success : p.warning} />
                <Txt
                  size={r.kind === 'group' ? u.r(10) : u.r(11)}
                  color={on ? p.primary : r.kind === 'group' ? alpha(p.onSurface, 0.6) : p.onSurface}
                >
                  {status}
                </Txt>
              </div>
            </div>
            {r.kind === 'group' ? (
              <div
                style={{
                  ...abs({
                    left: width - u.r(16) - u.r(8) - pickerW,
                    top: (rowH - u.r(28)) / 2,
                    width: pickerW,
                    height: u.r(28),
                  }),
                  background: p.surface,
                  borderRadius: neo.radius.internal,
                  opacity: r.ok ? 1 : 0.5,
                }}
              >
                <Txt
                  size={u.t(10)}
                  color={p.onSurface}
                  weight={700}
                  style={{
                    position: 'absolute',
                    left: u.r(8),
                    top: (u.r(28) - u.t(10) * LINE) / 2,
                  }}
                >
                  Select Core
                </Txt>
                <div
                  style={{
                    position: 'absolute',
                    right: u.r(8),
                    top: (u.r(28) - u.r(16)) / 2,
                  }}
                >
                  <Sym name="arrow_drop_down_rounded" size={u.r(16)} color={p.onSurface} />
                </div>
              </div>
            ) : (
              <div
                style={{
                  ...abs({
                    left: width - u.r(16) - u.r(8) - buttonW,
                    top: (rowH - u.t(10) * LINE - u.r(4) * 2) / 2,
                    width: buttonW,
                    height: u.t(10) * LINE + u.r(4) * 2,
                  }),
                  background: p.tertiary,
                  borderRadius: neo.radius.internal,
                }}
              >
                <Tinted
                  src={gamepad('Xbox_A_button')}
                  box={{
                    left: u.r(8),
                    top: (u.t(10) * LINE + u.r(8) - u.r(12)) / 2,
                    width: u.r(12),
                    height: u.r(12),
                  }}
                  color={p.onTertiary}
                />
                <Txt
                  size={u.t(10)}
                  color={p.onTertiary}
                  weight={700}
                  style={{
                    position: 'absolute',
                    left: u.r(8) + u.r(12) + u.r(4),
                    top: u.r(4),
                  }}
                >
                  Select
                </Txt>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AppearanceTab({ width, focus }: { width: number; focus: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const rows = [
    {
      title: 'Background Image',
      subtitle: 'jpg, png, webp, gif | 1024x1024px or less',
    },
    { title: 'System Logo', subtitle: 'jpg, png, webp | 512x512px or less' },
  ]
  const titleTop = u.r(6)
  const first = titleTop + u.t(12) * LINE + u.r(8)
  return (
    <>
      <Txt
        size={u.t(12)}
        color={p.onSurface}
        weight={700}
        style={{ position: 'absolute', left: u.r(12), top: titleTop }}
      >
        System Images
      </Txt>
      {rows.map((r, i) => {
        const on = i === focus
        return (
          <div
            key={r.title}
            style={{
              ...abs({
                left: u.r(12),
                top: first + i * (u.r(50) + u.r(8)),
                width: width - u.r(24),
                height: u.r(50),
              }),
              boxSizing: 'border-box',
              background: on ? alpha(p.primary, 0.1) : 'transparent',
              border: `${u.px(1)}px solid ${on ? alpha(p.primary, 0.5) : 'transparent'}`,
              borderRadius: neo.radius.external,
            }}
          >
            <div
              style={{
                ...abs({
                  left: u.r(12),
                  top: (u.r(50) - u.r(36)) / 2 - u.px(1),
                  width: u.r(36),
                  height: u.r(36),
                }),
                background: 'rgba(0,0,0,0.26)',
                borderRadius: neo.radius.internal,
              }}
            >
              <div style={{ position: 'absolute', left: u.r(10), top: u.r(10) }}>
                <Sym name="image_not_supported_rounded" size={u.r(16)} color="rgba(255,255,255,0.54)" />
              </div>
            </div>
            <Txt
              size={u.t(12)}
              color={p.onSurface}
              weight={500}
              style={{
                position: 'absolute',
                left: u.r(12) + u.r(36) + u.r(12),
                top: u.r(8),
              }}
            >
              {r.title}
            </Txt>
            <Txt
              size={u.t(10)}
              color={alpha(p.onSurface, 0.6)}
              style={{
                position: 'absolute',
                left: u.r(12) + u.r(36) + u.r(12),
                top: u.r(8) + u.t(12) * LINE + u.r(2),
              }}
            >
              {r.subtitle}
            </Txt>
            <div
              style={{
                position: 'absolute',
                right: u.r(12),
                top: (u.r(50) - u.r(16)) / 2 - u.px(1),
              }}
            >
              <Sym name="upload_file_rounded" size={u.r(16)} color={p.primary} />
            </div>
          </div>
        )
      })}
    </>
  )
}

function HiddenTab({ width, height }: { width: number; height: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const title = 'No hidden games'
  const body = 'Hide a game from its own settings and it appears here.'
  const total = u.r(28) + u.r(8) + u.t(12) * LINE + u.r(4) + u.t(10) * LINE
  const y = (height - total) / 2
  return (
    <>
      <div style={{ position: 'absolute', left: (width - u.r(28)) / 2, top: y }}>
        <Sym name="visibility_off_rounded" size={u.r(28)} color={alpha(p.onSurface, 0.5)} />
      </div>
      <Txt
        size={u.t(12)}
        color={p.onSurface}
        weight={600}
        style={{
          position: 'absolute',
          left: 0,
          width,
          top: y + u.r(28) + u.r(8),
          textAlign: 'center',
        }}
      >
        {title}
      </Txt>
      <Txt
        size={u.t(10)}
        color={alpha(p.onSurface, 0.6)}
        style={{
          position: 'absolute',
          left: 0,
          width,
          top: y + u.r(28) + u.r(8) + u.t(12) * LINE + u.r(4),
          textAlign: 'center',
        }}
      >
        {body}
      </Txt>
    </>
  )
}

/* ---- Select: the notification panel ------------------------------------------------ */

const NOTICE_ICON = {
  success: { icon: 'check_circle_rounded', color: '#66bb6a' },
  error: { icon: 'error_rounded', color: '' },
  info: { icon: 'info_rounded', color: '' },
} as const

/** The bell's panel (`notification_bell.dart:195-641`): Clear all, then one row per notification. */
function NotificationPanel({ state }: { state: State }) {
  const neo = useNeo()
  const { u, p } = neo
  const o = state.overlays.find((x) => x.kind === 'notifications')
  const focus = o?.kind === 'notifications' ? o.focus : 0
  // The bell sits in the status pill; the panel hangs 14px under it, 8px from the right edge.
  const pillH = u.r(16) + u.px(4) * 2
  const bellBottom = (u.r(46) - pillH) / 2 + u.px(4) + (u.r(16) - u.r(14)) / 2 + u.r(14)
  const title = 'Notifications'
  const empty = 'No active notifications'
  const notices = state.notices
  const rowW = (m: string) => u.r(12) * 2 + u.r(16) + u.r(8) * 2 + u.r(14) + textWidth(m, u.t(10))
  const w = Math.max(
    u.r(200),
    Math.min(
      u.r(300),
      Math.max(
        textWidth(title, u.t(12)) + u.r(24),
        textWidth(empty, u.t(11)) + u.r(32),
        ...notices.map((n) => rowW(n.message)),
      ),
    ),
  )
  const headerH = u.r(10) * 2 + u.t(12) * LINE
  const rowH = u.r(10) * 2 + Math.max(u.r(16), u.t(10) * LINE)
  const h = notices.length
    ? headerH + notices.length * rowH + (notices.length - 1) * u.r(1)
    : headerH + u.r(16) * 2 + u.t(11) * LINE
  const clear = 'Clear all'
  const clearW = textWidth(clear, u.t(10)) + u.r(6) * 2
  return (
    <div
      data-part="notifications"
      style={{
        ...abs({ left: u.W - u.px(8) - w, top: bellBottom + u.px(14), width: w, height: Math.min(h, u.r(360)) }),
        boxSizing: 'border-box',
        background: p.surface,
        borderRadius: neo.radius.external,
        border: `${u.px(1)}px solid ${alpha(p.outline, 0.3)}`,
        boxShadow: shadow(neo, alpha(p.shadow, 0.3), u.px(6), 0, u.px(3)),
        overflow: 'hidden',
      }}
    >
      <Txt
        size={u.t(12)}
        color={p.onSurface}
        weight={700}
        style={{ position: 'absolute', left: u.r(12), top: u.r(10) }}
      >
        {title}
      </Txt>
      {notices.length > 0 && (
        <div
          style={{
            ...abs({
              left: w - u.r(12) - clearW,
              top: (headerH - u.t(10) * LINE - u.r(4)) / 2,
              width: clearW,
              height: u.t(10) * LINE + u.r(4),
            }),
            background: focus === 0 ? alpha(p.primary, 0.15) : 'transparent',
            borderRadius: neo.radius.internal,
          }}
        >
          <Txt
            size={u.t(10)}
            color={p.primary}
            weight={600}
            style={{ position: 'absolute', left: u.r(6), top: u.r(2) }}
          >
            {clear}
          </Txt>
        </div>
      )}
      {notices.length === 0 ? (
        <Txt
          size={u.t(11)}
          color={alpha(p.onSurface, 0.6)}
          style={{ position: 'absolute', left: 0, width: w, top: headerH + u.r(16), textAlign: 'center' }}
        >
          {empty}
        </Txt>
      ) : (
        notices.map((n, i) => {
          const look = NOTICE_ICON[n.type]
          const top = headerH + i * (rowH + u.r(1))
          return (
            <div key={i}>
              {i > 0 && (
                <div
                  style={{
                    ...abs({ left: 0, top: top - u.r(1), width: w, height: u.r(1) }),
                    background: alpha(p.outline, 0.2),
                  }}
                />
              )}
              <div
                style={{
                  ...abs({ left: 0, top, width: w, height: rowH }),
                  background: focus === i + 1 ? alpha(p.primary, 0.15) : 'transparent',
                }}
              >
                <div style={{ position: 'absolute', left: u.r(12), top: u.r(10) }}>
                  <Sym
                    name={look.icon}
                    size={u.r(16)}
                    color={look.color || (n.type === 'error' ? p.error : p.primary)}
                  />
                </div>
                <Txt
                  size={u.t(10)}
                  color={alpha(p.onSurface, 0.8)}
                  style={{
                    position: 'absolute',
                    left: u.r(12) + u.r(16) + u.r(8),
                    top: u.r(10) + (u.r(16) - u.t(10) * LINE) / 2,
                  }}
                >
                  {n.message}
                </Txt>
                <div style={{ position: 'absolute', right: u.r(12), top: u.r(10) + u.r(1) }}>
                  <Sym name="close_rounded" size={u.r(14)} color={alpha(p.onSurface, 0.5)} />
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
