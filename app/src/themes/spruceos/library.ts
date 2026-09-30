/**
 * The sample card, as `docs/themes/spruceos/reference/fixture.txt` describes it and the reference
 * frames were rendered against: one line per game, its system folder under `Roms/`, its file, and
 * the lists it is on. A test holds this module to that file.
 */

export interface System {
  /** The folder under `Roms/` and `Emu/`. */
  readonly folder: string
  /** `Emu/<folder>/config.json` `label`. */
  readonly label: string
  /** `sortOrder`, which orders the Games grid (`game_system_select_menu.py`, spruce's SortOrderKey). */
  readonly sortOrder: number
}

export const SYSTEMS: readonly System[] = [
  { folder: 'GB', label: 'GB', sortOrder: 2700 },
  { folder: 'GBA', label: 'GBA', sortOrder: 2800 },
  { folder: 'MD', label: 'Genesis', sortOrder: 3000 },
  { folder: 'FC', label: 'NES', sortOrder: 4300 },
  { folder: 'PS', label: 'PSX', sortOrder: 5200 },
  { folder: 'SFC', label: 'SNES', sortOrder: 6200 },
]

export interface Game {
  readonly system: string
  readonly file: string
  /** The file name without its extension, which is what every list shows. */
  readonly name: string
}

/** `fixture.txt`, in file order: system folder, file name, and the lists the game is on. */
const FIXTURE: readonly (readonly [string, string, string])[] = [
  ['GB', 'Tetris.gb', 'recent,gs'],
  ['GB', 'Pokemon Red.gb', 'fav'],
  ['GB', "Kirby's Dream Land.gb", ''],
  ['GBA', 'Metroid Fusion.gba', 'fav,recent,gs'],
  ['GBA', 'Advance Wars.gba', ''],
  ['GBA', 'Golden Sun.gba', 'recent'],
  ['FC', 'Super Mario Bros..nes', 'fav'],
  ['FC', 'The Legend of Zelda.nes', 'recent,gs'],
  ['FC', 'Mega Man 2.nes', ''],
  ['SFC', 'Super Metroid.sfc', 'fav,recent,gs'],
  ['SFC', 'Chrono Trigger.sfc', ''],
  ['SFC', 'F-Zero.sfc', ''],
  ['MD', 'Sonic the Hedgehog.md', 'recent'],
  ['MD', 'Streets of Rage 2.md', ''],
  ['MD', 'Gunstar Heroes.md', ''],
  ['PS', 'Castlevania - Symphony of the Night.chd', 'fav'],
  ['PS', 'Crash Bandicoot.chd', ''],
  ['PS', 'Spyro the Dragon.chd', ''],
]

export const FIXTURE_LINES = FIXTURE

const game = ([system, file]: readonly [string, string, string]): Game => ({
  system,
  file,
  name: file.slice(0, file.lastIndexOf('.')),
})

export const GAMES: readonly Game[] = FIXTURE.map(game)

const onList = (tag: string) => FIXTURE.filter(([, , lists]) => lists.split(',').includes(tag)).map(game)

/** Newest first, in the fixture's order (`Saves/pyui-favorites.json`, `pyui-recents.json`). */
export const FAVOURITES: readonly Game[] = onList('fav')
export const RECENTS: readonly Game[] = onList('recent')
/** `Saves/gameswitcher.json`, newest first. */
export const SWITCHER: readonly Game[] = onList('gs')

export const gameKey = (g: Game) => `${g.system}/${g.file}`

/**
 * A system's games as its list shows them: sorted by lower-cased name (`roms_menu_common.py`), which
 * is not the order `sorted()` would give - so the index letter only shows when the two agree.
 */
export function gamesOf(system: string): Game[] {
  return GAMES.filter((g) => g.system === system).sort((a, b) =>
    a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0,
  )
}

export const systemOf = (folder: string) => SYSTEMS.find((s) => s.folder === folder)!

/** `"Name (FOLDER)"`, how Favorites, Recents and the Game Switcher name a game. */
export const listName = (g: Game) => `${g.name} (${g.system})`
