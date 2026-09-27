import { ADVANCES, KERNING, UNITS_PER_EM } from './advances'

/**
 * Text measurement, the way SDL_ttf answers it.
 *
 * TortOS decides layout by width all over: a shelf title slides only when it does not fit, a menu
 * row's longer half is the one that yields, a name is cut with "..." at the last character that
 * leaves room. Those are decisions, not styling, so they are made here from the font's own
 * advances rather than read back from the DOM - which is also what a renderer without a DOM would
 * have to do.
 *
 * Each glyph's advance is rounded to whole pixels before summing, which is what FreeType's hinted
 * advances do at a given size, and the font's GPOS pair kerning is added on top unrounded, as
 * HarfBuzz positions it. What hinting does beyond rounding is not reproduced: measured against the
 * reference frames these widths run about 1% wide, which is a character's difference in where a
 * long name is cut - see `docs/porting/tortos.md`.
 */

/** A character missing from the table falls back to the width of an `n`. */
const FALLBACK = ADVANCES['n'] ?? 500

export function textWidth(s: string, size: number): number {
  let w = 0
  let kern = 0
  let prev = ''
  for (const ch of s) {
    w += Math.round(((ADVANCES[ch] ?? FALLBACK) * size) / UNITS_PER_EM)
    if (prev) kern += ((KERNING[prev + ch] ?? 0) * size) / UNITS_PER_EM
    prev = ch
  }
  return w + Math.round(kern)
}

/**
 * `ui_fit_text` (`src/ui.c:351`): the whole string if it fits, otherwise the longest prefix that
 * still fits with "..." appended. Three full stops, not an ellipsis character - which is what the
 * source writes, and in Josefin the two are not the same width.
 */
export function fitText(s: string, size: number, maxW: number): string {
  if (textWidth(s, size) <= maxW) return s
  const chars = [...s]
  for (let n = chars.length - 1; n > 0; n--) {
    const cut = chars.slice(0, n).join('') + '...'
    if (textWidth(cut, size) <= maxW) return cut
  }
  return '...'
}

/**
 * Break a title across lines no wider than `maxW`, at most `maxLines` of them (`draw_wrapped`,
 * `src/ui.c:729`). A word that is wider than a line on its own gets a line to itself.
 */
export function wrapText(s: string, size: number, maxW: number, maxLines: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of s.split(' ').filter(Boolean)) {
    if (out.length >= maxLines) break
    const next = line ? `${line} ${word}` : word
    if (line && textWidth(next, size) > maxW) {
      out.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line && out.length < maxLines) out.push(line)
  return out
}

/**
 * Word wrap for prose, keeping the source's paragraph rule: a line break in the text starts a new
 * paragraph with one blank row before it (`wrap_text`, `src/main.c:6888`).
 */
export function wrapParagraphs(s: string, size: number, maxW: number): string[] {
  const out: string[] = []
  s.split('\n').forEach((para, i) => {
    if (i > 0) out.push('')
    out.push(...wrapText(para, size, maxW, Number.POSITIVE_INFINITY))
  })
  return out
}

/* ---- the marquee ---------------------------------------------------------- */

/** `src/ui.c:203-207`. */
export const MARQUEE = {
  fadePx: 36,
  holdMs: 1400,
  endMs: 900,
  pxPerS: 70,
} as const

/**
 * How far a ping-pong has travelled at `phase` ms (`ui_pingpong`, `src/ui.c:215`): still for
 * 1.4s, out at 70px/s, still for 0.9s at the far end, and back.
 *
 * At phase 0 it is 0, which is the marquee's resting value - a still of a long title is drawn at
 * its start, which is where the device shows it for the first 1.4s.
 */
export function pingpong(over: number, phase: number): number {
  if (over <= 0) return 0
  const travel = Math.max(1, Math.trunc((over * 1000) / MARQUEE.pxPerS))
  const cycle = MARQUEE.holdMs + travel + MARQUEE.endMs + travel
  const p = phase % cycle
  if (p < MARQUEE.holdMs) return 0
  if (p < MARQUEE.holdMs + travel) return Math.trunc(((p - MARQUEE.holdMs) * over) / travel)
  if (p < MARQUEE.holdMs + travel + MARQUEE.endMs) return over
  return over - Math.trunc(((p - MARQUEE.holdMs - travel - MARQUEE.endMs) * over) / travel)
}

/** One-way scroll for a looping body (`ui_scrollthrough`, `src/ui.c:233`). */
export function scrollthrough(cycle: number, phase: number): number {
  if (cycle <= 0) return 0
  const travel = Math.max(1, Math.trunc((cycle * 1000) / MARQUEE.pxPerS))
  const p = phase % (MARQUEE.holdMs + travel)
  if (p < MARQUEE.holdMs) return 0
  return Math.trunc(((p - MARQUEE.holdMs) * cycle) / travel)
}
