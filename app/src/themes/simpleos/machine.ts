import type { Button } from '../../input/keymap'
import {
  DS_BUTTONS,
  GAMES,
  GRID,
  MENU_CURRENT,
  MENU_OTHER,
  OVERRIDES,
  POWER_PROFILES,
  SAMPLE_CLOCK,
  SHADERS,
  type DsButton,
  type MenuItem,
  type Override,
  type PowerProfile,
  type View,
} from './library'

/**
 * SimpleOS as a state machine.
 *
 * A pure function of (state, button), so every transition the port makes can be tested without
 * rendering anything - and the theme root is left doing only what a root does: holding the state
 * and drawing it.
 *
 * Navigation is a back stack, seeded by the posed view. SimpleOS's own B is not uniform - it is
 * "back" in a list, "home" off the options screen, "cancel" on the clock, and resume in the game
 * menu - so B is handled per view here rather than by a generic back button.
 */

export interface Settings {
  readonly autoLoad: boolean
  readonly autoResume: boolean
  readonly hiRes3d: boolean
  readonly shader: number
  readonly wifi: boolean
  readonly ssh: boolean
  readonly ra: boolean
  readonly power: PowerProfile
}

export interface PerGame {
  readonly autoLoad: Override
  readonly autoResume: Override
  readonly hiRes3d: Override
  /** -1 is GLOBAL; anything else indexes `SHADERS`. */
  readonly shader: number
}

export interface Clock {
  readonly year: number
  readonly month: number
  readonly day: number
  readonly hour: number
  readonly minute: number
}

/** The clock's fields, in the order left and right step through them. */
export const CLOCK_FIELDS = ['day', 'month', 'year', 'hour', 'minute'] as const
export type ClockField = (typeof CLOCK_FIELDS)[number]

export type Osd = 'SAVED' | 'LOADED' | null

export interface State {
  readonly stack: readonly View[]
  /** The home grid's cursor, as an index into the visible (unarchived) titles. */
  readonly home: number
  /** Cursor per list screen. */
  readonly cursor: Readonly<Partial<Record<View, number>>>
  /** Indexes into `GAMES` of titles the player has archived, which leave the grid. */
  readonly archived: readonly number[]
  /** The title DraStic is running, as an index into `GAMES`. */
  readonly running: number | null
  /** The title the in-game menu is showing; left and right change it. */
  readonly menuTitle: number
  readonly settings: Settings
  readonly perGame: Readonly<Record<number, PerGame>>
  readonly bindings: Readonly<Record<DsButton, readonly string[]>>
  /** Controls is waiting for the next press: `bind` replaces, `add` appends. */
  readonly binding: 'bind' | 'add' | null
  readonly clock: Clock
  /** The clock screen edits a draft, so B can cancel it. */
  readonly draft: Clock
  readonly clockField: number
  readonly osd: Osd
  /** One line of feedback on the top panel of a settings screen. */
  readonly status: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  autoLoad: false,
  autoResume: false,
  hiRes3d: false,
  shader: 0,
  // First install: "Wi-Fi and SSH are off" (README).
  wifi: false,
  ssh: false,
  ra: true,
  power: 'Performance',
}

export const DEFAULT_PER_GAME: PerGame = {
  autoLoad: 'GLOBAL',
  autoResume: 'GLOBAL',
  hiRes3d: 'GLOBAL',
  shader: -1,
}

function defaultBindings(): Record<DsButton, readonly string[]> {
  const out = {} as Record<DsButton, readonly string[]>
  for (const b of DS_BUTTONS) out[b] = [b]
  return out
}

export interface Seed {
  readonly view?: View | undefined
  readonly home?: number | undefined
  readonly cursor?: number | undefined
  readonly running?: number | undefined
  readonly menuTitle?: number | undefined
  readonly osd?: Osd | undefined
  readonly binding?: 'bind' | 'add' | null | undefined
  readonly clockField?: number | undefined
  /** Titles already archived, so a still of the Archive screen has something on it. */
  readonly archived?: readonly number[] | undefined
}

/**
 * The stack a posed view would have been reached by.
 *
 * A still has no history, but B on it should still go where B goes - so the seed builds the path
 * the player would have walked to get there.
 */
function pathTo(view: View): View[] {
  switch (view) {
    case 'boot':
    case 'home':
      return [view]
    case 'archive':
    case 'options':
    case 'this-game':
    case 'clock':
    case 'game':
      return ['home', view]
    case 'network':
    case 'update':
    case 'game-settings':
    case 'power':
      return ['home', 'options', view]
    case 'retroachievements':
      return ['home', 'options', 'network', view]
    case 'controls':
      return ['home', 'this-game', view]
    case 'quick-menu':
      return ['home', 'game', view]
    case 'video':
      return ['home', 'game', 'quick-menu', view]
  }
}

export function initialState(seed: Seed = {}): State {
  const view = seed.view ?? 'boot'
  const inGame = view === 'game' || view === 'quick-menu' || view === 'video'
  const running = inGame ? (seed.running ?? 0) : null
  const cursor: Partial<Record<View, number>> = {}
  if (seed.cursor !== undefined) cursor[view] = seed.cursor

  return {
    stack: pathTo(view),
    home: seed.home ?? 0,
    cursor,
    archived: seed.archived ?? [],
    running,
    menuTitle: seed.menuTitle ?? running ?? 0,
    settings: DEFAULT_SETTINGS,
    perGame: {},
    bindings: defaultBindings(),
    binding: seed.binding ?? null,
    clock: SAMPLE_CLOCK,
    draft: SAMPLE_CLOCK,
    clockField: seed.clockField ?? 0,
    osd: seed.osd ?? null,
    status: null,
  }
}

export function currentView(state: State): View {
  return state.stack.at(-1) ?? 'home'
}

/** The titles still on the grid, as indexes into `GAMES`. */
export function visibleGames(state: State): number[] {
  return GAMES.map((_, i) => i).filter((i) => !state.archived.includes(i))
}

/** The game under the home cursor, or null on an empty grid. */
export function highlighted(state: State): number | null {
  const games = visibleGames(state)
  return games[Math.min(state.home, games.length - 1)] ?? null
}

export function perGameFor(state: State, game: number): PerGame {
  return state.perGame[game] ?? DEFAULT_PER_GAME
}

/** The in-game menu for whichever title it is showing. */
export function menuItems(state: State): readonly MenuItem[] {
  return state.menuTitle === state.running ? MENU_CURRENT : MENU_OTHER
}

/**
 * One row of a settings list.
 *
 * `note` is what the top panel says about the row while the cursor is on it. It is only ever one
 * of the binary's own strings.
 */
export interface Row {
  readonly key: string
  readonly label: string
  readonly value?: string | undefined
  readonly note?: string | undefined
}

const onOff = (on: boolean) => (on ? 'ON' : 'OFF')

/** The rows each settings screen lists. */
export function rows(state: State, view: View = currentView(state)): readonly Row[] {
  const s = state.settings
  switch (view) {
    case 'archive':
      return state.archived.map((g) => ({ key: String(g), label: GAMES[g]! }))
    case 'options':
      return [
        { key: 'network', label: 'Network', note: 'Wi-Fi, RetroAchievements' },
        { key: 'update', label: 'Update', note: 'OTA or zip on the SD' },
        { key: 'game-settings', label: 'Game settings', note: 'Default for every title' },
        { key: 'power', label: 'Power management' },
      ]
    case 'network':
      return [
        { key: 'wifi', label: 'Wi-Fi', value: onOff(s.wifi), note: s.wifi ? 'Radio on' : 'Radio off' },
        { key: 'ssh', label: 'SSH', value: onOff(s.ssh), note: s.ssh ? 'SSH on' : 'SSH off' },
        { key: 'retroachievements', label: 'RetroAchievements', value: onOff(s.ra) },
      ]
    case 'retroachievements':
      return [
        { key: 'ra', label: 'Enabled', value: onOff(s.ra) },
        { key: 'user', label: 'Username', value: '-' },
        { key: 'pass', label: 'Password', value: '-', note: 'Account password (not API key)' },
        { key: 'signin', label: 'Sign in' },
        { key: 'identify', label: 'Identify game' },
      ]
    case 'update':
      return [
        { key: 'ota', label: 'OTA', note: 'SimpleOS-RGDS zip' },
        { key: 'manual', label: 'Manual update', note: 'Copy the zip next to Roms/' },
      ]
    case 'game-settings':
      return [
        { key: 'autoLoad', label: 'Auto-load', value: onOff(s.autoLoad) },
        { key: 'autoResume', label: 'Auto-resume', value: onOff(s.autoResume) },
        { key: 'hiRes3d', label: 'HIGH RES 3D', value: onOff(s.hiRes3d), note: 'Best on 3D games' },
        { key: 'shader', label: 'Shader', value: SHADERS[s.shader] },
      ]
    case 'power':
      return POWER_PROFILES.map((p) => ({
        key: p,
        label: p,
        value: s.power === p ? 'ON' : undefined,
      }))
    case 'this-game': {
      const g = perGameFor(state, highlighted(state) ?? 0)
      return [
        { key: 'autoLoad', label: 'Auto-load', value: g.autoLoad },
        { key: 'autoResume', label: 'Auto-resume', value: g.autoResume },
        { key: 'hiRes3d', label: 'HIGH RES 3D', value: g.hiRes3d, note: 'Best on 3D games' },
        { key: 'shader', label: 'Shader', value: g.shader < 0 ? 'GLOBAL' : SHADERS[g.shader] },
        { key: 'controls', label: 'Controls', note: 'Remap DS buttons' },
      ]
    }
    case 'controls':
      return [
        ...DS_BUTTONS.map((b) => ({
          key: b,
          label: b,
          value: state.bindings[b].join(' + '),
          note: 'Several inputs per button',
        })),
        { key: 'default', label: 'DEFAULT' },
      ]
    case 'video':
      return [
        { key: 'hiRes3d', label: 'HIGH RES 3D', value: onOff(s.hiRes3d), note: 'A  apply (restarts)' },
        { key: 'shader', label: 'SHADER', value: SHADERS[s.shader] },
      ]
    default:
      return []
  }
}

export function listCursor(state: State, view: View = currentView(state)): number {
  return Math.min(state.cursor[view] ?? 0, Math.max(0, rows(state, view).length - 1))
}

/* --- transitions ---------------------------------------------------------- */

const push = (state: State, view: View): State => ({
  ...state,
  stack: [...state.stack, view],
  status: null,
})

const pop = (state: State): State =>
  state.stack.length > 1 ? { ...state, stack: state.stack.slice(0, -1), status: null } : state

const home = (state: State): State => ({ ...state, stack: ['home'], running: null, status: null })

const setCursor = (state: State, view: View, value: number): State => ({
  ...state,
  cursor: { ...state.cursor, [view]: value },
})

const wrap = (i: number, n: number) => ((i % n) + n) % n

function withSettings(state: State, patch: Partial<Settings>): State {
  return { ...state, settings: { ...state.settings, ...patch } }
}

function withPerGame(state: State, game: number, patch: Partial<PerGame>): State {
  return {
    ...state,
    perGame: { ...state.perGame, [game]: { ...perGameFor(state, game), ...patch } },
  }
}

function nextOverride(o: Override): Override {
  return OVERRIDES[wrap(OVERRIDES.indexOf(o) + 1, OVERRIDES.length)]!
}

/** Cursor movement in a list, shared by every settings screen. Lists wrap. */
function moveList(state: State, button: Button): State | null {
  const view = currentView(state)
  const n = rows(state, view).length
  if (n === 0) return null
  if (button === 'up') return setCursor(state, view, wrap(listCursor(state) - 1, n))
  if (button === 'down') return setCursor(state, view, wrap(listCursor(state) + 1, n))
  return null
}

function onHome(state: State, button: Button): State {
  const games = visibleGames(state)
  const n = games.length
  const at = Math.min(state.home, Math.max(0, n - 1))
  const game = games[at]

  switch (button) {
    /*
     * Row-major across pages, as the trailer moves it: right off the last tile of a page lands on
     * the first of the next. Up and down move a row; neither wraps.
     */
    case 'left':
      return { ...state, home: Math.max(0, at - 1) }
    case 'right':
      return { ...state, home: Math.min(n - 1, at + 1) }
    case 'up':
      return at - GRID.cols >= 0 ? { ...state, home: at - GRID.cols } : state
    case 'down':
      return at + GRID.cols < n ? { ...state, home: at + GRID.cols } : state
    case 'a':
      if (game === undefined) return state
      return { ...push(state, 'game'), running: game, menuTitle: game, osd: null }
    case 'x':
      /*
       * `X archive` opens the archive: the binary has a screen for it (`Ui_archive`, "Archived
       * titles"). Titles go *into* the archive from the in-game menu's ARCHIVE.
       */
      return push(state, 'archive')
    case 'start':
      return push(state, 'options')
    case 'select':
      return { ...push(state, 'clock'), draft: state.clock, clockField: 0 }
    case 'menu':
      return game === undefined ? state : push(state, 'this-game')
    default:
      return state
  }
}

function onList(state: State, button: Button): State {
  const view = currentView(state)
  const moved = moveList(state, button)
  if (moved) return moved

  if (button === 'b') {
    // Off the options screen B says `home`; everywhere else it says `back`. Both are one pop here,
    // because options sits directly on home.
    return pop(state)
  }

  const row = rows(state, view)[listCursor(state, view)]
  if (!row) return state
  const s = state.settings
  const shaderStep = (by: number) => wrap(s.shader + by, SHADERS.length)

  switch (view) {
    case 'archive':
      /* `A  move`: the title goes back to the library (`Library_toggleArchive`). */
      if (button !== 'a') return state
      return { ...state, archived: state.archived.filter((g) => String(g) !== row.key) }
    case 'options':
      if (button === 'a') return push(state, row.key as View)
      return state
    case 'network':
      if (button !== 'a') return state
      if (row.key === 'wifi') return withSettings(state, { wifi: !s.wifi })
      if (row.key === 'ssh') return withSettings(state, { ssh: !s.ssh })
      return push(state, 'retroachievements')
    case 'retroachievements':
      if (button !== 'a') return state
      if (row.key === 'ra') return withSettings(state, { ra: !s.ra })
      if (row.key === 'identify') {
        return { ...state, status: state.running === null ? 'No game' : 'Identifying...' }
      }
      // Username, Password and Sign in: no account is set, which the binary says this way.
      return { ...state, status: 'Enter user and password' }
    case 'update':
      if (button !== 'a') return state
      if (row.key === 'ota') {
        return { ...state, status: s.wifi ? 'Checking for updates' : 'Network error' }
      }
      return { ...state, status: 'No zip on the SD' }
    case 'game-settings':
      if (row.key === 'shader') {
        if (button === 'left') return withSettings(state, { shader: shaderStep(-1) })
        if (button === 'right' || button === 'a') return withSettings(state, { shader: shaderStep(1) })
        return state
      }
      if (button !== 'a') return state
      if (row.key === 'autoLoad') return withSettings(state, { autoLoad: !s.autoLoad })
      if (row.key === 'autoResume') return withSettings(state, { autoResume: !s.autoResume })
      if (row.key === 'hiRes3d') return withSettings(state, { hiRes3d: !s.hiRes3d })
      return state
    case 'power':
      if (button !== 'a') return state
      return withSettings(state, { power: row.key as PowerProfile })
    case 'this-game': {
      if (button !== 'a') return state
      const game = highlighted(state) ?? 0
      const g = perGameFor(state, game)
      if (row.key === 'controls') return push(state, 'controls')
      if (row.key === 'shader') {
        // GLOBAL, then every shader by name, then back to GLOBAL.
        const next = g.shader + 1 >= SHADERS.length ? -1 : g.shader + 1
        return withPerGame(state, game, { shader: next })
      }
      const key = row.key as 'autoLoad' | 'autoResume' | 'hiRes3d'
      return withPerGame(state, game, { [key]: nextOverride(g[key]) })
    }
    case 'controls':
      if (row.key === 'default') {
        return button === 'a' ? { ...state, bindings: defaultBindings() } : state
      }
      if (button === 'a') return { ...state, binding: 'bind' }
      if (button === 'x') return { ...state, binding: 'add' }
      return state
    case 'video':
      if (row.key === 'shader') {
        if (button === 'left') return withSettings(state, { shader: shaderStep(-1) })
        if (button === 'right') return withSettings(state, { shader: shaderStep(1) })
        return state
      }
      if (button === 'a') {
        return { ...withSettings(state, { hiRes3d: !s.hiRes3d }), status: 'Restarting' }
      }
      return state
    default:
      return state
  }
}

/** Controls is listening: the next press is the input being bound, whatever it is. */
function onBinding(state: State, button: Button): State {
  const view = currentView(state)
  const target = rows(state, view)[listCursor(state, view)]?.key as DsButton | undefined
  if (!target || !DS_BUTTONS.includes(target)) return { ...state, binding: null }
  const input = button.toUpperCase()
  const existing = state.bindings[target]
  const next =
    state.binding === 'add' ? [...existing.filter((b) => b !== input), input] : [input]
  return { ...state, binding: null, bindings: { ...state.bindings, [target]: next } }
}

const DAYS_IN_MONTH = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

function stepClock(c: Clock, field: ClockField, by: number): Clock {
  switch (field) {
    case 'day':
      return { ...c, day: wrap(c.day - 1 + by, DAYS_IN_MONTH(c.year, c.month)) + 1 }
    case 'month': {
      const month = wrap(c.month - 1 + by, 12) + 1
      return { ...c, month, day: Math.min(c.day, DAYS_IN_MONTH(c.year, month)) }
    }
    case 'year':
      return { ...c, year: Math.max(2000, Math.min(2099, c.year + by)) }
    case 'hour':
      return { ...c, hour: wrap(c.hour + by, 24) }
    case 'minute':
      return { ...c, minute: wrap(c.minute + by, 60) }
  }
}

function onClock(state: State, button: Button): State {
  const field = CLOCK_FIELDS[state.clockField]!
  switch (button) {
    case 'left':
      return { ...state, clockField: wrap(state.clockField - 1, CLOCK_FIELDS.length) }
    case 'right':
      return { ...state, clockField: wrap(state.clockField + 1, CLOCK_FIELDS.length) }
    case 'up':
      return { ...state, draft: stepClock(state.draft, field, 1) }
    case 'down':
      return { ...state, draft: stepClock(state.draft, field, -1) }
    case 'a':
      return { ...pop(state), clock: state.draft }
    case 'b':
      return { ...pop(state), draft: state.clock }
    default:
      return state
  }
}

function onGame(state: State, button: Button): State {
  // Every other button belongs to the game. MENU is the only one SimpleOS takes.
  if (button === 'menu') {
    return { ...push(state, 'quick-menu'), menuTitle: state.running ?? 0, osd: null, cursor: { ...state.cursor, 'quick-menu': 0 } }
  }
  return state.osd ? { ...state, osd: null } : state
}

function onQuickMenu(state: State, button: Button): State {
  const items = menuItems(state)
  const at = Math.min(state.cursor['quick-menu'] ?? 0, items.length - 1)
  const games = visibleGames(state)

  switch (button) {
    case 'up':
      return setCursor(state, 'quick-menu', wrap(at - 1, items.length))
    case 'down':
      return setCursor(state, 'quick-menu', wrap(at + 1, items.length))
    case 'left':
    case 'right': {
      /* "Left/right change title." The menu shortens for a title that is not running. */
      if (games.length === 0) return state
      const from = Math.max(0, games.indexOf(state.menuTitle))
      const menuTitle = games[wrap(from + (button === 'left' ? -1 : 1), games.length)]!
      return { ...setCursor(state, 'quick-menu', 0), menuTitle }
    }
    case 'b':
    case 'menu':
      return pop(state)
    case 'a':
      break
    default:
      return state
  }

  const item = items[at]!
  const current = state.menuTitle === state.running
  switch (item) {
    case 'RESUME':
    case 'RESET':
      return pop(state)
    case 'SAVE':
      return { ...pop(state), osd: 'SAVED' }
    case 'LOAD':
      return { ...pop(state), running: state.menuTitle, osd: 'LOADED' }
    case 'ARCHIVE': {
      const archived = [...state.archived, state.menuTitle]
      if (current) return { ...home(state), archived, home: 0 }
      const rest = games.filter((g) => g !== state.menuTitle)
      return { ...state, archived, menuTitle: state.running ?? rest[0] ?? 0 }
    }
    case 'VIDEO':
      return push(state, 'video')
    case 'CONTROLS':
      return push(state, 'controls')
    case 'HOME':
      return home(state)
  }
}

/** The one entry point: what a button does, given where SimpleOS is. */
export function reduce(state: State, button: Button): State {
  const view = currentView(state)
  if (state.binding) return onBinding(state, button)

  switch (view) {
    case 'boot':
      // "Touch the touch screen to continue." A continues too, so the mockup can be driven
      // entirely from the keyboard.
      return button === 'a' || button === 'start' ? { ...state, stack: ['home'] } : state
    case 'home':
      return onHome(state, button)
    case 'clock':
      return onClock(state, button)
    case 'game':
      return onGame(state, button)
    case 'quick-menu':
      return onQuickMenu(state, button)
    default:
      return onList(state, button)
  }
}
