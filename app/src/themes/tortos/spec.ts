import type { CoverflowLayout } from '../../widgets/Coverflow'

/**
 * TortOS's geometry, in the Brick's own pixels.
 *
 * One device and one output size, so there is no resolve step: every number here is either a
 * constant copied from the source or one derived from those constants the way the source derives
 * it. Where a number was measured off a reference frame instead, it says so.
 */

export const SCREEN = { w: 1024, h: 768 } as const

/* ---- type ---------------------------------------------------------------- */

/**
 * The type scale: one base and a multiplier per role, rounded the way `ui_init` rounds them
 * (`src/ui.c:35-42,99`).
 *
 * The comments beside `font_mul` in the source say 52/43/48/32/62. Those are the sizes from before
 * the base took its 1.15, and every pixel position commented against them is stale by the same
 * factor - the fonts actually open at the sizes below.
 */
const FONT_BASE = 32 * 1.15
const pt = (mul: number) => Math.floor(FONT_BASE * mul + 0.5)

export const FONT = {
  title: pt(1.62),
  menu: pt(1.34),
  label: pt(1.5),
  meta: pt(1.0),
  card: pt(1.94),
} as const

export type FontRole = keyof typeof FONT

/**
 * Josefin Sans's vertical metrics: ascent 750, descent 250, no line gap, and USE_TYPO_METRICS set,
 * so SDL_ttf's height and line skip are both exactly the point size and its descent is a quarter
 * of it. A text box `size` px tall at `top: y` is where SDL draws a surface at `y`.
 */
export const descent = (size: number) => Math.ceil(size * 0.25)

/* ---- the shelf ----------------------------------------------------------- */

/** A coverflow layout, field for field as `cf_layout` (`src/coverflow.h`). */
export type CfLayout = CoverflowLayout

const layout = (l: Partial<CfLayout> & Pick<CfLayout, 'size' | 'aspect' | 'step' | 'centerY' | 'reflect'>): CfLayout => ({
  sideScale: 1,
  tilt: 0,
  sideAlpha: 255,
  vertical: false,
  equalArea: false,
  wideArea: 0,
  reflectGap: 0,
  ...l,
})

/** `src/coverflow.c:40-147`. */
export const CF = {
  systems: layout({ size: 0.81, aspect: 0.78, step: 0.82, sideScale: 0.38, centerY: 0.415, reflect: 1.34, sideAlpha: 140, wideArea: 0.8 }),
  systemsV: layout({ size: 0.88, aspect: 0.78, step: 1.3, centerY: 0.45, reflect: 1.34, vertical: true, wideArea: 1 }),
  games: layout({ size: 0.6, aspect: 0.72, step: 0.74, sideScale: 0.62, centerY: 0.47, tilt: 0.82, reflect: 1.52, sideAlpha: 150, equalArea: true }),
  gamesV: layout({ size: 0.6, aspect: 0.72, step: 1.5, centerY: 0.47, reflect: 1.52, vertical: true, equalArea: true }),
  gameFace: layout({ size: 0.6, aspect: 0.72, step: 3.2, centerY: 0.47, reflect: 1.52, equalArea: true }),
  albums: layout({ size: 0.6, aspect: 1, step: 0.74, sideScale: 0.62, centerY: 0.54, tilt: 0.82, reflect: 1.52, sideAlpha: 150 }),
  albumsV: layout({ size: 0.6, aspect: 1, step: 1.5, centerY: 0.54, reflect: 1.52, vertical: true }),
  albumFace: layout({ size: 0.6, aspect: 1, step: 3.2, centerY: 0.54, reflect: 1.52 }),
} as const

/** `CF_HALF_WINDOW`: three cards either side of the centre, seven in all. */
export const CF_HALF_WINDOW = 3
export const CF_WINDOW = CF_HALF_WINDOW * 2 + 1
/** A move longer than this is drawn as a departure and a cut (`CF_WARM_CARDS`). */
export const CF_WARM_CARDS = 8
/** Art wider than this gets `wideArea` (`CF_WIDE_ART`). */
export const CF_WIDE_ART = 1.2
/** The share of a move the vertical systems row spends fading its name each way. */
export const CF_LABEL_EDGE = 0.3

/** The card's frame, as `cf_focus_rect` computes it (`src/coverflow.c:149`). */
export function focusRect(lay: CfLayout) {
  const h = SCREEN.h * lay.size
  const w = h * lay.aspect
  return {
    left: Math.trunc(SCREEN.w * 0.5 - w * 0.5),
    top: Math.trunc(SCREEN.h * lay.centerY - h * 0.5),
    width: Math.trunc(w),
    height: Math.trunc(h),
  }
}

/* ---- shelf text ---------------------------------------------------------- */

/** `src/main.c:2738-3009`. */
export const SHELF_TEXT = {
  titleY: 40,
  systemNameY: 618,
  countY: 690,
  /** Vertical and Cubic write the count bottom left, under the rail's lower end. */
  cornerX: 24,
  cornerY: 700,
  /** Cubic's system name is right-aligned to here, 40px clear of the count. */
  cornerRight: 1000,
  cornerGap: 40,
} as const

/* ---- rails --------------------------------------------------------------- */

/** `src/ui.c:554-635`, with `UI_BAR_H` 6. */
export const RAIL = {
  thickness: 6,
  /** The horizontal rail's track: x 90 to 934, its bottom 23px off the screen's. */
  x: 90,
  y: SCREEN.h - 23 - 6,
  /** The vertical rail's track: x 23, y 90 to 678. */
  vx: 23,
  vy: 90,
  minSegment: 18,
  /** How much of a band a moving colour boundary eats at its widest. */
  blend: 0.4,
  trackAlpha: 16,
  markerAlpha: 235,
} as const

/* ---- menus --------------------------------------------------------------- */

const line = (size: number) => size
const rowH = Math.trunc((line(FONT.menu) * 3) / 2)
const pad = Math.trunc((rowH * 3) / 4)

/**
 * `menu_draw_ex` (`src/main.c:3397`). Every measurement is cut from the menu font's line, so
 * these are derived rather than listed.
 */
export const MENU = {
  radius: 20,
  margin: 24,
  border: 12,
  rowH,
  pad,
  ruleH: Math.trunc(pad / 2) + 2,
  noteH: FONT.menu + Math.trunc(pad / 3),
  gap: rowH,
  /** Half the descent: rows centre the ink rather than the em box. */
  inkOff: Math.trunc(descent(FONT.menu) / 2),
  plateRadius: Math.trunc(rowH / 4),
  /** The scroll arrows: a triangle row_h/3 wide and half that tall, 8px off the rows. */
  arrowW: Math.trunc(rowH / 3),
  arrowOff: 8,
  /** The standard panel: 800 wide, which leaves this much for content. */
  stdContent: 800 - pad * 2,
  /**
   * The shelf menus' content width, as `menu_shelf_width` measured it on the device that took the
   * reference screenshots - the panel in `readme-menu.png` is 835 wide, not 800, because its
   * widest row set the floor. Measured off the frame rather than recomputed, because the row
   * that sets it is the Bluetooth headset's name on that device.
   */
  shelfContent: 835 - pad * 2,
  /** The plate chase's time constant, and the window's (ms). */
  plateTau: 22,
  windowTau: 55,
} as const

/** Screen dims behind a panel (`SDL_SetRenderDrawColor(0,0,0,a)`), by what is behind it. */
export const DIM = { panel: 120, keyboard: 150, deep: 185 } as const

/* ---- glows --------------------------------------------------------------- */

/** `ui_glow` calls: alpha and spread, by where (`src/main.c`). */
export const GLOW = {
  wash: { alpha: 34, spread: 1.7, box: { left: 0, top: SCREEN.h - 240, width: SCREEN.w, height: 480 } },
  system: { alpha: 110, spread: 2.4 },
  game: { alpha: 100, spread: 2.3 },
  panel: { alpha: 60, spread: 1.5 },
  save: { alpha: 85, spread: 1.35 },
  cover: { alpha: 90, spread: 1.7 },
} as const

/* ---- the generated card -------------------------------------------------- */

/** `src/ui.c:693-863`. */
export const CARD = {
  w: 512,
  h: 656,
  radius: 22,
  band: 6,
  titleTop: 0.38,
  titleX: 48,
  maxLines: 4,
  lineGap: 4,
  rule: { w: 90, h: 3, gap: 12, alpha: 220 },
  watermark: { size: 560, alpha: 55, x: 0.62, y: 0.8 },
} as const

/* ---- Now Playing --------------------------------------------------------- */

/** `src/main.c:7328-7441`. */
export const NOW = {
  side: 432,
  x: 80,
  y: Math.trunc((SCREEN.h - 432) / 2) - 28,
  textX: 568,
  textW: SCREEN.w - 568 - 64,
  barH: 6,
  hintY: SCREEN.h - 72,
} as const

/* ---- the save carousel --------------------------------------------------- */

/** `slot_draw`, `src/main.c:6617`. */
export const SLOTS = {
  area: { left: (SCREEN.w - 700) / 2, top: 129, width: 700, height: 451 },
  border: 12,
  headingY: 39,
  dots: 7,
  dotPitch: 36,
  dotR: 12,
} as const

/* ---- the keyboard -------------------------------------------------------- */

/** `src/keyboard.c:35-245`. */
export const KEYBOARD = {
  w: 860,
  h: 580,
  key: { w: 72, h: 60, gap: 6 },
  cols: 10,
  rows: 4,
  gridTop: 150,
  field: { top: 74, x: 28, w: 804, radius: 8 },
  space: { h: 48 },
  titleTop: 22,
  chip: { pad: 3, padX: 14, radius: 6, gap: 18 },
} as const

/** The low-battery dot, top right (`src/main.c:2371`). */
export const BATTERY_DOT = { cx: SCREEN.w - 34, cy: 34, r: 9 } as const
