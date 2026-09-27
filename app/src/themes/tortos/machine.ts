import type { Button } from '../../input/keymap'
import {
  ALBUMS,
  AUTO_OFF,
  BT_DEVICES,
  CARD_SETS,
  CONSOLES,
  DIRECTIONS,
  DISPLAY_MODES,
  FAVORITES,
  HARE,
  LIBRARY,
  MUSE,
  MUSE_SORTS,
  NETWORKS,
  PLAY_MODES,
  PLAY_TIME,
  SEED_FAVORITES,
  SORTS,
  VERSION,
  autoOffLabel,
  factsFor,
  titleOf,
  trackName,
  type CardSet,
  type Cheevo,
  type Direction,
  type Favorite,
  type System,
} from './library'
import { CYAN, MUSE_GREEN } from './palette'
import { CF_WINDOW, FONT, MENU } from './spec'
import { textWidth, wrapParagraphs } from './text'

/**
 * TortOS as a state machine.
 *
 * A pure function of (state, button), so every transition can be tested without drawing anything,
 * and the theme root does only what a root does: hold the state, run the clocks, draw.
 *
 * **One back stack, popped two ways.** The launcher runs every screen as a nested loop over the
 * shelf, and two buttons leave them differently (`g_menu_closing`, `src/main.c:4325`): B leaves
 * one screen, MENU leaves every menu screen at once, back to whatever opened the first of them.
 * Here that is one stack of overlays above the shelf, and `closeMenus` pops it down to the nearest
 * screen that is not a menu - the shelf, a running game, or Muse.
 *
 * **Only the top screen is drawn.** Each of the source's loops draws the shelf and then its own
 * panel, never the panel of the screen that opened it; the keyboard is drawn over the shelf, not
 * over the menu it was opened from. `backdropOf` says what is under the top screen.
 */

/* ---- views ---------------------------------------------------------------- */

export type View =
  | 'tortos-menu'
  | 'system-menu'
  | 'wifi'
  | 'bluetooth'
  | 'play-time'
  | 'about'
  | 'controls'
  | 'hare'
  | 'box-art'
  | 'game-info'
  | 'synopsis'
  | 'cheevos'
  | 'cheevo'
  | 'keyboard'
  | 'notice'
  | 'confirm'
  | 'game'
  | 'game-menu'
  | 'slots'
  | 'muse'
  | 'muse-tracks'
  | 'now-playing'

/** What the top of the stack is when the stack is empty. */
export type Shelf = 'systems' | 'games'

/** Screens MENU closes on its way out. Everything else stops it. */
const MENU_SCREENS: ReadonlySet<View> = new Set<View>([
  'tortos-menu',
  'system-menu',
  'wifi',
  'bluetooth',
  'play-time',
  'about',
  'controls',
  'hare',
  'box-art',
  'game-info',
  'synopsis',
  'cheevos',
  'cheevo',
  'confirm',
  'game-menu',
  'slots',
])

/* ---- state ---------------------------------------------------------------- */

export interface Keyboard {
  readonly purpose: 'ra-user' | 'ra-pass' | 'ss-user' | 'ss-pass' | 'wifi'
  readonly title: string
  readonly text: string
  readonly cur: number
  /** 0 lower, 1 upper, 2 symbols. */
  readonly layer: number
  readonly row: number
  readonly col: number
  /** The user name typed on the first keyboard, carried to the second. */
  readonly user: string
}

export interface Notice {
  readonly heading: string
  readonly text: string
  readonly live: boolean
  /** How long the source leaves it up before carrying on, in ms. */
  readonly ms: number
  /** What happens when it is done. */
  readonly then: Action
}

export interface Confirm {
  readonly heading: string
  readonly msg: string
  readonly yes: string
  /** 1 on the action, 2 on Cancel - where it opens. */
  readonly sel: 1 | 2
  readonly then: Action
}

/** Something a notice or a confirm does when it is over. */
export type Action =
  | { readonly kind: 'pop' }
  | { readonly kind: 'close-menus' }
  | { readonly kind: 'notice'; readonly notice: Notice }
  | { readonly kind: 'forget'; readonly ssid: string }

export interface MuseNow {
  readonly album: number
  readonly track: number
  readonly paused: boolean
  /** Seconds into the track. */
  readonly at: number
}

export interface State {
  readonly stack: readonly View[]
  readonly shelf: Shelf
  readonly cards: CardSet
  readonly dir: Direction
  /** The focused system, as an index into `systemsOf(state)`. */
  readonly sys: number
  /** Each shelf's cursor, by system tag, as the launcher keeps one per `sysview`. */
  readonly cursor: Readonly<Record<string, number>>
  /** The last move's direction per shelf, which a two-card ring needs. */
  readonly lastDir: Readonly<Record<string, -1 | 0 | 1>>
  readonly favorites: readonly Favorite[]
  readonly sort: Readonly<Record<string, number>>
  readonly dmode: Readonly<Record<string, number>>
  readonly autoOff: number
  readonly audio: 'auto' | 'speaker'
  readonly wifiOn: boolean
  /** The network joined, or null. */
  readonly wifiNet: string | null
  readonly forgotten: readonly string[]
  readonly btOn: boolean
  readonly btConnected: string | null
  readonly raUser: string | null
  /** Each menu screen's cursor. */
  readonly sel: Readonly<Partial<Record<View, number>>>
  readonly controlsPage: number
  readonly playWindow: number
  readonly playBySystem: boolean
  readonly cheevo: number
  readonly museSort: number
  readonly now: MuseNow | null
  readonly playMode: number
  /** The game the in-game screens are over, as a shelf tag and a file. */
  readonly running: Favorite | null
  readonly slotSaving: boolean
  readonly slot: number
  readonly slotsHave: readonly boolean[]
  readonly keyboard: Keyboard | null
  readonly notice: Notice | null
  readonly confirm: Confirm | null
  readonly empty: boolean
}

export interface Seed {
  readonly stack?: readonly View[] | undefined
  readonly shelf?: Shelf | undefined
  readonly cards?: CardSet | undefined
  readonly dir?: Direction | undefined
  /** The focused system, by tag. */
  readonly system?: string | undefined
  /** Cursors by tag. */
  readonly cursor?: Readonly<Record<string, number>> | undefined
  readonly sel?: Readonly<Partial<Record<View, number>>> | undefined
  readonly wifiOn?: boolean | undefined
  readonly wifiNet?: string | null | undefined
  readonly now?: MuseNow | null | undefined
  readonly running?: Favorite | null | undefined
  readonly slotSaving?: boolean | undefined
  readonly controlsPage?: number | undefined
  readonly keyboard?: Partial<Keyboard> | undefined
  readonly notice?: Notice | undefined
  readonly confirm?: Confirm | undefined
  readonly cheevo?: number | undefined
  readonly empty?: boolean | undefined
}

export function initialState(seed: Seed = {}): State {
  const base: State = {
    stack: seed.stack ?? [],
    shelf: seed.shelf ?? 'systems',
    cards: seed.cards ?? 'classic',
    dir: seed.dir ?? 'horizontal',
    sys: 0,
    cursor: seed.cursor ?? {},
    lastDir: {},
    favorites: SEED_FAVORITES,
    sort: {},
    dmode: {},
    autoOff: 3,
    audio: 'auto',
    wifiOn: seed.wifiOn ?? false,
    wifiNet: seed.wifiNet ?? null,
    forgotten: [],
    btOn: true,
    btConnected: null,
    raUser: null,
    sel: seed.sel ?? {},
    controlsPage: seed.controlsPage ?? 1,
    playWindow: 0,
    playBySystem: false,
    cheevo: seed.cheevo ?? 0,
    museSort: 0,
    now: seed.now ?? null,
    playMode: 0,
    running: seed.running ?? null,
    slotSaving: seed.slotSaving ?? true,
    slot: 0,
    slotsHave: [true, true, true, false, false, false, false],
    keyboard: seed.keyboard ? { ...newKeyboard('ra-user'), ...seed.keyboard } : null,
    notice: seed.notice ?? null,
    confirm: seed.confirm ?? null,
    empty: seed.empty ?? false,
  }
  const systems = systemsOf(base)
  const at = Math.max(0, systems.findIndex((s) => s.tag === seed.system))
  const withSys = { ...base, sys: at }
  return withSys.stack.includes('slots') ? { ...withSys, slot: firstSlot(withSys, withSys.slotSaving) } : withSys
}

/** The top of the stack, or null for the shelf itself. */
export function currentView(state: State): View | null {
  return state.stack.at(-1) ?? null
}

const push = (state: State, view: View): State => ({ ...state, stack: [...state.stack, view] })
const pop = (state: State): State => ({ ...state, stack: state.stack.slice(0, -1) })

/** MENU: out of every menu screen, down to what opened the first (`menu_leaving`). */
export function closeMenus(state: State): State {
  let stack = state.stack
  while (stack.length && MENU_SCREENS.has(stack.at(-1)!)) stack = stack.slice(0, -1)
  return { ...state, stack }
}

/* ---- the card ------------------------------------------------------------- */

export interface ShelfGame {
  readonly name: string
  readonly title: string
  /** The system the game belongs to - itself, except on Favorites. */
  readonly owner: System
}

/** Muse's cards are albums: the album's name is the title, the artist the name. */
function museCards(state: State): ShelfGame[] {
  const order = ALBUMS.map((a, i) => ({ a, i }))
  if (state.museSort === 1) order.sort((x, y) => x.a.name.localeCompare(y.a.name))
  return order.map(({ a }) => ({ name: a.artist, title: a.name, owner: MUSE }))
}

/** The album a Muse card is, as an index into `ALBUMS`. */
export function albumOf(state: State, card: number): number {
  const cards = museCards(state)
  const c = cards[card]
  return c ? ALBUMS.findIndex((a) => a.name === c.title && a.artist === c.name) : -1
}

export function gamesOf(state: State, sys: System): readonly ShelfGame[] {
  if (sys.tag === 'MUSE') return museCards(state)
  if (sys.tag === 'FAV') {
    return state.favorites
      .map((f) => ({ name: f.name, title: titleOf(f.name), owner: CONSOLES.find((c) => c.tag === f.tag)! }))
      .sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }))
  }
  return (LIBRARY[sys.tag] ?? []).map((g) => ({ ...g, owner: sys }))
}

/**
 * The systems on the shelf: Favorites first when it has anything, the consoles that have games,
 * and Muse last. Empty systems are hidden (`src/main.c:9194`).
 */
export function systemsOf(state: State): readonly System[] {
  if (state.empty) return []
  const out: System[] = []
  if (state.favorites.length) out.push(FAVORITES)
  for (const c of CONSOLES) if ((LIBRARY[c.tag] ?? []).length) out.push(c)
  out.push(MUSE)
  return out
}

export const museOpen = (state: State) => state.stack.includes('muse')

/** The system the shelf is showing: Muse while Muse is open, the focused one otherwise. */
export function shelfSystem(state: State): System | null {
  if (museOpen(state)) return MUSE
  return systemsOf(state)[state.sys] ?? null
}

export const cursorOf = (state: State, sys: System) => state.cursor[sys.tag] ?? 0

export function focusedGame(state: State): ShelfGame | null {
  const sys = shelfSystem(state)
  if (!sys) return null
  return gamesOf(state, sys)[cursorOf(state, sys)] ?? null
}

/** The shelf screen actually drawn: Muse is always its own games shelf. */
export function shelfScreen(state: State): Shelf {
  return museOpen(state) ? 'games' : state.shelf
}

/** What is under the top screen. */
export function backdropOf(state: State): 'shelf' | 'game' | 'none' {
  const top = currentView(state)
  if (top === 'now-playing') return 'none'
  const muse = state.stack.lastIndexOf('muse')
  const game = state.stack.lastIndexOf('game')
  if (game > muse) return 'game'
  return 'shelf'
}

/* ---- accents -------------------------------------------------------------- */

/**
 * Which colour a screen wears, by what it belongs to (`menu_draw`'s `accent`).
 *
 * TortOS's own screens are cyan. A system's menu and the achievement list follow the shelf's
 * live tint, so they are the tint's value at the moment - the root passes that in. Game info is the
 * *owning* system's, which on Favorites is not the shelf's. Muse is green everywhere.
 */
export function accentOf(state: State, view: View, tint: number): number {
  switch (view) {
    case 'system-menu':
    case 'cheevos':
    case 'cheevo':
    case 'game-menu':
    case 'slots':
      return tint
    case 'game-info':
    case 'synopsis':
      return focusedGame(state)?.owner.accent ?? tint
    case 'muse-tracks':
    case 'now-playing':
      return MUSE_GREEN
    default:
      return CYAN
  }
}

/* ---- panel rows ----------------------------------------------------------- */

/**
 * One row of a panel, as `menu_row` has them: a label and value, a rule, a centred note or a
 * left-aligned line of prose. `live` is whether the cursor can rest there, and whether the row is
 * drawn a step brighter.
 */
export type Row =
  | { readonly kind: 'row'; readonly label: string; readonly value?: string | undefined; readonly live: boolean; readonly color?: number | undefined }
  | { readonly kind: 'rule' }
  | { readonly kind: 'hr' }
  | { readonly kind: 'note'; readonly label: string; readonly live?: boolean | undefined }
  | { readonly kind: 'body'; readonly label: string }

const row = (label: string, value: string | undefined, live: boolean, color?: number): Row => ({
  kind: 'row',
  label,
  value,
  live,
  color,
})
const RULE: Row = { kind: 'rule' }
const note = (label: string, live = false): Row => ({ kind: 'note', label, live })

export const isLive = (r: Row) => (r.kind === 'row' ? r.live : r.kind === 'note' ? !!r.live : false)

export interface PanelModel {
  readonly heading: string | null
  readonly rows: readonly Row[]
  /** -1 for a card with no cursor. */
  readonly sel: number
  /** The content width, or 0 to size to the rows. */
  readonly fixedW: number
  /** The cursor rests on every row, whatever `live` says - the achievement list. */
  readonly visitsAll: boolean
  /** Where the rows start repeating, for a body that scrolls through. */
  readonly loopAt: number
}

const NEEDS_WIFI = (on: boolean) => (on ? undefined : 'needs Wi-Fi')
const connected = (state: State) => state.wifiOn && state.wifiNet !== null

function tortosRows(state: State): Row[] {
  const net = connected(state)
  const wifi = net ? state.wifiNet! : state.wifiOn ? 'not connected' : 'off'
  const dest = state.btConnected ? 'bluetooth' : 'speaker'
  return [
    row('Play Time', undefined, true),
    row('Wi-Fi', wifi, true),
    row('Bluetooth', state.btConnected ?? 'not connected', true),
    row('Audio Output', state.audio === 'auto' ? `auto (${dest})` : 'speaker', true),
    row('Over The Hare', NEEDS_WIFI(net), net),
    row('Auto Off', autoOffLabel(AUTO_OFF[state.autoOff]!), true),
    row('UI Theme', CARD_SETS.find((c) => c.id === state.cards)!.name, true),
    row('UI Direction', DIRECTIONS.find((d) => d.id === state.dir)!.name, true),
    row('Box Art', NEEDS_WIFI(net), net),
    row('Cheevos', state.raUser ?? 'sign in', true),
    // This build has no ScreenScraper developer key, which is what `readme-menu.png`'s panel
    // width says: it is this row that makes the shelf menus 835 wide rather than 800.
    row('ScreenScraper', 'not in this build', false),
    row('Controls', undefined, true),
    row('About TortOS', undefined, true),
  ]
}

/** The row indices `sysmenu_key` acts on, by label rather than by enum. */
const TORTOS_ROW = {
  playTime: 0,
  wifi: 1,
  bt: 2,
  audio: 3,
  hare: 4,
  autoOff: 5,
  theme: 6,
  dir: 7,
  boxArt: 8,
  cheevos: 9,
  ss: 10,
  controls: 11,
  about: 12,
} as const

function systemMenuRows(state: State, sys: System): Row[] {
  const net = connected(state)
  const n = gamesOf(state, sys).length
  if (sys.tag === 'FAV') return [row('Games', String(n), false), row('Sort By', SORTS[state.sort[sys.tag] ?? 0], true)]
  if (sys.tag === 'MUSE')
    return [
      row('Albums', String(n), false),
      row('Sort By', MUSE_SORTS[state.museSort], true),
      row('Album Art', NEEDS_WIFI(net), net),
      row('Rescan Folder', undefined, true),
    ]
  return [
    row('Games', String(n), false),
    row('Core', sys.core, false),
    row('Sort By', SORTS[state.sort[sys.tag] ?? 0], true),
    row('Display Mode', DISPLAY_MODES[state.dmode[sys.tag] ?? 0], true),
    row('Box Art', NEEDS_WIFI(net), net),
    row('Rescan Folder', undefined, true),
  ]
}

/** The system a system menu is for: Muse's while Muse is open, the shelf's otherwise. */
export function menuSystem(state: State): System | null {
  return shelfSystem(state)
}

const strength = (dbm: number) => (dbm >= -60 ? 'strong' : dbm >= -72 ? 'good' : 'weak')

export function networksOf(state: State) {
  return NETWORKS.map((n) => ({ ...n, saved: n.saved && !state.forgotten.includes(n.ssid) }))
}

function wifiRows(state: State): Row[] {
  const rows: Row[] = [row('Wi-Fi', state.wifiOn ? 'on' : 'off', true)]
  const nets = state.wifiOn ? networksOf(state) : networksOf(state).filter((n) => n.saved)
  for (const n of nets) {
    const st = state.wifiNet === n.ssid ? ' - connected' : n.saved ? ' - saved' : n.secured ? '' : ' - open'
    rows.push(row(n.ssid, state.wifiOn ? `${strength(n.dbm)}${st}` : 'saved', true))
  }
  rows.push(RULE)
  if (!state.wifiOn) rows.push(note('Turn Wi-Fi on to scan'))
  else rows.push(note(nets.some((n) => n.saved) ? 'Y: rescan   X: forget' : 'Y: rescan'))
  return rows
}

function btFooter(state: State, sel: number): string {
  if (!state.btOn) return 'A: turn on'
  const i = sel - 1
  if (i < 0) return 'A: turn off   Y: search'
  const d = BT_DEVICES[i]
  if (!d) return 'Y: search'
  if (state.btConnected === d.name) return 'A: disconnect   Y: search   X: forget'
  if (d.paired) return 'A: connect   Y: search   X: forget'
  return 'A: pair   Y: search'
}

function btRows(state: State): Row[] {
  const rows: Row[] = [row('Bluetooth', state.btOn ? 'on' : 'off', true)]
  if (state.btOn)
    for (const d of BT_DEVICES)
      rows.push(row(d.name, state.btConnected === d.name ? 'connected' : d.paired ? 'paired' : 'in range', true))
  rows.push(RULE, note(btFooter(state, state.sel['bluetooth'] ?? 0)))
  return rows
}

/** `stats_format` (`src/stats.c:322`). */
export function duration(secs: number): string {
  if (secs <= 0) return 'never'
  if (secs < 60) return `${secs}s`
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0) return `${m}m ${secs % 60}s`
  return `${h}h ${m}m`
}

export const PLAY_WINDOWS = ['All Time', 'This Year', 'This Month', 'This Week', 'Today'] as const

/** Play Time's rows, by game or by system, longest first. Only All Time has history in it. */
function playEntries(state: State) {
  const all = state.playWindow === 0 ? [...PLAY_TIME] : state.playWindow === 4 ? PLAY_TIME.filter((p) => p.ago === 'today') : PLAY_TIME.filter((p) => p.ago !== '1mo ago' && (state.playWindow < 3 || !p.ago.endsWith('w ago')))
  if (!state.playBySystem) return all.sort((a, b) => b.secs - a.secs).map((p) => ({ ...p, label: titleOf(p.name) }))
  const by = new Map<string, (typeof all)[number] & { label: string }>()
  for (const p of all) {
    const prev = by.get(p.tag)
    const label = CONSOLES.find((c) => c.tag === p.tag)?.name ?? p.tag
    by.set(p.tag, prev ? { ...prev, secs: prev.secs + p.secs, launches: prev.launches + p.launches, longest: Math.max(prev.longest, p.longest) } : { ...p, label })
  }
  return [...by.values()].sort((a, b) => b.secs - a.secs)
}

/**
 * How many games Play Time lists at once (`menu_list_fit(1, 1, 2)`): what is left of the panel
 * after the window row, the rule and two footer notes, so the footer is never scrolled away.
 */
function playVisible(): number {
  const head = FONT.label + MENU.pad
  let avail = 768 - MENU.margin * 2 - (head + Math.trunc(MENU.pad / 2)) - MENU.pad
  avail -= MENU.rowH + MENU.ruleH + 2 * MENU.noteH
  return avail < MENU.rowH ? 1 : Math.trunc(avail / MENU.rowH)
}

/** The first game listed: the list scrolls only when the cursor would leave it. */
const playTop = (cursor: number) => Math.max(0, cursor - playVisible() + 1)

function playRows(state: State): Row[] {
  const entries = playEntries(state)
  const total = entries.reduce((s, e) => s + e.secs, 0)
  const launches = entries.reduce((s, e) => s + e.launches, 0)
  const cursor = state.sel['play-time'] ?? 0
  const rows: Row[] = [row(PLAY_WINDOWS[state.playWindow]!, `${duration(total)} · ${launches} launch${launches === 1 ? '' : 'es'}`, false)]
  if (!entries.length) {
    rows.push(row('Nothing played yet', undefined, false))
  } else {
    const top = playTop(cursor)
    for (const e of entries.slice(top, top + playVisible())) rows.push(row(e.label, duration(e.secs), true))
    const at = entries[cursor] ?? entries[0]!
    rows.push(RULE, note(`${at.launches} launch${at.launches === 1 ? '' : 'es'}  ·  longest ${duration(at.longest)}  ·  ${at.ago}`))
  }
  rows.push(note(state.playBySystem ? 'A: go    Y: by game    L/R: window' : 'A: go    Y: by system    L/R: window'))
  return rows
}

export const CONTROLS_PAGES = ['Moving', 'On the shelf', 'In a game', 'In Muse', 'Anywhere'] as const

/** `ctl_rows` (`src/controls.c`). The shelf pages follow UI Direction. */
function controlsRows(state: State): Row[] {
  const cubic = state.dir === 'cubic'
  const f = (a: string, b: string) => row(a, b, false)
  let rows: Row[]
  switch (state.controlsPage) {
    case 0:
      rows = cubic
        ? [f('Up/Down', 'Console'), f('Left/Right', 'Game')]
        : state.dir === 'vertical'
          ? [f('Up/Down', 'Move'), f('Left/Right', 'Jump by letter')]
          : [f('Left/Right', 'Move'), f('Up/Down', 'Jump by letter')]
      rows.push(f('L1/R1', 'A screenful'))
      break
    case 1:
      rows = [
        f('A', cubic ? 'Start the game' : 'Open or play'),
        f('B', cubic ? "Console's menu" : 'Back'),
        f('X', 'Game details'),
        f('Y', 'Favorite'),
      ]
      break
    case 2:
      rows = [
        f('MENU', 'Pause and menu'),
        f('SELECT', 'Muse, in that menu'),
        f('X/Y', 'Turbo A/B *'),
        f('POWER', 'Save and turn off'),
        note('* Genesis and SNES: not turbo'),
      ]
      break
    case 3:
      rows = [f('A', 'Play or pause'), f('L1/R1', 'Track'), f('Left/Right', 'Ten seconds'), f('Y', 'Mode'), f('SELECT', 'Close Muse')]
      break
    default:
      rows = [f('SELECT', 'Muse'), f('MENU', 'Settings'), f('Volume rocker', 'Sound'), f('F1/F2', 'Brightness'), f('POWER', 'Turn off')]
  }
  rows.push(RULE, note('Left/Right: more'))
  return rows
}

function gameInfoRows(state: State): Row[] {
  const g = focusedGame(state)
  if (!g) return []
  const facts = factsFor(g.owner.tag, g.name)
  const scraped = facts.year !== undefined || facts.synopsis !== undefined
  const net = connected(state)
  const rows: Row[] = []
  if (scraped) rows.push(row('Synopsis', facts.synopsis ? undefined : 'none', !!facts.synopsis))
  if (facts.year) rows.push(row('Year', facts.year, false))
  if (facts.genre) rows.push(row('Genre', facts.genre, false))
  const c = facts.cheevos
  rows.push(row('Cheevos', c ? `${c.earned}/${c.total}, ${c.points}/${c.of} points` : 'none', !!c))
  // Every game in the sample card has art on the device's side of the story: the reference frame
  // offers Replace, and a generated card is the mockup's stand-in for that art, not its absence.
  rows.push(row('Replace Box Art', NEEDS_WIFI(net), net))
  return rows
}

export function cheevoSet(state: State): { title: string; set: readonly Cheevo[] } {
  const g = state.running ? { owner: CONSOLES.find((c) => c.tag === state.running!.tag)!, name: state.running.name } : focusedGame(state)
  if (!g) return { title: '', set: [] }
  const facts = factsFor(g.owner.tag, g.name)
  return { title: facts.setTitle ?? titleOf(g.name), set: facts.set ?? [] }
}

function cheevosHeading(state: State): string {
  const { title, set } = cheevoSet(state)
  const g = state.running ?? focusedGame(state)
  const c = g ? factsFor('owner' in g ? g.owner.tag : g.tag, g.name).cheevos : undefined
  const earned = c?.earned ?? set.filter((s) => s.earned).length
  const total = c?.total ?? set.length
  return `${title}\n${earned}/${total} cheevos   ${c?.points ?? 0}/${c?.of ?? 0} points`
}

/** `wrap_text` over the menu font at the panel's content width. */
const wrapBody = (text: string) => wrapParagraphs(text, FONT.menu, MENU.shelfContent)

/** How many prose lines fit a panel that is nothing but prose (`menu_notes_fit`). */
function notesFit(): number {
  const head = FONT.label + MENU.pad
  const avail = 768 - MENU.margin * 2 - (head + Math.trunc(MENU.pad / 2)) - MENU.pad
  return MENU.noteH > 0 && avail > MENU.noteH ? Math.trunc(avail / MENU.noteH) : 1
}

/** `syn_layout`: a synopsis too tall for the panel is laid out twice, to scroll through. */
function synopsisRows(text: string): { rows: Row[]; loopAt: number } {
  const lines = wrapBody(text).map((l): Row => ({ kind: 'body', label: l }))
  if (lines.length <= notesFit()) return { rows: lines, loopAt: 0 }
  const gap: Row[] = [{ kind: 'body', label: '' }, { kind: 'body', label: '' }, { kind: 'hr' }, { kind: 'body', label: '' }, { kind: 'body', label: '' }]
  return { rows: [...lines, ...gap, ...lines], loopAt: lines.length + gap.length }
}

function museTrackRows(state: State): Row[] {
  const album = ALBUMS[albumOf(state, cursorOf(state, MUSE))]
  if (!album) return []
  const playing = state.now && ALBUMS[state.now.album] === album ? state.now : null
  const rows: Row[] = album.tracks.map((t, i) =>
    row(trackName(t.name), playing && playing.track === i ? (playing.paused ? 'paused' : 'playing') : '', true),
  )
  if (state.now) {
    const a = ALBUMS[state.now.album]!
    const t = a.tracks[state.now.track]!
    rows.push(RULE, note(`${state.now.paused ? 'Paused: ' : ''}${trackName(t.name)}  -  ${a.artist}   ${mmss(state.now.at)} / ${mmss(t.len)}`))
  }
  return rows
}

export const mmss = (sec: number) => {
  const t = Math.max(0, Math.round(sec))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

function gameMenuRows(state: State): Row[] {
  const g = state.running
  const facts = g ? factsFor(g.tag, g.name) : {}
  const c = facts.cheevos
  return [
    row('Continue', undefined, true),
    row('Save', undefined, true),
    row('Load', undefined, true),
    row('Display', DISPLAY_MODES[state.dmode[g?.tag ?? ''] ?? 0], true),
    row('Cheevos', c ? `${c.earned} / ${c.total}` : 'none', !!facts.set?.length),
    row('Reset', undefined, true),
    row('Quit', undefined, true),
  ]
}

/** The widest a shelf menu gets, which is what fixes their width (`menu_shelf_width`). */
function measureRows(rows: readonly Row[], heading: string | null): number {
  const twoCol = rows.some((r) => r.kind === 'row' && r.value !== undefined)
  let w = 0
  for (const r of rows) {
    if (r.kind === 'rule' || r.kind === 'hr') continue
    let rw = textWidth(r.label, FONT.menu)
    if (twoCol && r.kind === 'row' && r.value !== undefined) rw += MENU.gap + textWidth(r.value, FONT.menu)
    w = Math.max(w, rw)
  }
  if (heading) for (const h of heading.split('\n')) w = Math.max(w, textWidth(h, FONT.label))
  return w
}

/**
 * The shelf menus' shared width (`menu_shelf_width`): the widest row any shelf menu can show, so
 * the panel never resizes while a value is cycled on it. On the device that took the reference
 * frames the widest is ScreenScraper's "not in this build", and the panel in `readme-menu.png` is
 * 835 wide. The rule measures 3px wider than that here - see `text.ts` on hinting - so the
 * reference's own measurement is used, and the rule is kept beside it as the check that it is
 * still the right row.
 */
export const SHELF_MENU_W = MENU.shelfContent

/** What the rule would measure, from the rows themselves. Asserted near `SHELF_MENU_W` in the test. */
export function measuredShelfWidth(): number {
  return Math.max(
    MENU.stdContent,
    measureRows(tortosRows(initialState()), 'TortOS'),
    ...CONSOLES.flatMap((c) =>
      DISPLAY_MODES.map((_, k) => measureRows(systemMenuRows({ ...initialState(), dmode: { [c.tag]: k } }, c), c.name)),
    ),
  )
}

/** `menu_std_width`. */
const STD_W = SHELF_MENU_W

export function panelOf(state: State, view: View): PanelModel {
  const sel = state.sel[view] ?? 0
  const base = { sel, fixedW: STD_W, visitsAll: false, loopAt: 0 }
  switch (view) {
    case 'tortos-menu':
      return { ...base, heading: 'TortOS', rows: tortosRows(state), fixedW: SHELF_MENU_W }
    case 'system-menu': {
      const sys = menuSystem(state)!
      return { ...base, heading: sys.name, rows: systemMenuRows(state, sys), fixedW: SHELF_MENU_W }
    }
    case 'wifi':
      return { ...base, heading: 'Wi-Fi', rows: wifiRows(state) }
    case 'bluetooth':
      return { ...base, heading: 'Bluetooth', rows: btRows(state) }
    case 'play-time':
      return { ...base, heading: 'Play Time', rows: playRows(state), sel: playEntries(state).length ? sel - playTop(sel) + 1 : -1 }
    case 'about':
      return {
        ...base,
        heading: 'About TortOS',
        sel: -1,
        rows: [
          row('Version', VERSION, false),
          row('Address', connected(state) ? HARE.address : 'not connected', false),
          row('Battery', '82%', false),
          row('Awake for', '0h 42m', false),
        ],
      }
    case 'controls':
      return { ...base, heading: `Controls: ${CONTROLS_PAGES[state.controlsPage]}`, rows: controlsRows(state), sel: -1 }
    case 'hare':
      return {
        ...base,
        heading: `${HARE.address}\nPIN ${HARE.pin}`,
        sel: -1,
        rows: [row('Browsers', HARE.browsers, false), row('Transferred', HARE.transferred, false), row('Now', HARE.now, false)],
      }
    case 'box-art':
      return {
        ...base,
        heading: 'Box Art\nDone',
        sel: -1,
        rows: [row('Systems', '11 of 11', false), row('Art', '0 found, 0 missing, 41 already', false), row('B to close', undefined, false)],
      }
    case 'game-info':
      return { ...base, heading: focusedGame(state)?.title ?? '', rows: gameInfoRows(state) }
    case 'synopsis': {
      const g = focusedGame(state)
      const text = g ? (factsFor(g.owner.tag, g.name).synopsis ?? '') : ''
      const { rows, loopAt } = synopsisRows(text)
      return { ...base, heading: g?.title ?? '', rows, sel: -1, loopAt }
    }
    case 'cheevos': {
      const { set } = cheevoSet(state)
      return {
        ...base,
        heading: cheevosHeading(state),
        rows: set.map((c) => row(c.title, String(c.points), c.earned, c.earned ? CYAN : undefined)),
        sel: state.cheevo,
        visitsAll: true,
      }
    }
    case 'cheevo': {
      const c = cheevoSet(state).set[state.cheevo]
      if (!c) return { ...base, heading: '', rows: [], sel: -1 }
      const lines = wrapBody(c.desc || 'The set carries no description.')
      return {
        ...base,
        heading: c.title,
        sel: -1,
        rows: [
          ...lines.map((l) => note(l, true)),
          RULE,
          row('Points', String(c.points), true),
          row('Status', c.earned ? 'Earned' : 'Not earned', true, c.earned ? CYAN : undefined),
        ],
      }
    }
    case 'notice':
      return { ...base, heading: state.notice?.heading ?? '', rows: [row(state.notice?.text ?? '', undefined, state.notice?.live ?? false)], sel: -1, fixedW: 0 }
    case 'confirm': {
      const c = state.confirm
      return {
        ...base,
        heading: c?.heading ?? '',
        rows: [row(c?.msg ?? '', undefined, false), row(c?.yes ?? '', undefined, true), row('Cancel', undefined, true)],
        sel: c?.sel ?? 2,
        fixedW: 0,
      }
    }
    case 'game-menu': {
      const rows = gameMenuRows(state)
      const w = Math.max(...DISPLAY_MODES.map((_, k) => measureRows(gameMenuRows({ ...state, dmode: { [state.running?.tag ?? '']: k } }), null)))
      return { ...base, heading: null, rows, fixedW: w }
    }
    case 'muse-tracks': {
      const album = ALBUMS[albumOf(state, cursorOf(state, MUSE))]
      return { ...base, heading: album ? `${album.name}\n${album.artist}` : '', rows: museTrackRows(state) }
    }
    default:
      return { ...base, heading: null, rows: [], sel: -1 }
  }
}

/** `menu_step_sel` (`src/menu.c`): the next live row, wrapping. */
export function stepSel(rows: readonly Row[], sel: number, dir: 1 | -1): number {
  const n = rows.length
  let k = sel
  for (let i = 0; i < n; i++) {
    k = (k + dir + n) % n
    if (isLive(rows[k]!)) return k
  }
  return sel
}

/* ---- the keyboard --------------------------------------------------------- */

/** `LAYER` (`src/keyboard.c:38-53`): ten keys by four rows, three layers. */
export const KEY_LAYERS = [
  '1234567890abcdefghijklmnopqrstuvwxyz-_.@',
  '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ-_.@',
  '1234567890!@#$%^&*()=+[]{}\\|/~;:\'",.<>?`',
] as const

const KB_TITLES: Record<Keyboard['purpose'], string> = {
  'ra-user': 'RetroAchievements User',
  'ra-pass': 'Password',
  'ss-user': 'ScreenScraper User',
  'ss-pass': 'Password',
  wifi: 'Password',
}

/** A fresh keyboard, opened on the letters rather than the digits. */
export function newKeyboard(purpose: Keyboard['purpose'], title = KB_TITLES[purpose], user = ''): Keyboard {
  return { purpose, title, text: '', cur: 0, layer: 0, row: 1, col: 0, user }
}

function reduceKeyboard(state: State, k: Keyboard, button: Button): State {
  const space = 4
  const set = (next: Partial<Keyboard>) => ({ ...state, keyboard: { ...k, ...next } })
  const cols = k.row === space ? 1 : 10
  switch (button) {
    case 'left':
      return set({ col: (k.col + cols - 1) % cols })
    case 'right':
      return set({ col: (k.col + 1) % cols })
    case 'up': {
      const r = (k.row + space) % (space + 1)
      return set({ row: r, col: r === space ? 0 : k.col })
    }
    case 'down': {
      const r = (k.row + 1) % (space + 1)
      return set({ row: r, col: r === space ? 0 : k.col })
    }
    case 'l':
      return set({ cur: Math.max(0, k.cur - 1) })
    case 'r':
      return set({ cur: Math.min(k.text.length, k.cur + 1) })
    case 'a': {
      const ch = k.row === space ? ' ' : KEY_LAYERS[k.layer]![k.row * 10 + k.col]!
      return set({ text: k.text.slice(0, k.cur) + ch + k.text.slice(k.cur), cur: k.cur + 1 })
    }
    case 'b':
      return k.cur > 0 ? set({ text: k.text.slice(0, k.cur - 1) + k.text.slice(k.cur), cur: k.cur - 1 }) : state
    case 'x':
      return set({ layer: k.layer === 1 ? 0 : 1 })
    case 'y':
      return set({ layer: k.layer === 2 ? 0 : 2 })
    case 'menu':
      return { ...pop(state), keyboard: null }
    case 'start':
      return acceptKeyboard(state, k)
    default:
      return state
  }
}

/** START on the keyboard: on to the password, or signed in (`ra_signin_screen`). */
function acceptKeyboard(state: State, k: Keyboard): State {
  const closed = { ...pop(state), keyboard: null }
  if (!k.text) return closed
  switch (k.purpose) {
    case 'ra-user':
      return { ...state, keyboard: newKeyboard('ra-pass', undefined, k.text) }
    case 'ss-user':
      return { ...state, keyboard: newKeyboard('ss-pass', undefined, k.text) }
    case 'ra-pass':
      return showNotice({ ...closed, raUser: k.user }, {
        heading: 'RetroAchievements',
        text: 'Signing in...',
        live: false,
        ms: 900,
        then: { kind: 'notice', notice: { heading: 'RetroAchievements', text: `Signed in as ${k.user}`, live: true, ms: 1800, then: { kind: 'pop' } } },
      })
    case 'ss-pass':
      return closed
    case 'wifi':
      return showNotice({ ...closed, wifiNet: k.title }, {
        heading: 'Wi-Fi',
        text: 'Connecting...',
        live: false,
        ms: 900,
        then: { kind: 'notice', notice: { heading: 'Wi-Fi', text: `Connected to ${k.title}`, live: true, ms: 1400, then: { kind: 'pop' } } },
      })
  }
}

/* ---- notices -------------------------------------------------------------- */

export function showNotice(state: State, notice: Notice): State {
  return { ...push(state, 'notice'), notice }
}

/**
 * A notice's time is up. The source blocks for its duration and carries on, so the mockup's clock
 * lives in the root and lands here; a press does the same, so a still of a notice is never a trap.
 */
export function finishNotice(state: State): State {
  const n = state.notice
  if (currentView(state) !== 'notice' || !n) return state
  const after = { ...pop(state), notice: null }
  return runAction(after, n.then)
}

function runAction(state: State, action: Action): State {
  switch (action.kind) {
    case 'pop':
      return state
    case 'close-menus':
      return closeMenus(state)
    case 'notice':
      return showNotice(state, action.notice)
    case 'forget': {
      const forgotten = [...state.forgotten, action.ssid]
      return showNotice({ ...state, forgotten, wifiNet: state.wifiNet === action.ssid ? null : state.wifiNet }, {
        heading: 'Wi-Fi',
        text: `Forgot ${action.ssid}`,
        live: true,
        ms: 1400,
        then: { kind: 'pop' },
      })
    }
  }
}

/* ---- the save carousel ---------------------------------------------------- */

/** Save opens on the first empty slot, or the last; Load on the first with a save. */
function firstSlot(state: State, saving: boolean): number {
  if (saving) {
    const empty = state.slotsHave.findIndex((h, i) => i >= 1 && !h)
    return empty < 0 ? 6 : empty
  }
  return Math.max(0, state.slotsHave.findIndex(Boolean))
}

/* ---- the reducer ---------------------------------------------------------- */

const moveCursor = (state: State, sys: System, to: number, dir: -1 | 0 | 1): State => ({
  ...state,
  cursor: { ...state.cursor, [sys.tag]: to },
  lastDir: { ...state.lastDir, [sys.tag]: dir },
})

/** The first alphanumeric character, upper-cased (`shelf_initial`). */
const initialOf = (s: string) => (s.match(/[A-Za-z0-9]/)?.[0] ?? '').toUpperCase()

/** `shelf_letter_jump` (`src/main.c:9073`). Muse jumps by artist. */
export function letterJump(games: readonly ShelfGame[], cur: number, dir: 1 | -1, byName: boolean): number {
  const n = games.length
  const key = (i: number) => initialOf(byName ? games[i]!.name : games[i]!.title)
  if (n <= 1) return cur
  const c0 = key(cur)
  const groupStart = (idx: number) => {
    const c = key(idx)
    let i = idx
    for (;;) {
      const p = (i - 1 + n) % n
      if (p === idx) return idx
      if (key(p) !== c) break
      i = p
    }
    return i
  }
  if (dir > 0) {
    for (let i = 1; i < n; i++) {
      const k = (cur + i) % n
      if (key(k) !== c0) return k
    }
    return cur
  }
  const g = groupStart(cur)
  if (g !== cur) return g
  const prev = (cur - 1 + n) % n
  if (key(prev) === c0) return cur
  return groupStart(prev)
}

/** A shelf's own keys: step, letter jump, and a screenful (`update_games`). */
function moveOnShelf(state: State, sys: System, button: Button, vertical: boolean): State | null {
  const games = gamesOf(state, sys)
  const n = games.length
  if (!n) return null
  const cur = cursorOf(state, sys)
  const back = vertical ? 'down' : 'left'
  const fwd = vertical ? 'up' : 'right'
  const jup = vertical ? 'left' : 'up'
  const jdn = vertical ? 'right' : 'down'
  if (button === back) return moveCursor(state, sys, (cur - 1 + n) % n, -1)
  if (button === fwd) return moveCursor(state, sys, (cur + 1) % n, 1)
  if (button === jdn) return moveCursor(state, sys, letterJump(games, cur, 1, sys.tag === 'MUSE'), 0)
  if (button === jup) return moveCursor(state, sys, letterJump(games, cur, -1, sys.tag === 'MUSE'), 0)
  if (button === 'l') return moveCursor(state, sys, (((cur - CF_WINDOW) % n) + n) % n, -1)
  if (button === 'r') return moveCursor(state, sys, (cur + CF_WINDOW) % n, 1)
  return null
}

/** Y on the shelf: mark or unmark the focused game, and rebuild Favorites under the cursor. */
function toggleFavorite(state: State): State {
  const g = focusedGame(state)
  if (!g || g.owner.tag === 'MUSE') return state
  const on = state.favorites.some((f) => f.tag === g.owner.tag && f.name === g.name)
  const favorites = on
    ? state.favorites.filter((f) => !(f.tag === g.owner.tag && f.name === g.name))
    : [...state.favorites, { tag: g.owner.tag, name: g.name }]
  const before = shelfSystem(state)
  const next = { ...state, favorites }
  // The system list can gain or lose Favorites at its head; keep the cursor on the same system.
  const systems = systemsOf(next)
  const sys = Math.max(0, systems.findIndex((s) => s.tag === before?.tag))
  const favCount = gamesOf(next, FAVORITES).length
  const cursor = { ...next.cursor, FAV: Math.min(next.cursor['FAV'] ?? 0, Math.max(0, favCount - 1)) }
  if (before?.tag === 'FAV' && !favCount) return { ...next, sys: 0, shelf: 'systems', cursor }
  return { ...next, sys, cursor }
}

export function isFavorite(state: State, g: ShelfGame | null): boolean {
  return !!g && state.favorites.some((f) => f.tag === g.owner.tag && f.name === g.name)
}

/** SELECT: Muse, straight to Now Playing when something is loaded (`muse_open`). */
function openMuse(state: State): State {
  if (museOpen(state)) return state
  const cursor = state.now ? museCardOfAlbum(state, state.now.album) : cursorOf(state, MUSE)
  const opened = { ...state, cursor: { ...state.cursor, MUSE: cursor }, stack: [...state.stack, 'muse' as View] }
  return state.now ? { ...opened, stack: [...opened.stack, 'muse-tracks', 'now-playing'], sel: { ...opened.sel, 'muse-tracks': state.now.track } } : opened
}

function museCardOfAlbum(state: State, album: number): number {
  return Math.max(0, museCards(state).findIndex((c) => c.title === ALBUMS[album]!.name))
}

/** Close all of Muse, back to whatever it was opened over. */
function closeMuse(state: State): State {
  const at = state.stack.lastIndexOf('muse')
  return at < 0 ? state : { ...state, stack: state.stack.slice(0, at) }
}

function launch(state: State): State {
  const g = focusedGame(state)
  if (!g || g.owner.tag === 'MUSE') return state
  return { ...push(state, 'game'), running: { tag: g.owner.tag, name: g.name } }
}

function reduceShelf(state: State, button: Button): State {
  const systems = systemsOf(state)
  const ns = systems.length
  if (!ns) return state
  const sys = systems[state.sys]!

  if (state.dir === 'cubic') {
    if (button === 'menu') return push(state, 'tortos-menu')
    if (button === 'b') return push(state, 'system-menu')
    if (button === 'down') return { ...state, sys: (state.sys - 1 + ns) % ns, lastDir: { ...state.lastDir, sys: -1 } }
    if (button === 'up') return { ...state, sys: (state.sys + 1) % ns, lastDir: { ...state.lastDir, sys: 1 } }
    const games = gamesOf(state, sys)
    const n = games.length
    if (!n) return state
    const cur = cursorOf(state, sys)
    if (button === 'left') return moveCursor(state, sys, (cur - 1 + n) % n, -1)
    if (button === 'right') return moveCursor(state, sys, (cur + 1) % n, 1)
    if (button === 'l') return moveCursor(state, sys, (((cur - CF_WINDOW) % n) + n) % n, -1)
    if (button === 'r') return moveCursor(state, sys, (cur + CF_WINDOW) % n, 1)
    if (sys.tag === 'MUSE') return button === 'a' ? openMuseAlbum(state) : state
    if (button === 'x') return push(state, 'game-info')
    if (button === 'y') return toggleFavorite(state)
    if (button === 'a') return launch(state)
    return state
  }

  if (button === 'menu') return push(state, state.shelf === 'systems' ? 'tortos-menu' : 'system-menu')
  const vertical = state.dir === 'vertical'

  if (state.shelf === 'systems') {
    const back = vertical ? 'down' : 'left'
    const fwd = vertical ? 'up' : 'right'
    if (button === back) return { ...state, sys: (state.sys - 1 + ns) % ns, lastDir: { ...state.lastDir, sys: -1 } }
    if (button === fwd) return { ...state, sys: (state.sys + 1) % ns, lastDir: { ...state.lastDir, sys: 1 } }
    if (button === 'a') {
      if (sys.tag === 'MUSE') return openMuse(state)
      return gamesOf(state, sys).length ? { ...state, shelf: 'games' } : state
    }
    return state
  }

  const moved = moveOnShelf(state, sys, button, vertical)
  if (moved) return moved
  if (button === 'b') return { ...state, shelf: 'systems' }
  if (button === 'x') return push(state, 'game-info')
  if (button === 'y') return toggleFavorite(state)
  if (button === 'a') return launch(state)
  return state
}

/**
 * A on an album: its tracks, over the shelf (`muse_album`). From Cubic's own Muse face this is not
 * Muse's shelf at all, so B from the tracks comes back to the cube rather than to a Muse layer.
 */
function openMuseAlbum(state: State): State {
  const opened = state
  const album = albumOf(opened, cursorOf(opened, MUSE))
  const sel = opened.now && opened.now.album === album ? opened.now.track : 0
  return { ...push(opened, 'muse-tracks'), sel: { ...opened.sel, 'muse-tracks': sel } }
}

function reduceMuseShelf(state: State, button: Button): State {
  if (button === 'b' || button === 'select') return closeMuse(state)
  if (button === 'menu') return push(state, 'system-menu')
  if (button === 'a') return openMuseAlbum(state)
  // `muse_shelf_screen` reads `.vertical`, which Cubic sets too: up and down step, there as in
  // Vertical, even though the cube it draws turns sideways between albums.
  return moveOnShelf(state, MUSE, button, state.dir !== 'horizontal') ?? state
}

function play(state: State, album: number, track: number): State {
  return { ...state, now: { album, track, paused: false, at: 0 } }
}

function stepTrack(state: State, by: 1 | -1): State {
  const now = state.now
  if (!now) return state
  const n = ALBUMS[now.album]!.tracks.length
  const track = Math.max(0, Math.min(n - 1, now.track + by))
  return { ...state, now: { ...now, track, at: 0 } }
}

function seek(state: State, by: number): State {
  const now = state.now
  if (!now) return state
  const len = ALBUMS[now.album]!.tracks[now.track]!.len
  return { ...state, now: { ...now, at: Math.max(0, Math.min(len, now.at + by)) } }
}

function reducePanel(state: State, view: View, button: Button): State {
  const model = panelOf(state, view)
  const sel = model.sel
  const setSel = (s: number) => ({ ...state, sel: { ...state.sel, [view]: s } })

  // A notice blocks on the device and carries on by itself; here a press also carries it on, so a
  // still of one is never a trap.
  if (view === 'notice') return button === 'a' || button === 'b' ? finishNotice(state) : state

  if (button === 'b') return pop(state)
  if (button === 'menu') return closeMenus(state)
  if (button === 'select' && !museOpen(state)) return openMuse(state)
  if (view === 'play-time') return reducePlayTime(state, button)
  if (view === 'confirm' && (button === 'up' || button === 'down')) {
    // Only the two answers are reachable, so either direction swaps between them.
    const c = state.confirm!
    return { ...state, confirm: { ...c, sel: c.sel === 1 ? 2 : 1 } }
  }

  if ((button === 'up' || button === 'down') && view === 'bluetooth') {
    // The device list clamps at its ends rather than wrapping.
    const n = model.rows.filter(isLive).length
    return setSel(Math.max(0, Math.min(n - 1, sel + (button === 'up' ? -1 : 1))))
  }
  if ((button === 'up' || button === 'down') && sel >= 0 && !model.visitsAll)
    return setSel(stepSel(model.rows, sel, button === 'up' ? -1 : 1))

  switch (view) {
    case 'tortos-menu':
      return reduceTortosMenu(state, sel, button)
    case 'system-menu':
      return reduceSystemMenu(state, sel, button)
    case 'wifi':
      return reduceWifi(state, sel, button)
    case 'bluetooth':
      return reduceBluetooth(state, sel, button)
    case 'controls':
      if (button === 'left' || button === 'right') {
        const d = button === 'right' ? 1 : -1
        return { ...state, controlsPage: (state.controlsPage + d + CONTROLS_PAGES.length) % CONTROLS_PAGES.length }
      }
      return state
    case 'game-info': {
      if (button === 'x') return pop(state)
      if (button !== 'a') return state
      const label = (model.rows[sel] as { label?: string } | undefined)?.label
      if (label === 'Synopsis') return push(state, 'synopsis')
      if (label === 'Cheevos') return cheevoSet(state).set.length ? { ...push(state, 'cheevos'), cheevo: 0 } : state
      if (label === 'Replace Box Art') return push(state, 'box-art')
      return state
    }
    case 'synopsis':
      return button === 'a' || button === 'x' ? pop(state) : state
    case 'cheevos': {
      const n = model.rows.length
      if (!n) return state
      if (button === 'up') return { ...state, cheevo: (state.cheevo + n - 1) % n }
      if (button === 'down') return { ...state, cheevo: (state.cheevo + 1) % n }
      if (button === 'l') return { ...state, cheevo: state.cheevo > 8 ? state.cheevo - 8 : 0 }
      if (button === 'r') return { ...state, cheevo: state.cheevo < n - 9 ? state.cheevo + 8 : n - 1 }
      if (button === 'a') return push(state, 'cheevo')
      return state
    }
    case 'cheevo':
      return button === 'a' ? pop(state) : state
    case 'confirm': {
      const c = state.confirm!
      if (button !== 'a') return state
      const closed = { ...pop(state), confirm: null }
      return c.sel === 1 ? runAction(closed, c.then) : closed
    }
    case 'game-menu':
      return reduceGameMenu(state, sel, button)
    case 'muse-tracks':
      return state
    default:
      return state
  }
}

function reduceTortosMenu(state: State, sel: number, button: Button): State {
  const d = button === 'right' ? 1 : button === 'left' ? -1 : 0
  if (d && sel === TORTOS_ROW.autoOff) return { ...state, autoOff: Math.max(0, Math.min(AUTO_OFF.length - 1, state.autoOff + d)) }
  if (sel === TORTOS_ROW.theme && (d || button === 'a')) {
    const i = CARD_SETS.findIndex((c) => c.id === state.cards)
    return { ...state, cards: CARD_SETS[(i + (d || 1) + CARD_SETS.length) % CARD_SETS.length]!.id }
  }
  if (sel === TORTOS_ROW.dir && (d || button === 'a')) {
    const i = DIRECTIONS.findIndex((x) => x.id === state.dir)
    const dir = DIRECTIONS[(i + (d || 1) + DIRECTIONS.length) % DIRECTIONS.length]!.id
    return { ...state, dir }
  }
  if (sel === TORTOS_ROW.audio && (d || button === 'a')) return { ...state, audio: state.audio === 'auto' ? 'speaker' : 'auto' }
  if (button !== 'a') return state
  switch (sel) {
    case TORTOS_ROW.playTime:
      return { ...push(state, 'play-time'), sel: { ...state.sel, 'play-time': 0 } }
    case TORTOS_ROW.wifi:
      return push(state, 'wifi')
    case TORTOS_ROW.bt:
      return push(state, 'bluetooth')
    case TORTOS_ROW.hare:
      return push(state, 'hare')
    case TORTOS_ROW.boxArt:
      return push(state, 'box-art')
    case TORTOS_ROW.cheevos:
      if (!connected(state))
        return showNotice(state, { heading: 'RetroAchievements', text: 'Not on a network. Connect Wi-Fi first.', live: false, ms: 1600, then: { kind: 'pop' } })
      return { ...push(state, 'keyboard'), keyboard: newKeyboard('ra-user') }
    case TORTOS_ROW.controls:
      return { ...push(state, 'controls'), controlsPage: 1 }
    case TORTOS_ROW.about:
      return push(state, 'about')
    default:
      return state
  }
}

function reduceSystemMenu(state: State, sel: number, button: Button): State {
  const sys = menuSystem(state)
  if (!sys) return state
  const d = button === 'right' ? 1 : button === 'left' ? -1 : 0
  const rows = systemMenuRows(state, sys)
  const label = (rows[sel] as { label?: string } | undefined)?.label
  if (d && label === 'Sort By') {
    if (sys.tag === 'MUSE') {
      const keep = focusedGame(state)
      const next = { ...state, museSort: (state.museSort + d + MUSE_SORTS.length) % MUSE_SORTS.length }
      const at = Math.max(0, museCards(next).findIndex((c) => c.title === keep?.title && c.name === keep?.name))
      return { ...next, cursor: { ...next.cursor, MUSE: at } }
    }
    return { ...state, sort: { ...state.sort, [sys.tag]: ((state.sort[sys.tag] ?? 0) + d + SORTS.length) % SORTS.length } }
  }
  if (d && label === 'Display Mode')
    return { ...state, dmode: { ...state.dmode, [sys.tag]: ((state.dmode[sys.tag] ?? 0) + d + DISPLAY_MODES.length) % DISPLAY_MODES.length } }
  if (button !== 'a') return state
  if (label === 'Box Art') return push(state, 'box-art')
  if (label === 'Rescan Folder')
    return showNotice(state, { heading: sys.name, text: 'Scanning...', live: false, ms: 900, then: { kind: 'close-menus' } })
  return state
}

function reduceWifi(state: State, sel: number, button: Button): State {
  const nets = state.wifiOn ? networksOf(state) : networksOf(state).filter((n) => n.saved)
  const net = sel >= 1 ? nets[sel - 1] : undefined
  if (button === 'y' && state.wifiOn) return state
  if (button === 'x' && net?.saved) {
    const msg = state.wifiNet === net.ssid ? `Forget ${net.ssid}? You are connected to it and will lose the network.` : `Forget ${net.ssid}?`
    return { ...push(state, 'confirm'), confirm: { heading: 'Wi-Fi', msg, yes: 'Forget', sel: 2, then: { kind: 'forget', ssid: net.ssid } } }
  }
  if (button !== 'a') return state
  if (sel === 0) return { ...state, wifiOn: !state.wifiOn, wifiNet: state.wifiOn ? null : state.wifiNet }
  if (!net || !state.wifiOn) return state
  if (net.saved || !net.secured)
    return showNotice({ ...state, wifiNet: net.ssid }, {
      heading: 'Wi-Fi',
      text: 'Connecting...',
      live: false,
      ms: 900,
      then: { kind: 'notice', notice: { heading: 'Wi-Fi', text: `Connected to ${net.ssid}`, live: true, ms: 1400, then: { kind: 'pop' } } },
    })
  return { ...push(state, 'keyboard'), keyboard: newKeyboard('wifi', net.ssid) }
}

function reduceBluetooth(state: State, sel: number, button: Button): State {
  if (button !== 'a') return state
  if (sel === 0) return { ...state, btOn: !state.btOn, btConnected: state.btOn ? null : state.btConnected }
  const d = BT_DEVICES[sel - 1]
  if (!d) return state
  return { ...state, btConnected: state.btConnected === d.name ? null : d.name }
}

function reducePlayTime(state: State, button: Button): State {
  const n = playEntries(state).length
  const cur = state.sel['play-time'] ?? 0
  const setCur = (c: number) => ({ ...state, sel: { ...state.sel, 'play-time': c } })
  if (button === 'left' || button === 'right') {
    const d = button === 'right' ? 1 : -1
    return { ...setCur(0), playWindow: (state.playWindow + d + PLAY_WINDOWS.length) % PLAY_WINDOWS.length }
  }
  if (button === 'y') return { ...setCur(0), playBySystem: !state.playBySystem }
  // The list clamps at both ends rather than wrapping.
  if (button === 'down' && cur < n - 1) return setCur(cur + 1)
  if (button === 'up' && cur > 0) return setCur(cur - 1)
  if (button === 'a' && n) {
    // A: go - to that game on its shelf, and out of the menus.
    const e = playEntries(state)[cur]!
    const systems = systemsOf(state)
    const sys = systems.findIndex((s) => s.tag === e.tag)
    if (sys < 0) return state
    const games = gamesOf(state, systems[sys]!)
    const at = state.playBySystem ? cursorOf(state, systems[sys]!) : Math.max(0, games.findIndex((g) => g.name === e.name))
    return { ...closeMenus(state), sys, shelf: state.dir === 'cubic' ? state.shelf : 'games', cursor: { ...state.cursor, [e.tag]: at } }
  }
  return state
}

function reduceGameMenu(state: State, sel: number, button: Button): State {
  const tag = state.running?.tag ?? ''
  if ((button === 'left' || button === 'right') && sel === 3) {
    const d = button === 'right' ? 1 : -1
    return { ...state, dmode: { ...state.dmode, [tag]: ((state.dmode[tag] ?? 0) + d + DISPLAY_MODES.length) % DISPLAY_MODES.length } }
  }
  if (button !== 'a') return state
  switch (sel) {
    case 0:
    case 5:
      return pop(state)
    case 1:
    case 2: {
      const saving = sel === 1
      return { ...push(state, 'slots'), slotSaving: saving, slot: firstSlot(state, saving) }
    }
    case 3:
      return { ...state, dmode: { ...state.dmode, [tag]: ((state.dmode[tag] ?? 0) + 1) % DISPLAY_MODES.length } }
    case 4:
      return { ...push(state, 'cheevos'), cheevo: 0 }
    case 6: {
      // Quit: out of the game and back to the shelf it was launched from.
      const at = state.stack.lastIndexOf('game')
      return { ...state, stack: state.stack.slice(0, at), running: null }
    }
    default:
      return state
  }
}

function reduceSlots(state: State, button: Button): State {
  const saving = state.slotSaving
  if (button === 'b') return pop(state)
  if (button === 'menu') return closeMenus(state)
  if (button === 'left' || button === 'right') {
    const dir = button === 'right' ? 1 : -1
    let next = state.slot
    do next = (next + dir + 7) % 7
    while ((saving ? next === 0 : !state.slotsHave[next]) && next !== state.slot)
    return { ...state, slot: next }
  }
  if (button === 'a') {
    // Chosen: the game resumes, with the save written.
    const at = state.stack.lastIndexOf('game')
    const slotsHave = saving ? state.slotsHave.map((h, i) => h || i === state.slot) : state.slotsHave
    return { ...state, stack: state.stack.slice(0, at + 1), slotsHave }
  }
  return state
}

function reduceNowPlaying(state: State, button: Button): State {
  switch (button) {
    case 'b':
      return pop(state)
    case 'select':
      return closeMuse(state)
    case 'menu':
      return push(state, 'system-menu')
    case 'a':
      return state.now ? { ...state, now: { ...state.now, paused: !state.now.paused } } : state
    case 'y':
      return { ...state, playMode: (state.playMode + 1) % PLAY_MODES.length }
    case 'l':
      return stepTrack(state, -1)
    case 'r':
      return stepTrack(state, 1)
    case 'left':
      return seek(state, -10)
    case 'right':
      return seek(state, 10)
    default:
      return state
  }
}

function reduceMuseTracks(state: State, button: Button): State {
  const album = albumOf(state, cursorOf(state, MUSE))
  const n = ALBUMS[album]?.tracks.length ?? 0
  const sel = state.sel['muse-tracks'] ?? 0
  const setSel = (s: number) => ({ ...state, sel: { ...state.sel, 'muse-tracks': s } })
  switch (button) {
    case 'up':
      return n ? setSel((sel + n - 1) % n) : state
    case 'down':
      return n ? setSel((sel + 1) % n) : state
    case 'b':
      return pop(state)
    case 'select':
      return closeMuse(state)
    case 'menu':
      return push(state, 'system-menu')
    case 'left':
      return seek(state, -10)
    case 'right':
      return seek(state, 10)
    case 'l':
      return stepTrack(state, -1)
    case 'r':
      return stepTrack(state, 1)
    case 'a': {
      if (!n) return state
      // The track already playing is not started over: A on it opens Now Playing.
      const same = state.now && state.now.album === album && state.now.track === sel
      return push(same ? state : play(state, album, sel), 'now-playing')
    }
    default:
      return state
  }
}

export function reduce(state: State, button: Button): State {
  const view = currentView(state)

  if (view === null) {
    if (button === 'select') return openMuse(state)
    return reduceShelf(state, button)
  }

  switch (view) {
    case 'muse':
      return reduceMuseShelf(state, button)
    case 'muse-tracks':
      return reduceMuseTracks(state, button)
    case 'now-playing':
      return reduceNowPlaying(state, button)
    case 'game':
      // Diatom owns the pad while a game runs; MENU is the one press the launcher hears.
      return button === 'menu' ? push(state, 'game-menu') : state
    case 'slots':
      return reduceSlots(state, button)
    case 'keyboard':
      return state.keyboard ? reduceKeyboard(state, state.keyboard, button) : pop(state)
    case 'game-menu':
      // B and MENU are Continue here: the game resumes.
      if (button === 'b' || button === 'menu') return pop(state)
      return reducePanel(state, view, button)
    case 'system-menu':
      // Muse's menu, over Muse: MENU inside it closes only it.
      if (museOpen(state) && button === 'menu') return pop(state)
      return reducePanel(state, view, button)
    default:
      return reducePanel(state, view, button)
  }
}
