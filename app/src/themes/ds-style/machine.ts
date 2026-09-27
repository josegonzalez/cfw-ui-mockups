import type { Button } from '../../input/keymap'
import { APPS, APPS_SHORTCUT, FAVOURITES, RECENTS, ROOT, allGames, byName, filename, list, type Entry } from './library'
import { THEMES } from './palette'
import { LANGUAGES } from './text'

/**
 * DS Style as a pure reducer: `action_impl` and `extra_action` (`source/dsstyle.c:529-592`,
 * `extra_ui.h:58-68`), in the order they run. The order matters - `extra_action` takes X on every
 * page before a page sees it, and L and R are a three-tab cycle before the browser's own branch -
 * so it is kept rather than tidied.
 */

/** The launcher's logical keys (`dsstyle.c:50`). */
export type Key =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'accept'
  | 'back'
  | 'view'
  | 'fav'
  | 'recent'
  | 'menu'
  | 'pgup'
  | 'pgdn'
  | 'start'
  | 'history'
  | 'favourites'

/** The 11 bindable actions, in `control_actions` order (`controller_state.h:7-8`). */
export const CONTROL_ACTIONS = [
  'accept',
  'back',
  'view',
  'fav',
  'recent',
  'pgup',
  'pgdn',
  'start',
  'history',
  'favourites',
  'menu',
] as const
export type ControlAction = (typeof CONTROL_ACTIONS)[number]
export const CONTROL_NAMES = [
  'Accept',
  'Back',
  'Search / help',
  'Favourite',
  'View / source',
  'Previous tab',
  'Next tab',
  'Launch mode',
  'Recents',
  'Favourites',
  'Settings',
]

/** The RG SP's default buttons for those actions (`controller_state.h:9`). */
const DEFAULT_BINDINGS: readonly Button[] = ['a', 'b', 'x', 'y', 'select', 'l', 'r', 'start', 'l2', 'r2', 'menu']

/** A handheld button's printed name (`controller_state.h:19`). */
export const BUTTON_NAME: Readonly<Partial<Record<Button, string>>> = {
  a: 'A',
  b: 'B',
  x: 'X',
  y: 'Y',
  select: 'SELECT',
  l: 'L',
  r: 'R',
  start: 'START',
  l2: 'L2',
  r2: 'R2',
  menu: 'MENU',
}

/** Setting ids, in the source's enum order (`ui.h:4`); the bindings follow `bind0`. */
export const SET = {
  clock: 0,
  folders: 1,
  names: 2,
  clean: 3,
  colour: 4,
  view: 5,
  gbaArt: 6,
  border: 7,
  round: 8,
  vSide: 9,
  hSide: 10,
  hFit: 11,
  artPos: 12,
  homeButton: 13,
  lcd: 14,
  stock: 15,
  autoboot: 16,
  reboot: 17,
  shutdown: 18,
  apps: 19,
  uiSound: 20,
  startSound: 21,
  sysIcons: 22,
  dark: 23,
  pt: 24,
  boot: 25,
  homeEnabled: 26,
  source: 27,
  quick: 28,
  language: 29,
  controller: 30,
  resetControls: 31,
  appsInGames: 32,
  bind0: 33,
} as const

/** Each category's rows (`ui.h:6-12`); Help and About have none. */
export const CATEGORY_ITEMS: readonly (readonly number[])[] = [
  [SET.view, SET.folders, SET.clean, SET.names, SET.sysIcons, SET.appsInGames],
  [SET.artPos, SET.hSide, SET.hFit, SET.vSide, SET.gbaArt, SET.border, SET.round],
  [SET.colour, SET.dark, SET.lcd, SET.pt, SET.clock, SET.language],
  [SET.boot, SET.homeEnabled, SET.source, SET.quick, SET.homeButton, SET.autoboot],
  [SET.uiSound, SET.startSound],
  [SET.apps, SET.stock, SET.reboot, SET.shutdown],
  [SET.controller, SET.resetControls, ...CONTROL_ACTIONS.map((_, i) => SET.bind0 + i)],
]
export const CATEGORY_NAMES = [
  'Browsing',
  'Artwork',
  'Appearance',
  'Startup',
  'Sound',
  'System',
  'Controls',
  'Help',
  'About',
]

export const VIEW_NAMES = ['List', 'List + Art', 'Horizontal', 'Vertical']
export const BOOT_NAMES = ['Home', 'Games', 'Recents', 'Favourites', 'Last game']
export const QUICK_NAMES = ['Off', 'A', 'B', 'X', 'Y', 'SELECT', 'L', 'R']

/** Every persisted preference, at the source's defaults (`dsstyle.c:69-81, 136`, `extra_state.h:2`). */
export interface Prefs {
  readonly viewmode: number
  readonly colour: number
  readonly lcd: boolean
  readonly cleanList: boolean
  readonly artPosition: number
  readonly artBorder: number
  readonly clock12: boolean
  readonly fullNames: boolean
  readonly gbaArt: boolean
  readonly hFit: boolean
  readonly homeButton: number
  readonly round: number
  readonly vSide: number
  readonly hSide: number
  readonly listFolders: number
  readonly uiSounds: boolean
  readonly startupSound: boolean
  readonly systemIcons: boolean
  readonly dark: boolean
  readonly pt: boolean
  readonly language: number
  readonly bootTo: number
  readonly homeEnabled: boolean
  readonly quick: number
  readonly appsInGames: boolean
  readonly autoboot: boolean
}

export const DEFAULT_PREFS: Prefs = {
  viewmode: 2,
  colour: 0,
  lcd: false,
  cleanList: true,
  artPosition: 0,
  artBorder: 3,
  clock12: true,
  fullNames: true,
  gbaArt: false,
  hFit: true,
  homeButton: 0,
  round: 2,
  vSide: 0,
  hSide: 0,
  listFolders: 1,
  uiSounds: true,
  startupSound: true,
  systemIcons: true,
  dark: false,
  pt: false,
  language: 0,
  bootTo: 0,
  homeEnabled: true,
  quick: 0,
  appsInGames: false,
  autoboot: false,
}

interface Frame {
  readonly here: string
  readonly choice: number
  readonly top: number
}

interface Tab extends Frame {
  readonly section: number
  readonly stack: readonly Frame[]
}

interface Return extends Tab {
  readonly page: number
  readonly setting: number
  readonly previous: number
}

export interface Snake {
  readonly active: boolean
  readonly over: boolean
  /** Head first, as `launcher_snake_x/y` (`about_snake.h:17-19`). */
  readonly body: readonly (readonly [number, number])[]
  readonly dx: number
  readonly dy: number
  readonly food: readonly [number, number]
  readonly rng: number
  readonly best: number
}

export interface Search {
  readonly saved: readonly Entry[]
  readonly savedChoice: number
  readonly savedTop: number
  readonly query: string
  readonly keyboard: boolean
  readonly cell: number
  /** From the Systems list, every game on the card; anywhere else, the list it opened on. */
  readonly global: boolean
}

export interface State {
  readonly prefs: Prefs
  /** 0 Home, 1 a list, 2 Settings. */
  readonly page: number
  readonly previous: number
  /** 0 Games, 1 Favourites, 2 Recents, 3 Apps. */
  readonly section: number
  readonly here: string
  readonly entries: readonly Entry[]
  readonly choice: number
  readonly top: number
  readonly stack: readonly Frame[]
  readonly homechoice: number
  /** Where the corners set off from, and whether they are still gliding. */
  readonly homeFrom: number
  readonly homeMoving: boolean
  readonly homeRecent: number
  readonly homeFavourites: boolean
  readonly favourites: readonly string[]
  readonly recents: readonly string[]
  readonly category: number
  readonly categoryChoice: number
  readonly setting: number
  readonly settingsTop: number
  readonly helpPage: number
  readonly aboutPage: number
  readonly snake: Snake
  readonly notice: string | null
  readonly powerConfirm: number
  readonly launchMode: string | null
  readonly launching: string | null
  /** A setting's help box: its id, or -2 for the Last-game boot warning. */
  readonly settingHelp: number | null
  readonly capture: number | null
  readonly bootWarning: boolean
  readonly search: Search | null
  readonly hardware: { readonly kind: 1 | 2; readonly level: number } | null
  readonly bindings: readonly Button[]
  readonly tabs: readonly [Tab | null, Tab | null]
  readonly collectionReturn: Return | null
  readonly appsReturnSystems: boolean
  readonly appsReturnSettings: boolean
  /** The launcher has handed the device back: to the stock menu, or to a reboot or shutdown. */
  readonly exited: 'stock' | 'reboot' | 'shutdown' | null
  /** Bumped whenever the marquee restarts (`dsstyle.c:589`). */
  readonly marquee: number
}

const SNAKE_COLS = 20
const SNAKE_ROWS = 14

/** `Launcher_SnakePlaceFood`: the LCG the source uses (`about_snake.h:47-58`). */
function placeFood(body: Snake['body'], rng: number): { food: [number, number]; rng: number } {
  let r = rng
  for (let attempt = 0; attempt < 512; attempt++) {
    r = (Math.imul(r, 1664525) + 1013904223) >>> 0
    const x = (r >>> 16) % SNAKE_COLS
    const y = (r >>> 24) % SNAKE_ROWS
    if (!body.some(([bx, by]) => bx === x && by === y)) return { food: [x, y], rng: r }
  }
  return { food: [0, 0], rng: r }
}

/**
 * `Launcher_SnakeReset` (`about_snake.h:60-72`). The source seeds its food from the clock; the port
 * seeds it with the constant alone, so a still of the board is the same every time.
 */
function snakeReset(best: number): Snake {
  const body: [number, number][] = [0, 1, 2, 3].map((i) => [SNAKE_COLS / 2 - i, SNAKE_ROWS / 2])
  const { food, rng } = placeFood(body, 0x13579bdf)
  return { active: true, over: false, body, dx: 1, dy: 0, food, rng, best }
}

/** `Launcher_SnakeStep` and `snake_tick` (`about_snake.h:143-182`): one step, every 134ms. */
export function snakeStep(s: State): State {
  const sn = s.snake
  if (!sn.active || sn.over) return s
  const [hx, hy] = sn.body[0]!
  const nx = hx + sn.dx
  const ny = hy + sn.dy
  const hit = nx < 0 || nx >= SNAKE_COLS || ny < 0 || ny >= SNAKE_ROWS || sn.body.some(([x, y]) => x === nx && y === ny)
  if (hit) return { ...s, snake: { ...sn, over: true, best: Math.max(sn.best, sn.body.length - 4) } }
  const ate = nx === sn.food[0] && ny === sn.food[1]
  const grew = ate && sn.body.length < 120
  const body: (readonly [number, number])[] = [
    [nx, ny],
    ...sn.body.slice(0, grew ? sn.body.length : sn.body.length - 1),
  ]
  const next = ate ? placeFood(body, sn.rng) : { food: sn.food, rng: sn.rng }
  return { ...s, snake: { ...sn, body, ...next, best: Math.max(sn.best, body.length - 4) } }
}

export interface Seed {
  /** Pressed from a fresh start, in the reference renderer's letters (`dsstyle.c:603`). */
  readonly events?: string
  readonly launching?: boolean
  readonly hardware?: State['hardware']
  readonly prefs?: Partial<Prefs>
  /** Preferences set after the events - the live build's panel, over whatever the still posed. */
  readonly then?: Partial<Prefs>
}

/** The reference renderer's event letters (`dsstyle.c:603`), as the port's buttons. */
export const EVENT_BUTTON: Readonly<Record<string, Button>> = {
  u: 'up',
  d: 'down',
  l: 'left',
  r: 'right',
  a: 'a',
  b: 'b',
  x: 'x',
  y: 'y',
  m: 'menu',
  s: 'select',
  t: 'start',
  q: 'l',
  e: 'r',
  '1': 'l2',
  '2': 'r2',
}

export function initialState(seed: Seed = {}): State {
  const base: State = {
    prefs: { ...DEFAULT_PREFS, ...seed.prefs },
    page: 0,
    previous: 0,
    section: 0,
    here: '',
    entries: [],
    choice: 0,
    top: 0,
    stack: [],
    homechoice: 0,
    homeFrom: 0,
    homeMoving: false,
    homeRecent: 0,
    homeFavourites: false,
    favourites: FAVOURITES,
    recents: RECENTS,
    category: -1,
    categoryChoice: 0,
    setting: 0,
    settingsTop: 0,
    helpPage: 0,
    aboutPage: -1,
    snake: { active: false, over: false, body: [], dx: 1, dy: 0, food: [0, 0], rng: 0, best: 0 },
    notice: null,
    powerConfirm: 0,
    launchMode: null,
    launching: seed.launching ? '' : null,
    settingHelp: null,
    capture: null,
    bootWarning: false,
    search: null,
    hardware: seed.hardware ?? null,
    bindings: DEFAULT_BINDINGS,
    tabs: [null, null],
    collectionReturn: null,
    appsReturnSystems: false,
    appsReturnSettings: false,
    exited: null,
    marquee: 0,
  }
  // A still is posed by pressing through from a fresh start, exactly as its reference frame was.
  let s = base
  for (const letter of seed.events ?? '') {
    const button = EVENT_BUTTON[letter]
    if (!button) throw new Error(`Unknown event letter: ${letter}`)
    s = settled(reduce(s, button))
  }
  return seed.then ? { ...s, prefs: { ...s.prefs, ...seed.then } } : s
}

/** A still is drawn at rest: the corners have arrived. */
const settled = (s: State): State => (s.homeMoving ? { ...s, homeMoving: false } : s)

/* ---- the browser's bookkeeping -------------------------------------------------------------- */

const isSystemsView = (s: State) => s.page === 1 && s.section === 0 && s.here === ROOT

/** `browse` (`dsstyle.c:188-221`): one card holds games, so the card list opens straight onto it. */
function browse(s: State, path: string): State {
  const here = path === '' ? ROOT : path
  const next: State = { ...s, here, choice: 0, top: 0, section: 0, page: 1 }
  const entries = list(here)
  if (here === ROOT && s.prefs.appsInGames) entries.push(APPS_SHORTCUT)
  return { ...next, entries }
}

function apps(s: State): State {
  return {
    ...s,
    appsReturnSystems: false,
    appsReturnSettings: false,
    page: 1,
    section: 3,
    entries: APPS,
    choice: 0,
    top: 0,
    stack: [],
    here: '',
  }
}

/** `remember_tab` (`dsstyle.c:238`). */
function rememberTab(s: State): State {
  if (s.page !== 1 || (s.section !== 0 && s.section !== 3 && s.section !== 4)) return s
  const t = s.section === 3 ? 1 : 0
  const tab: Tab = { here: s.here, choice: s.choice, top: s.top, section: s.section, stack: s.stack }
  return { ...s, tabs: t ? [s.tabs[0], tab] : [tab, s.tabs[1]] }
}

/** `restore_tab` (`dsstyle.c:239`). */
function restoreTab(s: State, t: number): State {
  const v = s.tabs[t]
  let next = t ? apps(s) : browse(s, v ? v.here : '')
  if (v) {
    const count = next.entries.length
    const choice = v.choice < count ? v.choice : count ? count - 1 : 0
    next = { ...next, choice, top: v.top <= choice ? v.top : choice, stack: v.stack }
  }
  return next
}

/** `collection` (`dsstyle.c:224-228`): Recents or Favourites as a list, remembering where it came from. */
function collection(s: State, recent: boolean): State {
  let next = s
  if (!(s.page === 1 && (s.section === 1 || s.section === 2))) {
    next = {
      ...next,
      collectionReturn: {
        page: s.page,
        section: s.section,
        choice: s.choice,
        top: s.top,
        setting: s.setting,
        previous: s.previous,
        here: s.here,
        stack: s.stack,
      },
    }
  }
  const paths = recent ? s.recents : s.favourites
  const entries: Entry[] = paths.map((path) => ({ name: filename(path), path, dir: false, app: 0 }))
  return { ...next, page: 1, section: recent ? 2 : 1, entries, choice: 0, top: 0, stack: [], here: '' }
}

/** `collection_back` (`dsstyle.c:230-235`). */
function collectionBack(s: State): State {
  const v = s.collectionReturn
  if (!v) return { ...s, page: 0 }
  let next: State = { ...s, collectionReturn: null }
  if (v.page === 1 || (v.page === 2 && v.previous === 1)) {
    if (v.section === 3) {
      const origin = s.appsReturnSystems
      next = { ...apps(next), appsReturnSystems: origin }
    } else next = browse(next, v.here)
    const count = next.entries.length
    next = { ...next, choice: v.choice < count ? v.choice : count ? count - 1 : 0, top: v.top, stack: v.stack }
  }
  return { ...next, page: v.page, section: v.section, here: v.here, setting: v.setting, previous: v.previous }
}

/** `position_selection` (`dsstyle.c:183-187`). */
function positionSelection(s: State, delta: number): State {
  const count = s.entries.length
  if (!count) return s
  const choice = Math.max(0, Math.min(count - 1, s.choice + delta))
  let top = s.top
  if (delta >= 10 || delta <= -10) {
    top = Math.max(0, Math.min(count > 10 ? count - 10 : 0, top + delta))
  }
  if (choice < top) top = choice
  if (choice >= top + 10) top = choice - 9
  return { ...s, choice, top }
}

/** `effective_view` (`ui.h:241`): Apps is a list, and so is a list of nothing but folders. */
export function effectiveView(s: State): number {
  if (s.section === 3 || s.section === 4) return 0
  if (s.prefs.listFolders && s.entries.length && s.entries.every((e) => e.dir)) return s.prefs.listFolders === 2 ? 1 : 0
  return s.prefs.viewmode
}

function addRecent(s: State, path: string): State {
  return { ...s, recents: [path, ...s.recents.filter((p) => p !== path)].slice(0, 50) }
}

/** `togglefav` (`dsstyle.c:143`). */
function toggleFavourite(s: State): State {
  const e = s.entries[s.choice]
  if (!e || e.dir || e.app) return s
  if (s.favourites.includes(e.path)) {
    return { ...s, favourites: s.favourites.filter((p) => p !== e.path), notice: 'Removed from favourites' }
  }
  if (s.favourites.length >= 512) return { ...s, notice: 'Favourite list is full' }
  return { ...s, favourites: [...s.favourites, e.path], notice: 'Added to favourites' }
}

/** `launch_selected` (`dsstyle.c:516`). */
function launchSelected(s: State): State {
  const e = s.entries[s.choice]
  if (!e) return s
  if (e.app === 4) return { ...apps(rememberTab(s)), appsReturnSystems: true }
  if (e.dir) {
    if (s.stack.length >= 63) return { ...s, notice: 'Folder nesting limit reached' }
    const stack = [...s.stack, { here: s.here, choice: s.choice, top: s.top }]
    return { ...browse(s, e.path), stack }
  }
  if (e.app === 1 && e.path === 'stock') return { ...s, exited: 'stock' }
  // A game or an app hands the device to the stock launcher behind "Launching" (`dsstyle.c:470-493`).
  return { ...s, launching: e.path }
}

/** The live build's clock: the game or app ran and returned (`dsstyle.c:486-490`). */
export function launchReturned(s: State): State {
  if (s.launching === null) return s
  const path = s.launching
  const game = path.startsWith(`${ROOT}/`)
  if (!game) return { ...s, launching: null }
  const back = { ...addRecent(s, path), launching: null }
  // From the Home card, the newest recent is the card again (`dsstyle.c:544`).
  return back.page === 0 && !back.homeFavourites ? { ...back, homeRecent: 0 } : back
}

/* ---- settings -------------------------------------------------------------------------------- */

export function settingsItems(s: State): readonly number[] {
  return s.category >= 0 && s.category < CATEGORY_ITEMS.length ? CATEGORY_ITEMS[s.category]! : CATEGORY_ITEMS[5]!
}

const cycle = (value: number, count: number, delta: number) => (value + count + delta) % count

function withPrefs(s: State, p: Partial<Prefs>): State {
  return { ...s, prefs: { ...s.prefs, ...p } }
}

/** One settings row changed by A, Left or Right (`dsstyle.c:552-570`). */
function changeSetting(s: State, id: number, key: Key): State {
  const d = key === 'left' ? -1 : 1
  const p = s.prefs
  if (id >= SET.bind0) {
    return key === 'accept' ? { ...s, capture: id - SET.bind0 } : s
  }
  switch (id) {
    case SET.boot: {
      const bootTo = cycle(p.bootTo, 5, d)
      return { ...withPrefs(s, { bootTo }), bootWarning: bootTo === 4 }
    }
    case SET.homeEnabled:
      return withPrefs(s, { homeEnabled: !p.homeEnabled })
    case SET.source:
      return { ...s, homeFavourites: !s.homeFavourites, homeRecent: 0 }
    case SET.quick:
      return withPrefs(s, { quick: cycle(p.quick, 8, d) })
    case SET.appsInGames:
      return withPrefs(s, { appsInGames: !p.appsInGames })
    case SET.language:
      return withPrefs(s, { language: cycle(p.language, LANGUAGES.length, d) })
    case SET.controller:
      return s
    case SET.resetControls:
      return { ...s, bindings: DEFAULT_BINDINGS, notice: 'Controls reset' }
    case SET.clock:
      return withPrefs(s, { clock12: !p.clock12 })
    case SET.names:
      return withPrefs(s, { fullNames: !p.fullNames })
    case SET.gbaArt:
      return withPrefs(s, { gbaArt: !p.gbaArt })
    case SET.hFit:
      return withPrefs(s, { hFit: !p.hFit })
    case SET.homeButton:
      return withPrefs(s, { homeButton: cycle(p.homeButton, 3, d) })
    case SET.folders:
      return withPrefs(s, { listFolders: cycle(p.listFolders, 3, d) })
    case SET.clean:
      return withPrefs(s, { cleanList: !p.cleanList })
    case SET.colour:
      return withPrefs(s, { colour: cycle(p.colour, THEMES.length, d) })
    case SET.view:
      return withPrefs(s, { viewmode: cycle(p.viewmode, 4, d) })
    case SET.border:
      return withPrefs(s, { artBorder: cycle(p.artBorder, 5, d) })
    case SET.round:
      return withPrefs(s, { round: cycle(p.round, 3, d) })
    case SET.vSide:
      return withPrefs(s, { vSide: cycle(p.vSide, 3, d) })
    case SET.hSide:
      return withPrefs(s, { hSide: cycle(p.hSide, 3, d) })
    case SET.artPos:
      return withPrefs(s, { artPosition: cycle(p.artPosition, 3, d) })
    case SET.lcd:
      return withPrefs(s, { lcd: !p.lcd })
    case SET.pt:
      return withPrefs(s, { pt: !p.pt })
    case SET.dark:
      return withPrefs(s, { dark: !p.dark })
    case SET.uiSound:
      return withPrefs(s, { uiSounds: !p.uiSounds })
    case SET.startSound:
      return withPrefs(s, { startupSound: !p.startupSound })
    case SET.sysIcons:
      return withPrefs(s, { systemIcons: !p.systemIcons })
    case SET.apps:
      return { ...apps(s), appsReturnSettings: true }
    case SET.stock:
      return { ...s, exited: 'stock' }
    case SET.reboot:
      return { ...s, powerConfirm: 1 }
    case SET.shutdown:
      return { ...s, powerConfirm: 2 }
    case SET.autoboot: {
      // The source runs its boot manager; here the switch simply takes (`dsstyle.c:567`).
      const autoboot = !p.autoboot
      return { ...withPrefs(s, { autoboot }), notice: autoboot ? 'Autoboot enabled' : 'Autoboot disabled' }
    }
    default:
      return s
  }
}

function openSettings(s: State): State {
  return { ...s, previous: s.page, page: 2, setting: 0, category: -1, settingsTop: 0 }
}

/* ---- search (`extra_state.h:40-53`) ----------------------------------------------------------- */

const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-'. "

/** `search_char`'s fold: case, and the accented Latin letters, to their base letter. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function filterSearch(s: State, search: Search): State {
  const source = search.global ? allGames() : search.saved
  const q = fold(search.query)
  const entries = source.filter((e) => fold(e.name).includes(q))
  // Every game on the card is sorted as one list; the current list keeps its own order (`extra_state.h:40`).
  if (search.global) entries.sort(byName)
  return { ...s, search, entries, choice: 0, top: 0 }
}

function searchBegin(s: State): State {
  if (s.search) return { ...s, search: { ...s.search, keyboard: true } }
  const search: Search = {
    saved: s.entries,
    savedChoice: s.choice,
    savedTop: s.top,
    query: '',
    keyboard: true,
    cell: 0,
    global: isSystemsView(s),
  }
  return search.global ? filterSearch(s, search) : { ...s, search }
}

function searchEnd(s: State, restore: boolean): State {
  if (!s.search) return s
  return restore
    ? { ...s, entries: s.search.saved, choice: s.search.savedChoice, top: s.search.savedTop, search: null }
    : { ...s, search: null }
}

/** `search_input`: true when the keyboard took the key. */
function searchInput(s: State, k: Key): State | null {
  const q = s.search
  if (!q) return null
  if (k === 'back') return searchEnd(s, true)
  if (!q.keyboard) return k === 'view' ? { ...s, search: { ...q, keyboard: true } } : null
  let cell = q.cell
  if (k === 'up' && cell >= 10) cell -= 10
  if (k === 'down' && cell < 40) cell = cell >= 30 ? 40 : cell + 10
  if (k === 'left' && cell > 0) cell--
  if (k === 'right' && cell < 41) cell++
  if (k === 'accept') {
    if (cell === 41) return { ...s, search: { ...q, keyboard: false } }
    if (cell === 40) return q.query ? filterSearch(s, { ...q, query: q.query.slice(0, -1) }) : s
    if (q.query.length < 48) return filterSearch(s, { ...q, query: q.query + KEYS[cell] })
    return s
  }
  return { ...s, search: { ...q, cell } }
}

export const SEARCH_KEYS = KEYS

/* ---- About and Snake (`about_snake.h:183-195`) ---------------------------------------------- */

function aboutAction(s: State, k: Key): State | null {
  if (s.aboutPage < 0) return null
  const sn = s.snake
  if (sn.active) {
    if (k === 'back') return { ...s, snake: { ...sn, active: false } }
    if (sn.over) return k === 'accept' || k === 'start' ? { ...s, snake: snakeReset(sn.best) } : s
    if (k === 'up' && sn.dy === 0) return { ...s, snake: { ...sn, dx: 0, dy: -1 } }
    if (k === 'down' && sn.dy === 0) return { ...s, snake: { ...sn, dx: 0, dy: 1 } }
    if (k === 'left' && sn.dx === 0) return { ...s, snake: { ...sn, dx: -1, dy: 0 } }
    if (k === 'right' && sn.dx === 0) return { ...s, snake: { ...sn, dx: 1, dy: 0 } }
    return s
  }
  if (k === 'back') return { ...s, aboutPage: -1 }
  if (k === 'start') return { ...s, snake: snakeReset(sn.best) }
  if ((k === 'accept' || k === 'right' || k === 'pgdn') && s.aboutPage < 1) return { ...s, aboutPage: s.aboutPage + 1 }
  if ((k === 'left' || k === 'pgup') && s.aboutPage > 0) return { ...s, aboutPage: s.aboutPage - 1 }
  return s
}

/* ---- the reducer ---------------------------------------------------------------------------- */

/** A physical button, through the bindings, to the launcher's key (`controller_key`, `controller_state.h:17`). */
export function keyFor(s: State, button: Button): Key | null {
  switch (button) {
    case 'up':
    case 'down':
    case 'left':
    case 'right':
      return button
    default: {
      const i = s.bindings.indexOf(button)
      return i >= 0 ? CONTROL_ACTIONS[i]! : null
    }
  }
}

export function reduce(state: State, button: Button): State {
  // After the device is handed back, any button starts DS Style again, its preferences kept.
  if (state.exited)
    return { ...initialState({ prefs: state.prefs }), favourites: state.favourites, recents: state.recents }
  // Binding: the next face or shoulder button takes the action; D-pad Left cancels; the other
  // directions are not bindable and are ignored (`dsstyle.c:381-387`, `controller_state.h:12`).
  if (state.capture !== null) {
    if (button === 'left') return { ...state, capture: null }
    if (button === 'up' || button === 'down' || button === 'right') return state
    const action = state.capture
    const old = state.bindings[action]!
    const bindings = state.bindings.map((b, i) => (i === action ? button : b === button ? old : b))
    return { ...state, bindings, capture: null }
  }
  const k = keyFor(state, button)
  if (!k) return state
  const before = state
  let s = act(state, k)
  if (!s.prefs.homeEnabled && s.page === 0) s = browse(s, '')
  // The Settings rows keep the selection on screen (`ui.h:233`).
  const selected = s.category < 0 ? s.categoryChoice : s.setting
  if (selected < s.settingsTop) s = { ...s, settingsTop: selected }
  if (selected >= s.settingsTop + 9) s = { ...s, settingsTop: selected - 8 }
  const restart =
    before.page !== s.page ||
    before.choice !== s.choice ||
    before.prefs.viewmode !== s.prefs.viewmode ||
    before.here !== s.here
  return restart ? { ...s, marquee: s.marquee + 1 } : s
}

/** `extra_action`, then `action_impl`. */
function act(state: State, k: Key): State {
  let s = state
  // `extra_action` (`extra_ui.h:58-68`).
  if (s.settingHelp !== null) return k === 'accept' || k === 'back' || k === 'view' ? { ...s, settingHelp: null } : s
  if (!(s.notice || s.powerConfirm || s.launchMode !== null)) {
    const about = aboutAction(s, k)
    if (about) return about
    const typed = searchInput(s, k)
    if (typed) return typed
    if (s.search && (k === 'menu' || k === 'pgup' || k === 'pgdn' || k === 'history' || k === 'favourites'))
      s = searchEnd(s, true)
    if (s.search && k === 'accept' && s.entries[s.choice]?.dir) {
      const path = s.entries[s.choice]!.path
      s = searchEnd(s, true)
      const found = s.entries.findIndex((e) => e.path === path)
      if (found >= 0) s = { ...s, choice: found }
    }
    if (k === 'view') {
      if (s.page === 2 && !s.helpPage) return s.category >= 0 ? { ...s, settingHelp: settingsItems(s)[s.setting]! } : s
      if (s.page === 1) return searchBegin(s)
      return s
    }
  }

  // `action_impl` (`dsstyle.c:529-582`).
  if (s.launchMode !== null) return k === 'accept' || k === 'back' ? { ...s, launchMode: null } : s
  if (s.notice) return k === 'accept' || k === 'back' ? { ...s, notice: null } : s
  if (s.powerConfirm) {
    if (k === 'back') return { ...s, powerConfirm: 0 }
    if (k === 'accept') return { ...s, powerConfirm: 0, exited: s.powerConfirm === 1 ? 'reboot' : 'shutdown' }
    return s
  }
  if (k === 'history' || k === 'favourites') return collection(rememberTab(s), k === 'history')
  if ((k === 'pgup' || k === 'pgdn') && s.page !== 0) {
    const current = s.page === 2 ? 2 : s.section === 3 ? 1 : 0
    const r = rememberTab(s)
    const dest = (current + (k === 'pgup' ? 2 : 1)) % 3
    return dest === 2 ? { ...r, previous: r.page, page: 2 } : restoreTab(r, dest)
  }
  if (s.page === 0) return home(s, k)
  if (s.page === 2) return settings(s, k)
  return browser(s, k)
}

/** Home's cursor and buttons (`dsstyle.c:534-546`). */
function home(s: State, k: Key): State {
  let hc = s.homechoice
  if (k === 'up') hc = hc >= 3 ? 1 : 0
  if (k === 'down') hc = hc === 0 ? 1 : hc < 3 ? 3 : hc
  if (k === 'left') hc = hc > 0 && hc < 3 ? 1 : hc > 3 ? hc - 1 : hc
  if (k === 'right') hc = hc > 0 && hc < 3 ? 2 : hc >= 3 && hc < 5 ? hc + 1 : hc
  let next: State = hc !== s.homechoice ? { ...s, homechoice: hc, homeFrom: s.homechoice, homeMoving: true } : s
  const games = next.homeFavourites ? next.favourites : next.recents
  const hn = games.length
  let homeRecent = next.homeRecent >= hn ? 0 : next.homeRecent
  if (hn && (k === 'pgup' || k === 'pgdn' || (hc === 0 && (k === 'left' || k === 'right')))) {
    homeRecent = (homeRecent + hn + (k === 'pgup' || k === 'left' ? -1 : 1)) % hn
  }
  next = { ...next, homeRecent }
  if (k === 'start') return next
  if (k === 'accept') {
    if (hc === 0) return hn ? { ...next, launching: games[homeRecent]! } : collection(next, !next.homeFavourites)
    if (hc === 1) return restoreTab(next, 0)
    if (hc === 2) return next.prefs.homeButton ? collection(next, next.prefs.homeButton === 2) : apps(next)
    if (hc === 3) return { ...next, previous: 0, page: 2, setting: 0, category: -1, settingsTop: 0 }
    return { ...next, powerConfirm: hc === 4 ? 1 : 2 }
  }
  if (k === 'recent') return { ...next, homeFavourites: !next.homeFavourites, homeRecent: 0 }
  if (k === 'fav') return collection(next, false)
  if (k === 'menu') return openSettings(next)
  return next
}

/** Settings, Help and the category pages (`dsstyle.c:547-571`). */
function settings(s: State, k: Key): State {
  if (s.helpPage) {
    if (k === 'back') return { ...s, helpPage: 0 }
    if (k === 'left' || k === 'right') return { ...s, helpPage: s.helpPage === 1 ? 2 : 1 }
    return s
  }
  if (s.category < 0) {
    if (k === 'up' && s.categoryChoice > 0) return { ...s, categoryChoice: s.categoryChoice - 1 }
    if (k === 'down' && s.categoryChoice < 8) return { ...s, categoryChoice: s.categoryChoice + 1 }
    if (k === 'back') {
      const back = { ...s, page: s.previous }
      if (back.page === 1 && isSystemsView(back)) {
        const refreshed = browse(back, back.here)
        const choice = s.choice < refreshed.entries.length ? s.choice : Math.max(0, refreshed.entries.length - 1)
        return { ...refreshed, choice, top: s.top <= choice ? s.top : choice, stack: s.stack }
      }
      return back
    }
    if (k === 'accept') {
      if (s.categoryChoice === 7) return { ...s, helpPage: 1 }
      if (s.categoryChoice === 8) return { ...s, aboutPage: 0 }
      return { ...s, category: s.categoryChoice, setting: 0, settingsTop: 0 }
    }
    return s
  }
  const items = settingsItems(s)
  if (k === 'up' && s.setting > 0) return { ...s, setting: s.setting - 1 }
  if (k === 'down' && s.setting + 1 < items.length) return { ...s, setting: s.setting + 1 }
  if (k === 'back') return { ...s, category: -1, settingsTop: 0 }
  const id = items[s.setting]!
  // Left and Right change the rows that cycle; the rows that act need A (`dsstyle.c:552`).
  if (k === 'accept' || ((k === 'left' || k === 'right') && (id <= SET.lcd || id >= SET.uiSound)))
    return changeSetting(s, id, k)
  return s
}

/** A list: Games, a collection, Apps, or search results (`dsstyle.c:572-581`). */
function browser(s: State, k: Key): State {
  if (k === 'menu') return openSettings(rememberTab(s))
  if (k === 'back') {
    if (!s.section && s.stack.length) {
      const frame = s.stack[s.stack.length - 1]!
      const up = browse(s, frame.here)
      return {
        ...up,
        choice: frame.choice < up.entries.length ? frame.choice : 0,
        top: frame.top,
        stack: s.stack.slice(0, -1),
      }
    }
    if (s.section === 1 || s.section === 2) return collectionBack(s)
    if (s.section === 3 && s.appsReturnSystems) return restoreTab({ ...s, appsReturnSystems: false }, 0)
    if (s.section === 3 && s.appsReturnSettings) return { ...s, page: 2, appsReturnSettings: false }
    const r = rememberTab(s)
    return r.prefs.homeEnabled ? { ...r, page: 0 } : browse(r, '')
  }
  if (k === 'accept') return launchSelected(s)
  if (k === 'fav') return toggleFavourite(s)
  if (k === 'recent') return withPrefs(s, { viewmode: (s.prefs.viewmode + 1) % 4 })
  if (k === 'start') {
    const e = s.entries[s.choice]
    return isSystemsView(s) && e?.dir && !e.app ? { ...s, launchMode: e.name } : s
  }
  if (!s.entries.length) return s
  const horizontal = effectiveView(s) === 2
  const delta =
    k === 'up'
      ? horizontal
        ? -10
        : -1
      : k === 'down'
        ? horizontal
          ? 10
          : 1
        : k === 'left'
          ? horizontal
            ? -1
            : -10
          : k === 'right'
            ? horizontal
              ? 1
              : 10
            : 0
  return delta ? positionSelection(s, delta) : s
}

export const isSystems = isSystemsView
