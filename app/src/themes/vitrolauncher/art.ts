import { svgDataUri } from '../../widgets/GeneratedArt'
import type { VitroGame } from './library'

/**
 * Placeholder box art.
 *
 * The launcher ships no artwork - a real install scrapes it - so covers are generated. Hue comes
 * from the system where one is known and from the title's hash otherwise, which keeps a shelf of
 * covers looking like a shelf rather than like one gradient repeated.
 */
const SYSTEM_HUE: Record<string, number> = {
  gba: 265,
  snes: 210,
  psx: 300,
  gb: 90,
  gbc: 140,
  genesis: 220,
  nes: 0,
  n64: 30,
  arcade: 350,
  ports: 190,
  gg: 50,
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Break a title into at most four lines of roughly fourteen characters. */
function wrap(name: string): string[] {
  const words = name.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    if (`${cur} ${word}`.trim().length > 14 && cur) {
      lines.push(cur)
      cur = word
    } else {
      cur = `${cur} ${word}`.trim()
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 4)
}

export function cover(game: VitroGame): string {
  const base = SYSTEM_HUE[game.system] ?? hash(game.name) % 360
  const h1 = (base + (hash(game.name) % 30)) % 360
  const h2 = (h1 + 40) % 360
  const lines = wrap(game.name)
  const startY = 225 - (lines.length - 1) * 24
  const tspans = lines
    .map((line, i) => `<tspan x="150" y="${startY + i * 48}">${esc(line)}</tspan>`)
    .join('')

  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="hsl(${h1},55%,42%)"/>` +
      `<stop offset="1" stop-color="hsl(${h2},60%,20%)"/></linearGradient>` +
      `<radialGradient id="v" cx="0.5" cy="0.38" r="0.75">` +
      `<stop offset="0.55" stop-color="rgba(0,0,0,0)"/><stop offset="1" stop-color="rgba(0,0,0,0.45)"/>` +
      `</radialGradient></defs>` +
      `<rect width="300" height="450" fill="url(#g)"/>` +
      `<rect width="300" height="450" fill="url(#v)"/>` +
      `<rect x="0" y="0" width="300" height="6" fill="rgba(255,255,255,0.25)"/>` +
      `<text font-family="Roboto Condensed, sans-serif" font-weight="700" font-size="40" ` +
      `fill="#ffffff" text-anchor="middle" style="paint-order:stroke" stroke="rgba(0,0,0,0.35)" stroke-width="3">` +
      `${tspans}</text>` +
      `<text x="150" y="418" font-family="Roboto Condensed, sans-serif" font-weight="700" font-size="22" ` +
      `fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="2">${esc(game.system.toUpperCase())}</text>` +
      `</svg>`,
  )
}

/**
 * The letter a tile shows when it has no art.
 *
 * The original styled `.cov-letter` and `.gicon-letter` and then never emitted either, so the
 * fallback was unreachable. Covers are generated here and never absent, but the rule the styles
 * describe is real for a scraped library, so the components render it when art is missing.
 */
export function coverLetter(game: VitroGame): string {
  return (game.name.trim()[0] ?? '?').toUpperCase()
}
