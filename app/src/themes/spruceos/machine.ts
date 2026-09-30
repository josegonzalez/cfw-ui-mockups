import type { DeviceSlug } from '../../device/devices'
import type { Button } from '../../input/keymap'
import { gridWindow, moveGrid, moveList, openGrid, openList, type GridCursor, type ListCursor } from './cursor'
import {
  ABOUT_VALUES,
  ADDITIONAL_SETTINGS,
  APPS,
  CORES,
  CPU_MODES,
  GAME_CONFIG_ACTIONS,
  TASKS,
  THEME_SETTINGS,
  additionalSettings,
  hardwareFor,
  type Hardware,
} from './data'
import { geometry, type Geometry } from './layout'
import {
  FAVOURITES,
  GAMES,
  RECENTS,
  SWITCHER,
  SYSTEMS,
  gameKey,
  gamesOf,
  listName,
  systemOf,
  type Game,
} from './library'
import { panelFor } from './panel'

/**
 * PyUI's menus as a pure reducer: every screen a menu loop draws, and what each button does there
 * (`menus/**`). A menu in PyUI is a loop that blocks on `get_input`, calls into the next menu, and
 * carries on when it returns; here that is a stack, and a screen's buttons are the loop's branches.
 *
 * The stills are posed by pressing the reference renderer's letters from a fresh start, so this has
 * to arrive where PyUI does - the same rows, the same window of rows, the same index.
 */

/** The four views SELECT cycles a game list through (`game_select_menu_popup.py:63-73`). */
export const GAME_VIEWS = ['TEXT_AND_IMAGE', 'GRID', 'ICON_AND_DESC', 'CAROUSEL'] as const
export type GameView = (typeof GAME_VIEWS)[number]

export type GameSource =
  | { readonly kind: 'system'; readonly folder: string }
  | { readonly kind: 'favorites' }
  | { readonly kind: 'recents' }
  | { readonly kind: 'collections' }
  | { readonly kind: 'search'; readonly folder: string | null; readonly query: string }

export type SettingsPage = 'root' | 'theme' | 'sound' | 'additional' | 'animation' | 'tasks' | 'about'

export type PopupOwner = 'main' | 'system' | 'game' | 'app'

export type Screen =
  | { readonly kind: 'main'; readonly cur: GridCursor }
  | {
      readonly kind: 'popup'
      readonly owner: PopupOwner
      /** The popup's own title: shown only where a device draws popups as full lists. */
      readonly title: string
      readonly rows: readonly string[]
      readonly cur: ListCursor
      /** The game or app it was opened on. */
      readonly subject: string | null
    }
  | { readonly kind: 'systems'; readonly cur: GridCursor }
  | {
      readonly kind: 'games'
      readonly source: GameSource
      readonly sel: number
      readonly list: ListCursor
      readonly grid: GridCursor
      /** Which way the last move went, for the carousel's slide: -1, 1, or 0 for none. */
      readonly dir: number
    }
  | {
      readonly kind: 'config'
      readonly game: string
      readonly cur: ListCursor
      readonly cpu: number
      readonly core: number
    }
  | { readonly kind: 'boxart'; readonly folder: string }
  | {
      readonly kind: 'keyboard'
      readonly folder: string | null
      readonly text: string
      readonly row: number
      readonly col: number
      readonly shifted: boolean
      readonly caps: boolean
    }
  | { readonly kind: 'apps'; readonly cur: ListCursor }
  | { readonly kind: 'settings'; readonly page: SettingsPage; readonly cur: ListCursor }
  | { readonly kind: 'power' }
  | {
      readonly kind: 'switcher'
      readonly sel: number
      readonly from: number
      /** UP and DOWN slide the pictures vertically, LEFT and RIGHT across. */
      readonly axis: 'x' | 'y'
    }

/** What PyUI hands the device back for: a game, an app, a power command, or a restart. */
export type Away =
  | { readonly kind: 'game'; readonly game: string }
  | { readonly kind: 'app'; readonly app: string }
  | { readonly kind: 'off' | 'reboot' | 'reload' }

export interface State {
  readonly device: DeviceSlug
  readonly hw: Hardware
  readonly geo: Geometry
  readonly stack: readonly Screen[]
  readonly backlight: number
  /** 0-20, the Volume row's scale. */
  readonly volume: number
  readonly wifiOn: boolean
  readonly bluetoothOn: boolean
  readonly buttonSound: boolean
  readonly bgm: boolean
  readonly bgmVolume: number
  readonly animations: boolean
  readonly animationSpeed: number
  /** The theme's `gameSelectionViewType`, which SELECT rewrites. */
  readonly gameView: GameView
  readonly favourites: readonly string[]
  readonly recents: readonly string[]
  readonly switcher: readonly string[]
  readonly hiddenApps: readonly string[]
  readonly showHiddenApps: boolean
  /** The last game chosen in each list (`PyUiState.set_last_game_selection`). */
  readonly lastGame: Readonly<Record<string, string>>
  /** Bumped by every volume change: the top bar shows the level for 3s after (`top_bar.py:128-133`). */
  readonly volumeShown: number
  readonly away: Away | null
  /** The one-time box-art question has been asked and answered. */
  readonly boxartAsked: boolean
}

export interface Seed {
  /** Buttons pressed from a fresh start, in the reference renderer's letters (`stills.txt`). */
  readonly events?: string | undefined
  /** Start in the Game Switcher, as after holding MENU in a game (`GS_TRIGGER=1`). */
  readonly gsTrigger?: boolean | undefined
  /** Let the one-time box-art question show (`BOXART_PROMPT=1`). */
  readonly boxartPrompt?: boolean | undefined
}

/** `harness.py`'s letters. */
export const LETTERS: Readonly<Record<string, Button>> = {
  u: 'up',
  d: 'down',
  l: 'left',
  r: 'right',
  a: 'a',
  b: 'b',
  x: 'x',
  y: 'y',
  q: 'l',
  w: 'r',
  '1': 'l2',
  '2': 'r2',
  s: 'start',
  e: 'select',
  m: 'menu',
}

/* ---- what each screen lists ------------------------------------------------------------------ */

export interface MainEntry {
  readonly id: 'recent' | 'favorite' | 'game' | 'app' | 'setting'
  readonly label: string
}

/**
 * `build_options` (`menus/main_menu.py:41-116`): Recents only where the theme enables it, Collections
 * never in SPRUCE. `reorder_options` keys on labels its ordering list never contains, so insertion
 * order stands.
 */
export function mainEntries(s: Pick<State, 'geo'>): MainEntry[] {
  const out: MainEntry[] = []
  if (s.geo.recentsOnMain) out.push({ id: 'recent', label: 'Recents' })
  out.push({ id: 'favorite', label: 'Favorites' }, { id: 'game', label: 'Games' })
  out.push({ id: 'app', label: 'Apps' }, { id: 'setting', label: 'Settings' })
  return out
}

/** The MENU popup: Rom Search, Settings, and whichever lists the main menu leaves out (`main_menu_popup.py`). */
export function mainPopupRows(s: Pick<State, 'geo'>): string[] {
  const rows = ['Rom Search', 'Settings']
  if (!s.geo.recentsOnMain) rows.push('Recents')
  rows.push('Collections')
  return rows
}

const bySortOrder = [...SYSTEMS].sort((a, b) => a.sortOrder - b.sortOrder)
export const systemList = () => bySortOrder

const findGame = (key: string): Game => GAMES.find((g) => gameKey(g) === key)!

/** A game list's entries and the title PyUI gives it. */
export function gameList(s: State, source: GameSource): { title: string; games: Game[]; named: boolean } {
  switch (source.kind) {
    case 'system':
      return { title: systemOf(source.folder).label, games: gamesOf(source.folder), named: false }
    case 'favorites':
      return { title: 'Favorites', games: s.favourites.map(findGame), named: true }
    case 'recents':
      return { title: 'Recents', games: s.recents.map(findGame), named: true }
    case 'collections':
      return { title: 'Collections', games: [], named: false }
    case 'search': {
      const q = source.query.toUpperCase()
      const pool = source.folder ? gamesOf(source.folder) : bySortOrder.flatMap((sys) => gamesOf(sys.folder))
      return {
        title: source.folder ? `${systemOf(source.folder).label} Search` : 'Game Search',
        games: pool.filter((g) => g.file.toUpperCase().includes(q) || g.name.toUpperCase().includes(q)),
        named: false,
      }
    }
  }
}

export const gameText = (g: Game, named: boolean) => (named ? listName(g) : g.name)

export function gamePopupRows(s: State, game: Game): string[] {
  const sys = systemOf(game.system).label
  const rows = [`${sys} Game Search`, '+/- GameSwitcher', '+/- Favorite', '+/- Collection']
  if (s.recents.includes(gameKey(game))) rows.push('- Recents')
  rows.push('Download BoxArt', 'Select BoxArt Download', 'Launch Random Game', 'Toggle View')
  return rows
}

/** The apps list: this device's, sorted, less the hidden ones unless they are being shown. */
export function appRows(s: State): string[] {
  return s.hw.apps
    .filter((a) => s.showHiddenApps || !s.hiddenApps.includes(a))
    .map((a) => (s.hiddenApps.includes(a) ? `${a}(Hidden)` : a))
}

export interface SettingRow {
  readonly text: string
  readonly value?: string | undefined
  readonly description?: string | undefined
}

const val = (v: string | number) => `<    ${v}    >`

export function settingRows(s: State, page: SettingsPage): SettingRow[] {
  switch (page) {
    case 'root': {
      const rows: SettingRow[] = [{ text: 'Power Off' }, { text: 'Backlight', value: val(s.backlight) }]
      if (s.hw.volume) rows.push({ text: 'Volume', value: val(s.volume) })
      if (s.hw.wifi) rows.push({ text: 'WiFi', value: val(s.wifiOn ? ABOUT_VALUES['IP Address']! : 'Off') })
      if (s.hw.bluetooth) rows.push({ text: 'Bluetooth', value: val(s.bluetoothOn ? 'On' : 'Off') })
      rows.push(
        { text: 'Theme', value: val('SPRUCE') },
        { text: 'Theme Settings' },
        { text: 'Sound Settings', value: '' },
        { text: 'Additional Settings' },
        { text: 'Tasks' },
        { text: 'About this Device' },
        { text: 'Reload UI' },
      )
      return rows
    }
    case 'theme':
      return THEME_SETTINGS.map((text) => (text === 'Screensaver' ? { text } : { text, value: '' }))
    case 'sound':
      return [
        { text: 'Play Button Press Sound', value: val(s.buttonSound ? 'True' : 'False') },
        { text: 'Play BGM', value: val(s.bgm ? 'True' : 'False') },
        { text: 'BGM Volume', value: val(s.bgmVolume) },
      ]
    case 'additional':
      return additionalSettings(s.hw).map((text) => ({ text }))
    case 'animation':
      return [
        { text: 'Animations Enabled', value: val(s.animations ? 'Enabled' : 'Disabled') },
        { text: 'Animation Speed', value: val(s.animationSpeed) },
      ]
    case 'tasks':
      return TASKS.map(([text, description]) => ({ text, description }))
    case 'about':
      return s.hw.about.map((text) => ({ text, value: ABOUT_VALUES[text]! }))
  }
}

export function configRows(screen: Extract<Screen, { kind: 'config' }>): SettingRow[] {
  const cores = CORES[findGame(screen.game).system]!
  return [
    { text: 'CPU Mode', value: val(CPU_MODES[screen.cpu]!) },
    { text: 'Retroarch Core', value: val(cores.options[screen.core]!) },
    ...GAME_CONFIG_ACTIONS.map((text) => ({ text })),
  ]
}

/**
 * The title a screen puts in the top bar - which a popup opened over it keeps, since
 * `PopupTextListView` takes `Display.get_current_top_bar_title()` (`popup_text_list_view.py:15`).
 */
export function titleOf(s: State, screen: Screen): string {
  switch (screen.kind) {
    case 'main':
    case 'boxart':
      return ''
    case 'systems':
      return 'Games'
    case 'games': {
      const { title, games, named } = gameList(s, screen.source)
      if (!games.length) return 'No Entries Found'
      // A grid or carousel titles the top bar with the focused game (`set_top_bar_text_to_selection`).
      if (s.gameView === 'GRID' || s.gameView === 'CAROUSEL') return gameText(games[screen.sel]!, named)
      return title
    }
    case 'config':
      return `${systemOf(findGame(screen.game).system).label} Configuration`
    case 'apps':
      return 'Apps'
    case 'settings':
      return 'Settings'
    case 'power':
      return 'Power'
    case 'keyboard':
      return 'Keyboard'
    case 'switcher': {
      const game = switcherGames(s)[screen.sel]
      return game ? listName(game) : ''
    }
    case 'popup':
      return screen.title
  }
}

/** The Game Switcher's games: `gameswitcher.json`, newest first, at most 8 (`recents_menu_gs.py`). */
export const switcherGames = (s: State) => s.switcher.slice(0, 8).map(findGame)

/* ---- the keyboard ----------------------------------------------------------------------------- */

export const KEYS_NORMAL = [
  ['`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '='],
  ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['⇪', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", '←'],
  ['↑', ' ', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '↵'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
]
export const KEYS_SHIFTED = [
  ['`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '='],
  ['~', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '+'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'],
  ['⇪', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '←'],
  ['↑', ' ', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', '↵'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
]

/* ---- building screens ------------------------------------------------------------------------ */

function openGames(s: State, source: GameSource): Screen {
  const { games, named } = gameList(s, source)
  const key = sourceKey(source)
  const last = s.lastGame[key]
  const found = last ? games.findIndex((g) => gameKey(g) === last) : -1
  const sel = Math.max(0, found)
  return gamesScreen(
    s,
    source,
    sel,
    games.map((g) => gameText(g, named)),
  )
}

function gamesScreen(s: State, source: GameSource, sel: number, texts: readonly string[]): Screen {
  return {
    kind: 'games',
    source,
    sel,
    list: openList(texts.length, s.geo.gameList.rows, sel),
    grid: openGrid(texts.length, s.geo.gameGrid.cols, s.geo.gameGrid.rows, sel),
    dir: 0,
  }
}

const sourceKey = (src: GameSource) =>
  src.kind === 'system' ? src.folder : src.kind === 'search' ? `search:${src.folder}:${src.query}` : src.kind

function openSettings(s: State, page: SettingsPage): Screen {
  return { kind: 'settings', page, cur: openList(settingRows(s, page).length, s.geo.descRows(settingRows(s, page)), 0) }
}

function popup(s: State, owner: PopupOwner, title: string, rows: string[], subject: string | null): Screen {
  const maxRows = s.hw.popups ? s.geo.popup.rows : s.geo.textList.rows
  return { kind: 'popup', owner, title, rows, cur: openList(rows.length, maxRows, 0), subject }
}

const keyboard = (folder: string | null): Screen => ({
  kind: 'keyboard',
  folder,
  text: '',
  row: 0,
  col: 0,
  shifted: false,
  caps: false,
})

/* ---- the reducer ------------------------------------------------------------------------------ */

export function initialState(device: DeviceSlug, seed: Seed = {}): State {
  const hw = hardwareFor(device)
  const geo = geometry(panelFor(hw.res))
  let s: State = {
    device,
    hw,
    geo,
    stack: [],
    backlight: hw.backlight,
    volume: hw.volumeLevel,
    wifiOn: true,
    bluetoothOn: false,
    buttonSound: true,
    bgm: true,
    bgmVolume: 10,
    animations: true,
    animationSpeed: hw.animationSpeed,
    gameView: 'TEXT_AND_IMAGE',
    favourites: FAVOURITES.map(gameKey),
    recents: RECENTS.map(gameKey),
    switcher: SWITCHER.map(gameKey),
    hiddenApps: [],
    showHiddenApps: false,
    lastGame: {},
    volumeShown: 0,
    away: null,
    boxartAsked: !seed.boxartPrompt,
  }
  s = { ...s, stack: [{ kind: 'main', cur: openGrid(mainEntries(s).length, mainEntries(s).length, 1) }] }
  // `check_for_gameswitcher` runs before the main menu draws (`main_menu.py:165-174`).
  if (seed.gsTrigger) s = push(s, { kind: 'switcher', sel: 0, from: 0, axis: 'x' })
  for (const c of seed.events ?? '') {
    const button = LETTERS[c]
    if (!button) throw new Error(`spruceOS event letter not known: ${c}`)
    s = reduce(s, button)
  }
  return s
}

const top = (s: State) => s.stack[s.stack.length - 1]!
const push = (s: State, screen: Screen): State => ({ ...s, stack: [...s.stack, screen] })
const pop = (s: State): State => (s.stack.length > 1 ? { ...s, stack: s.stack.slice(0, -1) } : s)
const replace = (s: State, screen: Screen): State => ({ ...s, stack: [...s.stack.slice(0, -1), screen] })

/** Leave PyUI for a game, an app or a power command; `returned` brings the device back. */
const leave = (s: State, away: Away): State => ({ ...s, away })

/** What PyUI shows when the device hands back to it. A game returns to where it was launched. */
export function returned(s: State): State {
  if (!s.away) return s
  if (s.away.kind === 'reload' || s.away.kind === 'off' || s.away.kind === 'reboot') {
    return initialState(s.device)
  }
  if (s.away.kind === 'game') {
    const key = s.away.game
    const recents = [key, ...s.recents.filter((k) => k !== key)]
    const switcher = [key, ...s.switcher.filter((k) => k !== key)]
    return { ...s, away: null, recents, switcher }
  }
  return { ...s, away: null }
}

/** The one press, applied to whatever screen is on top. */
export function reduce(s: State, b: Button): State {
  if (s.away) return s
  const screen = top(s)
  switch (screen.kind) {
    case 'main':
      return mainInput(s, screen, b)
    case 'popup':
      return popupInput(s, screen, b)
    case 'systems':
      return systemsInput(s, screen, b)
    case 'games':
      return gamesInput(s, screen, b)
    case 'config':
      return configInput(s, screen, b)
    case 'boxart':
      return ['a', 'b', 'x', 'y'].includes(b) ? replaceBoxart(s, screen, b) : s
    case 'keyboard':
      return keyboardInput(s, screen, b)
    case 'apps':
      return appsInput(s, screen, b)
    case 'settings':
      return settingsInput(s, screen, b)
    case 'power':
      return b === 'a'
        ? leave(s, { kind: 'off' })
        : b === 'x' && s.hw.reboot
          ? leave(s, { kind: 'reboot' })
          : b === 'b'
            ? pop(s)
            : s
    case 'switcher':
      return switcherInput(s, screen, b)
  }
}

/** Holding MENU opens the Game Switcher from any screen (`controller/controller.py:320-332`). */
export function holdMenu(s: State): State {
  if (s.away || top(s).kind === 'switcher' || !s.switcher.length) return s
  return push(s, { kind: 'switcher', sel: 0, from: 0, axis: 'x' })
}

/** A grid's buttons as `GridView.get_selection` maps them. */
function gridMove(b: Button): Parameters<typeof moveGrid>[4] | null {
  const map: Partial<Record<Button, Parameters<typeof moveGrid>[4]>> = {
    left: 'left',
    right: 'right',
    up: 'up',
    down: 'down',
    l: 'pageUp',
    r: 'pageDown',
    l2: 'letterUp',
    r2: 'letterDown',
  }
  return map[b] ?? null
}

/** A list's buttons as `ListView.get_selection` maps them: shoulders page by a window less one. */
function listMove(c: ListCursor, texts: readonly string[], maxRows: number, b: Button): ListCursor | null {
  switch (b) {
    case 'up':
      return moveList(c, texts, -1)
    case 'down':
      return moveList(c, texts, 1)
    case 'l':
      return moveList(c, texts, -maxRows + 1)
    case 'r':
      return moveList(c, texts, maxRows - 1)
    case 'l2':
      return moveList(c, texts, -maxRows + 1, true)
    case 'r2':
      return moveList(c, texts, maxRows - 1, true)
    default:
      return null
  }
}

function mainInput(s: State, screen: Extract<Screen, { kind: 'main' }>, b: Button): State {
  const entries = mainEntries(s)
  const move = gridMove(b)
  if (move) {
    return replace(s, {
      ...screen,
      cur: moveGrid(
        screen.cur,
        entries.map((e) => e.label),
        entries.length,
        1,
        move,
      ),
    })
  }
  if (b === 'menu') return push(s, popup(s, 'main', 'Main Menu Sub Options', mainPopupRows(s), null))
  if (b !== 'a') return s
  switch (entries[screen.cur.sel]!.id) {
    case 'recent':
      return push(s, openGames(s, { kind: 'recents' }))
    case 'favorite':
      return push(s, openGames(s, { kind: 'favorites' }))
    case 'game':
      return push(s, { kind: 'systems', cur: openGrid(bySortOrder.length, s.geo.systems.cols, s.geo.systems.rows) })
    case 'app':
      return push(s, { kind: 'apps', cur: openList(appRows(s).length, APP_ROWS(s), 0) })
    case 'setting':
      return push(s, openSettings(s, 'root'))
  }
}

function popupInput(s: State, screen: Extract<Screen, { kind: 'popup' }>, b: Button): State {
  const maxRows = s.hw.popups ? s.geo.popup.rows : s.geo.textList.rows
  const moved = listMove(screen.cur, screen.rows, maxRows, b)
  if (moved) return replace(s, { ...screen, cur: moved })
  if (b === 'b' || b === 'menu') return pop(s)
  if (b !== 'a') return s
  const row = screen.rows[screen.cur.sel]!
  const closed = pop(s)
  switch (screen.owner) {
    case 'main':
      if (row === 'Rom Search') return push(closed, keyboard(null))
      if (row === 'Settings') return push(closed, openSettings(closed, 'root'))
      if (row === 'Recents') return push(closed, openGames(closed, { kind: 'recents' }))
      return push(closed, openGames(closed, { kind: 'collections' }))
    case 'system': {
      const folder = screen.subject!
      if (row.endsWith('Game Search') && !row.startsWith('All')) return push(closed, keyboard(folder))
      if (row === 'All System Game Search') return push(closed, keyboard(null))
      // Download BoxArt fetches from the network; there is nothing to fetch here.
      return closed
    }
    case 'game':
      return gamePopupAction(closed, screen.subject!, row)
    case 'app':
      if (row === 'Hide App') {
        const app = screen.subject!.replace(/\(Hidden\)$/, '')
        const hidden = closed.hiddenApps.includes(app)
          ? closed.hiddenApps.filter((a) => a !== app)
          : [...closed.hiddenApps, app]
        return refreshApps({ ...closed, hiddenApps: hidden })
      }
      return refreshApps({ ...closed, showHiddenApps: !closed.showHiddenApps })
  }
}

/** The apps list always has descriptions, so it takes `bg-list-l` rows. */
const APP_ROWS = (s: State) => s.geo.descRows([{ description: '' }])

function refreshApps(s: State): State {
  const screen = top(s)
  if (screen.kind !== 'apps') return s
  const n = appRows(s).length
  return replace(s, { ...screen, cur: openList(n, APP_ROWS(s), Math.max(0, Math.min(screen.cur.sel, n - 1))) })
}

function toggleKey(list: readonly string[], key: string): string[] {
  return list.includes(key) ? list.filter((k) => k !== key) : [key, ...list]
}

function gamePopupAction(s: State, key: string, row: string): State {
  const game = findGame(key)
  if (row.endsWith('Game Search')) return push(s, keyboard(game.system))
  if (row === '+/- GameSwitcher') return refreshGames({ ...s, switcher: toggleKey(s.switcher, key) })
  if (row === '+/- Favorite') return refreshGames({ ...s, favourites: toggleKey(s.favourites, key) })
  if (row === '- Recents') return refreshGames({ ...s, recents: s.recents.filter((k) => k !== key) })
  if (row === 'Toggle View') return toggleView(s)
  if (row === 'Launch Random Game') {
    // `random.choice` over the list; the port takes the list's first game so a still is repeatable.
    const screen = top(s)
    if (screen.kind !== 'games') return s
    const first = gameList(s, screen.source).games[0]
    return first ? leave(s, { kind: 'game', game: gameKey(first) }) : s
  }
  // +/- Collection, Download BoxArt and Select BoxArt Download need collections or the network.
  return s
}

/** A list rebuilt after its games changed, keeping the selection where it can. */
function refreshGames(s: State): State {
  const screen = top(s)
  if (screen.kind !== 'games') return s
  const { games, named } = gameList(s, screen.source)
  const sel = Math.min(screen.sel, Math.max(0, games.length - 1))
  return replace(s, {
    ...gamesScreen(
      s,
      screen.source,
      sel,
      games.map((g) => gameText(g, named)),
    ),
  })
}

function toggleView(s: State): State {
  const next = GAME_VIEWS[(GAME_VIEWS.indexOf(s.gameView) + 1) % GAME_VIEWS.length]!
  return refreshGames({ ...s, gameView: next })
}

function systemsInput(s: State, screen: Extract<Screen, { kind: 'systems' }>, b: Button): State {
  const move = gridMove(b)
  const labels = bySortOrder.map((x) => x.label)
  if (move)
    return replace(s, { ...screen, cur: moveGrid(screen.cur, labels, s.geo.systems.cols, s.geo.systems.rows, move) })
  if (b === 'b') return pop(s)
  const sys = bySortOrder[screen.cur.sel]!
  if (b === 'menu') {
    const rows = [`${sys.label} Game Search`, 'All System Game Search', 'Download BoxArt']
    return push(s, popup(s, 'system', `${sys.label} Menu Sub Options`, rows, sys.folder))
  }
  if (b !== 'a') return s
  // Box art that is still PNG asks once whether to optimise it (`rom_select_options_builder.py:208-236`).
  if (!s.boxartAsked) return push(s, { kind: 'boxart', folder: sys.folder })
  return push(s, openGames(s, { kind: 'system', folder: sys.folder }))
}

function replaceBoxart(s: State, screen: Extract<Screen, { kind: 'boxart' }>, _b: Button): State {
  // Yes converts the art, which the port has no copy of to convert; every answer opens the list.
  const answered = { ...pop(s), boxartAsked: true }
  return push(answered, openGames(answered, { kind: 'system', folder: screen.folder }))
}

function gamesInput(s: State, screen: Extract<Screen, { kind: 'games' }>, b: Button): State {
  const { games, named } = gameList(s, screen.source)
  const texts = games.map((g) => gameText(g, named))
  if (b === 'b') return pop(s)
  if (!games.length) return s
  const view = s.gameView
  if (view === 'GRID' || view === 'CAROUSEL') {
    const cols = view === 'GRID' ? s.geo.gameGrid.cols : s.geo.carousel.cols
    const rows = view === 'GRID' ? s.geo.gameGrid.rows : 1
    const move = view === 'CAROUSEL' ? carouselMove(b) : gridMove(b)
    if (move) {
      const grid = moveGrid(screen.grid, texts, cols, rows, move)
      const dir = move === 'left' ? -1 : move === 'right' ? 1 : 0
      return replace(s, {
        ...screen,
        grid,
        sel: grid.sel,
        list: openList(texts.length, s.geo.gameList.rows, grid.sel),
        dir,
      })
    }
  } else {
    const rows = view === 'ICON_AND_DESC' ? APP_ROWS(s) : s.geo.gameList.rows
    const list = listMove(screen.list, texts, rows, b)
    if (list) {
      const grid = openGrid(texts.length, s.geo.gameGrid.cols, s.geo.gameGrid.rows, list.sel)
      return replace(s, { ...screen, list, sel: list.sel, grid, dir: 0 })
    }
  }
  const game = games[screen.sel]!
  const key = gameKey(game)
  const remembered = { ...s, lastGame: { ...s.lastGame, [sourceKey(screen.source)]: key } }
  switch (b) {
    case 'a':
      return leave(remembered, { kind: 'game', game: key })
    case 'x':
      return push(remembered, {
        kind: 'config',
        game: key,
        cur: openList(2 + GAME_CONFIG_ACTIONS.length, s.geo.descRows([{}]), 0),
        cpu: 0,
        core: CORES[game.system]!.options.indexOf(CORES[game.system]!.selected),
      })
    case 'menu':
      return push(s, popup(s, 'game', `${systemOf(game.system).label} Menu Sub Options`, gamePopupRows(s, game), key))
    case 'select':
      return toggleView(s)
    default:
      return s
  }
}

/** A carousel moves left and right only (`carousel_view.py`). */
const carouselMove = (b: Button): Parameters<typeof moveGrid>[4] | null =>
  b === 'left' ? 'left' : b === 'right' ? 'right' : null

function configInput(s: State, screen: Extract<Screen, { kind: 'config' }>, b: Button): State {
  const rows = configRows(screen)
  const moved = listMove(
    screen.cur,
    rows.map((r) => r.text),
    s.geo.descRows(rows),
    b,
  )
  if (moved && b !== 'l' && b !== 'r') return replace(s, { ...screen, cur: moved })
  if (b === 'b') return pop(s)
  const row = rows[screen.cur.sel]!.text
  const step = b === 'left' || b === 'l' ? -1 : b === 'right' || b === 'r' ? 1 : 0
  const game = findGame(screen.game)
  if (step && row === 'CPU Mode') return replace(s, { ...screen, cpu: (screen.cpu + step + 3) % 3 })
  if (step && row === 'Retroarch Core') {
    const n = CORES[game.system]!.options.length
    return replace(s, { ...screen, core: (screen.core + step + n) % n })
  }
  if (b !== 'a') return s
  if (row === 'Add to GameSwitcher') return { ...s, switcher: toggleKey(s.switcher, screen.game) }
  if (row === 'Add Favorite') return { ...s, favourites: toggleKey(s.favourites, screen.game) }
  if (row === 'Launch Random Game') return leave(s, { kind: 'game', game: screen.game })
  return s
}

function keyboardInput(s: State, k: Extract<Screen, { kind: 'keyboard' }>, b: Button): State {
  const keys = k.shifted || k.caps ? KEYS_SHIFTED : KEYS_NORMAL
  switch (b) {
    case 'up':
      return replace(s, { ...k, row: k.row > 0 ? k.row - 1 : 5 })
    case 'down':
      return replace(s, { ...k, row: k.row < 5 ? k.row + 1 : 0 })
    case 'left':
      return replace(s, { ...k, col: k.col > 0 ? k.col - 1 : 12 })
    case 'right':
      return replace(s, { ...k, col: k.col < 12 ? k.col + 1 : 0 })
    case 'l':
      return replace(s, { ...k, shifted: !k.shifted })
    case 'r':
      return replace(s, { ...k, caps: !k.caps, shifted: false })
    case 'b':
      return k.text ? replace(s, { ...k, text: k.text.slice(0, -1) }) : pop(s)
    case 'start':
      return submit(s, k)
    case 'a': {
      const key = keys[k.row]![k.col]!
      if (key === '⇪') return replace(s, { ...k, caps: !k.caps, shifted: false })
      if (key === '↑') return replace(s, { ...k, shifted: !k.shifted })
      if (key === '←') return replace(s, { ...k, text: k.text.slice(0, -1) })
      if (key === '↵') return submit(s, k)
      return replace(s, { ...k, text: k.text + key, shifted: false })
    }
    default:
      return s
  }
}

/** The search runs on the upper-cased text, over one system or every one (`searched_roms_menu.py`). */
function submit(s: State, k: Extract<Screen, { kind: 'keyboard' }>): State {
  const closed = pop(s)
  return push(closed, openGames(closed, { kind: 'search', folder: k.folder, query: k.text }))
}

function appsInput(s: State, screen: Extract<Screen, { kind: 'apps' }>, b: Button): State {
  const rows = appRows(s)
  const moved = listMove(screen.cur, rows, APP_ROWS(s), b)
  if (moved) return replace(s, { ...screen, cur: moved })
  if (b === 'b') return pop(s)
  const app = rows[screen.cur.sel]
  if (b === 'menu')
    return push(s, popup(s, 'app', `${app ?? ''} Sub Options`, ['Hide App', 'Show Hidden Apps'], app ?? null))
  if (b === 'a' && app) return leave(s, { kind: 'app', app: app.replace(/\(Hidden\)$/, '') })
  return s
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function settingsInput(s: State, screen: Extract<Screen, { kind: 'settings' }>, b: Button): State {
  const rows = settingRows(s, screen.page)
  // Settings take A, the D-pad's sides and the shoulders as a row's own buttons (`settings_menu.py:52-56`).
  if (b === 'up' || b === 'down' || b === 'l2' || b === 'r2') {
    const moved = listMove(
      screen.cur,
      rows.map((r) => r.text),
      s.geo.descRows(rows),
      b,
    )!
    return replace(s, { ...screen, cur: moved })
  }
  if (b === 'b') return pop(s)
  const row = rows[screen.cur.sel]!.text
  const step = b === 'left' || b === 'l' ? -1 : b === 'right' || b === 'r' ? 1 : 0
  const lr = b === 'left' || b === 'right'
  const open = (page: SettingsPage) => (b === 'a' ? push(s, openSettings(s, page)) : s)
  switch (row) {
    case 'Power Off':
      return b === 'a' ? push(s, { kind: 'power' }) : s
    case 'Backlight':
      return step ? { ...s, backlight: clamp(s.backlight + step, 0, 10) } : s
    case 'Volume':
      return step ? { ...s, volume: clamp(s.volume + step, 0, 20), volumeShown: s.volumeShown + 1 } : s
    case 'WiFi':
      return lr ? { ...s, wifiOn: !s.wifiOn } : s
    case 'Bluetooth':
      return lr ? { ...s, bluetoothOn: !s.bluetoothOn } : s
    case 'Theme Settings':
      return open('theme')
    case 'Sound Settings':
      return open('sound')
    case 'Additional Settings':
      return open('additional')
    case 'Tasks':
      return open('tasks')
    case 'About this Device':
      return open('about')
    case 'Animation Settings':
      return open('animation')
    case 'Reload UI':
      return b === 'a' ? leave(s, { kind: 'reload' }) : s
    case 'Play Button Press Sound':
      return lr ? { ...s, buttonSound: !s.buttonSound } : s
    case 'Play BGM':
      return lr ? { ...s, bgm: !s.bgm } : s
    case 'BGM Volume':
      return step ? { ...s, bgmVolume: clamp(s.bgmVolume + step, 0, 10) } : s
    case 'Animations Enabled':
      return lr ? { ...s, animations: !s.animations } : s
    case 'Animation Speed': {
      const speeds = [0.5, 1, 1.5, 2, 2.5, 3]
      const i = speeds.indexOf(s.animationSpeed)
      return step ? { ...s, animationSpeed: speeds[(i + step + speeds.length) % speeds.length]! } : s
    }
    default:
      // Theme cycles through theme folders, and the other pages are not reproduced; see the porting notes.
      return s
  }
}

function switcherInput(s: State, screen: Extract<Screen, { kind: 'switcher' }>, b: Button): State {
  const games = switcherGames(s)
  const n = games.length
  if (b === 'b') return pop(s)
  if (!n) return s
  const step: Partial<Record<Button, number>> = { left: -1, down: -1, right: 1, up: 1, l: -5, r: 5 }
  if (step[b] !== undefined) {
    const axis = b === 'up' || b === 'down' ? 'y' : 'x'
    return replace(s, { ...screen, from: screen.sel, sel: (((screen.sel + step[b]!) % n) + n) % n, axis })
  }
  const game = games[screen.sel]!
  if (b === 'a') return leave(pop(s), { kind: 'game', game: gameKey(game) })
  if (b === 'x') {
    return push(s, {
      kind: 'config',
      game: gameKey(game),
      cur: openList(2 + GAME_CONFIG_ACTIONS.length, s.geo.descRows([{}]), 0),
      cpu: 0,
      core: CORES[game.system]!.options.indexOf(CORES[game.system]!.selected),
    })
  }
  if (b === 'menu')
    return push(
      s,
      popup(s, 'game', `${systemOf(game.system).label} Menu Sub Options`, gamePopupRows(s, game), gameKey(game)),
    )
  return s
}

export const current = top
export { gridWindow, APPS, ADDITIONAL_SETTINGS }
