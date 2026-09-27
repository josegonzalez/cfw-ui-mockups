import type { Button } from '../../input/keymap'
import {
  CARD_SIZES,
  COLUMNS,
  systemDef,
  systemsList,
  type CardSize,
  type Entry,
  type Platform,
  type SortBy,
  type SortOrder,
} from './library'
import type { ThemeId } from './palette'
import { ANDROID_APPS } from './games'
import { INITIAL_SETTINGS, reduceSettings, type SettingsState } from './settings'
import {
  INITIAL_RA,
  INITIAL_ROMM,
  INITIAL_SCRAPER,
  INITIAL_SEARCH,
  INITIAL_SYNC,
  reduceRa,
  reduceRomm,
  reduceScraper,
  reduceSearch,
  reduceSync,
  type Effect,
  type RaState,
  type RommState,
  type ScraperState,
  type SearchState,
  type SyncState,
} from './tabs'
import { EMPTY_LIB, GAMES, gamesOf, isFavorite, playedOf, type Game, type LibState } from './library'
import { INITIAL_WIZARD, reduceWizard, scanDone, wizardSteps, type WizardState, type WizardStep } from './wizard'

/**
 * NeoStation as a state machine: a pure function of (state, button), so every transition is
 * testable without drawing, and the theme root only holds state and draws it.
 *
 * **Tabs, routes and overlays.** The app is a strip of tabs (`lib/screens/app_screen.dart:50-61`).
 * A system's games are a route pushed over the whole app, and while one is up the bumpers belong to
 * it rather than to the tab strip (`app_screen.dart:670`). Dropdowns, menus and dialogs are
 * overlays: each takes every button until it closes, which is the source's navigation-layer stack
 * (`lib/services/gamepad/gamepad_navigation_manager.dart`).
 */

/* ---- tabs ------------------------------------------------------------------ */

/** `NavTab`, in the strip's canonical order (`lib/utils/nav_tabs.dart:12`). */
export type Tab = 'systems' | 'search' | 'sync' | 'achievements' | 'scraper' | 'romm' | 'settings'

export const TABS: readonly Tab[] = ['systems', 'search', 'sync', 'achievements', 'scraper', 'romm', 'settings']

/** Systems and Settings can never be hidden (`nav_tabs.dart:61-63`). */
export const HIDABLE: readonly Tab[] = ['search', 'sync', 'achievements', 'scraper', 'romm']

/* ---- overlays -------------------------------------------------------------- */

export interface ViewDropdown {
  readonly kind: 'view-dropdown'
  readonly focus: number
  /** The panel scrolls to the focused row only once the cursor has moved (`header_sort_dropdown.dart:242-258`). */
  readonly moved?: boolean
}

export interface ContextMenu {
  readonly kind: 'context-menu'
  readonly focus: number
  /** The View Mode submenu, when open, and its focus. */
  readonly sub: number | null
}

export interface SystemSettings {
  readonly kind: 'system-settings'
  readonly tab: number
  readonly focus: number
}

export interface Notifications {
  readonly kind: 'notifications'
  readonly focus: number
}

/** X on a games screen: the view mode, and the grid's card size and style (`game_view_mode_dropdown.dart`). */
export interface GameDropdown {
  readonly kind: 'game-dropdown'
  readonly focus: number
}

/** Y on a game (`game_context_menu.dart:94-147`), and its Add to submenu. */
export interface GameMenu {
  readonly kind: 'game-menu'
  readonly focus: number
  readonly sub: number | null
}

/** Start on a game: Emulator, Scraping, Manage (`game_settings_dialog.dart`). */
export interface GameSettings {
  readonly kind: 'game-settings'
  readonly tab: number
  readonly focus: number
  /** Scraping's own two tabs: 0 Data, 1 Media. */
  readonly sub: number
  /** A field row being edited, on the Scraping tab. */
  readonly editing: boolean
}

/** The launch status dialog (`game_launch_dialog.dart`). */
export interface Launch {
  readonly kind: 'launch'
  readonly game: string
  readonly phase: 'launching' | 'executing'
}

/** The random game dialog: a spin through the list that settles on one. */
export interface RandomPick {
  readonly kind: 'random'
  readonly pick: number
  readonly spinning: boolean
}

/** A confirm over the game settings dialog: reset play time or delete. */
export interface ConfirmAction {
  readonly kind: 'confirm'
  readonly what: 'reset' | 'delete'
}

export type Overlay =
  | ViewDropdown
  | ContextMenu
  | SystemSettings
  | Notifications
  | GameDropdown
  | GameMenu
  | GameSettings
  | Launch
  | RandomPick
  | ConfirmAction

/* ---- routes ------------------------------------------------------------------ */

/** `DetailTab`, in D-pad order (`detail_tab.dart:5`). */
export type DetailTab = 'wheel' | 'box2d' | 'screenshotVideo' | 'gameInfo' | 'achievements'
export const DETAIL_TABS: readonly DetailTab[] = ['wheel', 'box2d', 'screenshotVideo', 'gameInfo', 'achievements']

export type GameView = 'list' | 'grid' | 'carousel'
export type CardStyle = 'fanart' | 'box'

/**
 * A system's games, pushed over the app (`SystemGamesList`). The order is taken when the route is
 * entered and kept: marking a favourite does not move the row (`favorites_reorder.dart:69-90`).
 */
export interface GamesRoute {
  readonly kind: 'games'
  readonly system: string
  readonly order: readonly string[]
  readonly sel: number
  /** The info or achievements panel holds the D-pad, entered with A. */
  readonly panel: boolean
  /** Game info: the description's scroll, in 56.r steps. */
  readonly scroll: number
  /** Achievements: the focused badge. */
  readonly cheevo: number
  /** Which way the last tab change went, for the panel slide. */
  readonly slide: -1 | 1
}

/** The Android card's apps (`android_apps_grid.dart`), Android only. */
export interface AppsRoute {
  readonly kind: 'apps'
  readonly sel: number
}

export type Route = GamesRoute | AppsRoute

/** One entry in the bell's panel. They never dismiss themselves (`notification_bell.dart:95-99`). */
export interface Notice {
  readonly type: 'info' | 'success' | 'error'
  readonly title?: string
  readonly message: string
}

/* ---- state ----------------------------------------------------------------- */

export interface SystemSettingsValues {
  readonly alwaysShowRomName: boolean
  readonly hideExtension: boolean
  readonly hideParentheses: boolean
  readonly hideBrackets: boolean
  readonly recursiveScan: boolean
  readonly subfolderView: boolean
}

export interface State {
  readonly platform: Platform
  readonly theme: ThemeId
  readonly tab: Tab
  readonly hidden: readonly Tab[]
  readonly view: 'grid' | 'carousel'
  readonly size: CardSize
  readonly sortBy: SortBy
  readonly order: SortOrder
  /** The focused card: an index into `entries(state)`. */
  readonly sel: number
  readonly overlays: readonly Overlay[]
  /** Per-system settings, keyed by system id; missing means the defaults. */
  readonly sysSettings: Readonly<Record<string, SystemSettingsValues>>
  /** The last direction pressed, for the scroll's fast pacing. */
  readonly repeat: boolean
  readonly route: Route | null
  readonly gameView: GameView
  readonly gameSize: CardSize
  readonly gameStyle: CardStyle
  /** The details card's tab, remembered across games (`config.gameDetailsTab`). */
  readonly detailTab: DetailTab
  readonly lib: LibState
  readonly notices: readonly Notice[]
  /** A game being scraped from its menu, until the root's clock finishes it. */
  readonly scraping: string | null
  /** How many random picks have been made, so the next is not the last again. */
  readonly rolls: number
  readonly search: SearchState
  readonly ra: RaState
  readonly sync: SyncState
  readonly scraper: ScraperState
  readonly romm: RommState
  readonly settings: SettingsState
  /** The theme as chosen: a theme, or `system`, which follows the platform's brightness. */
  readonly themeName: ThemeId | 'system'
  /** First run's setup wizard, until it finishes. */
  readonly wizard: WizardState | null
  /** A library scan in progress, 0 to 1: the Systems tab shows the scan splash until it ends. */
  readonly scan: number | null
  /** The scan has just ended: the systems fade in over the splash until the next button. */
  readonly scanEnded: boolean
}

export interface Seed {
  readonly platform?: Platform
  readonly theme?: ThemeId
  readonly tab?: Tab
  readonly hidden?: readonly Tab[]
  readonly view?: 'grid' | 'carousel'
  readonly size?: CardSize
  readonly sortBy?: SortBy
  readonly order?: SortOrder
  readonly sel?: number
  readonly overlays?: readonly Overlay[]
  /** Open a system's games, at a game and a details tab. */
  readonly games?: {
    readonly system: string
    readonly sel?: number
    readonly panel?: boolean
    readonly cheevo?: number
  }
  readonly apps?: boolean
  readonly gameView?: GameView
  readonly gameSize?: CardSize
  readonly gameStyle?: CardStyle
  readonly detailTab?: DetailTab
  readonly notices?: readonly Notice[]
  readonly search?: Partial<SearchState>
  readonly ra?: Partial<RaState>
  readonly sync?: Partial<SyncState>
  readonly scraper?: Partial<ScraperState>
  readonly romm?: Partial<RommState>
  readonly settings?: Partial<SettingsState>
  /** The wizard, at a step named rather than numbered: the numbering differs by platform. */
  readonly wizard?: Partial<Omit<WizardState, 'step'>> & { readonly at?: WizardStep }
  readonly scan?: number
}

function seedWizard(platform: Platform, seed: NonNullable<Seed['wizard']>): WizardState {
  const { at, ...rest } = seed
  const step = Math.max(0, wizardSteps(platform).indexOf(at ?? 'userData'))
  return { ...INITIAL_WIZARD, ...rest, step }
}

export function initialState(seed: Seed = {}): State {
  const base: State = {
    platform: seed.platform ?? 'android',
    theme: seed.theme ?? 'dark',
    tab: seed.tab ?? 'systems',
    hidden: seed.hidden ?? [],
    view: seed.view ?? 'grid',
    size: seed.size ?? 'M',
    sortBy: seed.sortBy ?? 'alphabetical',
    order: seed.order ?? 'asc',
    sel: seed.sel ?? 0,
    overlays: seed.overlays ?? [],
    sysSettings: {},
    repeat: false,
    route: null,
    gameView: seed.gameView ?? 'list',
    gameSize: seed.gameSize ?? 'M',
    gameStyle: seed.gameStyle ?? 'fanart',
    detailTab: seed.detailTab ?? 'wheel',
    lib: EMPTY_LIB,
    notices: seed.notices ?? [],
    scraping: null,
    rolls: 0,
    search: { ...INITIAL_SEARCH, ...seed.search },
    ra: { ...INITIAL_RA, ...seed.ra },
    sync: { ...INITIAL_SYNC, ...seed.sync },
    scraper: { ...INITIAL_SCRAPER, ...seed.scraper },
    romm: { ...INITIAL_ROMM, ...seed.romm },
    settings: { ...INITIAL_SETTINGS, ...seed.settings },
    // The source's default is `system`, which resolves to dark on a dark device.
    themeName: seed.theme ?? 'system',
    wizard: seed.wizard ? seedWizard(seed.platform ?? 'android', seed.wizard) : null,
    scan: seed.scan ?? null,
    scanEnded: false,
  }
  if (seed.apps) return { ...base, route: { kind: 'apps', sel: seed.sel ?? 0 } }
  if (seed.games) {
    const route = enterGames(base, seed.games.system)
    return {
      ...base,
      route: { ...route, sel: seed.games.sel ?? 0, panel: seed.games.panel ?? false, cheevo: seed.games.cheevo ?? 0 },
    }
  }
  return base
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsValues = {
  alwaysShowRomName: false,
  hideExtension: true,
  hideParentheses: true,
  hideBrackets: true,
  recursiveScan: true,
  subfolderView: false,
}

export function entries(s: State): Entry[] {
  const st = s.settings
  return systemsList({
    platform: s.platform,
    sortBy: s.sortBy,
    order: s.order,
    lib: s.lib,
    hideRecent: !st.recentCard,
    hideFavorites: !st.favoritesCard,
    hiddenSystems: st.hiddenSystems,
  })
}

export function visibleTabs(s: State): Tab[] {
  return TABS.filter((t) => !s.hidden.includes(t))
}

export const top = (s: State): Overlay | null => s.overlays[s.overlays.length - 1] ?? null

/* ---- the systems grid ------------------------------------------------------- */

/** `recentCardSpan` (`grid_geometry.dart:17-22`): 3x2, or 2x1 when Recent Card Size is Compact. */
export function recentSpan(cols: number, compact = false): readonly [number, number] {
  if (compact) return cols >= 2 ? [2, 1] : [1, 1]
  return cols >= 3 ? [3, 2] : [1, 1]
}

/** `buildVirtualGrid` (`grid_geometry.dart:31-94`): first-fit packing, row-major, -1 for empty. */
export function virtualGrid(list: readonly Entry[], cols: number, compact = false): number[][] {
  const grid: number[][] = []
  const [rw, rh] = recentSpan(cols, compact)
  list.forEach((e, i) => {
    const w = e.kind === 'recent' ? rw : 1
    const h = e.kind === 'recent' ? rh : 1
    let row = 0
    let col = 0
    for (;;) {
      while (grid.length <= row + h - 1) grid.push(new Array<number>(cols).fill(-1))
      if (col + w <= cols) {
        let overlap = false
        for (let r = row; r < row + h && !overlap; r++)
          for (let c = col; c < col + w; c++) if (grid[r]![c] !== -1) overlap = true
        if (!overlap) break
        col++
        if (col >= cols) {
          col = 0
          row++
        }
      } else {
        col = 0
        row++
      }
    }
    for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) grid[r]![c] = i
  })
  return grid
}

/** `findNearestInRow` (`grid_geometry.dart:100-113`). */
function nearestInRow(grid: number[][], row: number, col: number): number {
  const items = grid[row]!
  for (let d = 1; d < items.length; d++) {
    if (col - d >= 0 && items[col - d] !== -1) return items[col - d]!
    if (col + d < items.length && items[col + d] !== -1) return items[col + d]!
  }
  return -1
}

/** `_navigateVirtual` (`gamepad_grid_nav.dart:94-183`): every direction wraps. */
export function gridMove(grid: number[][], cur: number, dir: 'up' | 'down' | 'left' | 'right'): number {
  const cols = grid[0]?.length ?? 1
  let row = -1
  let col = -1
  outer: for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r]![c] === cur) {
        row = r
        col = c
        break outer
      }
  if (row === -1) return cur
  const n = grid.length

  if (dir === 'up' || dir === 'down') {
    const step = dir === 'up' ? -1 : 1
    let target = row
    let idx = cur
    for (let safety = 0; (idx === cur || idx === -1) && safety < n; safety++) {
      target = (target + step + n) % n
      idx = grid[target]![col]!
      if (idx === -1) idx = nearestInRow(grid, target, col)
    }
    return idx >= 0 ? idx : cur
  }
  if (dir === 'left') {
    let first = col
    while (first > 0 && grid[row]![first - 1] === cur) first--
    if (first > 0) {
      const idx = grid[row]![first - 1]!
      return idx >= 0 ? idx : cur
    }
    const target = (row - 1 + n) % n
    for (let c = cols - 1; c >= 0; c--) {
      const idx = grid[target]![c]!
      if (idx !== -1 && idx !== cur) return idx
    }
    return cur
  }
  let last = col
  while (last < cols - 1 && grid[row]![last + 1] === cur) last++
  if (last < cols - 1) {
    const idx = grid[row]![last + 1]!
    return idx >= 0 ? idx : cur
  }
  const target = (row + 1) % n
  for (let c = 0; c < cols; c++) {
    const idx = grid[target]![c]!
    if (idx !== -1 && idx !== cur) return idx
  }
  return cur
}

/* ---- the view-mode dropdown ---------------------------------------------------- */

export type DropdownRow =
  | { readonly kind: 'view'; readonly value: 'grid' | 'carousel' }
  | { readonly kind: 'size' }
  | { readonly kind: 'sort'; readonly value: SortBy }
  | { readonly kind: 'order'; readonly value: SortOrder }

/** `header_sort_dropdown.dart:385-504`, for the Systems tab: card size only in grid mode. */
export function dropdownRows(s: State): DropdownRow[] {
  return [
    { kind: 'view', value: 'grid' },
    { kind: 'view', value: 'carousel' },
    ...(s.view === 'grid' ? [{ kind: 'size' } as const] : []),
    { kind: 'sort', value: 'alphabetical' },
    { kind: 'sort', value: 'year' },
    { kind: 'sort', value: 'manufacturer' },
    { kind: 'sort', value: 'manufacturer_type' },
    { kind: 'order', value: 'asc' },
    { kind: 'order', value: 'desc' },
  ]
}

/* ---- the context menu -------------------------------------------------------- */

/** `MySystems._openSystemContextMenu` (`my_systems_grid.dart:290-348`). */
export const CONTEXT_ROWS = ['settings', 'view_mode'] as const
export const VIEW_SUBMENU = ['grid', 'carousel'] as const

/* ---- the system settings dialog ---------------------------------------------- */

export type SettingsTab = 'general' | 'emulators' | 'appearance' | 'hidden'

const AGGREGATE = ['all', 'favorites', 'collections']

/** `system_emulator_settings_dialog.dart:392-401`. The sample library hides no games. */
export function settingsTabs(system: string): SettingsTab[] {
  const tabs: SettingsTab[] = ['general']
  if (!AGGREGATE.includes(system) && system !== 'android') tabs.push('emulators')
  tabs.push('appearance')
  if (system !== 'android') tabs.push('hidden')
  return tabs
}

export type GeneralRow = keyof SystemSettingsValues

/** `system_emulator_settings_dialog.dart:344-358`: which General rows a system has. */
export function generalRows(system: string): GeneralRow[] {
  const rows: GeneralRow[] = ['alwaysShowRomName', 'hideExtension', 'hideParentheses', 'hideBrackets']
  const scanned = !AGGREGATE.includes(system) && system !== 'android'
  if (scanned) rows.push('recursiveScan')
  if (scanned && system !== 'music') rows.push('subfolderView')
  return rows
}

/** How many focusable rows a settings tab has, for the cursor. */
export function settingsRowCount(system: string, tab: SettingsTab, platform: Platform): number {
  switch (tab) {
    case 'general':
      return generalRows(system).length
    case 'emulators': {
      const e = systemDef(system).emulators[platform]
      return e.groups.length + e.standalone.length
    }
    case 'appearance':
      return 2
    case 'hidden':
      return 0
  }
}

/** The system a card stands for; the Recent card resolves to its game's system. */
export function systemOf(e: Entry): string {
  return e.kind === 'recent' ? e.game.system : e.def.id
}

export function sysSettingsOf(s: State, system: string): SystemSettingsValues {
  return s.sysSettings[system] ?? DEFAULT_SYSTEM_SETTINGS
}

/* ---- reduce ------------------------------------------------------------------ */

const wrap = (i: number, n: number) => (n <= 0 ? 0 : ((i % n) + n) % n)

function replaceTop(s: State, o: Overlay): State {
  return { ...s, overlays: [...s.overlays.slice(0, -1), o] }
}

const pop = (s: State): State => ({ ...s, overlays: s.overlays.slice(0, -1) })
const push = (s: State, o: Overlay): State => ({
  ...s,
  overlays: [...s.overlays, o],
})

/** Step through the visible tabs, wrapping, from wherever the current one sits (`app_screen.dart:663-682`). */
function cycleTab(s: State, step: number): State {
  const visible = visibleTabs(s)
  const at = visible.indexOf(s.tab)
  const next = visible[wrap((at === -1 ? 0 : at) + step, visible.length)]!
  // Switching tab resets the systems selection (`app_screen.dart:580-584`).
  return { ...s, tab: next, sel: 0 }
}

export function reduce(state: State, button: Button, repeat = false): State {
  const s = state.scanEnded ? { ...state, scanEnded: false } : state
  // After Confirm Exit the app is gone; any button launches it again, its settings kept.
  if (s.settings.exited) {
    return {
      ...s,
      tab: 'systems',
      route: null,
      overlays: [],
      sel: 0,
      settings: { ...s.settings, exited: false, inPane: false, menu: 0, item: 0 },
    }
  }
  // The wizard is its own screen, in front of the whole app (`permission_check_wrapper.dart:103-141`).
  if (s.wizard) return { ...s, wizard: reduceWizard(s.wizard, s.platform, button) }
  const o = top(s)
  if (o) return reduceOverlay(s, o, button)

  if (s.route?.kind === 'games') return reduceGames(s, s.route, button, repeat)
  if (s.route?.kind === 'apps') return reduceApps(s, s.route, button)

  // A tab's own menu or confirm takes every button, the bumpers included.
  if (tabModal(s)) return reduceTab(s, button)

  // Select opens the bell's panel wherever nothing else claims it (`notification_bell.dart:86-90`);
  // the NeoSync save list claims it for Delete.
  const claimsSelect = s.tab === 'sync' && s.sync.section === 'saves'
  if (button === 'select' && !claimsSelect) return push(s, { kind: 'notifications', focus: 0 })
  if (button === 'l') return cycleTab(s, -1)
  if (button === 'r') return cycleTab(s, 1)

  // The scan splash has no cursor; the header's buttons above still work.
  if (s.tab === 'systems') return s.scan === null ? reduceSystems(s, button, repeat) : s
  return reduceTab(s, button)
}

/** Whether the current tab has a menu or confirm open that holds every button. */
function tabModal(s: State): boolean {
  switch (s.tab) {
    case 'search':
      return s.search.region === 'menu' || s.search.region === 'action'
    case 'achievements':
      return s.ra.confirm
    case 'sync':
      return s.sync.confirm !== null
    case 'scraper':
      return s.scraper.confirm
    default:
      return false
  }
}

/** Run a tab's reducer and apply what it asks for (`tabs.ts`). */
function reduceTab(s: State, button: Button): State {
  const run = (): { next: State; effects: readonly Effect[] } | null => {
    switch (s.tab) {
      case 'search': {
        const r = reduceSearch(s.search, s.lib, button)
        return { next: { ...s, search: r.state }, effects: r.effects ?? [] }
      }
      case 'achievements': {
        const r = reduceRa(s.ra, button)
        return { next: { ...s, ra: r.state }, effects: r.effects ?? [] }
      }
      case 'sync': {
        const r = reduceSync(s.sync, button)
        return { next: { ...s, sync: r.state }, effects: r.effects ?? [] }
      }
      case 'scraper': {
        const r = reduceScraper(s.scraper, button)
        return { next: { ...s, scraper: r.state }, effects: r.effects ?? [] }
      }
      case 'romm': {
        const r = reduceRomm(s.romm, button)
        return { next: { ...s, romm: r.state }, effects: r.effects ?? [] }
      }
      default:
        return null
    }
  }
  if (s.tab === 'settings') return reduceSettings(s, button)
  const ran = run()
  if (!ran) return s
  let next = ran.next
  const effects = ran.effects
  for (const e of effects) {
    if (e.kind === 'notice') next = notice(next, { type: e.type, message: e.message })
    if (e.kind === 'launch') next = push(next, { kind: 'launch', game: e.game, phase: 'launching' })
    if (e.kind === 'goto') {
      // Go to game opens the game's own system at that game (`search_screen.dart:1302-1320`).
      const game = GAMES.find((g) => g.id === e.game)
      if (!game) continue
      const route = enterGames(next, game.system)
      next = { ...next, route: { ...route, sel: Math.max(0, route.order.indexOf(game.id)) } }
    }
  }
  return next
}

function reduceSystems(s: State, button: Button, repeat: boolean): State {
  const list = entries(s)
  switch (button) {
    case 'up':
    case 'down':
    case 'left':
    case 'right': {
      if (s.view === 'carousel') {
        // Left and right only, and no wrap (`native_carousel.dart:128-147`).
        if (button === 'up' || button === 'down') return s
        const next = Math.max(0, Math.min(list.length - 1, s.sel + (button === 'left' ? -1 : 1)))
        return next === s.sel ? s : { ...s, sel: next, repeat }
      }
      const next = gridMove(virtualGrid(list, COLUMNS[s.size], s.settings.recentCompact), s.sel, button)
      return next === s.sel ? s : { ...s, sel: next, repeat }
    }
    case 'a': {
      const e = list[s.sel]
      if (!e) return s
      if (e.kind === 'recent') return push(s, { kind: 'launch', game: e.game.id, phase: 'launching' })
      if (e.def.id === 'android') return { ...s, route: { kind: 'apps', sel: 0 } }
      return { ...s, route: enterGames(s, e.def.id) }
    }
    case 'x':
      return push(s, { kind: 'view-dropdown', focus: 0 })
    case 'y':
      return push(s, { kind: 'context-menu', focus: 0, sub: null })
    case 'start':
      return push(s, { kind: 'system-settings', tab: 0, focus: 0 })
    default:
      return s
  }
}

function reduceOverlay(s: State, o: Overlay, button: Button): State {
  switch (o.kind) {
    case 'game-dropdown':
    case 'game-menu':
    case 'game-settings':
    case 'launch':
    case 'random':
    case 'confirm':
      return reduceGameOverlay(s, o, button)
    case 'notifications': {
      // Clear all first when there is anything to clear, then each notification (`:308-313`).
      const count = s.notices.length ? s.notices.length + 1 : 0
      switch (button) {
        case 'b':
        case 'select':
          return pop(s)
        case 'up':
        case 'down':
          return count ? replaceTop(s, { ...o, focus: wrap(o.focus + (button === 'up' ? -1 : 1), count) }) : s
        case 'a': {
          if (!count) return s
          const notices = o.focus === 0 ? [] : s.notices.filter((_, i) => i !== o.focus - 1)
          // The panel closes when its list empties (`notification_bell.dart:364-387`).
          const next = { ...s, notices }
          return notices.length ? replaceTop(next, { ...o, focus: Math.min(o.focus, notices.length) }) : pop(next)
        }
        default:
          return s
      }
    }

    case 'view-dropdown': {
      const rows = dropdownRows(s)
      const row = rows[o.focus]
      switch (button) {
        case 'up':
        case 'down':
          return replaceTop(s, {
            ...o,
            focus: wrap(o.focus + (button === 'up' ? -1 : 1), rows.length),
            moved: true,
          })
        case 'left':
        case 'right': {
          // Card size steps with wrap and applies at once (`header_sort_dropdown.dart:305-342`).
          if (row?.kind !== 'size') return s
          const i = CARD_SIZES.indexOf(s.size)
          return {
            ...s,
            size: CARD_SIZES[wrap(i + (button === 'left' ? -1 : 1), CARD_SIZES.length)]!,
          }
        }
        case 'a': {
          if (!row) return pop(s)
          const closed = pop(s)
          switch (row.kind) {
            case 'view':
              return {
                ...closed,
                view: row.value,
                sel: Math.min(closed.sel, entries(closed).length - 1),
              }
            case 'size':
              return closed
            case 'sort':
              return { ...closed, sortBy: row.value }
            case 'order':
              return { ...closed, order: row.value }
          }
          return closed
        }
        case 'b':
          return pop(s)
        default:
          return s
      }
    }

    case 'context-menu': {
      if (o.sub !== null) {
        switch (button) {
          case 'up':
          case 'down':
            return replaceTop(s, {
              ...o,
              sub: wrap(o.sub + (button === 'up' ? -1 : 1), VIEW_SUBMENU.length),
            })
          case 'a':
            return { ...pop(s), view: VIEW_SUBMENU[o.sub]! }
          case 'b':
          case 'left':
            return replaceTop(s, { ...o, sub: null })
          case 'y':
            return pop(s)
          default:
            return s
        }
      }
      switch (button) {
        case 'up':
        case 'down':
          return replaceTop(s, {
            ...o,
            focus: wrap(o.focus + (button === 'up' ? -1 : 1), CONTEXT_ROWS.length),
          })
        case 'a':
        case 'right':
          if (CONTEXT_ROWS[o.focus] === 'view_mode') return replaceTop(s, { ...o, sub: s.view === 'grid' ? 0 : 1 })
          if (button === 'right') return s
          return push(pop(s), { kind: 'system-settings', tab: 0, focus: 0 })
        case 'b':
        case 'y':
          return pop(s)
        default:
          return s
      }
    }

    case 'system-settings': {
      const system = systemOf(entries(s)[s.sel]!)
      const tabs = settingsTabs(system)
      const tab = tabs[o.tab]!
      const count = settingsRowCount(system, tab, s.platform)
      switch (button) {
        case 'l':
        case 'r':
          return replaceTop(s, {
            ...o,
            tab: wrap(o.tab + (button === 'l' ? -1 : 1), tabs.length),
            focus: 0,
          })
        case 'up':
        case 'down':
          return count
            ? replaceTop(s, {
                ...o,
                focus: wrap(o.focus + (button === 'up' ? -1 : 1), count),
              })
            : s
        case 'a': {
          if (tab !== 'general') return s
          const key = generalRows(system)[o.focus]!
          const cur = sysSettingsOf(s, system)
          // Show Subfolders is disabled until recursive scan is on.
          if (key === 'subfolderView' && !cur.recursiveScan) return s
          return {
            ...s,
            sysSettings: {
              ...s.sysSettings,
              [system]: { ...cur, [key]: !cur[key] },
            },
          }
        }
        case 'b':
          return pop(s)
        default:
          return s
      }
    }
  }
}

/* ---- the games route ---------------------------------------------------------- */

/** Open a system's games with the list's own order, the first game selected. */
export function enterGames(s: State, system: string): GamesRoute {
  return {
    kind: 'games',
    system,
    order: gamesOf(system, s.lib).map((g) => g.id),
    sel: 0,
    panel: false,
    scroll: 0,
    cheevo: 0,
    slide: 1,
  }
}

/** The route's games, in its order, less any hidden or deleted since it was entered. */
export function routeGames(s: State, r: GamesRoute): Game[] {
  const live = new Map(gamesOf(r.system, { ...s.lib, favs: {} }).map((g) => [g.id, g]))
  const gone = [...s.lib.hidden, ...s.lib.deleted]
  return r.order
    .filter((id) => !gone.includes(id))
    .flatMap((id) => {
      const g = live.get(id)
      return g ? [g] : []
    })
}

export function selectedGame(s: State): Game | null {
  const r = s.route
  if (r?.kind !== 'games') return null
  return routeGames(s, r)[r.sel] ?? null
}

/** The tabs a game's card has: achievements only on a RetroAchievements system (`:330-333`). */
export function detailTabs(g: Game): DetailTab[] {
  return DETAIL_TABS.filter((t) => t !== 'achievements' || systemDef(g.system).ra)
}

/** The tab a card shows: the remembered one, or the wheel where it is unavailable (`:352-365`). */
export function tabOf(s: State, g: Game): DetailTab {
  return detailTabs(g).includes(s.detailTab) ? s.detailTab : 'wheel'
}

/** Whether the game info panel has something to drive: a description long enough to scroll. */
export function infoDrivable(g: Game): boolean {
  return (g.scraped?.description?.length ?? 0) > 160
}

export const cheevoCount = (g: Game) => g.cheevos?.total ?? 0

function withRoute(s: State, r: GamesRoute): State {
  return { ...s, route: r }
}

function reduceGames(s: State, r: GamesRoute, button: Button, repeat: boolean): State {
  const list = routeGames(s, r)
  const n = list.length
  const g = list[r.sel]
  const view = s.gameView

  // A panel entered with A holds the D-pad until B (`game_details_card_list.dart:1305-1325`).
  if (r.panel && g && view === 'list') {
    const tab = tabOf(s, g)
    const total = cheevoCount(g)
    switch (button) {
      case 'b':
        return withRoute(s, { ...r, panel: false })
      case 'up':
      case 'down':
        if (tab === 'gameInfo')
          return withRoute(s, { ...r, scroll: Math.max(0, r.scroll + (button === 'up' ? -1 : 1)) })
        // Six badges a row, no wrap (`game_details_achievements_tab.dart:215-306`).
        return withRoute(s, { ...r, cheevo: Math.min(total - 1, Math.max(0, r.cheevo + (button === 'up' ? -6 : 6))) })
      case 'left':
      case 'right':
        if (tab === 'achievements' && total)
          return withRoute(s, { ...r, cheevo: wrap(r.cheevo + (button === 'left' ? -1 : 1), total) })
        return s
      default:
        return s
    }
  }

  switch (button) {
    case 'up':
    case 'down':
    case 'left':
    case 'right': {
      if (!n) return s
      if (view === 'list') {
        if (button === 'left' || button === 'right') {
          if (!g) return s
          const tabs = detailTabs(g)
          const at = tabs.indexOf(tabOf(s, g))
          const next = tabs[wrap(at + (button === 'left' ? -1 : 1), tabs.length)]!
          return { ...s, detailTab: next, route: { ...r, slide: button === 'left' ? -1 : 1, scroll: 0 } }
        }
        return withRoute(s, { ...r, sel: wrap(r.sel + (button === 'up' ? -1 : 1), n), scroll: 0, cheevo: 0 })
      }
      if (view === 'carousel') {
        if (button === 'up' || button === 'down') return s
        return withRoute(s, { ...r, sel: wrap(r.sel + (button === 'left' ? -1 : 1), n) })
      }
      // The grid (`my_games_grid.dart:834-880`): up from the top row lands in the same column of the
      // last row that has one; down past the end, in the same column of the first; left and right
      // wrap inside the row.
      const cols = COLUMNS[s.gameSize]
      const col = r.sel % cols
      const rowStart = Math.floor(r.sel / cols) * cols
      const next = (() => {
        if (button === 'up') {
          if (r.sel - cols >= 0) return r.sel - cols
          let ni = (Math.ceil(n / cols) - 1) * cols + col
          while (ni >= n) ni -= cols
          return ni < 0 ? r.sel : ni
        }
        if (button === 'down') return r.sel + cols < n ? r.sel + cols : col
        if (button === 'left') return col === 0 ? Math.min(rowStart + cols - 1, n - 1) : r.sel - 1
        return (r.sel + 1) % cols === 0 || r.sel + 1 >= n ? rowStart : r.sel + 1
      })()
      return next === r.sel ? s : { ...s, route: { ...r, sel: next }, repeat }
    }
    case 'a': {
      if (!g) return s
      const tab = tabOf(s, g)
      if (view === 'list' && tab === 'gameInfo' && infoDrivable(g)) return withRoute(s, { ...r, panel: true })
      if (view === 'list' && tab === 'achievements' && cheevoCount(g)) return withRoute(s, { ...r, panel: true })
      return push(s, { kind: 'launch', game: g.id, phase: 'launching' })
    }
    case 'b':
      return { ...s, route: null }
    case 'x':
      return push(s, { kind: 'game-dropdown', focus: ['list', 'grid', 'carousel'].indexOf(view) })
    case 'y':
      return g ? push(s, { kind: 'game-menu', focus: 0, sub: null }) : s
    case 'start':
      return g ? push(s, { kind: 'game-settings', tab: 0, focus: 0, sub: 0, editing: false }) : s
    default:
      return s
  }
}

function reduceApps(s: State, r: AppsRoute, button: Button): State {
  const n = ANDROID_APPS.length
  const cols = appColumns(s)
  switch (button) {
    // No wrap: left and right stop at the ends, up at the first row (`android_apps_grid.dart:127-155`).
    case 'left':
      return { ...s, route: { ...r, sel: Math.max(0, r.sel - 1) } }
    case 'right':
      return { ...s, route: { ...r, sel: Math.min(n - 1, r.sel + 1) } }
    case 'up':
      return r.sel - cols >= 0 ? { ...s, route: { ...r, sel: r.sel - cols } } : s
    case 'down':
      return { ...s, route: { ...r, sel: Math.min(n - 1, r.sel + cols) } }
    case 'b':
      return { ...s, route: null }
    default:
      return s
  }
}

/** `Responsive` Android apps columns: XS 5, Small 6, Medium 8, Large and XL 10. Both devices are Small. */
export const appColumns = (_s: State) => 6

/* ---- games overlays ----------------------------------------------------------- */

export type GameDropdownRow =
  { readonly kind: 'view'; readonly value: GameView } | { readonly kind: 'size' } | { readonly kind: 'style' }

/** `game_view_mode_dropdown.dart:285-331`: size in the grid, style in the grid and carousel. */
export function gameDropdownRows(s: State): GameDropdownRow[] {
  return [
    { kind: 'view', value: 'list' },
    { kind: 'view', value: 'grid' },
    { kind: 'view', value: 'carousel' },
    ...(s.gameView === 'grid' ? [{ kind: 'size' } as const] : []),
    ...(s.gameView !== 'list' ? [{ kind: 'style' } as const] : []),
  ]
}

export const GAME_MENU = ['settings', 'scrape', 'add', 'view', 'random'] as const
export const ADD_MENU = ['favorite', 'new'] as const

export const GAME_SETTINGS_TABS = ['emulator', 'scraping', 'manage'] as const

/** The Emulator tab's rows: System Default, then every emulator the platform has. */
export function emulatorRows(s: State, g: Game): string[] {
  return ['System Default', ...systemDef(g.system).emulators[s.platform].all]
}

/** Scraping's rows: 0 rescrape, 1-4 fields, 5-10 descriptions, 11 save; Media has four. */
export const SCRAPE_DATA_ROWS = 12
export const SCRAPE_MEDIA_ROWS = 4

/** Manage's rows. Cloud Sync is there because the sample account is signed in to NeoSync. */
export const MANAGE_ROWS = ['cloud', 'playtime', 'hide', 'delete'] as const

function gameSettingsCount(s: State, o: GameSettings, g: Game): number {
  if (o.tab === 0) return emulatorRows(s, g).length
  if (o.tab === 1) return o.sub === 0 ? SCRAPE_DATA_ROWS : SCRAPE_MEDIA_ROWS
  return MANAGE_ROWS.length
}

/** A deterministic walk through the list for the random dialog: a stride that is not the list's. */
export function randomPick(n: number, roll: number): number {
  return n ? (roll * 7 + 3) % n : 0
}

function toggleFavorite(s: State, g: Game): State {
  return { ...s, lib: { ...s.lib, favs: { ...s.lib.favs, [g.id]: !isFavorite(s.lib, g) } } }
}

const notice = (s: State, n: Notice): State => ({ ...s, notices: [...s.notices, n] })

function reduceGameOverlay(
  s: State,
  o: GameDropdown | GameMenu | GameSettings | Launch | RandomPick | ConfirmAction,
  button: Button,
): State {
  const r = s.route?.kind === 'games' ? s.route : null
  const g = selectedGame(s)
  switch (o.kind) {
    case 'launch':
      // Every face button dismisses it (`game_launch_dialog.dart:61-64`); the game carries on.
      return ['a', 'b', 'x', 'y', 'start', 'menu'].includes(button) ? pop(s) : s

    case 'game-dropdown': {
      const rows = gameDropdownRows(s)
      const row = rows[o.focus]
      switch (button) {
        case 'up':
        case 'down':
          return replaceTop(s, { ...o, focus: wrap(o.focus + (button === 'up' ? -1 : 1), rows.length) })
        case 'left':
        case 'right': {
          const step = button === 'left' ? -1 : 1
          if (row?.kind === 'size')
            return { ...s, gameSize: CARD_SIZES[wrap(CARD_SIZES.indexOf(s.gameSize) + step, 4)]! }
          if (row?.kind === 'style') return { ...s, gameStyle: s.gameStyle === 'fanart' ? 'box' : 'fanart' }
          return s
        }
        case 'a': {
          const closed = pop(s)
          if (row?.kind !== 'view') return closed
          // The dropdown drops rows the new view has none of; keep the focus inside the new list.
          return { ...closed, gameView: row.value }
        }
        case 'b':
          return pop(s)
        default:
          return s
      }
    }

    case 'game-menu': {
      if (!g || !r) return pop(s)
      if (o.sub !== null) {
        switch (button) {
          case 'up':
          case 'down':
            return replaceTop(s, { ...o, sub: wrap(o.sub + (button === 'up' ? -1 : 1), ADD_MENU.length) })
          case 'a':
            // Toggling keeps the menu open (`context_menu.dart:66-104`).
            if (ADD_MENU[o.sub] === 'favorite') return toggleFavorite(s, g)
            return notice(s, { type: 'success', message: 'Added to Collection 1' })
          case 'b':
          case 'left':
            return replaceTop(s, { ...o, sub: null })
          case 'y':
            return pop(s)
          default:
            return s
        }
      }
      switch (button) {
        case 'up':
        case 'down':
          return replaceTop(s, { ...o, focus: wrap(o.focus + (button === 'up' ? -1 : 1), GAME_MENU.length) })
        case 'right':
          return GAME_MENU[o.focus] === 'add' ? replaceTop(s, { ...o, sub: 0 }) : s
        case 'a':
          switch (GAME_MENU[o.focus]) {
            case 'settings':
              return push(pop(s), { kind: 'game-settings', tab: 0, focus: 0, sub: 0, editing: false })
            case 'scrape':
              return { ...pop(s), scraping: g.id }
            case 'add':
              return replaceTop(s, { ...o, sub: 0 })
            case 'view':
              return push(pop(s), { kind: 'game-dropdown', focus: ['list', 'grid', 'carousel'].indexOf(s.gameView) })
            case 'random':
              return push(pop(s), {
                kind: 'random',
                pick: randomPick(routeGames(s, r).length, s.rolls),
                spinning: true,
              })
          }
          return s
        case 'b':
        case 'y':
          return pop(s)
        default:
          return s
      }
    }

    case 'random': {
      if (!r) return pop(s)
      const n = routeGames(s, r).length
      switch (button) {
        case 'a':
          if (o.spinning) return s
          // Play selects the game, then launches it (`launch_flow.dart:546-564`).
          return push(
            { ...pop(s), route: { ...r, sel: o.pick } },
            { kind: 'launch', game: routeGames(s, r)[o.pick]!.id, phase: 'launching' },
          )
        case 'x':
          if (o.spinning) return s
          return replaceTop({ ...s, rolls: s.rolls + 1 }, { ...o, pick: randomPick(n, s.rolls + 1), spinning: true })
        case 'b':
          return { ...pop(s), rolls: s.rolls + 1 }
        default:
          return s
      }
    }

    case 'confirm': {
      if (!g || !r) return pop(s)
      if (button === 'b') return pop(s)
      if (button !== 'a') return s
      if (o.what === 'reset') {
        return notice(
          { ...pop(s), lib: { ...s.lib, played: { ...s.lib.played, [g.id]: 0 } } },
          { type: 'success', message: 'Play time reset' },
        )
      }
      // Delete removes the game and closes the dialog under the confirm too.
      const after = { ...s, overlays: s.overlays.slice(0, -2), lib: { ...s.lib, deleted: [...s.lib.deleted, g.id] } }
      return { ...after, route: { ...r, sel: Math.max(0, Math.min(r.sel, routeGames(after, r).length - 1)) } }
    }

    case 'game-settings': {
      if (!g || !r) return pop(s)
      const count = gameSettingsCount(s, o, g)
      if (o.editing) {
        // A walks the fields to Save; B leaves the field (`game_settings_scrapping_tab.dart:229-237`).
        if (button === 'b') return replaceTop(s, { ...o, editing: false })
        if (button === 'a') {
          if (o.focus >= 1 && o.focus <= 3) return replaceTop(s, { ...o, focus: o.focus + 1 })
          if (o.focus === 4) return replaceTop(s, { ...o, focus: 11, editing: false })
        }
        return s
      }
      switch (button) {
        case 'l':
        case 'r':
          return replaceTop(s, { ...o, tab: wrap(o.tab + (button === 'l' ? -1 : 1), 3), focus: 0, sub: 0 })
        case 'up':
        case 'down':
          // Clamped, not wrapped, on every tab.
          return replaceTop(s, { ...o, focus: Math.min(count - 1, Math.max(0, o.focus + (button === 'up' ? -1 : 1))) })
        case 'left':
        case 'right':
          if (o.tab !== 1) return s
          return replaceTop(s, { ...o, sub: button === 'left' ? 0 : 1, focus: 0 })
        case 'b':
          return pop(s)
        case 'a': {
          if (o.tab === 0) return s
          if (o.tab === 1) {
            if (o.sub === 1) return s
            if (o.focus === 0) return { ...pop(s), scraping: g.id }
            if (o.focus === 11) return notice(s, { type: 'success', message: 'Metadata saved' })
            return replaceTop(s, { ...o, editing: true })
          }
          switch (MANAGE_ROWS[o.focus]) {
            case 'cloud':
              return s
            case 'playtime':
              return playedOf(s.lib, g) > 0 ? push(s, { kind: 'confirm', what: 'reset' }) : s
            case 'hide': {
              // Hides at once with no confirm, toasts, and closes (`game_settings_manage_tab.dart:240-245`).
              const after = notice(
                { ...pop(s), lib: { ...s.lib, hidden: [...s.lib.hidden, g.id] } },
                { type: 'success', message: `${g.title} hidden` },
              )
              return { ...after, route: { ...r, sel: Math.max(0, Math.min(r.sel, routeGames(after, r).length - 1)) } }
            }
            case 'delete':
              return push(s, { kind: 'confirm', what: 'delete' })
          }
          return s
        }
        default:
          return s
      }
    }
  }
}

/* ---- the clock ------------------------------------------------------------------ */

/** Launching turns to executing once the source's two-second minimum is up. */
export function launchStarted(s: State): State {
  const o = top(s)
  return o?.kind === 'launch' && o.phase === 'launching' ? replaceTop(s, { ...o, phase: 'executing' }) : s
}

/** The random spin lands. */
export function spinSettled(s: State): State {
  const o = top(s)
  return o?.kind === 'random' && o.spinning ? replaceTop(s, { ...o, spinning: false }) : s
}

/** A scrape from the menu finishes: the card's progress panel goes and the bell gets its toast. */
/** The wizard's scan completes. */
export const wizardScanned = (s: State): State => (s.wizard ? { ...s, wizard: scanDone(s.wizard) } : s)

/** The library scan completes, and the splash gives way to the systems. */
export const scanFinished = (s: State): State => ({ ...s, scan: null, scanEnded: true })

export function scrapeFinished(s: State): State {
  return s.scraping ? notice({ ...s, scraping: null }, { type: 'success', message: 'Scraping successful!' }) : s
}
