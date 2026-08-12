/**
 * slot's geometry, from the Rust source.
 *
 * The panel is 720x480 and there is no scale factor anywhere: slot targets one device with one
 * output size, so every number here is a literal pixel exactly as it is in the source. See
 * `docs/themes/slot/reference/source-notes.md` for the file:line references.
 */
export const OUT = { w: 720, h: 480 } as const
export const CENTER = { x: OUT.w / 2, y: OUT.h / 2 } as const

/* ---- the cart ----------------------------------------------------------- */

export const CART = { w: 240, h: 135 } as const

/**
 * The paper label, inset in the shell rather than covering it.
 *
 * 9% to 91% across and 22.8% to 86.3% down. The band left above is the moulded grip, and the
 * source is explicit that the asymmetry "is most of what makes the face read as a cartridge
 * rather than a bordered rectangle".
 */
function labelPanel(w: number, h: number) {
  const x0 = Math.round((w * 90) / 1000)
  const y0 = Math.round((h * 228) / 1000)
  const x1 = Math.round((w * 910) / 1000)
  const y1 = Math.round((h * 863) / 1000)
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

export const LABEL = labelPanel(CART.w, CART.h)
export const LABEL_PAD = 10
export const LABEL_MAX_LINES = 3
/** Three lines have to clear the label; Open Sans Bold sets at about 1.36x the em. */
export const LABEL_MAX_PX = LABEL.h / (LABEL_MAX_LINES * 1.36)
export const LABEL_MIN_PX = 10

/* ---- the shelf ---------------------------------------------------------- */

export const SHELF = {
  /** Wider than a cart so the neighbours peek in. At 286 the side carts were clipped. */
  pitch: 240,
  sideScale: 0.78,
  sideAlpha: 0.55,
  /** Carts stand on the row: the foot stays put as a cart shrinks away. */
  footY: (OUT.h + CART.h) / 2,
  /** How far the neighbour is pushed aside as the chosen cart goes in. */
  part: 130,
  /** Slots considered either side of the selection. */
  slots: 3,
} as const

/* ---- the slot chrome ---------------------------------------------------- */

export const MOUTH = { w: CART.w + 14, h: 58 } as const
export const BAND_Y = OUT.h - MOUTH.h
export const MOUTH_X = (OUT.w - MOUTH.w) / 2
export const LIP_H = 2
export const LIP_Y = BAND_Y
export const BAY = { w: MOUTH.w + 18, y: BAND_Y + LIP_H } as const
export const BAY_X = (OUT.w - BAY.w) / 2
export const SLIT = { h: 9, y: BAY.y + 5 } as const
export const RECESS_H = 42
export const SCOOP = { w: MOUTH.w * 0.88, y: SLIT.y + SLIT.h, flat: 4 } as const
export const SCOOP_D = RECESS_H - (SCOOP.y - BAY.y)
export const RIM_W = 2

export const CART_X = (OUT.w - CART.w) / 2
export const REST_Y = (OUT.h - CART.h) / 2
export const SEATED_Y = BAY.y + 4
export const ALERT_PX = 44

/* ---- the switcher ------------------------------------------------------- */

/** The GBA's own resolution, which is what a save-state thumbnail is a picture of. */
export const PHOTO = { w: 240, h: 160 } as const
export const SWITCHER = { dot: 6, dotGap: 10, dotDim: 0.35, margin: 16, blank: '#3a3a3e' } as const
export const SWITCHER_LEGEND: readonly (readonly [string, string])[] = [
  ['B', 'Back'],
  ['Y', 'Delete'],
  ['A', 'Load'],
]

/* ---- the HUD ------------------------------------------------------------ */

export const HUD = {
  plateH: 40,
  iconPx: 18,
  ink: '#f5f2ef',
  iconGap: 10,
  badgeMargin: 12,
  barW: 320,
  barH: 6,
  track: 'rgba(255, 255, 255, 0.18)',
} as const
export const HUD_BAR_Y = (HUD.plateH - HUD.barH) / 2

/* ---- hints, plates and the footer --------------------------------------- */

export const HINT = { h: 24, cap: 20, capPad: 4, capMaxW: 64, gap: 14, capGap: 5, edge: 2 } as const
export const TITLE = { w: 360, h: 24 } as const
export const PLATE_PX = { key: 14, label: 16, labelMin: 10, title: 20, titleMin: 12 } as const
export const LABEL_MAX_W = 140

export const BRAND = 'SLOT.'
export const FOOTER_Y = OUT.h - MOUTH.h + (MOUTH.h - HINT.h) / 2
export const FOOTER_MARGIN = 24

/* ---- the clock picker --------------------------------------------------- */

export const CLOCK = {
  /** Widths of the nine cells: four fields and their separators. */
  cells: [88, 22, 52, 22, 52, 36, 52, 22, 52] as const,
  fieldCell: [0, 2, 4, 6, 8] as const,
  h: 44,
  px: 30,
  minPx: 12,
  caretH: 4,
  caretGap: 6,
  hintDrop: 48,
} as const

/* ---- toast -------------------------------------------------------------- */

export const TOAST = { w: 220, h: 22, px: 16, minPx: 12 } as const

/* ---- colour ------------------------------------------------------------- */

/**
 * There is no palette and no theme format. These are the literals at their use sites, gathered
 * here only so a reader can see them at once - nothing in slot lets a user change them.
 */
export const INK = {
  backdrop: '#0f0f12',
  text: '#f6f4ef',
  capText: '#1a1917',
  halo: '#08080a',
  blank: '#3a3a3e',
} as const
export const HALO_PX = 1
/** How much of a wallpaper is taken back out again, so the shelf stays predictable over it. */
export const SCRIM = 0.62
