/**
 * PORTING NOTES
 * CFW: NeoStation            Devices: odin2-mini, rg40xx
 * Source: lib/widgets/game_view_mode_dropdown.dart (X), lib/widgets/context_menu/game_context_menu.dart
 *         and my_games_list/context_menu.dart (Y), game_settings_dialog/ (Start),
 *         lib/widgets/game_launch_dialog.dart (A), game_details_card/random_game_dialog.dart,
 *         lib/widgets/confirm_action_dialog.dart, delete_game_dialog.dart
 * Mode: reproduce
 *
 * Layout:        the view dropdown is pinned 12.r from the top and 6.r in, 170.r wide. The game menu
 *                hangs from the selected row or card like the systems one, with Add to opening beside
 *                itself. The settings dialog is the system dialog's frame with `secondary` tabs. The
 *                launch dialog is a 320.r card; the random one at most 320 x 180.r.
 * Focus & selection: `primary` 0.15 rows in the dropdown and menu; `secondary` rows in the settings
 *                dialog; the Manage tab's rows take a `primary` 2px border.
 * Buttons:       dropdown - up/down wrap, left/right step the size or style and apply, A picks and
 *                closes, B closes. Menu - as the systems menu; A on Favorite toggles and stays open.
 *                Settings - LB/RB change tab and wrap, up/down clamp, left/right switch Scraping's
 *                Data and Media, A acts, B closes. Launch - any face button dismisses it. Random - A
 *                plays once it lands, X spins again, B closes. Confirm - A confirms, B cancels.
 * Transitions:   the random spin ticks through the list every 80ms for 18 ticks, then shows PLAY; the
 *                launch dialog moves from "Launching Game..." to "Game executing..." after two seconds.
 * Notes:         text fields are not editable here: A on a field shows it being edited and walks to
 *                Save, as the source's A does, without a keyboard. "New collection..." reports the
 *                collection it made, but the Collections card and browser are not reproduced.
 */
import { useEffect, useState } from 'react'
import { emulator, gamepad } from '../assets'
import { boxart, fanart, screenshot } from '../art'
import { CARD_SIZES, GAMES, isFavorite, playedOf, systemDef, type Game } from '../library'
import {
  GAME_MENU,
  MANAGE_ROWS,
  emulatorRows,
  gameDropdownRows,
  routeGames,
  selectedGame,
  type ConfirmAction,
  type GameDropdown,
  type GameDropdownRow,
  type GameMenu,
  type GameSettings,
  type GamesRoute,
  type Launch,
  type RandomPick,
  type State,
} from '../machine'
import { alpha } from '../palette'
import type { SymbolName } from '../symbols'
import { textWidth } from '../text'
import { sidebarGeometry } from './GamesList'
import { MenuPanel, Segments, Toggle, place, type MenuRow } from './Overlays'
import {
  GamepadControl,
  LINE,
  Sym,
  Tinted,
  Txt,
  abs,
  controlHeight,
  controlWidth,
  shadow,
  useNeo,
  type Box,
  type Neo,
} from './parts'

/* ---- X: the view dropdown ------------------------------------------------------------ */

const VIEW_LOOK = {
  list: { label: 'List View', icon: 'list_rounded' },
  grid: { label: 'Grid View', icon: 'grid_view_rounded' },
  carousel: { label: 'Carousel View', icon: 'view_carousel_rounded' },
} as const

const GROUP = { view: 'VIEW MODE', size: 'CARD SIZE', style: 'CARD STYLE' } as const

export function GameDropdownPanel({ state, o }: { state: State; o: GameDropdown }) {
  const neo = useNeo()
  const { u, p } = neo
  const rows = gameDropdownRows(state)
  const headerH = u.r(6) * 2 + u.t(10) * LINE
  const width = u.r(170)
  const items: { kind: 'divider' | 'header' | 'row'; top: number; row?: GameDropdownRow; index?: number }[] = []
  let y = 0
  rows.forEach((row, i) => {
    if (i === 0 || rows[i - 1]!.kind !== row.kind) {
      if (i > 0) {
        items.push({ kind: 'divider', top: y })
        y += u.r(4)
      }
      items.push({ kind: 'header', top: y, row })
      y += headerH
    }
    items.push({ kind: 'row', top: y, row, index: i })
    y += (row.kind === 'view' ? u.r(24) : u.r(28)) + u.r(2) * 2
  })
  const height = y + u.r(8) * 2
  return (
    <div
      data-part="game-dropdown"
      style={{
        ...abs({ left: u.r(6), top: u.r(12), width, height }),
        boxSizing: 'border-box',
        background: p.surface,
        borderRadius: u.r(12),
        border: `${u.px(1)}px solid ${alpha(p.primary, 0.2)}`,
        boxShadow: shadow(neo, 'rgba(0,0,0,0.5)', u.px(15), 0, u.px(5)),
      }}
    >
      {items.map((it, k) => {
        const top = u.r(8) - u.px(1) + it.top
        if (it.kind === 'divider')
          return (
            <div
              key={k}
              style={{
                ...abs({ left: 0, top: top + (u.r(4) - u.px(1)) / 2, width: width - u.px(2), height: u.px(1) }),
                background: alpha(p.outline, 0.1),
              }}
            />
          )
        if (it.kind === 'header')
          return (
            <Txt
              key={k}
              size={u.t(10)}
              color={alpha(p.onSurface, 0.5)}
              weight={800}
              letterSpacing={u.r(1)}
              style={{ position: 'absolute', left: u.r(16), top: top + u.r(6) }}
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
            top={top}
            width={width - u.px(2)}
          />
        )
      })}
    </div>
  )
}

function DropdownItem({
  state,
  row,
  focused,
  top,
  width,
}: {
  state: State
  row: GameDropdownRow
  focused: boolean
  top: number
  width: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const seg = row.kind !== 'view'
  const h = seg ? u.r(28) : u.r(24)
  const box: Box = { left: u.r(4), top: top + u.r(2), width: width - u.r(8), height: h }
  const active = row.kind === 'view' && state.gameView === row.value
  const icon: SymbolName =
    row.kind === 'view' ? VIEW_LOOK[row.value].icon : row.kind === 'size' ? 'crop_free_rounded' : 'style_rounded'
  const b = u.px(1)
  return (
    <div
      style={{
        ...abs(box),
        boxSizing: 'border-box',
        background: focused ? alpha(p.primary, 0.15) : 'transparent',
        border: `${b}px solid ${focused ? alpha(p.primary, 0.3) : 'transparent'}`,
        borderRadius: u.r(8),
      }}
    >
      <div style={{ position: 'absolute', left: u.r(12) - b, top: (h - u.r(14)) / 2 - b }}>
        <Sym name={icon} size={u.r(14)} color={active ? p.secondary : seg ? alpha(p.onSurface, 0.5) : p.onSurface} />
      </div>
      {row.kind === 'view' ? (
        <>
          <Txt
            size={u.t(12)}
            color={active ? p.secondary : p.onSurface}
            weight={active ? 700 : 500}
            style={{ position: 'absolute', left: u.r(12) + u.r(14) + u.r(8) - b, top: (h - u.t(12) * LINE) / 2 - b }}
          >
            {VIEW_LOOK[row.value].label}
          </Txt>
          {active && (
            <div style={{ position: 'absolute', right: u.r(12) - b, top: (h - u.r(14)) / 2 - b }}>
              <Sym name="check_rounded" size={u.r(14)} color={p.secondary} />
            </div>
          )}
        </>
      ) : (
        <Segments
          left={u.r(12) + u.r(14) + u.r(8) - b}
          width={box.width - u.r(12) * 2 - u.r(14) - u.r(8)}
          height={h - b * 2}
          value={row.kind === 'size' ? state.gameSize : state.gameStyle}
          values={row.kind === 'size' ? CARD_SIZES : ['fanart', 'box']}
          labels={row.kind === 'size' ? CARD_SIZES : ['Fanart', 'Box']}
          on={p.secondary}
          onText={p.onSecondary}
        />
      )}
    </div>
  )
}

/* ---- Y: the game menu ---------------------------------------------------------------- */

/** Where the selected game is: its row in the list, or its card in the grid and carousel. */
function gameAnchor(neo: Neo, state: State, route: GamesRoute): Box {
  const { u } = neo
  const n = routeGames(state, route).length
  if (state.gameView === 'list') {
    const g = sidebarGeometry(neo, n, route.sel)
    return {
      left: g.box.left + u.r(8),
      top: g.box.top + g.header + u.r(2) + route.sel * g.row - g.offset,
      width: g.box.width - u.r(16),
      height: g.row,
    }
  }
  // Grid and carousel: the middle of the screen, where both keep the selection.
  const w = u.r(160)
  return { left: (u.W - w) / 2, top: u.H / 2 - w / 2, width: w, height: w }
}

export function GameMenuPanel({ state, o }: { state: State; o: GameMenu }) {
  const neo = useNeo()
  const route = state.route?.kind === 'games' ? state.route : null
  const game = selectedGame(state)
  if (!route || !game) return null
  const rows: MenuRow[] = [
    { label: 'Game Settings', icon: 'settings_rounded' },
    { label: 'Scrape', icon: 'cloud_download_rounded' },
    { label: 'Add to…', icon: 'playlist_add_rounded', submenu: true },
    { label: 'View Mode', icon: 'grid_view_rounded', separatorBefore: true },
    { label: 'Random Game', icon: 'casino_rounded' },
  ]
  const box = place(neo, gameAnchor(neo, state, route), rows, true)
  const sub: MenuRow[] = [
    { label: 'Favorite', icon: 'favorite_rounded', box: isFavorite(state.lib, game) },
    { label: 'New collection…', icon: 'add_rounded', separatorBefore: true },
  ]
  const u = neo.u
  const addTop = box.top + u.r(8) + GAME_MENU.indexOf('add') * u.r(30)
  const subBox =
    o.sub !== null ? place(neo, { left: box.left, top: addTop, width: box.width, height: u.r(30) }, sub, false) : null
  return (
    <>
      <MenuPanel box={box} rows={rows} focus={o.focus} />
      {subBox && <MenuPanel box={subBox} rows={sub} focus={o.sub!} />}
    </>
  )
}

/* ---- Start: the game settings dialog -------------------------------------------------- */

const SETTINGS_TABS = ['Emulator', 'Scraping', 'Manage'] as const

/** `formatPlayTime`, short (`lib/utils/game_utils.dart:20-54`). */
function shortTime(s: number): string {
  if (s <= 0) return '0s'
  if (s >= 3600) return `${Math.floor(s / 3600)}h`
  if (s >= 60) return `${Math.floor(s / 60)}m`
  return `${s}s`
}

export function GameSettingsDialog({ state, o }: { state: State; o: GameSettings }) {
  const neo = useNeo()
  const { u, p } = neo
  const game = selectedGame(state)
  if (!game) return null
  const w = Math.min(u.r(640), u.W - u.r(16) * 2)
  const h = Math.min(u.r(480), u.H - u.r(16) * 2)
  const box = { left: (u.W - w) / 2, top: (u.H - h) / 2, width: w, height: h }
  const headerH = u.r(8) * 2 + u.t(12) * LINE + u.r(1) + u.t(10) * LINE
  const tabH = u.r(8) * 2 + u.t(10) * LINE + u.r(2)
  const footerH = u.r(8) * 2 + controlHeight(neo)
  const bodyTop = headerH + tabH
  const bodyH = h - bodyTop - footerH
  const tabW = SETTINGS_TABS.map((t) => textWidth(t.toUpperCase(), u.t(10), u.r(0.5)))
  const tabLeft = SETTINGS_TABS.map(
    (_, i) => u.r(12) + u.r(24) + u.r(8) + tabW.slice(0, i).reduce((n, x) => n + x + u.r(16), 0),
  )

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.54)' }} />
      <div
        data-part="game-settings"
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
          Game Settings
        </Txt>
        <Txt
          size={u.t(10)}
          color={alpha(p.onSurface, 0.6)}
          weight={500}
          style={{ position: 'absolute', left: u.r(12), top: u.r(8) + u.t(12) * LINE + u.r(1), width: w - u.r(60) }}
        >
          {game.title}
        </Txt>
        <div style={{ position: 'absolute', right: u.r(12) + u.r(6), top: (headerH - u.r(18)) / 2 }}>
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
            box={{ left: u.r(12), top: (tabH - u.r(24)) / 2, width: u.r(24), height: u.r(24) }}
            color={alpha(p.onSurface, 0.5)}
          />
          {SETTINGS_TABS.map((t, i) => {
            const on = i === o.tab
            return (
              <div
                key={t}
                style={{
                  ...abs({ left: tabLeft[i]!, top: 0, width: tabW[i]!, height: tabH }),
                  boxSizing: 'border-box',
                  borderBottom: `${u.r(2)}px solid ${on ? p.secondary : 'transparent'}`,
                }}
              >
                <Txt
                  size={u.t(10)}
                  color={on ? p.secondary : alpha(p.onSurface, 0.5)}
                  weight={on ? 700 : 500}
                  letterSpacing={u.r(0.5)}
                  style={{ position: 'absolute', left: 0, top: u.r(8) }}
                >
                  {t.toUpperCase()}
                </Txt>
              </div>
            )
          })}
          <Tinted
            src={gamepad('Xbox_RB_bumper')}
            box={{ left: w - u.r(12) - u.r(24), top: (tabH - u.r(24)) / 2, width: u.r(24), height: u.r(24) }}
            color={alpha(p.onSurface, 0.5)}
          />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: bodyTop, height: bodyH, overflow: 'hidden' }}>
          {o.tab === 0 && <EmulatorTab state={state} game={game} focus={o.focus} width={w} height={bodyH} />}
          {o.tab === 1 && <ScrapingTab game={game} o={o} width={w} height={bodyH} />}
          {o.tab === 2 && <ManageTab state={state} game={game} focus={o.focus} width={w} />}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: footerH,
            background: alpha(p.surface, 0.05),
          }}
        >
          <GamepadControl
            glyph="Xbox_D-pad_ALL"
            label="Navigate"
            bg={p.tertiary}
            fg={p.onPrimary}
            left={u.r(8)}
            top={u.r(8)}
          />
          <GamepadControl
            glyph="Xbox_B_button"
            label="Close"
            bg={p.error}
            fg={p.onError}
            left={u.r(8) + controlWidth(neo, 'Navigate') + u.r(8)}
            top={u.r(8)}
          />
        </div>
      </div>
    </>
  )
}

/** Keep the focused row in the middle of a list that runs past its box (`ensureVisible`, alignment 0.5). */
function centred(focusTop: number, rowH: number, total: number, height: number): number {
  return Math.min(Math.max(0, total - height), Math.max(0, focusTop + rowH / 2 - height / 2))
}

function SectionHeader({ icon, label, left, top }: { icon: SymbolName; label: string; left: number; top: number }) {
  const neo = useNeo()
  const { u, p } = neo
  return (
    <div style={{ position: 'absolute', left, top, display: 'flex', alignItems: 'center', gap: u.r(4) }}>
      <Sym name={icon} size={u.r(12)} color={alpha(p.onSurface, 0.6)} />
      <Txt size={u.t(11)} color={alpha(p.onSurface, 0.6)} weight={600}>
        {label}
      </Txt>
    </div>
  )
}

/**
 * The Emulator tab: System Default, then each emulator. On the Odin RetroArch 64 is taken to be
 * installed and nothing else; on the rg40xx, RetroArch. "System Default" is the active choice.
 */
function EmulatorTab({
  state,
  game,
  focus,
  width,
  height,
}: {
  state: State
  game: Game
  focus: number
  width: number
  height: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const rows = emulatorRows(state, game)
  const lineH = u.t(12) * LINE + u.r(1) + u.t(10) * LINE
  const rowH = u.r(4) * 2 + Math.max(u.r(22), lineH)
  const pitch = rowH + u.r(4)
  const head = u.t(11) * LINE + u.r(4)
  const total = u.r(12) * 2 + head + rows.length * pitch
  const offset = centred(u.r(12) + head + focus * pitch, rowH, total, height)
  const ready = (name: string) =>
    name === 'System Default' ||
    (state.platform === 'android' ? name.startsWith('RetroArch64 ') : name.startsWith('RetroArch'))
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: -offset }}>
      <SectionHeader icon="sports_esports_rounded" label="Emulator" left={u.r(12) + u.r(4)} top={u.r(12)} />
      {rows.map((name, i) => {
        const on = i === focus
        const ok = ready(name)
        const tint = on ? p.secondary : p.onSurface
        return (
          <div
            key={name}
            style={{
              ...abs({ left: u.r(12), top: u.r(12) + head + i * pitch, width: width - u.r(24), height: rowH }),
              background: on ? alpha(p.secondary, 0.15) : alpha(p.surface, 0.1),
              borderRadius: u.r(6),
              opacity: ok ? 1 : 0.4,
            }}
          >
            <div
              style={{
                ...abs({ left: u.r(8), top: (rowH - u.r(22)) / 2, width: u.r(22), height: u.r(22) }),
                background: alpha(p.secondary, on ? 0.2 : 0.1),
                borderRadius: u.r(4),
              }}
            >
              {name.startsWith('RetroArch') ? (
                <Tinted
                  src={emulator('retroarch.webp')}
                  box={{ left: u.r(3), top: u.r(3), width: u.r(16), height: u.r(16) }}
                  color={on ? p.secondary : p.onSurface}
                />
              ) : (
                <div style={{ position: 'absolute', left: u.r(5), top: u.r(5) }}>
                  <Sym name="gamepad_rounded" size={u.r(12)} color={tint} />
                </div>
              )}
            </div>
            <Txt
              size={u.t(12)}
              color={tint}
              weight={600}
              style={{ position: 'absolute', left: u.r(8) + u.r(22) + u.r(8), top: (rowH - lineH) / 2 }}
            >
              {name}
            </Txt>
            <div
              style={{
                position: 'absolute',
                left: u.r(8) + u.r(22) + u.r(8),
                top: (rowH - lineH) / 2 + u.t(12) * LINE + u.r(1),
                display: 'flex',
                alignItems: 'center',
                gap: u.r(3),
              }}
            >
              <Sym
                name={ok ? 'check_circle_rounded' : 'error_outline_rounded'}
                size={u.r(10)}
                color={ok ? '#56c288' : '#fdaf1e'}
              />
              <Txt size={u.t(10)} color={p.onSurface}>
                {ok ? 'Ready' : 'Not configured'}
              </Txt>
            </div>
            {i === 0 && (
              <div style={{ position: 'absolute', right: u.r(8), top: (rowH - u.r(14)) / 2 }}>
                <Sym name="check_circle_rounded" size={u.r(14)} color={p.secondary} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** The Scraping tab's two views: the metadata fields, and the four kinds of art. */
function ScrapingTab({ game, o, width, height }: { game: Game; o: GameSettings; width: number; height: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const subs = ['Scraping Data', 'Scraping Media']
  const barH = u.r(8) * 2 + u.r(6) * 2 + u.t(10) * LINE
  const itemW = (width - u.r(12) * 2 - u.r(8)) / 2
  const s = game.scraped
  const fields = [
    { label: 'Title', value: game.title },
    { label: 'Developer', value: s?.developer ?? '' },
    { label: 'Publisher', value: s?.publisher ?? '' },
    { label: 'Genre', value: s?.genre ?? '' },
    ...['EN', 'ES', 'FR', 'DE', 'IT', 'PT'].map((l) => ({
      label: `Description (${l})`,
      value: l === 'EN' ? (s?.description ?? '') : '',
      lines: 3,
    })),
  ]
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: barH,
          borderBottom: `${u.px(1)}px solid ${alpha(p.outline, 0.1)}`,
        }}
      >
        {subs.map((t, i) => {
          const on = i === o.sub
          return (
            <div
              key={t}
              style={{
                ...abs({ left: u.r(12) + i * (itemW + u.r(8)), top: u.r(8), width: itemW, height: barH - u.r(16) }),
                boxSizing: 'border-box',
                background: on ? alpha(p.secondary, 0.15) : alpha(p.surface, 0.3),
                border: `${u.r(1)}px solid ${on ? alpha(p.secondary, 0.5) : alpha(p.outline, 0.1)}`,
                borderRadius: u.r(6),
              }}
            >
              <Txt
                size={u.t(10)}
                color={on ? p.secondary : alpha(p.onSurface, 0.6)}
                weight={on ? 700 : 600}
                letterSpacing={u.r(0.5)}
                style={{
                  position: 'absolute',
                  left: 0,
                  width: itemW - u.r(2),
                  top: u.r(6) - u.r(1),
                  textAlign: 'center',
                }}
              >
                {t.toUpperCase()}
              </Txt>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: barH, height: height - barH, overflow: 'hidden' }}>
        {o.sub === 0 ? (
          <DataRows fields={fields} o={o} width={width} height={height - barH} />
        ) : (
          <MediaRows game={game} focus={o.focus} width={width} />
        )}
      </div>
    </>
  )
}

function DataRows({
  fields,
  o,
  width,
  height,
}: {
  fields: { label: string; value: string; lines?: number }[]
  o: GameSettings
  width: number
  height: number
}) {
  const neo = useNeo()
  const { u, p } = neo
  const navH = u.r(6) * 2 + Math.max(u.r(18), u.t(12) * LINE + u.t(10) * LINE)
  const fieldH = (lines: number) => u.r(4) * 2 + Math.max(u.t(10) * LINE * 2, u.t(11) * LINE * lines)
  const head = u.r(8) + u.t(11) * LINE + u.r(4)
  // Row tops, in the source's order: rescrape, the header, eleven fields... then Save.
  const tops: number[] = [u.r(12)]
  let y = u.r(12) + navH + u.r(4) + head
  fields.forEach((f) => {
    tops.push(y)
    y += fieldH(f.lines ?? 1) + u.r(4)
  })
  y += u.r(8)
  tops.push(y)
  const total = y + navH + u.r(12)
  const heights = [navH, ...fields.map((f) => fieldH(f.lines ?? 1)), navH]
  const offset = centred(tops[o.focus]!, heights[o.focus]!, total, height)
  const nav = (i: number, icon: SymbolName, label: string, sub: string) => {
    const on = o.focus === i
    return (
      <div
        key={label}
        style={{
          ...abs({ left: u.r(12), top: tops[i]!, width: width - u.r(24), height: navH }),
          background: on ? alpha(p.secondary, 0.15) : 'transparent',
          borderRadius: u.r(6),
        }}
      >
        <div
          style={{
            ...abs({ left: u.r(8), top: (navH - u.r(18)) / 2, width: u.r(18), height: u.r(18) }),
            background: alpha(p.secondary, on ? 0.2 : 0.1),
            borderRadius: u.r(4),
          }}
        >
          <div style={{ position: 'absolute', left: (u.r(18) - u.r(11)) / 2, top: (u.r(18) - u.r(11)) / 2 }}>
            <Sym name={icon} size={u.r(11)} color={on ? p.secondary : p.onSurface} />
          </div>
        </div>
        <Txt
          size={u.t(12)}
          color={on ? p.secondary : p.onSurface}
          weight={600}
          style={{ position: 'absolute', left: u.r(8) + u.r(18) + u.r(8), top: u.r(6) }}
        >
          {label}
        </Txt>
        {sub && (
          <Txt
            size={u.t(10)}
            color={alpha(p.onSurface, 0.7)}
            style={{ position: 'absolute', left: u.r(8) + u.r(18) + u.r(8), top: u.r(6) + u.t(12) * LINE }}
          >
            {sub}
          </Txt>
        )}
      </div>
    )
  }
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: -offset }}>
      {nav(0, 'refresh_rounded', 'Force Rescrape', 'Rescrape')}
      <SectionHeader
        icon="edit_rounded"
        label="Description"
        left={u.r(12) + u.r(4)}
        top={u.r(12) + navH + u.r(4) + u.r(8)}
      />
      {fields.map((f, k) => {
        const i = k + 1
        const on = o.focus === i
        const editing = on && o.editing
        const h = heights[i]!
        return (
          <div
            key={f.label}
            style={{
              ...abs({ left: u.r(12), top: tops[i]!, width: width - u.r(24), height: h }),
              boxSizing: 'border-box',
              background: on ? alpha(p.secondary, 0.12) : 'transparent',
              border: `${u.r(1)}px solid ${editing ? alpha(p.secondary, 0.6) : alpha(p.outline, 0.15)}`,
              borderRadius: u.r(6),
            }}
          >
            <Txt
              size={u.t(10)}
              color={on ? p.secondary : alpha(p.onSurface, 0.7)}
              weight={600}
              style={{ position: 'absolute', left: u.r(8), top: u.r(4) + u.r(4) - u.r(1), width: u.r(92) }}
            >
              {f.label}
            </Txt>
            <div
              style={{
                position: 'absolute',
                left: u.r(8) + u.r(92),
                right: u.r(8),
                top: u.r(4) - u.r(1),
                fontFamily: "'NeoStation Anta'",
                fontSize: u.t(11),
                lineHeight: `${u.t(11) * LINE}px`,
                maxHeight: u.t(11) * LINE * (f.lines ?? 1),
                overflow: 'hidden',
                color: p.onSurface,
                whiteSpace: f.lines ? 'normal' : 'nowrap',
              }}
            >
              {/* An empty field shows the source's own dash (`game_settings_scrapping_tab.dart:967-979`). */}
              {f.value || '—'}
            </div>
          </div>
        )
      })}
      {nav(11, 'save_rounded', 'Save', '')}
    </div>
  )
}

function MediaRows({ game, focus, width }: { game: Game; focus: number; width: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const rows = [
    { label: 'Screenshot', src: screenshot(game) },
    { label: 'Wheel', src: '' },
    { label: 'Fanart', src: fanart(game) },
    { label: 'Boxart', src: boxart(game) },
  ]
  const rowH = u.r(4) * 2 + u.r(40)
  const head = u.r(8) + u.t(11) * LINE + u.r(4)
  const pill = textWidth('Change', u.t(11)) + u.r(8) * 2 + u.r(2)
  return (
    <>
      <SectionHeader icon="image_rounded" label="System Art" left={u.r(12) + u.r(4)} top={u.r(12) + u.r(8)} />
      {rows.map((r, i) => {
        const on = i === focus
        return (
          <div
            key={r.label}
            style={{
              ...abs({
                left: u.r(12),
                top: u.r(12) + head + i * (rowH + u.r(4)),
                width: width - u.r(24),
                height: rowH,
              }),
              background: on ? alpha(p.secondary, 0.15) : 'transparent',
              borderRadius: u.r(6),
            }}
          >
            <div
              style={{
                ...abs({ left: u.r(8), top: u.r(4), width: u.r(40), height: u.r(40) }),
                background: p.surface,
                borderRadius: u.r(4),
                overflow: 'hidden',
              }}
            >
              {r.src ? (
                <img
                  alt=""
                  src={r.src}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ position: 'absolute', left: u.r(12), top: u.r(12) }}>
                  <Sym name="image_rounded" size={u.r(16)} color={alpha(p.onSurface, 0.4)} />
                </div>
              )}
            </div>
            <Txt
              size={u.t(12)}
              color={on ? p.secondary : p.onSurface}
              weight={600}
              style={{ position: 'absolute', left: u.r(8) + u.r(40) + u.r(8), top: (rowH - u.t(12) * LINE) / 2 }}
            >
              {r.label}
            </Txt>
            <div
              style={{
                ...abs({
                  left: width - u.r(24) - u.r(8) - pill,
                  top: (rowH - (u.t(11) * LINE + u.r(3) * 2 + u.r(2))) / 2,
                  width: pill,
                  height: u.t(11) * LINE + u.r(3) * 2 + u.r(2),
                }),
                boxSizing: 'border-box',
                background: alpha(p.secondary, 0.12),
                border: `${u.r(1)}px solid ${alpha(p.secondary, 0.4)}`,
                borderRadius: u.r(4),
              }}
            >
              <Txt
                size={u.t(11)}
                color={p.secondary}
                weight={600}
                style={{ position: 'absolute', left: u.r(8), top: u.r(3) }}
              >
                Change
              </Txt>
            </div>
          </div>
        )
      })}
    </>
  )
}

/** The Manage tab (`game_settings_manage_tab.dart`): `SettingRow`s 12.r apart. */
function ManageTab({ state, game, focus, width }: { state: State; game: Game; focus: number; width: number }) {
  const neo = useNeo()
  const { u, p } = neo
  const played = playedOf(state.lib, game)
  const rows: Record<(typeof MANAGE_ROWS)[number], { title: string; subtitle: string }> = {
    cloud: { title: 'Cloud Sync', subtitle: 'Saves are synced to the cloud' },
    playtime: { title: 'Play Time', subtitle: shortTime(played) },
    hide: { title: 'Hide Game', subtitle: 'Hides it from your game lists. Nothing is deleted.' },
    delete: { title: 'Delete Game', subtitle: 'Permanently removes the ROM file from disk' },
  }
  const rowH = u.r(6) * 2 + Math.max(u.r(28), u.t(12) * LINE + u.r(4) + u.t(9) * LINE)
  const pill = (label: string, color: string, enabled: boolean) => {
    const w = textWidth(label, u.t(11)) + u.r(8) * 2 + u.r(2)
    const h = u.t(11) * LINE + u.r(3) * 2 + u.r(2)
    return (
      <div
        style={{
          ...abs({ left: width - u.r(24) - u.r(12) - w, top: (rowH - h) / 2, width: w, height: h }),
          boxSizing: 'border-box',
          background: enabled ? alpha(color, 0.15) : alpha(p.onSurface, 0.05),
          border: `${u.r(1)}px solid ${enabled ? alpha(color, 0.4) : alpha(p.onSurface, 0.1)}`,
          borderRadius: u.r(4),
        }}
      >
        <Txt
          size={u.t(11)}
          color={enabled ? color : alpha(p.onSurface, 0.3)}
          weight={600}
          style={{ position: 'absolute', left: u.r(8), top: u.r(3) }}
        >
          {label}
        </Txt>
      </div>
    )
  }
  const toggleW = u.r(24) * 2 + u.r(16) + u.r(2) * 2
  return (
    <>
      {MANAGE_ROWS.map((key, i) => {
        const on = i === focus
        return (
          <div
            key={key}
            style={{
              ...abs({ left: u.r(12), top: u.r(12) + i * (rowH + u.r(12)), width: width - u.r(24), height: rowH }),
              boxSizing: 'border-box',
              background: alpha(p.surface, 0.5),
              border: `${u.px(2)}px solid ${on ? p.primary : 'transparent'}`,
              borderRadius: u.r(8),
            }}
          >
            <Txt
              size={u.t(12)}
              color={on ? p.primary : p.onSurface}
              weight={500}
              style={{ position: 'absolute', left: u.r(12), top: (rowH - u.t(12) * LINE - u.r(4) - u.t(9) * LINE) / 2 }}
            >
              {rows[key].title}
            </Txt>
            <Txt
              size={u.t(9)}
              color={alpha(p.onSurface, 0.6)}
              style={{
                position: 'absolute',
                left: u.r(12),
                top: (rowH - u.t(12) * LINE - u.r(4) - u.t(9) * LINE) / 2 + u.t(12) * LINE + u.r(4),
              }}
            >
              {rows[key].subtitle}
            </Txt>
            {key === 'cloud' && <Toggle value left={width - u.r(24) - u.r(12) - toggleW} top={(rowH - u.r(28)) / 2} />}
            {key === 'playtime' && pill('Reset', p.error, played > 0)}
            {key === 'hide' && pill('Hide', p.primary, true)}
            {key === 'delete' && pill('Delete', p.error, true)}
          </div>
        )
      })}
    </>
  )
}

/** Reset play time and delete, over the settings dialog (`confirm_action_dialog.dart`, `delete_game_dialog.dart`). */
export function ConfirmDialog({ state, o }: { state: State; o: ConfirmAction }) {
  const neo = useNeo()
  const { u, p } = neo
  const game = selectedGame(state)
  if (!game) return null
  const del = o.what === 'delete'
  const w = Math.min(u.r(320), u.W - u.r(40) * 2)
  const pad = u.r(24)
  const title = del ? 'Delete Game' : 'Reset Play Time'
  const body = del
    ? 'This will permanently delete the game ROM, its scraped data, and media files. This action cannot be undone.'
    : 'This will permanently reset the recorded play time for this game to zero. This cannot be undone.'
  const confirm = del ? 'Delete Forever' : 'Reset'
  const btnH = u.r(8) * 2 + Math.max(u.r(18), u.t(12) * LINE)
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.54)' }} />
      <div
        data-part="confirm"
        style={{
          position: 'absolute',
          left: (u.W - w) / 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: w,
          boxSizing: 'border-box',
          padding: pad,
          background: p.background,
          borderRadius: u.r(12),
          border: `${u.px(1)}px solid ${alpha(p.error, 0.3)}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: u.r(8) }}>
          <Sym name={del ? 'delete_rounded' : 'timer_off_rounded'} size={u.r(20)} color={p.error} />
          <Txt size={u.t(14)} color={p.error} weight={600}>
            {title}
          </Txt>
        </div>
        {del && (
          <div style={{ marginTop: u.r(16) }}>
            <Txt size={u.t(13)} color={p.onSurface} weight={600}>{`"${game.title}"`}</Txt>
            <Txt size={u.t(11)} color={alpha(p.onSurface, 0.5)} style={{ marginTop: u.r(2) }}>
              {game.file}
            </Txt>
          </div>
        )}
        <div
          style={{
            marginTop: del ? u.r(8) : u.r(16),
            fontFamily: "'NeoStation Anta'",
            fontSize: u.t(11),
            lineHeight: 1.4,
            color: alpha(p.onSurface, 0.7),
          }}
        >
          {body}
        </div>
        <div
          style={{
            marginTop: pad,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: u.r(8),
            height: btnH,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: u.r(4), padding: `0 ${u.r(8)}px` }}>
            <div style={{ position: 'relative', width: u.r(18), height: u.r(18) }}>
              <Tinted
                src={gamepad('Xbox_B_button')}
                box={{ left: 0, top: 0, width: u.r(18), height: u.r(18) }}
                color={alpha(p.onSurface, 0.6)}
              />
            </div>
            <Txt size={u.t(12)} color={alpha(p.onSurface, 0.6)}>
              Cancel
            </Txt>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: u.r(4),
              padding: `${u.r(8)}px ${u.r(16)}px`,
              background: p.error,
              borderRadius: u.r(6),
            }}
          >
            <div style={{ position: 'relative', width: u.r(18), height: u.r(18) }}>
              <Tinted
                src={gamepad('Xbox_A_button')}
                box={{ left: 0, top: 0, width: u.r(18), height: u.r(18) }}
                color={p.onError}
              />
            </div>
            <Txt size={u.t(12)} color={p.onError} weight={600}>
              {confirm}
            </Txt>
          </div>
        </div>
      </div>
    </>
  )
}

/* ---- the launch dialog ---------------------------------------------------------------- */

const LAUNCH_STATUS = { launching: 'Launching Game...', executing: 'Game executing...' } as const

export function LaunchDialog({ state, o }: { state: State; o: Launch }) {
  const neo = useNeo()
  const { u, p } = neo
  const game = routeGamesOrAll(state).find((g) => g.id === o.game)
  if (!game) return null
  const w = u.r(320)
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.54)' }} />
      <div
        data-part="launch"
        style={{
          position: 'absolute',
          left: (u.W - w) / 2,
          top: '50%',
          transform: 'translateY(-50%)',
          width: w,
          boxSizing: 'border-box',
          padding: u.r(16),
          background: p.background,
          borderRadius: u.r(16),
          boxShadow: shadow(neo, 'rgba(0,0,0,0.25)', u.r(2), u.r(2), u.r(2)),
          textAlign: 'center',
        }}
      >
        <div
          style={{
            height: u.r(100),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'NeoStation Anta'",
            fontWeight: 900,
            fontSynthesis: 'weight',
            fontSize: u.r(28),
            lineHeight: 1.05,
            color: p.onSurface,
          }}
        >
          {game.title}
        </div>
        <Txt size={u.t(24)} color={p.onSurface} weight={600} letterSpacing={u.r(0.5)} style={{ marginTop: u.r(4) }}>
          {LAUNCH_STATUS[o.phase]}
        </Txt>
        <div
          style={{
            marginTop: u.r(4),
            fontFamily: "'NeoStation Anta'",
            fontSize: u.t(16),
            letterSpacing: u.r(0.3),
            lineHeight: `${u.t(16) * LINE}px`,
            color: p.onSurface,
          }}
        >
          {game.title}
        </div>
      </div>
    </>
  )
}

/** The route's games, or every game when the Recent card launches from the systems grid. */
function routeGamesOrAll(state: State): Game[] {
  const r = state.route
  return r?.kind === 'games' ? routeGames(state, r) : [...GAMES]
}

/* ---- the random dialog ---------------------------------------------------------------- */

export function RandomDialog({ state, o }: { state: State; o: RandomPick }) {
  const neo = useNeo()
  const { u, p } = neo
  const r = state.route?.kind === 'games' ? state.route : null
  const games = r ? routeGames(state, r) : []
  // While it spins the name ticks through the list; only the live build shows the ticks.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!o.spinning || !neo.animate) return
    const id = setInterval(() => setTick((t) => t + 1), 80)
    return () => clearInterval(id)
  }, [o.spinning, neo.animate])
  if (!games.length) return null
  const shown = o.spinning && neo.animate ? games[(o.pick + games.length - 18 + tick) % games.length]! : games[o.pick]!
  const settled = !o.spinning || !neo.animate
  const accent = settled ? p.secondary : p.primary
  const w = Math.min(u.r(320), u.W - u.r(40) * 2)
  const h = Math.min(u.r(180), u.H - u.r(30) * 2)
  const headH = u.r(5) * 2 + Math.max(u.r(13), u.t(11) * LINE, settled ? u.r(6) * 2 + u.r(14) : 0)
  const chip = (glyph: string, label: string, bg: string, fg: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: u.r(4),
        padding: `${u.r(6)}px ${u.r(8)}px`,
        background: bg,
        borderRadius: u.r(6),
        boxShadow: shadow(neo, 'rgba(0,0,0,0.25)', u.r(2), u.r(2), u.r(2)),
      }}
    >
      <div style={{ position: 'relative', width: u.r(14), height: u.r(14) }}>
        <Tinted src={gamepad(glyph)} box={{ left: 0, top: 0, width: u.r(14), height: u.r(14) }} color={fg} />
      </div>
      <Txt size={u.t(10)} color={fg} weight={700} letterSpacing={u.r(0.8)}>
        {label}
      </Txt>
    </div>
  )
  return (
    <>
      {/* `showDialog`'s default barrier; the random dialog is not dismissible by tapping it. */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.54)' }} />
      <div
        data-part="random"
        style={{
          ...abs({ left: (u.W - w) / 2, top: (u.H - h) / 2, width: w, height: h }),
          boxSizing: 'border-box',
          background: p.surface,
          borderRadius: u.r(10),
          border: `${u.r(1)}px solid ${alpha(accent, settled ? 0.4 : 0.35)}`,
          boxShadow: `0 0 ${2 * (0.57735 * u.r(18) + u.px(0.5))}px ${u.r(1)}px ${alpha(accent, 0.12)}, ${shadow(neo, 'rgba(0,0,0,0.3)', u.r(8), 0, u.r(3))}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: headH,
            background: alpha(accent, 0.08),
            borderBottom: `${u.r(1)}px solid ${alpha(accent, 0.12)}`,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${u.r(10)}px`,
            gap: u.r(5),
          }}
        >
          <Sym name={settled ? 'stars_rounded' : 'casino_rounded'} size={u.r(13)} color={accent} />
          <Txt size={u.t(11)} color={alpha(p.onSurface, 0.85)} weight={700} letterSpacing={u.r(0.5)}>
            {settled ? 'Selected!' : 'Random Game'}
          </Txt>
          <div style={{ flex: 1 }} />
          {settled && chip('Xbox_X_button', 'RANDOM', p.surface, p.tertiary)}
          {settled && chip('Xbox_B_button', 'BACK', p.error, p.onError)}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: headH, bottom: 0 }}>
          <img
            alt=""
            src={screenshot(shown)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              ...(neo.web
                ? {
                    maskImage:
                      'linear-gradient(to right, #fff 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.35) 75%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(to right, #fff 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.35) 75%, transparent 100%)',
                  }
                : { opacity: 0.35 }),
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: u.r(180),
              padding: u.r(8),
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Sym name="videogame_asset_rounded" size={u.r(28)} color={alpha(p.onSurface, 0.7)} />
            <div
              style={{
                marginTop: u.r(6),
                fontFamily: "'NeoStation Anta'",
                fontWeight: 700,
                fontSynthesis: 'weight',
                fontSize: settled ? u.t(13) : u.t(11),
                lineHeight: 1.2,
                color: p.onSurface,
                maxHeight: (settled ? u.t(13) : u.t(11)) * 1.2 * 2,
                overflow: 'hidden',
              }}
            >
              {shown.title}
            </div>
            <div
              style={{
                marginTop: u.r(3),
                padding: `${u.r(2)}px ${u.r(6)}px`,
                background: p.primary,
                borderRadius: u.r(4),
              }}
            >
              <Txt size={u.t(8)} color={alpha(p.onPrimary, 0.8)} weight={600}>
                {systemDef(shown.system).short}
              </Txt>
            </div>
            <div style={{ marginTop: u.r(10) }}>
              {settled ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: u.r(6),
                    padding: `${u.r(8)}px ${u.r(20)}px`,
                    background: 'linear-gradient(to bottom right, #2ecc71, #1e8449)',
                    borderRadius: u.r(7),
                    boxShadow: shadow(neo, 'rgba(0,0,0,0.25)', u.r(2), u.r(2), u.r(2)),
                  }}
                >
                  <div style={{ position: 'relative', width: u.r(14), height: u.r(14) }}>
                    <Tinted
                      src={gamepad('Xbox_A_button')}
                      box={{ left: 0, top: 0, width: u.r(14), height: u.r(14) }}
                      color="#ffffff"
                    />
                  </div>
                  <Txt
                    size={u.t(11)}
                    color="#ffffff"
                    weight={900}
                    letterSpacing={1.5 * u.dpr}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    PLAY
                  </Txt>
                </div>
              ) : (
                <div
                  style={{
                    width: u.r(16),
                    height: u.r(16),
                    boxSizing: 'border-box',
                    borderRadius: u.r(8),
                    border: `${u.r(1.5)}px solid ${alpha(p.primary, 0.5)}`,
                    borderRightColor: 'transparent',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
