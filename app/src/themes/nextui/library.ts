/**
 * The sample library, and what every view the theme touches is made of.
 *
 * Twenty-three views render this theme, and they are not twenty-three different screens: nearly
 * all are a title, a list or a body block, and a hint bar, differing in what fills the middle and
 * which buttons the bar names. Modelling that shape once - here, as data - is what keeps the view
 * components thin enough to be worth reading.
 *
 * Every string is the source's own. The hint labels come from each view's `hint_group_draw` call,
 * the settings rows and their descriptions from `nextui_rows[]`, the slot names from
 * `slot_labels[]`. Nothing here is invented except the sample ROM titles, which stand in for
 * whatever is on the card.
 */

export interface RomEntry {
  readonly name: string
  /** Folders have no cover, so they draw the tinted folder icon instead. */
  readonly folder?: boolean
}

/**
 * The browser's sample listing.
 *
 * Names are shown cleaned, as `theme_display_name` does it: the extension and any trailing tag
 * group are hidden, so `GoldenEye 007 (USA).z64` reads as `GoldenEye 007`. The first entry is long
 * enough to overflow its row, which is the only way to see the marquee.
 */
export const BROWSER: readonly RomEntry[] = [
  { name: 'A Longer Folder Name For Marquee Testing', folder: true },
  { name: 'Demos', folder: true },
  { name: 'Homebrew', folder: true },
  { name: 'Stress', folder: true },
  { name: 'Menu Jingle' },
  { name: 'Wave Race 64' },
  { name: 'Perfect Dark' },
  { name: 'Banjo-Kazooie' },
  { name: 'Donkey Kong 64' },
  { name: 'GoldenEye 007' },
  { name: 'Super Mario 64' },
  { name: 'The Legend of Zelda: Ocarina of Time' },
  { name: 'Mario Kart 64' },
  { name: 'Star Fox 64' },
]

export const COLLECTIONS: readonly RomEntry[] = [{ name: 'Racing' }, { name: 'Shooters' }]

export const HISTORY: readonly RomEntry[] = [
  { name: 'Banjo-Kazooie' },
  { name: 'Perfect Dark' },
  { name: 'Wave Race 64' },
  { name: 'Super Mario 64' },
]

export const CPAK_NOTES: readonly RomEntry[] = [
  { name: 'MARIOKART64' },
  { name: 'BANJO KAZOOIE' },
  { name: 'PERFECT DARK' },
]

/** One hint pill: a lettered circle (or a worded mini pill) and its label. */
export interface Hint {
  readonly button: string
  readonly label: string
}

/**
 * A settings row: a label, a value, and the line of help shown under the list when it is selected.
 * `chevron` rows lead to another screen and show `>` rather than a value.
 */
export interface SettingRow {
  readonly label: string
  readonly value: string
  readonly description: string
}

/** `nextui_rows[]` from `settings_editor.c`, in order, with the descriptions it carries. */
export const SETTINGS_ROWS: readonly SettingRow[] = [
  { label: 'Date-Time Settings', value: '>', description: 'Adjust the real time clock' },
  { label: 'Menu Information', value: '>', description: 'Version and credits' },
  { label: 'Flashcart Information', value: '>', description: 'Details about the flashcart' },
  { label: 'N64 Information', value: '>', description: 'Details about the console' },
  {
    label: 'Menu Theme',
    value: 'NextUI',
    description: 'Switch between the Classic and NextUI look',
  },
  {
    label: 'Menu Colors',
    value: '>',
    description: 'Choose a palette or edit the theme colors',
  },
  {
    label: 'Show Hidden Files',
    value: 'Off',
    description: 'Show system files and hidden entries in the browser',
  },
  {
    label: 'Show Only Supported Files',
    value: 'On',
    description: 'Hide files the menu cannot load or open',
  },
  { label: 'Sound Effects', value: 'On', description: 'Play sounds when navigating the menu' },
  { label: 'Background Music', value: 'Off', description: 'Play music while in the menu' },
  {
    label: 'Use Saves Folder',
    value: 'On',
    description: 'Store ROM saves in a separate saves folder',
  },
  { label: 'Show Saves Folder', value: 'Off', description: 'Show the saves folder in the browser' },
  { label: 'Show Save Files', value: 'Off', description: 'Show save files in the browser' },
  { label: 'Show Cheat Files', value: 'Off', description: 'Show cheat files in the browser' },
  {
    label: 'PAL60 Mode',
    value: 'Off',
    description: 'Use a 60 Hz signal on PAL consoles. May blank some displays',
  },
  {
    label: 'ROM Loading Bar',
    value: 'On',
    description: 'Show a progress bar while loading a ROM',
  },
]

/** `slot_labels[]`, shared by the colours hub and the editor's title. */
export const SLOT_LABELS: readonly string[] = [
  'Main Color',
  'Primary Accent',
  'Secondary Accent',
  'List Text',
  'List Text (Selected)',
  'Hint Text',
  'Background',
]

/** A label/value pair drawn by `ui_components_nextui_row_draw`. */
export interface InfoRow {
  readonly label: string
  readonly value: string
}

/** `flashcart_info.c`, which draws two rows, a gap, then eight feature rows. */
export const FLASHCART_ROWS: readonly InfoRow[] = [
  { label: 'Type', value: 'SummerCart64' },
  { label: 'Firmware version', value: '2.20.1' },
  { label: 'Virtual 64DD', value: 'Yes' },
  { label: 'Real Time Clock', value: 'Yes' },
  { label: 'USB Debugging', value: 'Yes' },
  { label: 'Automatic CIC', value: 'Yes' },
  { label: 'Region Detection', value: 'Yes' },
  { label: 'Save Writeback', value: 'Yes' },
  { label: 'Auto F/W Updates', value: 'No' },
  { label: 'Fast ROM Reboots', value: 'Yes' },
]

export const MUSIC_ROWS: readonly InfoRow[] = [
  { label: 'Elapsed / length', value: '00:12 / 00:38' },
  { label: 'Average bitrate', value: '128 kbps' },
  { label: 'Samplerate', value: '44100 Hz' },
]

/** The load screen's ledger: eight rows in two columns, each with an icon. */
export interface LedgerRow {
  readonly icon:
    'players' | 'save' | 'region' | 'expansion' | 'rumble' | 'tpak' | 'cheats' | 'patches'
  readonly label: string
  readonly value: string
  /** `Not used`, `Off` and `Not required` render dimmed but stay visible. */
  readonly dimmed?: boolean
}

export const LEDGER_LEFT: readonly LedgerRow[] = [
  { icon: 'players', label: 'Players', value: '' },
  { icon: 'save', label: 'Save type', value: 'EEPROM 4kbit | Cont…' },
  { icon: 'region', label: 'TV region', value: 'NTSC' },
  { icon: 'expansion', label: 'Expansion PAK', value: 'Not required', dimmed: true },
]

export const LEDGER_RIGHT: readonly LedgerRow[] = [
  { icon: 'rumble', label: 'Rumble PAK', value: 'Not used', dimmed: true },
  { icon: 'tpak', label: 'Transfer PAK', value: 'Not used', dimmed: true },
  { icon: 'cheats', label: 'Datel Cheats', value: 'Off', dimmed: true },
  { icon: 'patches', label: 'Patches', value: 'Off', dimmed: true },
]

/** Cheat codes for the Datel editor, which shows On in green and Off in red. */
export const CHEAT_CODES: readonly { code: string; enabled: boolean }[] = [
  { code: '8033AFA1 0001', enabled: true },
  { code: '8133B172 4220', enabled: false },
  { code: 'D033AF9F 0020', enabled: true },
  { code: '8133AF9E 0064', enabled: false },
  { code: '80389D8C 0009', enabled: true },
]

/**
 * Every view the theme draws.
 *
 * `kind` is the shape it renders as; `topHints`, `leftHints` and `rightHints` are the groups the
 * view's own source draws. Three of the menu's twenty-six views - error, fault and startup - never
 * render this theme and are absent.
 */
export type ViewKind =
  | 'browser'
  | 'titled-browser'
  | 'settings'
  | 'colors'
  | 'palette'
  | 'editor'
  | 'load'
  | 'rows'
  | 'body'
  | 'cheats'
  | 'cpak'
  | 'music'
  | 'image'

export interface ViewDef {
  readonly slug: string
  /** What the view is called in the gallery. The screen may draw no title of its own. */
  readonly label: string
  /** The screen title, or null where the view draws none. */
  readonly title: string | null
  readonly kind: ViewKind
  readonly topHints?: readonly Hint[]
  readonly leftHints?: readonly Hint[]
  readonly rightHints: readonly Hint[]
  /** A centred or left-aligned line the view draws just above the hint bar. */
  readonly footnote?: string
  /** How many items its list holds, for cursor clamping. */
  readonly items?: number
  /** The source file it comes from, so a reader can check the strings. */
  readonly source: string
}

const BACK: Hint = { button: 'B', label: 'BACK' }
const SETTINGS_TOP: readonly Hint[] = [{ button: 'START', label: 'SETTINGS' }]

export const VIEWS: readonly ViewDef[] = [
  {
    slug: 'browser',
    label: 'File browser',
    title: null,
    kind: 'browser',
    topHints: SETTINGS_TOP,
    leftHints: [{ button: 'R', label: 'OPTIONS' }],
    rightHints: [BACK, { button: 'A', label: 'PLAY' }],
    items: BROWSER.length,
    source: 'views/browser.c',
  },
  {
    slug: 'collections',
    label: 'Collections',
    title: 'Collections',
    kind: 'titled-browser',
    topHints: SETTINGS_TOP,
    rightHints: [BACK, { button: 'A', label: 'OPEN' }],
    items: COLLECTIONS.length,
    source: 'views/collections.c',
  },
  {
    slug: 'history-favorites',
    label: 'Favorites',
    title: 'Favorites',
    kind: 'titled-browser',
    topHints: SETTINGS_TOP,
    leftHints: [{ button: 'R', label: 'REMOVE' }],
    rightHints: [BACK, { button: 'A', label: 'PLAY' }],
    items: HISTORY.length,
    source: 'views/history_favorites.c',
  },
  {
    slug: 'settings-editor',
    label: 'Settings',
    title: 'Settings',
    kind: 'settings',
    leftHints: [{ button: 'R', label: 'RESET' }],
    rightHints: [BACK, { button: 'A', label: 'CHANGE' }],
    items: SETTINGS_ROWS.length,
    source: 'views/settings_editor.c',
  },
  {
    slug: 'menu-colors',
    label: 'Menu Colors',
    title: 'Menu Colors',
    kind: 'colors',
    leftHints: [{ button: 'R', label: 'RESET COLORS' }],
    rightHints: [BACK, { button: 'A', label: 'CHANGE' }],
    items: 9,
    source: 'views/nextui_colors.c',
  },
  {
    slug: 'palette-picker',
    label: 'Palettes',
    title: 'Palettes',
    kind: 'palette',
    rightHints: [BACK, { button: 'A', label: 'APPLY' }],
    source: 'views/nextui_palette_view.c',
  },
  {
    slug: 'color-editor',
    label: 'Color editor',
    title: 'Main Color',
    kind: 'editor',
    leftHints: [{ button: 'C', label: 'FAST' }],
    rightHints: [
      { button: 'B', label: 'CANCEL' },
      { button: 'A', label: 'SAVE' },
    ],
    items: 3,
    source: 'views/nextui_color_editor.c',
  },
  {
    slug: 'load-rom',
    label: 'Load ROM',
    title: 'Mario Kart 64',
    kind: 'load',
    topHints: [{ button: 'START', label: 'INFO' }],
    leftHints: [{ button: 'R', label: 'OPTIONS' }],
    rightHints: [BACK, { button: 'A', label: 'PLAY' }],
    source: 'views/load_rom.c',
  },
  {
    slug: 'load-disk',
    label: 'Load 64DD disk',
    title: null,
    kind: 'body',
    leftHints: [
      { button: 'Z', label: 'WITH ROM' },
      { button: 'R', label: 'OPTIONS' },
    ],
    rightHints: [BACK, { button: 'A', label: 'PLAY' }],
    source: 'views/load_disk.c',
  },
  {
    slug: 'load-emulator',
    label: 'Load emulator',
    title: null,
    kind: 'body',
    rightHints: [BACK, { button: 'A', label: 'PLAY' }],
    source: 'views/load_emulator.c',
  },
  {
    slug: 'file-info',
    label: 'File Information',
    title: null,
    kind: 'body',
    rightHints: [BACK, { button: 'A', label: 'RESTORE' }],
    source: 'views/file_info.c',
  },
  {
    slug: 'system-info',
    label: 'N64 Information',
    title: 'N64 Information',
    kind: 'body',
    rightHints: [BACK],
    source: 'views/system_info.c',
  },
  {
    slug: 'flashcart-info',
    label: 'Flashcart Information',
    title: 'Flashcart Information',
    kind: 'rows',
    rightHints: [BACK],
    source: 'views/flashcart_info.c',
  },
  {
    slug: 'credits',
    label: 'Menu Information',
    title: 'Menu Information',
    kind: 'body',
    leftHints: [{ button: 'Z', label: 'LICENSES' }],
    rightHints: [BACK],
    source: 'views/credits.c',
  },
  {
    slug: 'rtc',
    label: 'Date-Time Settings',
    title: 'Date-Time Settings',
    kind: 'body',
    rightHints: [BACK, { button: 'A', label: 'ADJUST' }],
    source: 'views/rtc.c',
  },
  {
    slug: 'music-player',
    label: 'Music player',
    title: 'Menu Jingle',
    kind: 'music',
    leftHints: [{ button: 'A', label: 'PAUSE' }],
    rightHints: [BACK],
    source: 'views/music_player.c',
  },
  {
    slug: 'image-viewer',
    label: 'Image viewer',
    title: null,
    kind: 'image',
    rightHints: [BACK, { button: 'A', label: 'SET BG' }],
    source: 'views/image_viewer.c',
  },
  {
    slug: 'text-viewer',
    label: 'Text viewer',
    title: null,
    kind: 'body',
    footnote: 'Up / Down: scroll',
    rightHints: [BACK],
    source: 'views/text_viewer.c',
  },
  {
    slug: 'extract-file',
    label: 'Extract file',
    title: null,
    kind: 'body',
    rightHints: [BACK, { button: 'A', label: 'EXTRACT' }],
    source: 'views/extract_file.c',
  },
  {
    slug: 'datel-code-editor',
    label: 'Datel Code Editor',
    title: 'Datel Code Editor',
    kind: 'cheats',
    leftHints: [
      { button: 'Z', label: 'SAVE' },
      { button: 'R', label: 'OPTIONS' },
    ],
    rightHints: [BACK, { button: 'A', label: 'APPLY' }],
    items: CHEAT_CODES.length,
    source: 'views/datel_code_editor.c',
  },
  {
    slug: 'cpakfs-manager',
    label: 'Controller Pak Manager',
    title: 'Controller Pak Manager',
    kind: 'cpak',
    leftHints: [
      { button: 'Z', label: 'NOTE' },
      { button: 'R', label: 'OPTIONS' },
    ],
    rightHints: [BACK, { button: 'A', label: 'BACKUP' }],
    footnote: 'Left / Right: change controller',
    items: CPAK_NOTES.length,
    source: 'views/cpakfs_manager.c',
  },
  {
    slug: 'cpak-dump-info',
    label: 'Controller Pak Dump',
    title: 'Controller Pak Dump',
    kind: 'body',
    rightHints: [BACK],
    source: 'views/cpak_dump_info.c',
  },
  {
    slug: 'cpak-note-dump-info',
    label: 'Controller Pak Note Dump',
    title: 'Controller Pak Note Dump',
    kind: 'body',
    rightHints: [BACK],
    source: 'views/cpak_note_dump_info.c',
  },
]

export function viewBySlug(slug: string): ViewDef {
  return VIEWS.find((v) => v.slug === slug) ?? VIEWS[0]!
}

/**
 * The body text the info and text views show.
 *
 * The wording is the source's where the source has a literal - credits, system info and the RTC
 * screen all print fixed strings around their substitutions. The substituted values are a
 * plausible console: a SummerCart64 with one controller and an Expansion Pak.
 */
export const BODY_TEXT: Record<string, readonly string[]> = {
  credits: [
    'Menu version: v1.5.0',
    'Build timestamp: 2026-03-11T18:42:07Z',
    'libdragon SDK: 12.0.0 (trunk, a2f0e7c)',
    '',
    'Get the latest menu version:',
    '  https://github.com/Polprzewodnikowy/N64FlashcartMenu',
    '',
    'Authors:',
    '  Robin Jones / NetworkFusion',
    '  Mateusz Faderewski / Polprzewodnikowy',
    '  and all project contributors,',
    '  thank you!',
  ],
  'system-info': [
    'Expansion PAK is inserted',
    '',
    'Joypad 1 is connected (Controller Pak)',
    'Joypad 2 is not connected',
    'Joypad 3 is not connected',
    'Joypad 4 is not connected',
    '',
    'Physical Disk Drive attached: No',
  ],
  rtc: [
    'Press A to set the RTC date and time.',
    'You can also use the PC terminal application',
    'via USB, or an N64 game with RTC support.',
  ],
  'file-info': [
    'Banjo-Kazooie (USA).z64',
    '',
    'Size: 16.0 MB',
    'Modified: 2024-03-11 18:42',
    'Attributes: Archive',
  ],
  'text-viewer': [
    '# Readme',
    '',
    'Place ROMs in sd:/games and box art in a',
    '.media folder beside them.',
    '',
    'Images must be PNG files no larger than',
    '288x288 pixels; any aspect ratio within',
    'that box works and is scaled to fit.',
  ],
  'extract-file': [
    'N64brew Demo.zip',
    '',
    'Extract to sd:/games/N64brew Demo?',
    '',
    'This will overwrite any existing file.',
  ],
  'cpak-dump-info': ['Controller Pak 1', '', '123 of 123 pages free', '0 notes'],
  'cpak-note-dump-info': ['Note 1 of 4', '', 'MARIOKART64', '12 pages'],
  'load-disk': [
    '64DD Disk',
    '',
    'Mario Artist Paint Studio (JPN).ndd',
    '',
    'Disk type: Retail',
    'Region: JPN',
  ],
  'load-emulator': ['Emulated ROM', '', 'neon64bu.rom', '', 'Emulator: Neon64'],
}

/** The one row the RTC screen draws under its body text. */
export const RTC_ROW: InfoRow = {
  label: 'Current date & time',
  value: 'Tue Mar 11 18:42:07 2024',
}

/** The Controller Pak manager's header row and its two status lines. */
export const CPAK_STATE = {
  controller: '< 1 >',
  status: 'Controller Pak inserted',
  free: '105 of 123 pages free',
} as const
