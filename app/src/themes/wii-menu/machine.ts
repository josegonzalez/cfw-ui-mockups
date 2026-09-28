import type { Button } from '../../input/keymap'
import { CALENDAR, COLS, DATE, FILLED, GRID, PAGES, PER_PAGE, CHANNELS } from './library'

/**
 * The Wii Menu as a pure reducer: a stack of views, the grid's page and highlight, the HOME Menu
 * over whatever is showing, and the Settings the console keeps.
 *
 * The System Menu is closed source, so every transition here is the one the reference captures
 * show; where a capture shows a pointer doing something the + Control Pad has to reach instead, the
 * port's choice is recorded in `docs/porting/wii-menu.md`.
 */

export type BarItem = 'wii' | 'sd' | 'mail'
export type Focus = { readonly area: 'grid'; readonly slot: number } | { readonly area: 'bar'; readonly item: BarItem }

/** A Settings page lists four items; the focus is one of them, or the Back button. */
export type ListFocus = number | 'back'
/** A page of options: one option, or one of the two buttons along the bottom. */
export type ChoiceFocus = number | 'back' | 'confirm'

/** The Settings pages whose items open a list of their own. */
export type ListSection = 'screen' | 'calendar' | 'sensor-bar'
/** The Settings pages that pick one of a few options, with Back and Confirm. */
export type ChoiceSection = 'sound' | 'widescreen' | 'tv-resolution' | 'burn-in' | 'sensor-bar-position'

export type BoardFocus = 'calendar' | 'create' | 'wii'

export type View =
  | { readonly kind: 'health' }
  | { readonly kind: 'menu' }
  /** `stepped`: reached with - or + from another preview, rather than grown out of the grid. */
  | { readonly kind: 'preview'; readonly slot: number; readonly focus: 'menu' | 'start'; readonly stepped?: boolean }
  | { readonly kind: 'running'; readonly slot: number }
  | { readonly kind: 'options'; readonly focus: 0 | 1 | 'back' }
  | { readonly kind: 'data'; readonly focus: 0 | 1 | 'back' }
  | { readonly kind: 'settings'; readonly page: number; readonly focus: ListFocus }
  | { readonly kind: 'list'; readonly id: ListSection; readonly focus: ListFocus }
  | { readonly kind: 'choice'; readonly id: ChoiceSection; readonly selected: number; readonly focus: ChoiceFocus }
  | { readonly kind: 'update'; readonly focus: 'yes' | 'no' }
  | { readonly kind: 'sd'; readonly page: number; readonly dialog: 0 | 1 | 2; readonly focus: SdFocus }
  | { readonly kind: 'board'; readonly day: number; readonly focus: BoardFocus }
  | { readonly kind: 'board-calendar' }
  | { readonly kind: 'board-create'; readonly focus: 0 | 1 | 2 | 'back' }
  | { readonly kind: 'memo'; readonly focus: 'back' | 'post' }
  | { readonly kind: 'address'; readonly focus: 'back' | 'register' }
  | { readonly kind: 'no-miis' }

export type SdFocus = 'wii' | 'help' | 'back' | 'next' | 'close'

export type HomeFocus = 'close' | 'wii-menu' | 'reset' | 'remote'

export interface Prefs {
  /** Mono, Stereo, Surround. */
  readonly sound: number
  /** Standard (4:3), Widescreen (16:9). */
  readonly widescreen: number
  /** EDTV or HDTV (480p), Standard TV (480i). */
  readonly tvResolution: number
  /** On, Off. */
  readonly burnIn: number
  /** Above TV, Below TV. */
  readonly sensorBar: number
}

/**
 * The preview's zoom, which the root's clocks step through: drawn over its slot (`enter`), growing
 * to fill the screen (`opening`), `open`, and shrinking back (`leave`). A still settles every one
 * of them, so it is always the picture the zoom comes to rest on.
 */
export type Zoom = 'enter' | 'opening' | 'open' | 'leave'

/** Whether the panel is drawn at full size - growing towards it, or there. */
export const zoomedIn = (z: Zoom) => z === 'opening' || z === 'open'

export interface State {
  readonly stack: readonly View[]
  readonly page: number
  readonly focus: Focus
  readonly home: HomeFocus | null
  readonly prefs: Prefs
  /** The channel preview's zoom: grows out of the tile, then shrinks back into it. */
  readonly zoom: Zoom
  /** Memos posted to the Message Board, by day offset from `DATE`. */
  readonly memos: readonly number[]
  /** Bumped by Reset in the HOME Menu, so the running channel starts over. */
  readonly resets: number
  /**
   * Leaving Health & Safety: the warning fades to black (`out`), the screen stays black while the
   * menu loads (`black`), then the menu fades up. Null once it has.
   */
  readonly boot: 'out' | 'black' | null
  /**
   * A screen waiting for the one showing to finish its exit: the Wii Menu fading to black, or Wii
   * Options' chosen tile flying off.
   */
  readonly pending: View | null
  /** "Wii Menu" standing in the clock's place just after boot. */
  readonly bootLabel: boolean
  /** The SD Card Menu's "Loading from the SD Card..." box, just after it opens. */
  readonly sdLoading: boolean
}

/** The Wii's own defaults for a console set up for a 4:3 television. */
export const DEFAULT_PREFS: Prefs = { sound: 1, widescreen: 0, tvResolution: 1, burnIn: 0, sensorBar: 1 }

export interface Seed {
  /** Buttons pressed from power-on, in `LETTERS`, then every transition settled. */
  readonly events?: string
}

/** The seed alphabet: one letter per button, so a still reads as the presses that pose it. */
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
  s: 'start',
  e: 'select',
  m: 'menu',
}

export function initialState(seed: Seed = {}): State {
  let s: State = {
    stack: [{ kind: 'health' }],
    page: 0,
    focus: { area: 'grid', slot: 0 },
    home: null,
    prefs: DEFAULT_PREFS,
    zoom: 'open',
    memos: [],
    resets: 0,
    boot: null,
    pending: null,
    bootLabel: false,
    sdLoading: false,
  }
  for (const ch of seed.events ?? '') {
    const button = LETTERS[ch]
    if (!button) throw new Error(`Wii Menu seed: unknown letter ${ch}`)
    s = settle(reduce(s, button))
  }
  return s
}

export const top = (s: State): View => s.stack[s.stack.length - 1]!

/** One step of settling: the next transition in line, finished. */
function settleStep(s: State): State {
  if (s.boot !== null) return finishBoot(s)
  if (s.pending !== null) return finishPending(s)
  if (s.zoom === 'enter' || s.zoom === 'opening') return { ...s, zoom: 'open' }
  if (s.zoom === 'leave') return finishLeave(s)
  if (s.bootLabel || s.sdLoading) return { ...s, bootLabel: false, sdLoading: false }
  return s
}

/**
 * Every transition finished: what a still shows, and what the root's clocks arrive at. One
 * transition can lead to another - the menu's boot shows its label, the SD Card Menu opens on its
 * loading box - so this runs until nothing is left moving.
 */
export function settle(s: State): State {
  let next = settleStep(s)
  while (next !== s) {
    s = next
    next = settleStep(s)
  }
  return s
}

/** The black between Health & Safety and the menu is over: the menu is showing, labelled. */
export function finishBoot(s: State): State {
  return { ...s, boot: null, stack: [{ kind: 'menu' }], bootLabel: true }
}

/** The exit has played: the waiting screen is showing. The SD Card Menu opens loading. */
export function finishPending(s: State): State {
  if (!s.pending) return s
  return { ...s, pending: null, stack: [...s.stack, s.pending], sdLoading: s.pending.kind === 'sd' }
}

/** The preview has shrunk back into its tile: it is gone, and the grid is showing. */
export function finishLeave(s: State): State {
  return { ...s, zoom: 'open', stack: s.stack.slice(0, -1) }
}

const push = (s: State, v: View): State => ({ ...s, stack: [...s.stack, v] })
const pop = (s: State): State => (s.stack.length > 1 ? { ...s, stack: s.stack.slice(0, -1) } : s)
const replace = (s: State, v: View): State => ({ ...s, stack: [...s.stack.slice(0, -1), v] })

export function reduce(s: State, button: Button): State {
  // Something is still moving: the System Menu takes no input until it settles.
  if (s.zoom !== 'open' || s.boot !== null || s.pending !== null) return s
  if (s.home !== null) return home(s, button, s.home)
  const v = top(s)
  if (button === 'menu' && v.kind !== 'health') return { ...s, home: 'close' }
  switch (v.kind) {
    case 'health':
      return button === 'a' ? { ...s, boot: 'out' } : s
    case 'menu':
      return menu(s, button)
    case 'preview':
      return preview(s, button, v)
    case 'running':
      return s
    case 'options':
      return options(s, button, v)
    case 'data':
      return data(s, button, v)
    case 'settings':
      return settings(s, button, v)
    case 'list':
      return list(s, button, v)
    case 'choice':
      return choice(s, button, v)
    case 'update':
      return update(s, button, v)
    case 'sd':
      return sd(s, button, v)
    case 'board':
      return board(s, button, v)
    case 'board-calendar':
      return button === 'a' || button === 'b' ? pop(s) : s
    case 'board-create':
      return boardCreate(s, button, v)
    case 'memo':
      return memo(s, button, v)
    case 'address':
      return address(s, button, v)
    case 'no-miis':
      return button === 'a' || button === 'b' ? pop(s) : s
  }
}

/* ---- the Wii Menu ---- */

const turn = (s: State, by: number): State => {
  const page = s.page + by
  return page < 0 || page >= PAGES ? s : { ...s, page }
}

function menu(s: State, button: Button): State {
  const f = s.focus
  if (button === 'l' || button === 'select') return turn(s, -1)
  if (button === 'r' || button === 'start') return turn(s, 1)
  if (f.area === 'grid') {
    const col = f.slot % COLS
    const row = Math.floor(f.slot / COLS)
    switch (button) {
      case 'left':
        if (col > 0) return { ...s, focus: { area: 'grid', slot: f.slot - 1 } }
        return s.page > 0 ? { ...s, page: s.page - 1, focus: { area: 'grid', slot: f.slot + COLS - 1 } } : s
      case 'right':
        if (col < COLS - 1) return { ...s, focus: { area: 'grid', slot: f.slot + 1 } }
        return s.page < PAGES - 1 ? { ...s, page: s.page + 1, focus: { area: 'grid', slot: f.slot - COLS + 1 } } : s
      case 'up':
        return row > 0 ? { ...s, focus: { area: 'grid', slot: f.slot - COLS } } : s
      case 'down':
        if (row < 2) return { ...s, focus: { area: 'grid', slot: f.slot + COLS } }
        return { ...s, focus: { area: 'bar', item: col === 0 ? 'wii' : col === 1 ? 'sd' : 'mail' } }
      case 'a': {
        const slot = s.page * PER_PAGE + f.slot
        return GRID[slot] ? { ...push(s, { kind: 'preview', slot, focus: 'menu' }), zoom: 'enter' } : s
      }
      default:
        return s
    }
  }
  const order: BarItem[] = ['wii', 'sd', 'mail']
  const at = order.indexOf(f.item)
  switch (button) {
    case 'left':
      return at > 0 ? { ...s, focus: { area: 'bar', item: order[at - 1]! } } : s
    case 'right':
      return at < order.length - 1 ? { ...s, focus: { area: 'bar', item: order[at + 1]! } } : s
    case 'up':
      return { ...s, focus: { area: 'grid', slot: 2 * COLS + (f.item === 'wii' ? 0 : f.item === 'sd' ? 1 : COLS - 1) } }
    case 'a':
      // Wii Options and the SD Card Menu open once the menu has faded to black.
      if (f.item === 'wii') return { ...s, pending: { kind: 'options', focus: 1 } }
      if (f.item === 'sd') return { ...s, pending: { kind: 'sd', page: 0, dialog: 0, focus: 'wii' } }
      return push(s, { kind: 'board', day: 0, focus: 'wii' })
    default:
      return s
  }
}

/** The grid follows the preview, so backing out lands on the channel last shown. */
const showSlot = (s: State, slot: number): State => ({
  ...s,
  page: Math.floor(slot / PER_PAGE),
  focus: { area: 'grid', slot: slot % PER_PAGE },
})

function preview(s: State, button: Button, v: Extract<View, { kind: 'preview' }>): State {
  const startable = CHANNELS[GRID[v.slot]!].startable
  const step = (by: number) => {
    const at = FILLED.indexOf(v.slot)
    const slot = FILLED[(at + by + FILLED.length) % FILLED.length]!
    return replace(showSlot(s, slot), { kind: 'preview', slot, focus: 'menu', stepped: true })
  }
  switch (button) {
    case 'l':
    case 'select':
      return step(-1)
    case 'r':
    case 'start':
      return step(1)
    case 'left':
      return replace(s, { ...v, focus: 'menu' })
    case 'right':
      return startable ? replace(s, { ...v, focus: 'start' }) : s
    case 'b':
      return { ...s, zoom: 'leave' }
    case 'a':
      if (v.focus === 'menu') return { ...s, zoom: 'leave' }
      return push(s, { kind: 'running', slot: v.slot })
    default:
      return s
  }
}

/* ---- the HOME Menu ---- */

function home(s: State, button: Button, f: HomeFocus): State {
  const running = top(s).kind === 'running'
  const close: State = { ...s, home: null }
  if (button === 'menu' || button === 'b') return close
  // Over a channel the HOME Menu offers Wii Menu and Reset; over the Wii Menu itself it has neither.
  const middle: HomeFocus[] = running ? ['wii-menu', 'reset'] : []
  switch (button) {
    case 'up':
      if (f === 'remote') return { ...s, home: middle[0] ?? 'close' }
      if (f === 'wii-menu' || f === 'reset') return { ...s, home: 'close' }
      return s
    case 'down':
      if (f === 'close') return { ...s, home: middle[0] ?? 'remote' }
      if (f === 'wii-menu' || f === 'reset') return { ...s, home: 'remote' }
      return s
    case 'left':
      return f === 'reset' ? { ...s, home: 'wii-menu' } : s
    case 'right':
      return f === 'wii-menu' ? { ...s, home: 'reset' } : s
    case 'a':
      if (f === 'close') return close
      if (f === 'wii-menu') return { ...close, stack: [{ kind: 'menu' }] }
      if (f === 'reset') return { ...close, resets: s.resets + 1 }
      return s
    default:
      return s
  }
}

/* ---- Wii Options and Data Management ---- */

function options(s: State, button: Button, v: Extract<View, { kind: 'options' }>): State {
  switch (button) {
    case 'left':
      return v.focus === 1 ? replace(s, { ...v, focus: 0 }) : s
    case 'right':
      return v.focus === 0 ? replace(s, { ...v, focus: 1 }) : s
    case 'down':
      return replace(s, { ...v, focus: 'back' })
    case 'up':
      return v.focus === 'back' ? replace(s, { ...v, focus: 0 }) : s
    case 'b':
      return pop(s)
    case 'a':
      if (v.focus === 'back') return pop(s)
      // The chosen tile flies off before the next screen comes up.
      if (v.focus === 0) return { ...s, pending: { kind: 'data', focus: 0 } }
      return { ...s, pending: { kind: 'settings', page: 0, focus: 0 } }
    default:
      return s
  }
}

function data(s: State, button: Button, v: Extract<View, { kind: 'data' }>): State {
  switch (button) {
    case 'left':
      return v.focus === 1 ? replace(s, { ...v, focus: 0 }) : s
    case 'right':
      return v.focus === 0 ? replace(s, { ...v, focus: 1 }) : s
    case 'down':
      return replace(s, { ...v, focus: 'back' })
    case 'up':
      return v.focus === 'back' ? replace(s, { ...v, focus: 0 }) : s
    case 'b':
      return pop(s)
    case 'a':
      return v.focus === 'back' ? pop(s) : s
    default:
      return s
  }
}

/* ---- Wii Settings ---- */

/** A vertical list of `n` items with Back below them. */
function listMove(focus: ListFocus, n: number, button: Button): ListFocus {
  if (button === 'down') return focus === 'back' ? 'back' : focus + 1 < n ? focus + 1 : 'back'
  if (button === 'up') return focus === 'back' ? n - 1 : Math.max(0, focus - 1)
  return focus
}

/** What each Settings item opens, page by page; `null` is an item this port does not open. */
export const SETTINGS_ITEMS: readonly (readonly (View | null)[])[] = [
  [null, { kind: 'list', id: 'calendar', focus: 0 }, { kind: 'list', id: 'screen', focus: 0 }, { kind: 'choice', id: 'sound', selected: -1, focus: 0 }],
  [null, { kind: 'list', id: 'sensor-bar', focus: 0 }, null, null],
  [null, null, { kind: 'update', focus: 'yes' }, null],
]

export const LIST_ITEMS: Readonly<Record<ListSection, readonly (View | null)[]>> = {
  screen: [
    null,
    { kind: 'choice', id: 'widescreen', selected: -1, focus: 0 },
    { kind: 'choice', id: 'tv-resolution', selected: -1, focus: 0 },
    { kind: 'choice', id: 'burn-in', selected: -1, focus: 0 },
  ],
  calendar: [null, null],
  'sensor-bar': [{ kind: 'choice', id: 'sensor-bar-position', selected: -1, focus: 0 }, null],
}

const PREF_OF: Readonly<Record<ChoiceSection, keyof Prefs>> = {
  sound: 'sound',
  widescreen: 'widescreen',
  'tv-resolution': 'tvResolution',
  'burn-in': 'burnIn',
  'sensor-bar-position': 'sensorBar',
}

export const CHOICE_COUNT: Readonly<Record<ChoiceSection, number>> = {
  sound: 3,
  widescreen: 2,
  'tv-resolution': 2,
  'burn-in': 2,
  'sensor-bar-position': 2,
}

/** Opening a choice starts from what the console has saved. */
function open(s: State, v: View | null): State {
  if (!v) return s
  if (v.kind === 'choice') return push(s, { ...v, selected: s.prefs[PREF_OF[v.id]] })
  return push(s, v)
}

export const SETTINGS_PAGES = 3

function settings(s: State, button: Button, v: Extract<View, { kind: 'settings' }>): State {
  switch (button) {
    case 'left':
    case 'l':
    case 'select':
      return v.page > 0 ? replace(s, { ...v, page: v.page - 1 }) : s
    case 'right':
    case 'r':
    case 'start':
      return v.page < SETTINGS_PAGES - 1 ? replace(s, { ...v, page: v.page + 1 }) : s
    case 'up':
    case 'down':
      return replace(s, { ...v, focus: listMove(v.focus, 4, button) })
    case 'b':
      return pop(s)
    case 'a':
      return v.focus === 'back' ? pop(s) : open(s, SETTINGS_ITEMS[v.page]![v.focus]!)
    default:
      return s
  }
}

function list(s: State, button: Button, v: Extract<View, { kind: 'list' }>): State {
  const items = LIST_ITEMS[v.id]
  switch (button) {
    case 'up':
    case 'down':
      return replace(s, { ...v, focus: listMove(v.focus, items.length, button) })
    case 'b':
      return pop(s)
    case 'a':
      return v.focus === 'back' ? pop(s) : open(s, items[v.focus]!)
    default:
      return s
  }
}

function choice(s: State, button: Button, v: Extract<View, { kind: 'choice' }>): State {
  const n = CHOICE_COUNT[v.id]
  // Widescreen Settings lays its two options side by side; the rest stack them.
  const across = v.id === 'widescreen'
  const f = v.focus
  const to = (focus: ChoiceFocus) => replace(s, { ...v, focus })
  const onButtons = f === 'back' || f === 'confirm'
  switch (button) {
    case 'up':
      if (onButtons) return to(across ? 0 : n - 1)
      return !across && f > 0 ? to(f - 1) : s
    case 'down':
      if (onButtons) return s
      return !across && f < n - 1 ? to(f + 1) : to('back')
    case 'left':
      if (f === 'confirm') return to('back')
      return across && typeof f === 'number' && f > 0 ? to(f - 1) : s
    case 'right':
      if (f === 'back') return to('confirm')
      return across && typeof f === 'number' && f < n - 1 ? to(f + 1) : s
    case 'b':
      return pop(s)
    case 'a':
      if (f === 'back') return pop(s)
      if (f === 'confirm') return { ...pop(s), prefs: { ...s.prefs, [PREF_OF[v.id]]: v.selected } }
      return replace(s, { ...v, selected: f })
    default:
      return s
  }
}

function update(s: State, button: Button, v: Extract<View, { kind: 'update' }>): State {
  switch (button) {
    case 'left':
      return replace(s, { ...v, focus: 'yes' })
    case 'right':
      return replace(s, { ...v, focus: 'no' })
    case 'a':
    case 'b':
      return pop(s)
    default:
      return s
  }
}

/* ---- the SD Card Menu ---- */

export const SD_PAGES = 20

function sd(s: State, button: Button, v: Extract<View, { kind: 'sd' }>): State {
  const to = (patch: Partial<Extract<View, { kind: 'sd' }>>) => replace(s, { ...v, ...patch })
  if (v.dialog === 0) {
    switch (button) {
      case 'l':
      case 'select':
        return v.page > 0 ? to({ page: v.page - 1 }) : s
      case 'r':
      case 'start':
        return v.page < SD_PAGES - 1 ? to({ page: v.page + 1 }) : s
      case 'left':
        return to({ focus: 'wii' })
      case 'right':
        return to({ focus: 'help' })
      case 'b':
        return pop(s)
      case 'a':
        return v.focus === 'wii' ? pop(s) : to({ dialog: 1, focus: 'next' })
      default:
        return s
    }
  }
  // The About dialog: two pages, Back and Next on the first, Back and Close on the second.
  const second = v.dialog === 2 ? 'close' : 'next'
  switch (button) {
    case 'left':
      return to({ focus: 'back' })
    case 'right':
      return to({ focus: second })
    case 'b':
      return v.dialog === 2 ? to({ dialog: 1, focus: 'next' }) : to({ dialog: 0, focus: 'help' })
    case 'a':
      if (v.focus === 'back') return v.dialog === 2 ? to({ dialog: 1, focus: 'next' }) : to({ dialog: 0, focus: 'help' })
      if (v.focus === 'next') return to({ dialog: 2, focus: 'close' })
      return to({ dialog: 0, focus: 'help' })
    default:
      return s
  }
}

/* ---- the Wii Message Board ---- */

const BOARD_ROW: BoardFocus[] = ['calendar', 'create', 'wii']

function board(s: State, button: Button, v: Extract<View, { kind: 'board' }>): State {
  const at = BOARD_ROW.indexOf(v.focus)
  switch (button) {
    case 'left':
      return at > 0 ? replace(s, { ...v, focus: BOARD_ROW[at - 1]! }) : s
    case 'right':
      return at < BOARD_ROW.length - 1 ? replace(s, { ...v, focus: BOARD_ROW[at + 1]! }) : s
    // The arrows either side of the board turn the day; the board holds nothing after today.
    case 'l':
    case 'select':
      return v.day > -(DATE.day - 1) ? replace(s, { ...v, day: v.day - 1 }) : s
    case 'r':
    case 'start':
      return v.day < 0 ? replace(s, { ...v, day: v.day + 1 }) : s
    case 'b':
      return pop(s)
    case 'a':
      if (v.focus === 'wii') return pop(s)
      if (v.focus === 'calendar') return push(s, { kind: 'board-calendar' })
      return push(s, { kind: 'board-create', focus: 0 })
    default:
      return s
  }
}

function boardCreate(s: State, button: Button, v: Extract<View, { kind: 'board-create' }>): State {
  const f = v.focus
  switch (button) {
    case 'left':
      return typeof f === 'number' && f > 0 ? replace(s, { ...v, focus: (f - 1) as 0 | 1 }) : s
    case 'right':
      return typeof f === 'number' && f < 2 ? replace(s, { ...v, focus: (f + 1) as 1 | 2 }) : s
    case 'down':
      return replace(s, { ...v, focus: 'back' })
    case 'up':
      return f === 'back' ? replace(s, { ...v, focus: 0 }) : s
    case 'b':
      return pop(s)
    case 'a':
      if (f === 'back') return pop(s)
      if (f === 0) return push(s, { kind: 'memo', focus: 'post' })
      if (f === 1) return push(s, { kind: 'no-miis' })
      return push(s, { kind: 'address', focus: 'back' })
    default:
      return s
  }
}

function memo(s: State, button: Button, v: Extract<View, { kind: 'memo' }>): State {
  switch (button) {
    case 'left':
      return replace(s, { ...v, focus: 'back' })
    case 'right':
      return replace(s, { ...v, focus: 'post' })
    case 'b':
      return pop(s)
    case 'a': {
      if (v.focus === 'back') return pop(s)
      // Posting puts the memo on the board for the day being shown, and goes back to the board.
      const boardAt = s.stack.map((x) => x.kind).lastIndexOf('board')
      const day = (s.stack[boardAt] as Extract<View, { kind: 'board' }>).day
      return { ...s, stack: s.stack.slice(0, boardAt + 1), memos: [...s.memos, day] }
    }
    default:
      return s
  }
}

function address(s: State, button: Button, v: Extract<View, { kind: 'address' }>): State {
  switch (button) {
    case 'left':
      return replace(s, { ...v, focus: 'back' })
    case 'right':
      return replace(s, { ...v, focus: 'register' })
    case 'b':
      return pop(s)
    case 'a':
      return v.focus === 'back' ? pop(s) : s
    default:
      return s
  }
}

/* ---- dates ---- */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The board's date label for a day offset from `DATE` - always within `DATE`'s month. */
export function dayLabel(offset: number): string {
  const day = DATE.day + offset
  const weekday = WEEKDAYS[(CALENDAR.firstWeekday + day - 1) % 7]
  return `${weekday} ${DATE.month}/${day}`
}
