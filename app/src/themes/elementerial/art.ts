import { svgDataUri } from '../../widgets/GeneratedArt'
import type { ElementerialGame } from './library'

/**
 * Elementerial's generated placeholder artwork.
 *
 * The theme bundles system logos and backdrops but no per-game media, so screenshots and
 * marquees stand in for what a scraper would supply. They are drawn in the theme's own language
 * - the accent gradient its logo art uses, a soft vignette, its own typeface - and take the
 * scheme's colours as arguments so they re-tint when the scheme changes.
 *
 * The seeding is reproduced exactly rather than replaced with a nicer hash, because the shapes
 * it produces are what the reference screenshots show.
 */

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Wrap on whole words at roughly `perLine` characters. */
function wrap(text: string, perLine: number): string[] {
  const lines: string[] = []
  let line = ''

  for (const word of String(text).split(' ')) {
    if (`${line} ${word}`.trim().length > perLine && line) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)

  return lines
}

/**
 * A stand-in for the screenshot slot and for grid and boxes tile art.
 *
 * Deliberately carries no title: every view that shows this also shows the name through a
 * marquee or a tile caption, so lettering it here would double up. It is an abstract scene in
 * the scheme's accent gradient, seeded off the title so each game looks distinct and looks the
 * same on every render.
 */
export function screenshot(game: ElementerialGame, accent: string, sect: string): string {
  const W = 640
  const H = 360

  // The original's seeding, kept exactly: a character sum, then a linear congruential step per
  // value. A better hash would produce different art from the reference screenshots.
  let seed = 0
  for (let i = 0; i < game.name.length; i++) seed = (seed * 31 + game.name.charCodeAt(i)) % 9973

  let shapes = ''
  for (let k = 0; k < 5; k++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    const x = ((seed % 100) / 100) * W
    seed = (seed * 1103515245 + 12345) % 2147483648
    const y = ((seed % 100) / 100) * H
    seed = (seed * 1103515245 + 12345) % 2147483648
    const r = 40 + (seed % 90)
    shapes += `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="${r}" fill="#fff" fill-opacity="0.07"/>`
  }

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      `<stop offset="0" stop-color="${accent}"/>` +
      `<stop offset="1" stop-color="${sect}"/>` +
      '</linearGradient>' +
      '<radialGradient id="v" cx="0.5" cy="0.45" r="0.75">' +
      '<stop offset="0.55" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity="0.4"/>' +
      '</radialGradient>' +
      '</defs>' +
      `<rect width="${W}" height="${H}" fill="url(#g)"/>` +
      shapes +
      `<rect width="${W}" height="${H}" fill="url(#v)"/>` +
      `<text x="${W - 18}" y="${H - 16}" text-anchor="end" font-family="Inter, sans-serif" font-weight="400" font-size="20" fill="#fff" fill-opacity="0.75">${escapeXml(game.system ?? '')}</text>` +
      '</svg>',
  )
}

/** A stand-in for the marquee slot: a transparent wordmark, as real marquees are. */
export function marquee(game: ElementerialGame): string {
  const W = 520
  const H = 200
  const lines = wrap(game.name, 14).slice(0, 2)
  const start = H / 2 - (lines.length - 1) * 28 + 14

  const text = lines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${start + i * 56}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700" font-size="46" fill="#fff" stroke="rgba(0,0,0,.45)" stroke-width="6" paint-order="stroke">${escapeXml(line)}</text>`,
    )
    .join('')

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${text}</svg>`,
  )
}

/**
 * Rating stars, inlined so they can be tinted.
 *
 * Paths copied verbatim from the theme's own star artwork. Referencing the files instead would
 * need `mask-image`, which the original could not use over `file://`.
 */
export const STAR_FILLED =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="m22 9.74-7.19-0.62-2.81-6.62-2.81 6.63-7.19 0.61 5.46 4.73-1.64 7.03 ' +
  '6.18-3.73 6.18 3.73-1.63-7.03z"/></svg>'

export const STAR_EMPTY =
  '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="m22 9.74-7.19-0.62-2.81-6.62-2.81 6.63-7.19 0.61 5.46 4.73-1.64 7.03 ' +
  '6.18-3.73 6.18 3.73-1.63-7.03zm-10 6.16-3.76 2.27 1-4.28-3.32-2.88 4.38-0.38 ' +
  '1.7-4.03 1.71 4.04 4.38 0.38-3.32 2.88 1 4.28z"/></svg>'

/**
 * Whether star `index` (0-based, of five) is filled for a 0-1 rating.
 *
 * The epsilon is the source's: without it a rating of exactly 0.8 leaves the fourth star empty
 * through floating-point error, which is visible and wrong.
 */
export function starFilled(rating: number, index: number): boolean {
  return rating >= (index + 1) / 5 - 0.001
}
