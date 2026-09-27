import { CYAN, MUSE_GREEN } from './palette'

/**
 * TortOS's sample card: the systems, their shelves, the music, and the few per-game facts the
 * screens show.
 *
 * The systems and their accents are `config/systems.cfg` exactly, in its order, with Favorites put
 * first and Muse last the way the launcher builds the list (`src/main.c`). Every shelf that the
 * reference screenshots show is sized and ordered to match them - SNES has 12 games with Chrono
 * Trigger first, NES has Contra second of 10, Genesis has 11 ending on Streets of Rage 2, Muse has
 * seven albums with The xx sixth - so a still can be put beside its reference frame.
 *
 * There is no box art. The reference frames show real covers, which this repo does not ship; every
 * game is drawn with the card TortOS itself generates for a game that has none (`ui_make_card`).
 */

export type CardSet = 'classic' | 'fancy'
export type Direction = 'horizontal' | 'vertical' | 'cubic'

/** `CARD_SETS` and `CARD_DIRS` (`src/cards.h`): the stored id and the label the menu shows. */
export const CARD_SETS: readonly { id: CardSet; name: string; labeled: boolean; reflectGap: number }[] = [
  { id: 'classic', name: 'Plain Jane', labeled: true, reflectGap: 0 },
  { id: 'fancy', name: 'Fancy Pants', labeled: false, reflectGap: 0.21 },
]

export const DIRECTIONS: readonly { id: Direction; name: string }[] = [
  { id: 'horizontal', name: 'Horizontal' },
  { id: 'vertical', name: 'Vertical' },
  { id: 'cubic', name: 'Cubic' },
]

export interface Game {
  /** The file name without its extension. */
  readonly name: string
  /** What the shelf shows: the name cut before the first " (" or " [" (`lib_title`). */
  readonly title: string
}

export interface System {
  readonly tag: string
  readonly name: string
  readonly folder: string
  readonly core: string
  /** The card art's file name, without `.png`. */
  readonly card: string
  readonly accent: number
}

/** `lib_title` (`src/library.c:112`). */
export function titleOf(name: string): string {
  const cut = name.search(/ [([]/)
  return cut < 0 ? name : name.slice(0, cut)
}

const games = (...names: string[]): Game[] => names.map((name) => ({ name, title: titleOf(name) }))

export const FAVORITES: System = {
  tag: 'FAV',
  name: 'Favorites',
  folder: '',
  core: '',
  card: 'FAVORITES',
  accent: CYAN,
}

export const MUSE: System = {
  tag: 'MUSE',
  name: 'Muse',
  folder: '',
  core: '',
  card: 'MUSE',
  accent: MUSE_GREEN,
}

/** `config/systems.cfg`, in its order. */
export const CONSOLES: readonly System[] = [
  { tag: 'NES', name: 'NES', folder: 'NES', core: 'fceumm', card: 'NES', accent: 0xc4443a },
  { tag: 'SMS', name: 'Master System', folder: 'Master System', core: 'genesis_plus_gx', card: 'SMS', accent: 0xc12216 },
  { tag: 'GB', name: 'Game Boy', folder: 'Game Boy', core: 'mgba', card: 'GB', accent: 0x7e9b47 },
  { tag: 'MD', name: 'Genesis', folder: 'Genesis', core: 'genesis_plus_gx', card: 'GENESIS', accent: 0x3e82d6 },
  { tag: 'PCE', name: 'TurboGrafx-16', folder: 'TurboGrafx-16', core: 'mednafen_pce_fast', card: 'PCE', accent: 0xe8641e },
  { tag: 'GG', name: 'Game Gear', folder: 'Game Gear', core: 'genesis_plus_gx', card: 'GG', accent: 0x00b589 },
  { tag: 'SFC', name: 'SNES', folder: 'SNES', core: 'snes9x2010', card: 'SNES', accent: 0x816eba },
  { tag: 'NGP', name: 'Neo Geo Pocket', folder: 'Neo Geo Pocket', core: 'mednafen_ngp', card: 'NGP', accent: 0xc2478f },
  { tag: 'GBC', name: 'Game Boy Color', folder: 'Game Boy Color', core: 'mgba', card: 'GBC', accent: 0xe0b23a },
  { tag: 'NGPC', name: 'Neo Geo Pocket Color', folder: 'Neo Geo Pocket Color', core: 'mednafen_ngp', card: 'NGPC', accent: 0x00aa4f },
  { tag: 'GBA', name: 'Game Boy Advance', folder: 'Game Boy Advance', core: 'mgba', card: 'GBA', accent: 0x6b5bd6 },
]

/** Every shelf, sorted by title the way `lib_scan` sorts one. */
export const LIBRARY: Readonly<Record<string, readonly Game[]>> = {
  NES: games(
    'Castlevania (USA)',
    'Contra (USA)',
    'Double Dragon (USA)',
    'DuckTales (USA)',
    'Excitebike (World)',
    "Kirby's Adventure (USA)",
    'Mega Man 2 (USA)',
    'Metroid (USA)',
    'Punch-Out!! (USA)',
    'Super Mario Bros. 3 (USA)',
  ),
  SMS: games('Alex Kidd in Miracle World (USA)', 'Phantasy Star (USA)', 'Wonder Boy III - The Dragon\'s Trap (USA)'),
  GB: games("Kirby's Dream Land (USA)", "Link's Awakening (USA)", 'Metroid II - Return of Samus (World)', 'Tetris (World)'),
  MD: games(
    'Castlevania - Bloodlines (USA)',
    'Comix Zone (USA)',
    'Contra - Hard Corps (USA)',
    'Earthworm Jim (USA)',
    'Ecco the Dolphin (USA)',
    'Gunstar Heroes (USA)',
    'Phantasy Star IV (USA)',
    'Rocket Knight Adventures (USA)',
    'Shining Force II (USA)',
    'Shinobi III - Return of the Ninja Master (USA)',
    'Streets of Rage 2 (USA)',
  ),
  PCE: games('Blazing Lazers (USA)', 'Bonk\'s Adventure (USA)', 'Neutopia (USA)'),
  GG: games('Columns (USA)', 'Shinobi (USA)', 'Sonic the Hedgehog (World)'),
  SFC: games(
    'Chrono Trigger (USA)',
    'Donkey Kong Country (USA)',
    'EarthBound (USA)',
    'F-Zero (USA)',
    'Hagane - The Final Conflict (USA)',
    'Kirby Super Star (USA)',
    'Mega Man X (USA)',
    'Secret of Mana (USA)',
    'Star Fox (USA)',
    'Super Mario World (USA)',
    'Super Metroid (USA)',
    'Super Punch-Out!! (USA)',
  ),
  NGP: games('King of Fighters R-1 (Europe)', 'Samurai Shodown! (Europe)'),
  GBC: games('Pokemon Crystal (USA)', 'Shantae (USA)', 'Wario Land 3 (World)'),
  NGPC: games('Metal Slug - 2nd Mission (World)', 'SNK vs. Capcom - Match of the Millennium (World)', 'Sonic the Hedgehog Pocket Adventure (World)'),
  GBA: games('Advance Wars (USA)', 'Golden Sun (USA)', 'Metroid Fusion (USA)', 'Minish Cap (USA)'),
}

/** Favorites: a system's tag and a file, which is what `fav_toggle` stores. */
export interface Favorite {
  readonly tag: string
  readonly name: string
}

/** Contra carries the heart in `readme-cubic.png`; Chrono Trigger does not in `readme-shelf.png`. */
export const SEED_FAVORITES: readonly Favorite[] = [
  { tag: 'NES', name: 'Contra (USA)' },
  { tag: 'SFC', name: 'Super Metroid (USA)' },
  { tag: 'GBA', name: 'Minish Cap (USA)' },
]

/* ---- per-game facts ------------------------------------------------------- */

export interface Cheevo {
  readonly title: string
  readonly desc: string
  readonly points: number
  readonly earned: boolean
}

export interface GameFacts {
  readonly year?: string
  readonly genre?: string
  readonly synopsis?: string
  /** What the Cheevos row says: "E/N, P/T points". */
  readonly cheevos?: { readonly earned: number; readonly total: number; readonly points: number; readonly of: number }
  /** The set's own title for the game, which the list heads itself with. */
  readonly setTitle?: string
  readonly set?: readonly Cheevo[]
}

/**
 * Only the games a reference frame says something about carry facts; the rest have not been
 * scraped, so their info screen shows only the rows that exist before a scrape.
 *
 * Streets of Rage 2's rows are `readme-info.png`. Hagane's heading and the six rows on screen are
 * `readme-cheevos.png`; the set is 36 long on the device, and only the six the frame shows are
 * kept rather than inventing thirty more. The frame cuts two titles with "...", so their tails here are
 * placeholders long enough to be cut the same way, and no description is invented: the detail card
 * says what the source says for a set without one.
 */
export const FACTS: Readonly<Record<string, GameFacts>> = {
  'MD/Streets of Rage 2 (USA)': {
    year: '1992',
    genre: "Beat'em Up",
    synopsis:
      'Axel, Blaze and two new fighters, Max and Skate, take to the streets again after Mr. X kidnaps Adam.\nFight through eight stages of the city with punches, throws and a special move each, alone or with a friend.',
    cheevos: { earned: 0, total: 40, points: 0, of: 626 },
  },
  'SFC/Hagane - The Final Conflict (USA)': {
    setTitle: 'Hagane: The Final Conflict',
    cheevos: { earned: 3, total: 36, points: 25, of: 415 },
    set: [
      { title: 'The Path to Disaster', desc: '', points: 5, earned: true },
      { title: 'Hold On To Your Potatoes, Here Comes Hagane', desc: '', points: 10, earned: true },
      { title: 'Violated Heavens', desc: '', points: 10, earned: true },
      { title: 'I Am Not Left Handed Either', desc: '', points: 25, earned: false },
      { title: "Koma Faction's Fall", desc: '', points: 25, earned: false },
      { title: 'Not So Disaster', desc: '', points: 10, earned: false },
    ],
  },
}

export const factsFor = (tag: string, name: string): GameFacts => FACTS[`${tag}/${name}`] ?? {}

/* ---- Muse ----------------------------------------------------------------- */

export interface Album {
  readonly artist: string
  readonly name: string
  readonly tracks: readonly { readonly name: string; readonly len: number }[]
}

const tracks = (...t: [string, number][]) => t.map(([name, len]) => ({ name, len }))

/**
 * Seven albums sorted by artist, Muse's default order: `readme-muse.png` has The xx sixth of seven
 * between Sara Bareilles and They Might Be Giants, and `readme-nowplaying.png` has Little Voice
 * playing its first track, 3:56 long, with Vegas next.
 */
export const ALBUMS: readonly Album[] = [
  { artist: 'Arcade Fire', name: 'Funeral', tracks: tracks(['Neighborhood #1 (Tunnels)', 288], ['Wake Up', 335], ['Rebellion (Lies)', 310]) },
  { artist: 'Daft Punk', name: 'Discovery', tracks: tracks(['One More Time', 320], ['Aerodynamic', 212], ['Digital Love', 301]) },
  {
    artist: 'Fleetwood Mac',
    name: 'Rumours',
    tracks: tracks(['Second Hand News', 163], ['Dreams', 254], ['Never Going Back Again', 134], ["Don't Stop", 191], ['Go Your Own Way', 218]),
  },
  { artist: 'Radiohead', name: 'OK Computer', tracks: tracks(['Airbag', 284], ['Paranoid Android', 387], ['Subterranean Homesick Alien', 267]) },
  {
    artist: 'Sara Bareilles',
    name: 'Little Voice',
    tracks: tracks(
      ['01 - Love Song', 236],
      ['02 - Vegas', 222],
      ['03 - Bottle It Up', 213],
      ['04 - Morningside', 245],
      ['05 - Many the Miles', 263],
      ['06 - Between the Lines', 229],
      ['07 - Come Round Soon', 225],
      ['08 - Gravity', 233],
      ['09 - One Sweet Love', 246],
      ['10 - Fairytale', 241],
      ['11 - Undertow', 240],
      ['12 - Love on the Rocks', 226],
    ),
  },
  { artist: 'The xx', name: 'xx', tracks: tracks(['Intro', 127], ['VCR', 177], ['Crystalised', 201], ['Islands', 160]) },
  {
    artist: 'They Might Be Giants',
    name: 'Flood',
    tracks: tracks(['Theme from Flood', 27], ['Birdhouse in Your Soul', 200], ['Lucky Ball and Chain', 164], ['Istanbul (Not Constantinople)', 153]),
  },
]

/** Track names drop a leading number (`ml_track_name`, `src/muselib.c:30`). */
export function trackName(file: string): string {
  return file.replace(/^\d+\s*[-.]?\s*/, '')
}

/** `MUSE_MODES` (`src/main.c:471`). In order has no mark. */
export const PLAY_MODES = ['in order', 'repeat all', 'repeat one', 'shuffle'] as const
export type PlayMode = (typeof PLAY_MODES)[number]

/* ---- settings ------------------------------------------------------------- */

/** `AUTO_OFF` (`src/main.c:1050`), in seconds; 2m is the default. */
export const AUTO_OFF = [0, 30, 60, 120, 300, 600] as const

export function autoOffLabel(s: number): string {
  if (s <= 0) return 'never'
  if (s < 60) return `${s}s`
  return `${s / 60}m`
}

/** `SORTS` (`src/sort.h:44`) and Muse's two orders. */
export const SORTS = ['Name', 'Play Time', 'Last Played', 'Recently Added'] as const
export const MUSE_SORTS = ['Artist', 'Album'] as const

/** `DMODES` (`src/main.c:122`). */
export const DISPLAY_MODES = ['Stretch', 'Aspect', 'Integer', 'Integer tall', 'Overscale', 'Fill', 'Native 1:1'] as const

/* ---- the device ----------------------------------------------------------- */

export interface Network {
  readonly ssid: string
  readonly dbm: number
  readonly secured: boolean
  readonly saved: boolean
}

export const NETWORKS: readonly Network[] = [
  { ssid: 'Tortoise Den', dbm: -48, secured: true, saved: true },
  { ssid: 'Hare Warren', dbm: -66, secured: true, saved: false },
  { ssid: 'Library Guest', dbm: -79, secured: false, saved: false },
]

export interface BtDevice {
  readonly name: string
  readonly paired: boolean
}

export const BT_DEVICES: readonly BtDevice[] = [
  { name: 'Studio Buds', paired: true },
  { name: 'Living Room Speaker', paired: false },
]

/** Over The Hare's panel, as `readme-hare.png` shows it. */
export const HARE = {
  address: '192.168.1.42',
  pin: '4071',
  browsers: '1 connected',
  transferred: '12 KB in / 41 MB out',
  now: 'waiting',
} as const

export const VERSION = '1.0'

/** Play Time: seconds and launches per game, for the stats screen. */
export const PLAY_TIME: readonly { tag: string; name: string; secs: number; launches: number; longest: number; ago: string }[] = [
  { tag: 'SFC', name: 'Chrono Trigger (USA)', secs: 41 * 3600 + 12 * 60, launches: 38, longest: 3 * 3600 + 5 * 60, ago: 'today' },
  { tag: 'MD', name: 'Streets of Rage 2 (USA)', secs: 6 * 3600 + 40 * 60, launches: 22, longest: 56 * 60 + 30, ago: 'yesterday' },
  { tag: 'NES', name: 'Contra (USA)', secs: 2 * 3600 + 3 * 60, launches: 17, longest: 42 * 60, ago: '3d ago' },
  { tag: 'SFC', name: 'Super Metroid (USA)', secs: 9 * 3600 + 21 * 60, launches: 12, longest: 2 * 3600 + 14 * 60, ago: '2w ago' },
  { tag: 'GBA', name: 'Minish Cap (USA)', secs: 4 * 3600 + 7 * 60, launches: 9, longest: 1 * 3600 + 20 * 60, ago: '1mo ago' },
]
