import { ANDROID_APPS, GAME_DEFS, type GameDef } from './games'
import { SYSTEM_DEFS, type SystemDef } from './systems'

/**
 * The sample library: which systems are on the card, what is in them, and the orders the source
 * puts them in.
 *
 * Systems come from the source's own definitions (`systems.ts`, generated); games from `games.ts`,
 * which says where each list came from. A system's count is always its list's length, so the number
 * on a card is the number of rows it opens.
 */

export type Platform = 'android' | 'linux'

export interface Game extends GameDef {
  readonly id: string
  readonly system: string
}

export type SortBy = 'alphabetical' | 'year' | 'manufacturer' | 'manufacturer_type'
export type SortOrder = 'asc' | 'desc'
export type CardSize = 'S' | 'M' | 'L' | 'XL'

export const CARD_SIZES: readonly CardSize[] = ['S', 'M', 'L', 'XL']

/** `Responsive.systemGridColumns` (`lib/responsive.dart:100-114`): the same at every width. */
export const COLUMNS: Readonly<Record<CardSize, number>> = {
  S: 7,
  M: 6,
  L: 5,
  XL: 4,
}

/** Every game, each tagged with its system. */
export const GAMES: readonly Game[] = Object.entries(GAME_DEFS).flatMap(([system, defs]) =>
  defs.map((d) => ({ ...d, id: `${system}:${d.file}`, system })),
)

/** What the player has changed in the library: favourites, hidden and deleted games, reset clocks. */
export interface LibState {
  readonly favs: Readonly<Record<string, boolean>>
  readonly hidden: readonly string[]
  readonly deleted: readonly string[]
  readonly played: Readonly<Record<string, number>>
}

export const EMPTY_LIB: LibState = { favs: {}, hidden: [], deleted: [], played: {} }

export const isFavorite = (lib: LibState, g: Game) => lib.favs[g.id] ?? !!g.favorite
export const playedOf = (lib: LibState, g: Game) => lib.played[g.id] ?? g.played ?? 0

/** `ORDER BY ur.is_favorite DESC, LOWER(game_display_name) ASC` (`sqlite_service.dart:4506`). */
function byList(lib: LibState) {
  return (a: Game, b: Game): number => {
    const fa = isFavorite(lib, a)
    const fb = isFavorite(lib, b)
    if (fa !== fb) return fa ? -1 : 1
    const x = a.title.toLowerCase()
    const y = b.title.toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  }
}

/** A system's games in list order. `all` is every game, `favorites` every favourite. */
export function gamesOf(system: string, lib: LibState = EMPTY_LIB): Game[] {
  const shown = GAMES.filter((g) => !lib.hidden.includes(g.id) && !lib.deleted.includes(g.id))
  const pick =
    system === 'all'
      ? shown
      : system === 'favorites'
        ? shown.filter((g) => isFavorite(lib, g))
        : shown.filter((g) => g.system === system)
  return [...pick].sort(byList(lib))
}

/** How many a system card says it holds: games, or for Android its apps. */
export function romCount(system: string, lib: LibState = EMPTY_LIB): number {
  return system === 'android' ? ANDROID_APPS.length : gamesOf(system, lib).length
}

export function gameById(id: string): Game {
  const g = GAMES.find((x) => x.id === id)
  if (!g) throw new Error(`No game ${id}`)
  return g
}

/** The most recently played game: what the Recent card shows. */
export const RECENT: Game = GAMES.find((x) => x.title === 'Goodboy Galaxy')!

export interface SystemEntry {
  readonly kind: 'system'
  readonly def: SystemDef
  readonly roms: number
}

export interface RecentEntry {
  readonly kind: 'recent'
  readonly game: Game
}

export type Entry = SystemEntry | RecentEntry

/** Virtual systems float to the top in this order whatever the sort (`scanning.dart:1269-1283`). */
const VIRTUAL = ['all', 'favorites', 'collections', 'music', 'android']

function compare(a: SystemDef, b: SystemDef, by: SortBy): number {
  const s = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0)
  const year = (d: SystemDef) => d.released || '9999'
  switch (by) {
    case 'year':
      return s(year(a), year(b))
    case 'manufacturer':
      return s(a.manufacturer.toLowerCase(), b.manufacturer.toLowerCase()) || s(year(a), year(b))
    case 'manufacturer_type':
      return s(a.manufacturer.toLowerCase(), b.manufacturer.toLowerCase()) || s(a.type, b.type) || s(year(a), year(b))
    default:
      return s(a.name.toLowerCase(), b.name.toLowerCase())
  }
}

export interface ListOptions {
  readonly platform: Platform
  readonly sortBy: SortBy
  readonly order: SortOrder
  readonly hideRecent?: boolean
  readonly hideFavorites?: boolean
  readonly hiddenSystems?: readonly string[]
  readonly lib?: LibState
}

/**
 * `buildSystemsList` (`system_list_builder.dart:21-91`): the Recent card, then the detected
 * systems - virtual ones first in their fixed order, real ones sorted and reversed for `desc`.
 * Favorites is dropped with no favourites, and Android off Android.
 */
export function systemsList({ platform, sortBy, order, hideRecent, hideFavorites, hiddenSystems = [], lib = EMPTY_LIB }: ListOptions): Entry[] {
  const favorites = gamesOf('favorites', lib).length
  const defs = SYSTEM_DEFS.filter(
    (d) =>
      (d.id !== 'android' || platform === 'android') &&
      (d.id !== 'favorites' || (favorites > 0 && !hideFavorites)) &&
      !hiddenSystems.includes(d.id),
  )
  const virtual = VIRTUAL.flatMap((id) => defs.filter((d) => d.id === id))
  const real = defs.filter((d) => !VIRTUAL.includes(d.id)).sort((a, b) => compare(a, b, sortBy))
  if (order === 'desc') real.reverse()

  const entries: Entry[] = [...virtual, ...real].map((def) => ({ kind: 'system', def, roms: romCount(def.id, lib) }))
  return hideRecent ? entries : [{ kind: 'recent', game: RECENT }, ...entries]
}

/** `GameUtils.formatPlayTime(fullWords: true)` (`lib/utils/game_utils.dart:20-54`). */
export function playTimeWords(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor(seconds / 60)
  if (h >= 1) return `${h} ${h === 1 ? 'Hour' : 'Hours'}`
  if (m >= 1) return `${m} ${m === 1 ? 'Minute' : 'Minutes'}`
  return `${seconds} ${seconds === 1 ? 'Second' : 'Seconds'}`
}

export function systemDef(id: string): SystemDef {
  const d = SYSTEM_DEFS.find((x) => x.id === id)
  if (!d) throw new Error(`No system ${id}`)
  return d
}
