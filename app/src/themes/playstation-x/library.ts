/**
 * The sample library, and the predicates the views read it through.
 *
 * The data itself is generated into `library.data.ts`. The predicates are here and hand-written,
 * because each one is a `<visible>` or `if=` expression from the source and its citation is the
 * point - they are the rules that decide which of a screen's rows actually appear, and getting
 * one backwards changes what the screen shows without changing its geometry.
 */
import { GAMES, SYSTEMS } from './library.data'

export interface PsxSystem {
  readonly theme: string
  readonly name: string
  readonly fullName: string
  readonly manufacturer: string
  readonly hardwareType: string
  /**
   * Empty on a Collection, which has no release year of its own. The source ships it as an
   * empty string rather than omitting the field, and the views print it verbatim.
   */
  readonly releaseYear: number | ''
  readonly total: number
  readonly favorites: number
  readonly gamesPlayed: number
  readonly mostPlayed: string
  readonly description: string
  /** The bottom rule's gradient, from `_theme_inc/infos/<theme>.xml`. */
  readonly linea: readonly [string, string]
  readonly hasConsole: boolean
  readonly hasLogo: boolean
  /**
   * Whether the system ships a character cutout. Absent means yes - the source tests
   * `!== false`, so only an explicit `false` suppresses it.
   */
  readonly hasOverlayArt?: boolean
  /** A Collection rather than a real system: its logo is a PNG, and its games are gathered. */
  readonly isCollection?: boolean
}

export interface PsxGame {
  readonly name: string
  readonly system: string
  readonly rom: string
  readonly desc: string
  readonly publisher?: string
  readonly developer?: string
  readonly releaseyear?: number
  readonly genre?: string
  readonly stars?: number
  readonly playerCount?: number
  readonly region?: string
  readonly lang?: string
  readonly favorite?: boolean
  readonly cheevos?: boolean
  readonly multidisc?: boolean
  readonly manual?: boolean
  readonly savegame?: boolean
  readonly playcount?: number
  readonly gametime?: number
  readonly lastplayed?: string
  readonly art?: string
  readonly overlay?: string

  /**
   * Play-state tags, which each draw their own pulsing badge: `finished` is F11E,
   * `in progress` F144, `buggy` F070. `liked` is carried and has no badge of its own.
   */
  readonly tags?: readonly PsxTag[]
  readonly kidGame?: boolean
  readonly gunGame?: boolean
  readonly hasSaveState?: boolean
  readonly hasKeyboardMapping?: boolean
  readonly hasManual?: boolean
}

/** The four play-state tags the sample library uses. */
export type PsxTag = 'finished' | 'in progress' | 'buggy' | 'liked'

export { GAMES, SYSTEMS }

export function systemByTheme(theme: string): PsxSystem {
  return SYSTEMS.find((s) => s.theme === theme) ?? SYSTEMS[0]!
}

export function gamesForSystem(system: PsxSystem): PsxGame[] {
  // A Collection gathers from everywhere rather than owning games of its own.
  if (system.isCollection) return GAMES.filter((g) => g.favorite)

  const own = GAMES.filter((g) => g.system === system.theme)
  // Every system shows something, even the ones with no sample games of their own.
  return own.length > 0 ? own : [...GAMES]
}

/**
 * The `<visible>` and `if=` predicates, with their citations.
 *
 * The first four are mutually exclusive and cover every combination of publisher and developer.
 * The source writes them as four separate rows rather than one conditional because
 * EmulationStation has no else - so all four must be reproduced, including the placeholder case.
 */
export const P = {
  /** `<visible>{game:publisher} == {game:developer} && !empty(...)` - `grid.xml:271` */
  pubEqDev: (g: PsxGame) => !!g.publisher && !!g.developer && g.publisher === g.developer,

  /** `<visible>empty({game:publisher}) && !empty({game:developer})` - `grid.xml:275` */
  devOnly: (g: PsxGame) => !g.publisher && !!g.developer,

  /** The mirrored case - `grid.xml:283` */
  pubOnly: (g: PsxGame) => !!g.publisher && !g.developer,

  /** Neither, which draws the dim placeholder rows - `detailed.xml:127` */
  neither: (g: PsxGame) => !g.publisher && !g.developer,

  /** `<visible>` on the star row - `detailed.xml:175` */
  hasStars: (g: PsxGame) => (g.stars ?? 0) > 0,

  /**
   * `theme.game-hasMultidisc` - true when the rom name marks a disc.
   *
   * The flag and the filename both count, because the source tests the filename and the sample
   * data also carries an explicit flag.
   */
  multidisc: (g: PsxGame) => !!g.multidisc || /\(Disc \d\)/.test(g.rom ?? ''),

  /** `force-world-flag` when a game claims more than one region - `grid.xml:356` */
  worldFlag: (g: PsxGame) => String(g.region ?? '').includes(','),

  /** More than one language draws a text label rather than a flag - `grid.xml:381` */
  langLabel: (g: PsxGame) => String(g.lang ?? '').includes(','),

  /** `gameInfoExNull` when the game has never been played - `top-info.xml:294` */
  neverPlayed: (g: PsxGame) => !g.gametime,

  /** `if="{system.name} == 'favorites'"` hides the per-tile heart - `grid.xml:116` */
  hidesFavorite: (sys: PsxSystem) => sys.name === 'favorites',

  /** `if="${system.manufacturer} == 'Collections'"` shows the italic chip - `ps4-style.xml:216` */
  showsSystemChip: (sys: PsxSystem) => sys.manufacturer === 'Collections',

  /** `if="{system.theme} == 'n64' || 'snes' || 'gameandwatch'"` - `grid.xml:14` */
  gridSpecialCase: (sys: PsxSystem) => ['n64', 'snes', 'gameandwatch'].includes(sys.theme),
} as const

/** `"2h 12m"`, from the theme's own label strings. */
export function formatGameTime(seconds: number | undefined): string {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

/** Five pips, filled to the game's rating. */
export function starPips(rating: number | undefined): boolean[] {
  return [0, 1, 2, 3, 4].map((i) => i < (rating ?? 0))
}
