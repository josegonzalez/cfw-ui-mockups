import { LOCALE_ROWS } from './strings'

/**
 * DS Style's text rules, ported from its pure title functions (`source/original_text.h`, Apache-2.0)
 * and its glyph table. The font draws ASCII and the accented letters `font-latin.bin` carries;
 * anything else is `?` (`dsstyle.c:108-122`).
 */
const LATIN = new Set([
  192, 193, 194, 195, 196, 197, 199, 200, 201, 202, 203, 204, 205, 206, 207, 209, 210, 211, 212, 213, 214, 217, 218,
  219, 220, 221, 223, 224, 225, 226, 227, 228, 229, 231, 232, 233, 234, 235, 236, 237, 238, 239, 241, 242, 243, 244,
  245, 246, 249, 250, 251, 252, 253, 255, 286, 287, 304, 305, 350, 351, 191, 161, 338, 339, 198, 230,
])

/** Each character as the font draws it: itself if it has a glyph, else `?`. */
export function drawable(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    out += (c >= 32 && c < 128) || LATIN.has(c) ? ch : '?'
  }
  return out
}

/** Glyphs, not bytes: every glyph advances six pixels. */
export const glyphs = (s: string) => [...s].length

/** `Launcher_CleanTitle` (`original_text.h:5-62`): no extension, nothing in () or [], no trailing space. */
export function cleanTitle(src: string): string {
  const temp = src.slice(0, 127)
  const dot = temp.lastIndexOf('.')
  const stem = dot >= 0 ? temp.slice(0, dot) : temp
  let out = ''
  let paren = false
  let bracket = false
  for (const ch of stem) {
    if (ch === '(') paren = true
    else if (ch === ')') paren = false
    else if (ch === '[') bracket = true
    else if (ch === ']') bracket = false
    else if (!paren && !bracket) out += ch
  }
  out = out.replace(/[ \t]+$/, '')
  return out || stem
}

function split(title: string, takeFor: (line: number) => number, minBreak: number, cut: number): string[] {
  const lines: string[] = []
  let pos = 0
  while (pos < title.length && lines.length < 3) {
    const take = Math.min(title.length - pos, takeFor(lines.length))
    let at = pos + take
    if (at < title.length) {
      for (let i = at; i > pos + minBreak; i--) {
        if (title[i] === ' ') {
          at = i
          break
        }
      }
    }
    if (at <= pos) at = pos + take
    lines.push(title.slice(pos, at).replace(/^ +/, ''))
    pos = at
    while (title[pos] === ' ') pos++
  }
  if (pos < title.length && lines.length) {
    const last = lines.length - 1
    lines[last] = lines[last]!.slice(0, cut).replace(/ +$/, '') + '...'
  }
  return lines.length ? lines : [' ']
}

/** `Launcher_SplitTitle` (`original_text.h:64-128`): three lines of 20, 20 and 24. */
export const splitTitle = (title: string) => split(title, (n) => (n < 2 ? 20 : 24), 8, 21)

/** `Launcher_SplitStartTitle` (`original_text.h:130-199`): the Home card's lines of 18. */
export function splitStartTitle(title: string): string[] {
  if (!title) return ['No recent game']
  return split(title, () => 18, 5, 15)
}

/** The interface languages, in `language_names` order (`locale.h:2`). */
export const LANGUAGES = [
  'English (UK)',
  'Français',
  'Deutsch',
  'Español',
  'Português',
  'Italiano',
  'Nederlands',
  'English (US)',
] as const

const BY_KEY = new Map(LOCALE_ROWS.map((row) => [row[0]!, row]))

/** `tr` (`locale.h:169`): the string in the chosen language, or the English key itself. */
export function tr(s: string, language: number): string {
  if (language <= 0 || language >= LANGUAGES.length) return s
  return BY_KEY.get(s)?.[language] ?? s
}

/** `extra_box`'s word wrap: 33 glyphs a line, at most nine lines (`extra_ui.h:42-49`). */
export function wrapBox(body: string): string[] {
  const lines: string[] = ['']
  let width = 0
  for (const word of body.split(' ')) {
    const cells = glyphs(word)
    if (lines[lines.length - 1] && width + 1 + cells > 33) {
      if (lines.length === 9) break
      lines.push('')
      width = 0
    }
    if (lines[lines.length - 1]) {
      lines[lines.length - 1] += ' '
      width++
    }
    lines[lines.length - 1] += word
    width += cells
  }
  return lines
}
