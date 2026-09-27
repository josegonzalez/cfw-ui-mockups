/**
 * The sample library: the same folders and file names as `docs/themes/ds-style/reference/fixture.txt`,
 * which the reference frames are rendered from, so a still and its frame list the same games. The
 * GBA games are the source's own demo list (`source/dsstyle.c:594`).
 */
export const ROOT = 'Roms'

export const LIBRARY: Readonly<Record<string, readonly string[]>> = {
  GBA: ['Aster Trail.gba', 'Garden Quest.gba', 'Pocket Rally.gba', 'Skybound.gba', 'Tiny Workshop.gba'],
  GB: ['Tetris.gb', "Kirby's Dream Land.gb"],
  GBC: ["Link's Awakening DX.gbc"],
  FC: ['Super Mario Bros.nes'],
  SFC: ['Super Metroid.sfc', 'Chrono Trigger.sfc', 'The Legend of Zelda - A Link to the Past.sfc'],
  MD: ['Sonic the Hedgehog.md'],
  PS: ['Crash Bandicoot.chd'],
}

/** The seeded collections, as the reference renderer's state files hold them. */
export const RECENTS: readonly string[] = [`${ROOT}/GBA/Garden Quest.gba`, `${ROOT}/SFC/Super Metroid.sfc`]
export const FAVOURITES: readonly string[] = [`${ROOT}/GBA/Pocket Rally.gba`, `${ROOT}/GB/Tetris.gb`]

/** What the launcher lists: a folder, a game, or an app (`dsstyle.c:51`). */
export interface Entry {
  readonly name: string
  readonly path: string
  readonly dir: boolean
  /** 0 a game or folder; 1 a built-in app; 4 the Apps shortcut in the Systems list. */
  readonly app: 0 | 1 | 4
}

export const filename = (path: string) => path.slice(path.lastIndexOf('/') + 1)
export const parent = (path: string) => path.slice(0, path.lastIndexOf('/'))

/** `cmpentry`: folders first, then case-insensitively by name (`dsstyle.c:146`). */
export function byName(a: Entry, b: Entry): number {
  if (a.dir !== b.dir) return a.dir ? -1 : 1
  const x = a.name.toLowerCase()
  const y = b.name.toLowerCase()
  return x < y ? -1 : x > y ? 1 : 0
}

/** `browse`: a folder's contents, or the root's system folders (`dsstyle.c:188-221`). */
export function list(path: string): Entry[] {
  if (path === ROOT) {
    return Object.keys(LIBRARY)
      .map((sys) => ({ name: sys, path: `${ROOT}/${sys}`, dir: true, app: 0 as const }))
      .sort(byName)
  }
  const sys = filename(path)
  return (LIBRARY[sys] ?? [])
    .map((name) => ({ name, path: `${path}/${name}`, dir: false, app: 0 as const }))
    .sort(byName)
}

/** Every game on the card, for a search from the Systems list (`extra_state.h:27-40`). */
export const allGames = (): Entry[] => Object.keys(LIBRARY).flatMap((sys) => list(`${ROOT}/${sys}`))

/** `apps()`: the built-in apps; the preview lists RetroArch and PPSSPP, and no `.sh` apps (`dsstyle.c:229`). */
export const APPS: readonly Entry[] = [
  { name: 'RetroArch', path: 'retroarch', dir: false, app: 1 },
  { name: 'PPSSPP', path: 'ppsspp', dir: false, app: 1 },
  { name: 'Stock OS', path: 'stock', dir: false, app: 1 },
]

/** The Apps shortcut the Systems list gains with Apps in Games on (`dsstyle.c:217`). */
export const APPS_SHORTCUT: Entry = { name: 'Apps', path: '@apps', dir: true, app: 4 }

/** `system_full_title` (`system_names.h:2-18`). */
const FULL: Readonly<Record<string, string>> = {
  PS: 'PlayStation',
  PSX: 'PlayStation',
  PSP: 'PlayStation Portable',
  GBA: 'Game Boy Advance',
  GB: 'Game Boy',
  GBC: 'Game Boy Color',
  FC: 'Nintendo Entertainment System',
  NES: 'Nintendo Entertainment System',
  FAMICOM: 'Famicom',
  SFC: 'Super Nintendo',
  SNES: 'Super Nintendo',
  N64: 'Nintendo 64',
  NDS: 'Nintendo DS',
  FDS: 'Famicom Disk System',
  MD: 'Mega Drive',
  GENESIS: 'Genesis',
  MDCD: 'Mega CD',
  SEGA32X: 'Sega 32X',
  SMS: 'Master System',
  GG: 'Game Gear',
  PCE: 'PC Engine',
  PCECD: 'PC Engine CD',
  NGP: 'Neo Geo Pocket',
  NGPC: 'Neo Geo Pocket Color',
  NEOCD: 'Neo Geo CD',
  NEOGEO: 'Neo Geo',
  WS: 'WonderSwan',
  WSC: 'WonderSwan Color',
  VB: 'Virtual Boy',
  GW: 'Game & Watch',
  POKE: 'Pokemon Mini',
  A2600: 'Atari 2600',
  A5200: 'Atari 5200',
  A7800: 'Atari 7800',
  A800: 'Atari 800',
  ATARIST: 'Atari ST',
  LYNX: 'Atari Lynx',
  C64: 'Commodore 64',
  VIC20: 'Commodore VIC-20',
  MSX: 'MSX',
  AMIGA: 'Amiga',
  DREAMCAST: 'Dreamcast',
  SATURN: 'Sega Saturn',
  CPS1: 'Capcom Play System',
  CPS2: 'Capcom Play System II',
  CPS3: 'Capcom Play System III',
  FBNEO: 'FinalBurn Neo',
  MAME: 'Arcade (MAME)',
  NAOMI: 'Sega NAOMI',
  ATOMISWAVE: 'Atomiswave',
  PICO: 'PICO-8',
  SCUMMVM: 'ScummVM',
  EASYRPG: 'EasyRPG',
  DOS: 'DOS',
  PORTS: 'Ports',
  'SG-1000': 'Sega SG-1000',
  COLECO: 'ColecoVision',
  SCV: 'Super Cassette Vision',
}

export const fullTitle = (name: string) => FULL[name.toUpperCase()] ?? name

/** `system_title`: the full name, or the folder's own with System names on Short (`system_names.h:20`). */
export const systemTitle = (name: string, full: boolean) => (full ? fullTitle(name) : name)

/** The system a path is under - the folder right below the root. */
export function systemOf(path: string): string | null {
  if (!path.startsWith(`${ROOT}/`)) return null
  return path.slice(ROOT.length + 1).split('/')[0] ?? null
}
