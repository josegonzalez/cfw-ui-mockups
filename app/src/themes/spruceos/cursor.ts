/**
 * PyUI's cursors, kept in its own arithmetic: a list's selection and the window of rows it shows
 * (`views/list_view.py`), and a grid's selection and the window of cells (`views/grid_view.py`).
 * The quirks are kept - a list's window drifts by the amount paged, and a grid's UP from the first
 * cell wraps to the last - because they decide which rows a still shows.
 */

export interface ListCursor {
  readonly sel: number
  readonly top: number
  readonly bottom: number
}

/** `first_letter_of`: the lower-cased first character (`views/view.py:19-23`). */
const letterOf = (s: string) => (s ? s[0]!.toLowerCase() : '')

/** `calculate_amount_to_move_by`: a page move by letter jumps to the next letter (`view.py:25-58`). */
function amountToMove(texts: readonly string[], sel: number, amount: number, byLetter: boolean): number {
  if (!texts.length || sel < 0 || sel >= texts.length) return amount
  if (amount === 1 || amount === -1 || !byLetter) return amount
  const current = letterOf(texts[sel]!)
  let next = sel
  if (amount > 1) {
    next = 0
    for (let i = sel + 1; i < texts.length; i++)
      if (letterOf(texts[i]!) !== current) {
        next = i
        break
      }
  } else if (amount < -1) {
    next = texts.length - 1
    for (let i = sel - 1; i >= 0; i--)
      if (letterOf(texts[i]!) !== current) {
        next = i
        break
      }
  }
  return next - sel
}

/** `adjust_selected_top_bottom_for_overflow`, which every render runs first (`list_view.py:151-161`). */
function settle(c: ListCursor, n: number): ListCursor {
  let { top, bottom } = c
  const sel = Math.min(n - 1, Math.max(0, c.sel))
  while (sel < top) {
    top--
    bottom--
  }
  while (sel >= bottom) {
    top++
    bottom++
  }
  return { sel, top, bottom }
}

/** A new list: the first page, then `center_selection` (`non_descriptive_list_view.py`, `list_view.py:21-39`). */
export function openList(n: number, maxRows: number, sel = 0): ListCursor {
  let top = 0
  let bottom = Math.min(maxRows, n)
  if (sel !== 0) {
    const size = bottom - top
    top = sel - Math.floor(size / 2)
    bottom = top + size
    if (top < 0) {
      top = 0
      bottom = size
    }
    if (bottom > n) {
      bottom = n
      top = bottom - size
    }
  }
  return settle({ sel, top, bottom }, n)
}

/** `ListView.adjust_selected`, then the render's overflow fix (`list_view.py:163-186`). */
export function moveList(c: ListCursor, texts: readonly string[], amount: number, byLetter = false): ListCursor {
  const n = texts.length
  if (!n) return c
  const by = amountToMove(texts, c.sel, amount, byLetter)
  let { sel, top, bottom } = c
  if (sel === 0 && by < 0) {
    const delta = bottom - top
    sel = n - 1
    bottom = n
    top = Math.max(0, bottom - delta)
  } else if (sel === n - 1 && by > 0) {
    const delta = bottom - top
    sel = 0
    top = 0
    bottom = Math.min(delta, n)
  } else {
    sel = Math.max(0, Math.min(n - 1, sel + by))
    if (by > 1) {
      top += by
      bottom += by
    }
  }
  return settle({ sel, top, bottom }, n)
}

export interface GridCursor {
  readonly sel: number
  /** `current_left` and `current_right`: the window of cells shown. */
  readonly left: number
  readonly right: number
}

export const openGrid = (n: number, cols: number, rows: number, sel = 0): GridCursor =>
  correct({ sel, left: 0, right: Math.min(rows * cols, n) }, n, cols, rows)

const mod = (a: number, n: number) => ((a % n) + n) % n

/** `correct_selected_for_off_list` (`grid_view.py:86-126`). A one-row grid wraps as a ring. */
function correct(c: GridCursor, n: number, cols: number, rows: number): GridCursor {
  if (!n) return c
  let sel = c.sel
  while (sel < 0) sel = n + sel
  sel = Math.max(0, sel) % n
  let { left, right } = c
  if (rows > 1) {
    while (sel < left) {
      left -= cols
      right -= cols
    }
    while (sel >= right) {
      left += cols
      right += cols
    }
  } else if (n > cols) {
    left = mod(left, n)
    right = mod(left + cols, n)
    const inWindow = () => (left <= right ? left <= sel && sel < right : sel >= left || sel < right)
    while (!inWindow()) {
      if (mod(left - sel, n) < mod(sel - left, n)) {
        left = mod(left - 1, n)
        right = mod(right - 1, n)
      } else {
        left = mod(left + 1, n)
        right = mod(right + 1, n)
      }
    }
  }
  return { sel, left, right }
}

/** A grid's D-pad and shoulders (`grid_view.py:279-322, 358-361`). */
export function moveGrid(
  c: GridCursor,
  texts: readonly string[],
  cols: number,
  rows: number,
  move: 'left' | 'right' | 'up' | 'down' | 'pageUp' | 'pageDown' | 'letterUp' | 'letterDown',
): GridCursor {
  const n = texts.length
  if (!n) return c
  let sel = c.sel
  switch (move) {
    case 'left':
      sel -= 1
      break
    case 'right':
      sel += 1
      break
    case 'pageUp':
    case 'pageDown':
    case 'letterUp':
    case 'letterDown': {
      const page = cols * rows * (move === 'pageUp' || move === 'letterUp' ? -1 : 1)
      sel += amountToMove(texts, sel, page, move === 'letterUp' || move === 'letterDown')
      break
    }
    case 'up':
      sel = sel === 0 ? -1 : sel - cols < 0 ? 0 : sel - cols
      break
    case 'down':
      sel = sel === n - 1 ? n : sel + cols >= n ? n - 1 : sel + cols
      break
  }
  return correct({ ...c, sel }, n, cols, rows)
}

/** The cells a grid's window shows, in order: a one-row ring may wrap past the end. */
export function gridWindow(c: GridCursor, n: number, rows: number): number[] {
  if (rows > 1 || c.left <= c.right) {
    const out: number[] = []
    for (let i = c.left; i < Math.min(c.right, n); i++) out.push(i)
    return out
  }
  const out: number[] = []
  for (let i = c.left; i < n; i++) out.push(i)
  for (let i = 0; i < c.right; i++) out.push(i)
  return out
}
