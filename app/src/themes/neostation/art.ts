import { gradientArt, hashString, svgDataUri } from '../../widgets/GeneratedArt'
import type { Game } from './library'

/**
 * Stand-ins for the art NeoStation downloads with its scraper: a game's fanart, box art and
 * screenshot. None ships here. Each is a deterministic gradient seeded from the game, so every
 * capture is the same picture; the wheel (the game's logo) is drawn as the game's title instead.
 */

/** Deep, saturated pairs, so the fanart reads as a busy picture behind glass rather than as a flat. */
const PAIRS: readonly (readonly [string, string])[] = [
  ['#3b1f6e', '#c2185b'],
  ['#0d3b66', '#1fa2a8'],
  ['#4a1d1d', '#e0712b'],
  ['#1b4332', '#8fbf3a'],
  ['#2a2a72', '#5f7fe0'],
  ['#5a189a', '#f15bb5'],
  ['#233142', '#e8b04b'],
  ['#3d0c02', '#d83f31'],
]

function pair(seed: string): readonly [string, string] {
  return PAIRS[hashString(seed) % PAIRS.length]!
}

export function fanart(game: Game): string {
  const [from, to] = pair(`fanart:${game.id}`)
  return gradientArt({
    width: 1920,
    height: 1080,
    from,
    to,
    angle: 120 + (hashString(game.id) % 90),
  })
}

export function boxart(game: Game): string {
  const [from, to] = pair(`box:${game.id}`)
  return gradientArt({ width: 600, height: 800, from, to, angle: 160 })
}

export function screenshot(game: Game): string {
  const [from, to] = pair(`shot:${game.id}`)
  const w = 480
  const h = 320
  // A few blocks over the gradient, so it reads as a game screen rather than a card.
  const n = hashString(`blocks:${game.id}`)
  const blocks = [0, 1, 2, 3, 4]
    .map((i) => {
      const x = ((n >> (i * 5)) & 31) * (w / 32)
      const y = h * 0.55 + (((n >> (i * 3)) & 7) * h) / 24
      return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w / 8}" height="${h / 12}" fill="rgba(255,255,255,0.18)"/>`
    })
    .join('')
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${blocks}</svg>`,
  )
}
