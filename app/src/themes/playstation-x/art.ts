/**
 * Generated stand-in artwork.
 *
 * The theme ships no per-game media - a real install scrapes it - so screenshots, box art and
 * game logos are drawn as SVG data URIs. Each game gets a two-colour palette so the screens
 * read as a library of distinct titles rather than a wall of one placeholder.
 *
 * These are deliberately *not* photographic. They exist so layout, letterboxing and selection
 * behaviour can be judged, and pretending to be scraped art would make a mockup look finished
 * where it is standing in.
 */
import type { PsxGame } from './library'

/**
 * Two colours per game, keyed by its `art` name.
 *
 * Hand-picked to suggest each title without reproducing anything: a dark base and a lighter
 * accent. A game with no entry falls back to the neutral pair.
 */
const ART_PALETTE: Record<string, readonly [string, string]> = {
  ff7: ['#1b2a4a', '#4a7bb5'],
  gt: ['#2a2a30', '#c8462d'],
  sh: ['#2b2723', '#7d6a55'],
  tk3: ['#3a1f2b', '#b5476a'],
  klonoa: ['#1e3550', '#57b0d8'],
  vib: ['#1a1a1a', '#e8e8e8'],
  mgs: ['#1f2a24', '#5d7d63'],
  sotn: ['#241a30', '#8a6bb5'],
  bushido: ['#2a2320', '#b59a6b'],
  crash: ['#3a2410', '#e8842d'],
  parappa: ['#2d2a12', '#e8d24a'],
  pointblank: ['#1a2438', '#4a8ad8'],
  metroid: ['#1c2330', '#6b8fb5'],
  zelda: ['#1b3020', '#5da05e'],
  chrono: ['#2a1f38', '#9a7bc0'],
  goldeneye: ['#2a2a1f', '#b5a05d'],
  mario64: ['#1f2a4a', '#d84a4a'],
  sonic2: ['#12244a', '#3ba0e0'],
  sor2: ['#2a1c1c', '#c06a3a'],
  fusion: ['#2a1f2a', '#c05d8a'],
  advwars: ['#2a2a1c', '#c0b03a'],
  jsr: ['#1f2a2a', '#3ac0a0'],
  shenmue: ['#242a30', '#7a95b5'],
  mslug: ['#2a2a20', '#b5a545'],
  sf2: ['#301f1c', '#d0653a'],
}

const FALLBACK: readonly [string, string] = ['#1e2430', '#4a6ea8']

function paletteFor(game: PsxGame): readonly [string, string] {
  return ART_PALETTE[game.art ?? ''] ?? FALLBACK
}

/** Escaped for embedding in SVG markup. Titles carry ampersands. */
function xml(text: string): string {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
}

function svgUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** A screenshot stand-in: a soft diagonal gradient with the title along the bottom. */
export function fanart(game: PsxGame, w: number, h: number): string {
  const [from, to] = paletteFor(game)
  const id = `g${game.art ?? 'x'}`

  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#${id})"/>` +
      `<g opacity="0.20" fill="none" stroke="#fff" stroke-width="${Math.max(1, w / 90)}">` +
      `<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${h * 0.3}"/>` +
      `<circle cx="${w * 0.26}" cy="${h * 0.74}" r="${h * 0.22}"/>` +
      `</g>` +
      `<rect y="${h * 0.7}" width="${w}" height="${h * 0.3}" fill="#000" opacity="0.42"/>` +
      `<text x="${w * 0.05}" y="${h * 0.87}" fill="#ffffff" ` +
      `font-family="Helvetica,Arial,sans-serif" font-size="${Math.round(h * 0.11)}" ` +
      `font-weight="600">${xml(game.name)}</text>` +
      `</svg>`,
  )
}

/** Box art: portrait, with a spine down the left edge. */
export function boxart(game: PsxGame, w: number, h: number): string {
  const [base, accent] = paletteFor(game)

  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="${w}" height="${h}" fill="${base}"/>` +
      `<rect width="${w * 0.12}" height="${h}" fill="#000" opacity="0.35"/>` +
      `<rect x="${w * 0.16}" y="${h * 0.08}" width="${w * 0.76}" height="${h * 0.52}" fill="${accent}" opacity="0.85"/>` +
      `<text x="${w * 0.16}" y="${h * 0.74}" fill="#ffffff" ` +
      `font-family="Helvetica,Arial,sans-serif" font-size="${Math.round(h * 0.062)}" ` +
      `font-weight="700">${xml(game.name).slice(0, 22)}</text>` +
      `<rect y="${h * 0.93}" width="${w}" height="${h * 0.07}" fill="#d8d8d8"/>` +
      `</svg>`,
  )
}

/** The game logo: the title on transparency, so it sits over whatever is behind it. */
export function marquee(game: PsxGame, w: number, h: number): string {
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<text x="${w / 2}" y="${h * 0.58}" fill="#ffffff" text-anchor="middle" ` +
      `font-family="Helvetica,Arial,sans-serif" font-size="${Math.round(h * 0.2)}" ` +
      `font-weight="700" letter-spacing="1">${xml(game.name).slice(0, 18)}</text>` +
      `</svg>`,
  )
}
