import { ADVANCES, KERNING, UNITS_PER_EM } from './advances'

/**
 * Text measurement, the way Flutter lays Anta out.
 *
 * NeoStation sizes chrome by its text: the status pill is its contents' measured width, and the
 * header decides how many tab slots fit beside it from that (`lib/utils/header_layout.dart`). Those
 * are layout decisions, so they are made here from the font's own advances rather than read back
 * from the DOM.
 *
 * Flutter shapes with HarfBuzz and does not hint, so a width is the unrounded sum of advances plus
 * GPOS pair kerning. `letterSpacing` is added after every glyph, the last included, which is what
 * Flutter's paragraph builder does.
 */

/** A character missing from the table falls back to the width of an `n`. */
const FALLBACK = ADVANCES['n'] ?? 1200

export function textWidth(s: string, size: number, letterSpacing = 0): number {
  let w = 0
  let prev = ''
  let n = 0
  for (const ch of s) {
    w += ADVANCES[ch] ?? FALLBACK
    if (prev) w += KERNING[prev + ch] ?? 0
    prev = ch
    n++
  }
  return (w * size) / UNITS_PER_EM + letterSpacing * n
}

/**
 * `TextOverflow.ellipsis` on one line: the whole string if it fits, otherwise the longest prefix
 * that fits with a U+2026 appended.
 */
export function ellipsize(s: string, size: number, maxW: number, letterSpacing = 0): string {
  if (textWidth(s, size, letterSpacing) <= maxW) return s
  const chars = [...s]
  for (let n = chars.length - 1; n > 0; n--) {
    const cut = chars.slice(0, n).join('').trimEnd() + '…'
    if (textWidth(cut, size, letterSpacing) <= maxW) return cut
  }
  return '…'
}
