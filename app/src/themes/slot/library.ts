/**
 * The sample library, and the shell table that colours it.
 *
 * slot is a single-system frontend, so there is far less here than any other set in this repo:
 * no per-system metadata, no scraped art, no palette. A cart is a game code, a name and a shell
 * colour, and the shell colour is the only thing that varies between them.
 */

export interface Cart {
  /** The four-character game code from the ROM header. Only the first three are matched. */
  readonly code: string
  /** The filename, before cleaning. */
  readonly file: string
}

/**
 * `shell.rs`'s table, transcribed whole.
 *
 * Keyed on the region-free game code prefix, so one row covers every region a title shipped in.
 * The source notes that every code was read off a real header rather than recalled, "a wrong one
 * paints some other game in the wrong shell, which is worse than defaulting to grey".
 */
export const EXACT: readonly (readonly [string, string])[] = [
  ['AXV', '#c2332e'], // Pokemon Ruby
  ['AXP', '#2f5cc0'], // Pokemon Sapphire
  ['BPE', '#249c60'], // Pokemon Emerald
  ['BPR', '#d85224'], // Pokemon FireRed
  ['BPG', '#63b044'], // Pokemon LeafGreen
]

/** Keyed on the first letter alone. `M` is the Game Boy Advance Video family. */
export const FAMILY: readonly (readonly [string, string])[] = [['M', '#c6c6c9']]

export const DEFAULT_SHELL = '#35353a'

/**
 * Exact, then family, then default.
 *
 * The order is the escape hatch: an explicit row is how a wrongly coloured family member gets
 * fixed. slot's own table has no code that two rules both claim, so the order is unobservable
 * through it - which is why the source keeps a test for it rather than a comment.
 */
export function shellFor(code: string): string {
  const prefix = code.slice(0, 3)
  const exact = EXACT.find(([key]) => key === prefix)
  if (exact) return exact[1]
  const family = FAMILY.find(([key]) => key === code.slice(0, 1))
  if (family) return family[1]
  return DEFAULT_SHELL
}

/**
 * Strip the extension and any trailing tag group, the way `clean_label` does.
 *
 * A name that cleans to nothing keeps what it had, so a file called `(USA).gba` still shows
 * something.
 */
export function cleanLabel(file: string): string {
  const noExt = file.replace(/\.(gba|agb|bin|zip)$/i, '')
  const cut = noExt.replace(/[([].*$/, '').trim()
  return cut || noExt
}

/** The shelf's sample library. Five carts from the shell table, plus three that fall to grey. */
export const CARTS: readonly Cart[] = [
  { code: 'AXVE', file: 'Pokemon Ruby (USA).gba' },
  { code: 'AXPE', file: 'Pokemon Sapphire (USA).gba' },
  { code: 'BPEE', file: 'Pokemon Emerald (USA).gba' },
  { code: 'BPRE', file: 'Pokemon FireRed (USA).gba' },
  { code: 'BPGE', file: 'Pokemon LeafGreen (USA).gba' },
  { code: 'AMTE', file: 'Metroid Fusion (USA).gba' },
  { code: 'AZLE', file: 'The Legend of Zelda - The Minish Cap (USA).gba' },
  { code: 'MSAE', file: 'Sonic X - Volume 1 (USA).gba' },
]

/* ---- the HUD ------------------------------------------------------------ */

export type IconName =
  | 'volume'
  | 'volumeMuted'
  | 'brightness'
  | 'blueLight'
  | 'fastForward'
  | 'fastForwardLatched'
  | 'rewind'
  | 'alert'

/** `HudKind`. Rewind is not a level: its value is how much history is left. */
export type HudKind = 'brightness' | 'blueLight' | 'volume' | 'rewind'

export function hudIcon(kind: HudKind, value: number): IconName {
  /* Silence is a state, not a low level: a bar at zero looks like a bar nobody has touched. */
  if (kind === 'volume') return value === 0 ? 'volumeMuted' : 'volume'
  if (kind === 'brightness') return 'brightness'
  if (kind === 'blueLight') return 'blueLight'
  return 'rewind'
}

/* ---- the phases --------------------------------------------------------- */

/** `Phase`, which is also the screen inventory. */
export type Phase =
  'set-clock' | 'shelf' | 'inserting' | 'playing' | 'ejecting' | 'polaroids' | 'doze'

export interface ViewDef {
  readonly slug: string
  readonly label: string
  readonly phase: Phase
  readonly source: string
}

export const VIEWS: readonly ViewDef[] = [
  { slug: 'shelf', label: 'Shelf', phase: 'shelf', source: 'slot-ui/src/shelf.rs' },
  {
    slug: 'inserting',
    label: 'Inserting',
    phase: 'inserting',
    source: 'slot-ui/src/slot_chrome.rs',
  },
  { slug: 'playing', label: 'Playing', phase: 'playing', source: 'slot-ui/src/hud.rs' },
  { slug: 'ejecting', label: 'Ejecting', phase: 'ejecting', source: 'slot-ui/src/slot_chrome.rs' },
  {
    slug: 'polaroids',
    label: 'Save states',
    phase: 'polaroids',
    source: 'slot-ui/src/polaroids.rs',
  },
  { slug: 'set-clock', label: 'Set the clock', phase: 'set-clock', source: 'slot-ui/src/clock.rs' },
  { slug: 'doze', label: 'Doze', phase: 'doze', source: 'slot/src/app.rs' },
]

export function viewBySlug(slug: string): ViewDef {
  return VIEWS.find((v) => v.slug === slug) ?? VIEWS[0]!
}

/** The shelf's one hint, and the switcher's three. */
export const SHELF_HINT: readonly (readonly [string, string])[] = [['A', 'play']]
export const CLOCK_HINT: readonly (readonly [string, string])[] = [['A', 'set the clock']]

/** Save states for the switcher: four slots, the last of them empty. */
export const STATES: readonly (string | null)[] = ['00:41', '02:17', '06:03', null]
