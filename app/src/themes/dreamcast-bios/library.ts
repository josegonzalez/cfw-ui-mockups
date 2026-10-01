/**
 * Sample data. Nothing here is random: every still is posed from it, so a capture can only change
 * when the port does.
 */

export interface Clock {
  readonly month: number
  readonly day: number
  readonly year: number
  readonly hour: number
  readonly minute: number
}

/** The console's clock when the menu opens: the day and minute of the reference capture. */
export const CLOCK: Clock = { month: 7, day: 21, year: 2021, hour: 19, minute: 42 }

/**
 * The clock the BIOS offers when its battery has run down: 11/27/1998 00:00, the Dreamcast's
 * Japanese launch day, as the recording's first box shows it (12s) before it is set.
 */
export const BOOT_CLOCK: Clock = { month: 11, day: 27, year: 1998, hour: 0, minute: 0 }

const pad = (n: number, w = 2) => String(n).padStart(w, '0')

/** `MM/DD/YYYY HH:MM`, the one format the English menu uses. */
export const formatClock = (c: Clock) => `${pad(c.month)}/${pad(c.day)}/${c.year} ${pad(c.hour)}:${pad(c.minute)}`

/** The clock editor's fields, left to right, and each one's range. */
export const CLOCK_FIELDS = [
  { key: 'month', min: 1, max: 12 },
  { key: 'day', min: 1, max: 31 },
  { key: 'year', min: 1998, max: 2086 },
  { key: 'hour', min: 0, max: 23 },
  { key: 'minute', min: 0, max: 59 },
] as const

/** Where each field starts in `formatClock`'s output, in cells, and how many cells it takes. */
export const FIELD_CELLS = [
  [0, 2],
  [3, 2],
  [6, 4],
  [11, 2],
  [14, 2],
] as const

/**
 * A save on the memory card. `desc` and `comment` are the bytes of the file's header as hex where
 * the game wrote Shift-JIS, which the BIOS shows undecoded (`strings.ts` `asLatin1`).
 */
export interface VmuFile {
  readonly id: string
  /** The game the save belongs to: X and Y group files of one game. */
  readonly game: string
  readonly desc: string
  readonly name: string
  readonly comment: string
  readonly blocks: number
  readonly date: string
  /** The seed for the file's placeholder icon, and its two colours. */
  readonly icon: readonly [string, string]
  readonly sjis?: { readonly desc?: string; readonly comment?: string }
}

/**
 * The card in controller A, socket 1: the nine saves the reference capture shows, in its order and
 * with its block counts (`frames/file-list.png`, `file-delete.png`). The five the capture names are
 * given as it names them; the rest are the same shape. Their icons are placeholders.
 */
export const FILES: readonly VmuFile[] = [
  { id: 'bangaio', game: 'BANGAIO', desc: 'BANGAI-O', name: 'BANGAIODC001', comment: 'AUTO SAVE DATA', blocks: 5, date: '01/01/1950 11:00', icon: ['#f3e14a', '#303848'] },
  { id: 'dino', game: 'DINO', desc: 'DINO/EASY/Facility 1F', name: 'DINO____.001', comment: 'DINO CRISIS', blocks: 8, date: '03/11/2019 05:46', icon: ['#c0482c', '#2a2020'] },
  {
    id: 'puyo',
    game: 'PUYO',
    desc: '',
    name: 'PUYOFEVERSYS',
    comment: '',
    blocks: 4,
    date: '05/13/2014 19:54',
    icon: ['#d6a070', '#6ab0e0'],
    // ぷよぷよフィーバー, and システム for its comment.
    sjis: { desc: '82d582e682d582e683748342815b836f815b', comment: '8356835883658380' },
  },
  { id: 'arcadia', game: 'ARCADIA', desc: 'Arcadia', name: 'S.ARCADIA001', comment: 'Arcadia Savefile', blocks: 27, date: '03/20/2019 05:01', icon: ['#c05a34', '#284878'] },
  { id: 'sonic', game: 'SONICADV', desc: 'SONIC ADVENTURE', name: 'SONICADV_SYS', comment: 'SYSTEM FILE', blocks: 18, date: '04/02/2019 21:17', icon: ['#2a58c8', '#f0f0f0'] },
  { id: 'jet', game: 'JET', desc: 'JET SET RADIO', name: 'JETSETON_SYS', comment: 'JET_SYSTEM', blocks: 4, date: '03/14/2019 05:48', icon: ['#9ae04a', '#3a78c8'] },
  { id: 'shadow', game: 'SHADOW', desc: 'SHADOW', name: 'SHADOW___001', comment: 'SAVE DATA', blocks: 10, date: '02/09/2019 16:30', icon: ['#101010', '#f0f0f0'] },
  { id: 'rocket', game: 'ROCKET', desc: 'ROCKET', name: 'ROCKET___SYS', comment: 'SYSTEM', blocks: 3, date: '01/27/2019 10:05', icon: ['#801828', '#f0e0e8'] },
  { id: 'rez', game: 'REZ', desc: 'Rez', name: 'REZ_______01', comment: 'Rez save data', blocks: 9, date: '12/24/2018 23:59', icon: ['#200808', '#e03a2a'] },
]

/** A memory card's user blocks: the capture's 88 used and 110 free, and 83 and 115 after a 5-block delete. */
export const CARD_BLOCKS = 198

/** The controller ports and their two expansion sockets; only A-1 holds a card. */
export const PORTS = ['A', 'B', 'C', 'D'] as const
export const CARD_SLOT = 0

/**
 * The audio CD in the drive, for Music with a disc in: its tracks' lengths in seconds. Stopped, the
 * readouts show the track count and the total length, as the recording's do for its disc (275s).
 */
export const AUDIO_CD: readonly number[] = [212, 187, 241, 198, 263, 225, 174, 236]
export const AUDIO_CD_TOTAL = AUDIO_CD.reduce((a, b) => a + b, 0)

/** `MM:SS`, with as many minutes as it takes - the recording's disc runs to `122:04`. */
export const formatTime = (seconds: number) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
