/**
 * Every box the BIOS menu draws, in pixels of its 640x480 frame, measured from the reference
 * frames (`docs/themes/dreamcast-bios/reference/frames/`). The BIOS draws edge to edge, so the
 * frame is the panel and nothing is inset.
 */
export const W = 640
export const H = 480

export interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** The system font's cell: 12x24 for a narrow glyph, twice as wide for a wide one. */
export const CELL = { w: 12, h: 24 } as const

/** The top bar, and the logo and clock on it (`main.png`). */
export const BAR = { h: 62 } as const
export const LOGO: Box = { x: 30, y: 29, w: 136, h: 34 }
export const CLOCK = { right: 612, y: 38 } as const

/** The main menu's label pills. Its models are placed by their own transforms (`models/scene.ts`). */
export const MAIN = {
  play: { pill: { x: 205, y: 202, w: 114, h: 42 } },
  file: { pill: { x: 427, y: 202, w: 114, h: 42 } },
  music: { pill: { x: 205, y: 365, w: 114, h: 42 } },
  settings: { pill: { x: 427, y: 365, w: 114, h: 42 } },
} as const satisfies Record<string, { pill: Box }>

/** BACK, where each screen puts it. */
export const BACK_SIZE = 56
export const BACK = {
  settings: { x: 94, y: 372 },
  file: { x: 50, y: 366 },
  music: { x: 72, y: 380 },
} as const

/** Settings: four rows, the last with a second field under it for the memory-card clock. */
export const SETTINGS = {
  x: 44,
  w: 572,
  rowH: 52,
  rows: [54, 130, 209, 286],
  labelRight: 224,
  icon: { x: 58, w: 40 },
  value: { x: 258, w: 354, inset: 4 },
  /** The memory-card clock's field, and the slate that runs down behind it. */
  adjust: { x: 258, y: 338, w: 354, h: 86 },
  adjustBacking: { x: 190, y: 286, w: 426, h: 144 },
} as const

/**
 * Dialogs. Each gives its box, the centre line of each line of its message (`title`), and where its
 * options go: the first option's centre, the distance between them, and the blobs' centre line.
 */
export const DIALOG = {
  rim: 4,
  radius: 6,
  blob: { w: 46, h: 36 },
  /** `settings-language.png`. */
  language: { box: { x: 142, y: 46, w: 356, h: 386 }, title: [68, 94], first: 136, pitch: 42, blobX: 268 },
  /** `boot-clock.png` and `settings-clock.png`: four lines, the date, and Select (and Cancel) beside it. */
  clock: {
    box: { x: 84, y: 98, w: 472, h: 284 },
    title: [134, 159, 185, 210],
    date: { x: 156, cy: 295 },
    blobX: 410,
    select: 268,
    cancel: 328,
    /** The first-boot box has Select alone, level with the date. */
    bootSelect: 295,
    arrow: { w: 16, h: 14, gap: 26 },
  },
  /** `settings-sound.png`. */
  sound: { box: { x: 166, y: 128, w: 308, h: 222 }, title: [146, 171], first: 210, pitch: 52, blobX: 288 },
  /** `settings-other.png`. */
  auto: { box: { x: 66, y: 114, w: 510, h: 248 }, title: [136, 161], first: 223, pitch: 52, blobX: 228 },
  /** `settings-vmu-clock.png`: three lines, then the console's clock beside Select and Cancel. */
  cardClock: {
    box: { x: 84, y: 98, w: 474, h: 284 },
    title: [130, 155, 180],
    current: { x: 116, cy: [243, 268] },
    date: { x: 156, cy: 305 },
    blobX: 410,
    select: 268,
    cancel: 328,
  },
  /** The Play box with no disc in: its message, and a blob with no label (`no-disc.png`). */
  noDisc: { box: { x: 74, y: 144, w: 492, h: 192 }, title: [188], blob: { cx: 320, cy: 300 } },
  /** "Set all memory cards to...", over the memory-card clock box (`settings-vmu-done.png`). */
  cardsSet: { box: { x: 76, y: 144, w: 490, h: 192 }, title: [190, 214], blob: { cx: 320, cy: 300 } },
} as const

/** File: the card picker (`file-cards.png`). */
export const CARDS = {
  header: { x: 55, y: 42, w: 530, h: 76 },
  band: { x: 55, y: 118, w: 530, h: 42 },
  column: { x: 188, pitch: 99, w: 70 },
  tab: { y: 162, h: 30 },
  slot: [{ y: 200, h: 118 }, { y: 330, h: 110 }],
  number: { cx: 140, cy: [284, 408] },
  info: { x: 66, y: 126, w: 110, h: 106 },
} as const

/** File: the file list (`file-list.png`). */
export const FILES = {
  headerBox: { x: 138, y: 38, w: 464, h: 104 },
  vmu: { x: 44, y: 124, w: 78, h: 110 },
  info: { x: 26, y: 244, w: 108, h: 108 },
  all: { cx: 147, cy: 158, r: 22 },
  panel: { x: 140, y: 146, w: 464, h: 298, rim: 8, split: 194 },
  grid: { x: 198, y: 165, cols: 8, rows: 3, pitchX: 48, pitchY: 52, w: 40, h: 50 },
  arrows: { cx: 172, up: 216, down: 296 },
  detail: { x: 152, lines: [356, 386, 416], right: 590 },
  /** The prompt's two lines are placed apart: the first starts with its own two spaces. */
  header: { x: [116, 168], lines: [58, 84] },
  /** Copy, Delete, Cancel over the grid (`file-menu.png`). */
  menu: { box: { x: 187, y: 160, w: 360, h: 173 }, first: 179, pitch: 58, blobX: 267 },
  /** Copy all, Delete all, Cancel, for ALL (`file-all-menu.png`). */
  allMenu: { box: { x: 62, y: 138, w: 470, h: 204 }, first: 180, pitch: 59, blobX: 128 },
  /** Yes and No, with the header asking; it opens on No (`file-delete.png`). */
  confirm: { box: { x: 187, y: 168, w: 226, h: 139 }, first: 208, pitch: 56, blobX: 293 },
  /** "File was deleted.", over the list after Yes (`file-deleted.png`). */
  deleted: { box: { x: 75, y: 144, w: 485, h: 240 }, title: [187], blob: { cx: 320, cy: 299 } },
} as const

/** Music (`music-empty.png`): the two readouts and the transport row. */
export const MUSIC = {
  track: { cx: 140, cy: 104 },
  time: { cx: 500, cy: 104 },
  lozenge: { w: 156, h: 30 },
  /** The readouts' figures: 29 pixels apart in TIME, 46 in TRACK. */
  digits: { y: 132, advance: 29, trackPitch: 46 },
  buttons: { cx: [185, 275, 365, 455, 545], cy: 408, w: 84, h: 40 },
} as const

/**
 * Power-on (`boot-logo.png`): the swirl, and the ROM's wordmark texture at 2.88 times its 128x32 -
 * its ink runs from texel 30 to 123, which lands "Dreamcast" on the capture's x 174 to 445.
 */
export const BOOT = {
  swirl: { x: 230, y: 130, w: 180, h: 160 },
  wordmark: { x: 88, y: 277, w: 369, h: 92 },
} as const
