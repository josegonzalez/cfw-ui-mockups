/**
 * Text as PyUI draws it: `TTF_RenderUTF8_Blended` into a surface as tall as the font, placed by
 * that surface's box (`display/display.py:622-700`).
 *
 * `nunwen.ttf` has 1000 units to the em, an ascender of 1011 and a descender of -353. SDL_ttf rounds
 * each up to whole pixels, and the surface is the rounded-up sum - measured from SDL_ttf 2.24 at every
 * size PyUI uses (`docs/themes/spruceos/reference/source-notes.md`, Fonts).
 */
import FONT_DATA from './assets/font.json'

const FONT = FONT_DATA as { readonly unitsPerEm: number; readonly advances: Readonly<Record<string, number>> }

const ASCENDER = 1.011
const DESCENDER = 0.353

/** The height of a rendered line, which is what every anchor centres or bottoms on. */
export const lineHeight = (size: number) => Math.ceil((ASCENDER + DESCENDER) * size)

/** Where the baseline sits in that line, from its top. */
export const ascent = (size: number) => Math.ceil(ASCENDER * size)

/**
 * How far to move a CSS line box of `lineHeight(size)` so its baseline lands where SDL_ttf's does.
 * The browser centres the font's own ascent and descent in the line box, unrounded.
 */
export const baselineShift = (size: number) =>
  ascent(size) - ((lineHeight(size) - (ASCENDER + DESCENDER) * size) / 2 + ASCENDER * size)

/**
 * Whether a list's texts are in `sorted()` order, which is what shows the selected entry's first
 * letter beside the index (`views/view.py:10-12`). Python compares code points, so upper case sorts
 * before lower case.
 */
export function isAlphabetized(texts: readonly string[]): boolean {
  for (let i = 1; i < texts.length; i++) if (texts[i - 1]! > texts[i]!) return false
  return true
}

/** The index as `add_index_text` formats it: zero-padded to the total's digits (`display.py:1147-1183`). */
export function indexText(index: number, total: number): string {
  return String(index).padStart(String(total).length, '0')
}

/**
 * A string's width at a size, from the font's advance widths, each rounded to a pixel as hinting
 * does. SDL_ttf also kerns, so this can be a pixel or two wide of its measure; it only decides how
 * many spaces pad a marquee and where the Game Switcher's strip starts.
 */
export function textWidth(s: string, size: number): number {
  let w = 0
  for (const c of s) w += Math.round(((FONT.advances[c] ?? FONT.advances[' ']!) * size) / FONT.unitsPerEm)
  return w
}

/**
 * `TextUtils.scroll_string` (`views/text_utils.py:7-19`): the text padded with as many spaces as its
 * free width holds, never fewer than 8, and rotated left by `amt` characters. PyUI rotates the
 * selected row whether it fits or not.
 */
export function scrollString(text: string, amt: number, available: number, size: number): string {
  if (!text) return text
  const space = textWidth(' ', size)
  const pad = Math.max(Math.floor((available - textWidth(text, size)) / space), 8)
  const padded = text + ' '.repeat(pad)
  const n = amt % padded.length
  return padded.slice(n) + padded.slice(0, n)
}
