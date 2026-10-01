import type { Button } from '../../input/keymap'
import { BOOT_CLOCK, CARD_BLOCKS, CARD_SLOT, CLOCK, CLOCK_FIELDS, FILES, type Clock, type VmuFile } from './library'

/**
 * The BIOS menu as a pure reducer: a stack of views, the main menu's cursor, and what the console
 * keeps - its clock, its Settings, and the saves on the one memory card.
 *
 * The BIOS is closed, so every transition here is one the reference recording shows
 * (`docs/themes/dreamcast-bios/reference/README.md`) or the US manual describes; where neither
 * says, the choice is recorded in `docs/porting/dreamcast-bios.md`. A opens and B goes back
 * everywhere, as the manual has it, and BACK on screen does what B does.
 */

/** Main menu items, in reading order: Play, File, Music, Settings. */
export type MainItem = 0 | 1 | 2 | 3

/** Settings rows: Language, Date/Time, Sound, Auto start, the memory-card clock, then BACK. */
export const SETTINGS_BACK = 5
/** The clock editor's stops: five fields, then Select, then Cancel (only the Settings editor has one). */
export const CLOCK_SELECT = 5
export const CLOCK_CANCEL = 6
/** Music's stops, left to right: BACK, previous, stop, play/pause, next, repeat. */
export const MUSIC_STOPS = 6
export const MUSIC_PLAY = 3
/** The card picker's eight sockets, ports A-D by column, sockets 1 and 2 by row. */
export const SOCKETS = 8

export type View =
  /** Power-on: the logo on grey, while the boot sound plays. It takes no input and moves on by itself. */
  | { readonly kind: 'boot'; readonly next: View }
  | { readonly kind: 'boot-clock'; readonly focus: number; readonly draft: Clock }
  | { readonly kind: 'main' }
  | { readonly kind: 'no-disc' }
  | { readonly kind: 'settings'; readonly focus: number }
  | { readonly kind: 'language'; readonly focus: number }
  | { readonly kind: 'clock'; readonly focus: number; readonly draft: Clock }
  | { readonly kind: 'sound'; readonly focus: number }
  | { readonly kind: 'auto'; readonly focus: number }
  | { readonly kind: 'card-clock'; readonly focus: number }
  | { readonly kind: 'card-clock-done' }
  | { readonly kind: 'cards'; readonly focus: number | 'back'; readonly purpose: 'browse' | 'copy' }
  | { readonly kind: 'files'; readonly focus: number | 'all' | 'back' }
  | { readonly kind: 'file-menu'; readonly focus: number; readonly all: boolean }
  | { readonly kind: 'delete'; readonly focus: number; readonly all: boolean }
  | { readonly kind: 'deleted' }
  | { readonly kind: 'music'; readonly focus: number }

export type ViewKind = View['kind']

/** The views drawn as a box over the screen under them rather than as a screen of their own. */
const DIALOGS: ReadonlySet<ViewKind> = new Set(['language', 'clock', 'sound', 'auto', 'card-clock', 'card-clock-done', 'file-menu', 'delete', 'deleted'])
export const isDialog = (v: View) => DIALOGS.has(v.kind)

export interface Prefs {
  /** Index into `LANGUAGE_NAMES`: Japanese, English, German, French, Spanish, Italian. */
  readonly language: number
  readonly stereo: boolean
  readonly autoStart: boolean
}

export interface State {
  readonly stack: readonly View[]
  readonly main: MainItem
  readonly prefs: Prefs
  readonly clock: Clock
  /** The saves still on the card, by id, in `FILES` order. */
  readonly files: readonly string[]
  /** Saves picked with X or Y, to act on together. */
  readonly marked: readonly string[]
  /** Off, one track, all tracks. */
  readonly repeat: 0 | 1 | 2
  /**
   * The screen showing is fading out for this stack. The BIOS takes no input until it is up.
   */
  readonly pending: readonly View[] | null
}

export const DEFAULT_PREFS: Prefs = { language: 1, stereo: true, autoStart: false }

export interface Seed {
  /** Buttons pressed from power-on, in `LETTERS`, with every transition settled after each. */
  readonly events?: string
  /** Power on with the clock lost, so the BIOS asks for it first (`frames/boot-clock.png`). */
  readonly firstBoot?: boolean
  /** Start at power-on, on the logo, rather than on the screen after it. */
  readonly boot?: boolean
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
}

export function initialState(seed: Seed = {}): State {
  const first: View = seed.firstBoot ? { kind: 'boot-clock', focus: 0, draft: BOOT_CLOCK } : { kind: 'main' }
  let s: State = {
    stack: [seed.boot ? { kind: 'boot', next: first } : first],
    main: 0,
    prefs: DEFAULT_PREFS,
    clock: seed.firstBoot ? BOOT_CLOCK : CLOCK,
    files: FILES.map((f) => f.id),
    marked: [],
    repeat: 0,
    pending: null,
  }
  for (const ch of seed.events ?? '') {
    const button = LETTERS[ch]
    if (!button) throw new Error(`Dreamcast BIOS seed: unknown letter ${ch}`)
    s = settle(reduce(s, button))
  }
  return s
}

export const top = (s: State): View => s.stack[s.stack.length - 1]!

/** The screen a view is drawn on: a dialog's is the one under it. */
export function screenOf(stack: readonly View[]): View {
  for (let i = stack.length - 1; i >= 0; i--) if (!isDialog(stack[i]!)) return stack[i]!
  return stack[0]!
}

/** What distinguishes one screen from another for the fade between them. */
export function screenKey(stack: readonly View[]): string {
  const v = screenOf(stack)
  return v.kind === 'cards' ? `cards:${v.purpose}` : v.kind
}

/** The fade has finished: the waiting stack is showing. */
export function finishPending(s: State): State {
  return s.pending ? { ...s, stack: s.pending, pending: null } : s
}

/**
 * Every transition finished: what a still shows, and what the root's clock arrives at. The boot
 * logo is not a transition but a screen of its own, held until the root's clock ends it, so a still
 * posed on it stays on it.
 */
export const settle = (s: State): State => finishPending(s)

/** The logo has had its time: the screen after it fades up. */
export function finishBoot(s: State): State {
  const v = top(s)
  return v.kind === 'boot' ? go(s, [v.next]) : s
}

export const filesOf = (s: State): VmuFile[] => FILES.filter((f) => s.files.includes(f.id))
export const usedBlocks = (s: State) => filesOf(s).reduce((n, f) => n + f.blocks, 0)
export const freeBlocks = (s: State) => CARD_BLOCKS - usedBlocks(s)

/**
 * Go to a new stack. A new screen fades the old one out first; a dialog opening or closing over
 * the same screen happens at once.
 */
function go(s: State, stack: readonly View[]): State {
  if (screenKey(stack) === screenKey(s.stack)) return { ...s, stack }
  return { ...s, pending: stack }
}

const push = (s: State, v: View) => go(s, [...s.stack, v])
const pop = (s: State) => (s.stack.length > 1 ? go(s, s.stack.slice(0, -1)) : s)
const replace = (s: State, v: View) => ({ ...s, stack: [...s.stack.slice(0, -1), v] })
const home = (s: State) => go(s, [{ kind: 'main' }])

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const wrap = (n: number, lo: number, hi: number) => (n > hi ? lo : n < lo ? hi : n)

/** One of the clock's fields stepped up or down, wrapping within its range. */
export function stepClock(c: Clock, field: number, by: number): Clock {
  const f = CLOCK_FIELDS[field]!
  return { ...c, [f.key]: wrap(c[f.key] + by, f.min, f.max) }
}

/**
 * One press. A press that moves nothing - the cursor against an edge, A on an empty socket - returns
 * the state it was given, the same object, so the root can tell it was a press that did nothing and
 * make no sound.
 */
export function reduce(s: State, button: Button): State {
  const next = step(s, button)
  return next === s || JSON.stringify(next) === JSON.stringify(s) ? s : next
}

function step(s: State, button: Button): State {
  if (s.pending) return s
  const v = top(s)
  switch (v.kind) {
    case 'boot':
      return s
    case 'boot-clock':
      return bootClock(s, v, button)
    case 'main':
      return main(s, button)
    case 'no-disc':
      return button === 'a' || button === 'b' ? home(s) : s
    case 'settings':
      return settings(s, v, button)
    case 'language':
      return choice(s, v.focus, 7, button, (focus) => replace(s, { ...v, focus }), (i) =>
        i < 6 ? { ...pop(s), prefs: { ...s.prefs, language: i } } : pop(s),
      )
    case 'sound':
      return choice(s, v.focus, 3, button, (focus) => replace(s, { ...v, focus }), (i) =>
        i < 2 ? { ...pop(s), prefs: { ...s.prefs, stereo: i === 0 } } : pop(s),
      )
    case 'auto':
      return choice(s, v.focus, 3, button, (focus) => replace(s, { ...v, focus }), (i) =>
        i < 2 ? { ...pop(s), prefs: { ...s.prefs, autoStart: i === 0 } } : pop(s),
      )
    case 'card-clock':
      // Select sets every card's clock to the console's, and says so in a box over this one
      // (`frames/settings-vmu-done.png`); Cancel leaves them.
      return choice(s, v.focus, 2, button, (focus) => replace(s, { ...v, focus }), (i) =>
        i === 0 ? push(s, { kind: 'card-clock-done' }) : pop(s),
      )
    case 'card-clock-done':
      // Dismissing it closes both boxes.
      return button === 'a' || button === 'b' ? go(s, s.stack.slice(0, -2)) : s
    case 'clock':
      return clock(s, v, button)
    case 'cards':
      return cards(s, v, button)
    case 'files':
      return files(s, v, button)
    case 'file-menu':
      return fileMenu(s, v, button)
    case 'delete':
      return deleteConfirm(s, v, button)
    case 'deleted':
      return button === 'a' || button === 'b' ? pop(s) : s
    case 'music':
      return music(s, v, button)
  }
}

/** A dialog's list: up and down move without wrapping, A picks, B is Cancel. */
function choice(s: State, focus: number, n: number, button: Button, move: (f: number) => State, pick: (i: number) => State): State {
  if (button === 'up') return move(clamp(focus - 1, 0, n - 1))
  if (button === 'down') return move(clamp(focus + 1, 0, n - 1))
  if (button === 'a') return pick(focus)
  if (button === 'b') return pop(s)
  return s
}

function bootClock(s: State, v: Extract<View, { kind: 'boot-clock' }>, button: Button): State {
  const onField = v.focus < CLOCK_SELECT
  if (button === 'left') return replace(s, { ...v, focus: clamp(v.focus - 1, 0, CLOCK_SELECT) })
  if (button === 'right') return replace(s, { ...v, focus: clamp(v.focus + 1, 0, CLOCK_SELECT) })
  if (onField && (button === 'up' || button === 'down')) {
    return replace(s, { ...v, draft: stepClock(v.draft, v.focus, button === 'up' ? 1 : -1) })
  }
  // The first-boot box has no Cancel: Select is the only way on, and it sets the clock.
  if (button === 'a' && !onField) return { ...go(s, [{ kind: 'main' }]), clock: v.draft }
  return s
}

function main(s: State, button: Button): State {
  const col = s.main % 2
  const row = Math.floor(s.main / 2)
  const at = (c: number, r: number) => ({ ...s, main: (r * 2 + c) as MainItem })
  if (button === 'left') return at(0, row)
  if (button === 'right') return at(1, row)
  if (button === 'up') return at(col, 0)
  if (button === 'down') return at(col, 1)
  if (button !== 'a') return s
  switch (s.main) {
    case 0:
      return push(s, { kind: 'no-disc' })
    case 1:
      return push(s, { kind: 'cards', focus: CARD_SLOT, purpose: 'browse' })
    case 2:
      return push(s, { kind: 'music', focus: MUSIC_PLAY })
    case 3:
      return push(s, { kind: 'settings', focus: 0 })
  }
}

function settings(s: State, v: Extract<View, { kind: 'settings' }>, button: Button): State {
  if (button === 'up') return replace(s, { ...v, focus: clamp(v.focus - 1, 0, SETTINGS_BACK) })
  if (button === 'down') return replace(s, { ...v, focus: clamp(v.focus + 1, 0, SETTINGS_BACK) })
  if (button === 'b') return home(s)
  if (button !== 'a') return s
  switch (v.focus) {
    case 0:
      return push(s, { kind: 'language', focus: s.prefs.language })
    case 1:
      return push(s, { kind: 'clock', focus: 0, draft: s.clock })
    case 2:
      return push(s, { kind: 'sound', focus: s.prefs.stereo ? 0 : 1 })
    case 3:
      return push(s, { kind: 'auto', focus: s.prefs.autoStart ? 0 : 1 })
    case 4:
      return push(s, { kind: 'card-clock', focus: 0 })
    default:
      return home(s)
  }
}

function clock(s: State, v: Extract<View, { kind: 'clock' }>, button: Button): State {
  const onField = v.focus < CLOCK_SELECT
  if (button === 'left') return replace(s, { ...v, focus: onField ? clamp(v.focus - 1, 0, 4) : 4 })
  if (button === 'right' && onField) return replace(s, { ...v, focus: clamp(v.focus + 1, 0, CLOCK_SELECT) })
  if (button === 'up' || button === 'down') {
    if (onField) return replace(s, { ...v, draft: stepClock(v.draft, v.focus, button === 'up' ? 1 : -1) })
    return replace(s, { ...v, focus: button === 'up' ? CLOCK_SELECT : CLOCK_CANCEL })
  }
  if (button === 'a' && v.focus === CLOCK_SELECT) return { ...pop(s), clock: v.draft }
  if (button === 'b' || (button === 'a' && v.focus === CLOCK_CANCEL)) return pop(s)
  return s
}

function cards(s: State, v: Extract<View, { kind: 'cards' }>, button: Button): State {
  // BACK sits under the first column, so left from the first column and down from its lower socket reach it.
  if (v.focus === 'back') {
    if (button === 'right' || button === 'up') return replace(s, { ...v, focus: 1 })
    if (button === 'a' || button === 'b') return pop(s)
    return s
  }
  const port = Math.floor(v.focus / 2)
  const socket = v.focus % 2
  const at = (p: number, k: number) => replace(s, { ...v, focus: p * 2 + k })
  if (button === 'left') return port === 0 ? replace(s, { ...v, focus: 'back' }) : at(port - 1, socket)
  if (button === 'right') return at(clamp(port + 1, 0, 3), socket)
  if (button === 'up') return at(port, 0)
  if (button === 'down') return socket === 1 && port === 0 ? replace(s, { ...v, focus: 'back' }) : at(port, 1)
  if (button === 'b') return pop(s)
  // Only A-1 holds a card. As the destination of a copy it is also the source, so there is nowhere to copy to.
  if (button === 'a' && v.focus === CARD_SLOT && v.purpose === 'browse') {
    return push(s, { kind: 'files', focus: s.files.length ? 0 : 'all' })
  }
  return s
}

/** The file grid is eight across; ALL sits above-left of it and BACK below-left. */
const COLS = 8

function files(s: State, v: Extract<View, { kind: 'files' }>, button: Button): State {
  const n = s.files.length
  const set = (focus: number | 'all' | 'back') => replace(s, { ...v, focus })
  if (v.focus === 'all') {
    if ((button === 'right' || button === 'down') && n) return set(0)
    if (button === 'a' && n) return push(s, { kind: 'file-menu', focus: 0, all: true })
    if (button === 'b') return pop(s)
    return s
  }
  if (v.focus === 'back') {
    if (button === 'up') return set('all')
    if (button === 'right' && n) return set(Math.min(n - 1, COLS))
    if (button === 'a' || button === 'b') return pop(s)
    return s
  }
  const i = v.focus
  const col = i % COLS
  if (button === 'left') return col === 0 ? set('all') : set(i - 1)
  if (button === 'right') return set(Math.min(n - 1, i + 1))
  if (button === 'up') return i < COLS ? set('all') : set(i - COLS)
  if (button === 'down') return i + COLS < n ? set(i + COLS) : set('back')
  if (button === 'b') return pop(s)
  if (button === 'x' || button === 'y') return mark(s, s.files[i]!)
  if (button === 'a') return push(s, { kind: 'file-menu', focus: 0, all: false })
  return s
}

/** X and Y pick saves of one game to act on together; a save of another game starts a new group. */
function mark(s: State, id: string): State {
  const game = FILES.find((f) => f.id === id)!.game
  const same = s.marked.filter((m) => FILES.find((f) => f.id === m)!.game === game)
  const marked = same.includes(id) ? same.filter((m) => m !== id) : [...same, id]
  return { ...s, marked }
}

function fileMenu(s: State, v: Extract<View, { kind: 'file-menu' }>, button: Button): State {
  return choice(s, v.focus, 3, button, (focus) => replace(s, { ...v, focus }), (i) => {
    // Copy asks where to; there is no second card, so the picker is as far as a copy can go.
    if (i === 0) return go(s, [...s.stack.slice(0, -1), { kind: 'cards', focus: CARD_SLOT, purpose: 'copy' }])
    if (i === 1) return replace(s, { kind: 'delete', focus: 1, all: v.all })
    return pop(s)
  })
}

function deleteConfirm(s: State, v: Extract<View, { kind: 'delete' }>, button: Button): State {
  return choice(s, v.focus, 2, button, (focus) => replace(s, { ...v, focus }), (i) => {
    if (i !== 0) return pop(s)
    const list = s.stack[s.stack.length - 2] as Extract<View, { kind: 'files' }>
    const focused = typeof list.focus === 'number' ? s.files[list.focus] : undefined
    const doomed = v.all ? s.files : s.marked.length ? s.marked : focused ? [focused] : []
    const left = s.files.filter((id) => !doomed.includes(id))
    const focus = left.length ? Math.min(typeof list.focus === 'number' ? list.focus : 0, left.length - 1) : 'all'
    // "File was deleted." then stands over the list, with a blob to press, until A or B.
    return {
      ...s,
      files: left,
      marked: [],
      stack: [...s.stack.slice(0, -2), { ...list, focus }, { kind: 'deleted' }],
    }
  })
}

function music(s: State, v: Extract<View, { kind: 'music' }>, button: Button): State {
  if (button === 'left') return replace(s, { ...v, focus: clamp(v.focus - 1, 0, MUSIC_STOPS - 1) })
  if (button === 'right') return replace(s, { ...v, focus: clamp(v.focus + 1, 0, MUSIC_STOPS - 1) })
  if (button === 'b' || (button === 'a' && v.focus === 0)) return home(s)
  // With no disc in, the transport has nothing to play; only repeat keeps a setting.
  if (button === 'a' && v.focus === MUSIC_STOPS - 1) return { ...s, repeat: ((s.repeat + 1) % 3) as 0 | 1 | 2 }
  return s
}

/**
 * The sounds a press can make, named as `extract-assets.py` names the ROM's sequences. Each is one
 * the reference recording plays where the port does; the ROM's other two are never heard in it,
 * so nothing here plays them.
 */
export type Cue = 'cursor' | 'confirm' | 'back' | 'alert' | 'card-clock'

/** Whether A, here, is the on-screen BACK - which sounds as B does. */
function onBack(v: View): boolean {
  switch (v.kind) {
    case 'settings':
      return v.focus === SETTINGS_BACK
    case 'cards':
    case 'files':
      return v.focus === 'back'
    case 'music':
      return v.focus === 0
    default:
      return false
  }
}

/**
 * The sound a press makes, from the state before it and after it (times into the recording, as it
 * sounds them). A press that changes nothing is silent.
 *
 * - The D-pad: the cursor (34.41s; every step of the clock editor, 13.8-28.9s). X and Y, which
 *   the recording never presses, sound the same.
 * - A that opens or chooses: confirm (36.65s, 56.17s, 133.59s), including dismissing a box (40.32s).
 * - B, or A on BACK: back (52.71s, 141.83s).
 * - Choosing Delete: the alert, as its warning opens (131.52s).
 * - Opening the memory-card clock box: its own sound (93.45s).
 */
export function cueOf(prev: State, next: State, button: Button): Cue | null {
  if (next === prev) return null
  if (button === 'b') return 'back'
  if (button !== 'a') return 'cursor'
  const from = top(prev)
  if (onBack(from)) return 'back'
  const to = next.pending ? next.pending[next.pending.length - 1]! : top(next)
  if (to.kind === 'delete' && from.kind === 'file-menu') return 'alert'
  if (to.kind === 'card-clock' && from.kind === 'settings') return 'card-clock'
  return 'confirm'
}

/**
 * The sound a screen makes as it arrives, after the fade to it: the no-disc box's alert, which
 * follows Play's confirm as the box comes up (36.88s).
 */
export function arrivalCue(v: View): Cue | null {
  return v.kind === 'no-disc' ? 'alert' : null
}
