/**
 * The device button map.
 *
 * This table existed in four byte-identical copies across the repo - once in the shared nav
 * helper and once in each of the three theme engines. One of them even carried the comment
 * "Repo-standard key map. Identical table in vitrolauncher and elementerial." This is that
 * table, once.
 */

/** Every button a handheld in this repo has. */
export type Button =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'x'
  | 'y'
  | 'l'
  | 'r'
  | 'start'
  | 'select'
  | 'menu'

export const BUTTONS: readonly Button[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'x',
  'y',
  'l',
  'r',
  'start',
  'select',
  'menu',
]

/**
 * Keyboard bindings, keyed by `KeyboardEvent.key`.
 *
 * The face-button layout is Nintendo-style, which is what these devices use: A confirms and
 * sits right, B cancels and sits below. Both cases of each letter are listed because `key`
 * reports the shifted character, and holding shift while pressing a face button should not
 * silently stop working.
 */
export const KEY_TO_BUTTON: Readonly<Record<string, Button>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  z: 'a',
  Z: 'a',
  x: 'b',
  X: 'b',
  Backspace: 'b',
  a: 'x',
  A: 'x',
  s: 'y',
  S: 'y',
  Enter: 'start',
  q: 'l',
  Q: 'l',
  w: 'r',
  W: 'r',
  Escape: 'menu',
}

/**
 * Resolve a keyboard event to a device button, or null if it is not bound.
 *
 * Select is matched on `code` rather than `key`, because both shift keys report `key` as
 * `'Shift'` and would otherwise be indistinguishable.
 */
export function buttonForKeyEvent(event: Pick<KeyboardEvent, 'key' | 'code'>): Button | null {
  if (event.code === 'ShiftRight') return 'select'
  return KEY_TO_BUTTON[event.key] ?? null
}

/** Human-readable binding per button, for on-screen help and documentation. */
export const BUTTON_KEY_LABEL: Readonly<Record<Button, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  a: 'Z',
  b: 'X',
  x: 'A',
  y: 'S',
  l: 'Q',
  r: 'W',
  start: 'Enter',
  select: 'Right Shift',
  menu: 'Esc',
}
