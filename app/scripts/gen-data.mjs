/*
 * Extract Elementerial's sample library from the original source.
 *
 * Around 90 game entries with metadata and descriptions. Transcribing that by hand invites the
 * one class of error nobody notices - a wrong year, a dropped favourite flag - so it is lifted
 * mechanically instead.
 *
 * Run from `app/`:  node scripts/gen-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'

const repoRoot = resolve(import.meta.dirname, '../..')
const out = resolve(import.meta.dirname, '../src/themes/elementerial/library.ts')

// The original is browser code. It only touches the DOM inside its builder functions, so a
// stub is enough to reach the data at the top.
const sandbox = { window: {}, document: { createElement: () => ({ style: {}, appendChild() {} }) } }
vm.createContext(sandbox)

for (const file of ['palette.js', 'layout.js', 'views.js']) {
  vm.runInContext(readFileSync(resolve(repoRoot, 'legacy/elementerial', file), 'utf8'), sandbox, {
    filename: file,
  })
}

const E = sandbox.window.Elementerial
const json = (value) => JSON.stringify(value, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:')

writeFileSync(
  out,
  `/**
 * Elementerial's sample library.
 *
 * Extracted from the original source by \`scripts/gen-data.mjs\` rather than retyped - it is
 * around ninety entries of metadata, and a transcription slip in one year or one favourite flag
 * would be invisible.
 *
 * The theme ships system logos and backdrops but no per-game artwork, which is why every screen
 * that needs cover art generates it. See \`art.ts\`.
 */

export interface ElementerialSystem {
  readonly theme: string
  readonly fullName: string
  readonly count: number
}

export interface ElementerialGame {
  readonly name: string
  readonly releasedate: string
  readonly genre: string
  readonly players: string
  /** 0 to 1; the view renders five stars from it. */
  readonly rating: number
  readonly developer: string
  readonly favorite: boolean
  /** Renders the scheme's no-artwork placeholder instead of generated art. */
  readonly noArt: boolean
  readonly folder: boolean
  readonly desc: string
  /** Filled in at load; the source sets it on the game when a list is built. */
  readonly system?: string
}

export const SYSTEMS: readonly ElementerialSystem[] = ${json(E.SYSTEMS)}

export const GAMES: Readonly<Record<string, readonly ElementerialGame[]>> = ${json(E.GAMES)}

export function gamesFor(systemTheme: string): readonly ElementerialGame[] {
  return GAMES[systemTheme] ?? GAMES.snes!
}

export function systemByTheme(theme: string): ElementerialSystem {
  return SYSTEMS.find((s) => s.theme === theme) ?? SYSTEMS[0]!
}

/**
 * What the description slot shows.
 *
 * Falls back to the game's own scraped metadata rather than invented prose, so the slot is
 * always populated in Elementflix and in the 1:1 detailed view.
 */
export function describe(game: ElementerialGame): string {
  if (game.desc) return game.desc
  return [game.genre, game.developer, game.releasedate].filter(Boolean).join('  \\u00b7  ')
}
`,
)

/*
 * Also capture the generated artwork.
 *
 * The seeding is a character sum plus a linear congruential step, reproduced exactly in the
 * port. Comparing the emitted SVG proves that, where re-deriving "some deterministic art" would
 * not - the shapes are what the reference screenshots show.
 */
const artOut = resolve(import.meta.dirname, '../src/themes/elementerial/__fixtures__/art.golden.json')
const art = {}

for (const [theme, list] of Object.entries(E.GAMES)) {
  for (const game of list.slice(0, 3)) {
    const withSystem = { ...game, system: theme }
    art[`${theme}|${game.name}`] = {
      screenshot: E.screenshot(withSystem, '#ED5353', '#ff8c82'),
      marquee: E.marquee(withSystem),
    }
  }
}

writeFileSync(artOut, JSON.stringify(art, null, 1))

const total = Object.values(E.GAMES).reduce((n, list) => n + list.length, 0)
console.log(`wrote ${E.SYSTEMS.length} systems, ${total} games, ${Object.keys(art).length} art samples`)
