import type { Box } from '../../layout/box'
import { GRID } from './library'

/**
 * SimpleOS's geometry, in device pixels on one 640x480 panel.
 *
 * SimpleOS renders for exactly one device and resolution, so there is no resolve step: these are
 * literal pixels. Each was measured off the release trailer, where a panel is drawn at 0.819 of
 * its size on the home frames and 1.57 on the zoomed settings and unlock frames, and rounded to
 * the whole pixel. Where the result had to be an 8x8 font cell, it was snapped to one - every
 * string SimpleOS draws is its 8x8 font at 1x, 2x or 3x.
 */

/** The font's three sizes: one glyph cell is 8px, and SimpleOS draws it at 1x, 2x and 3x. */
export const FONT = { small: 8, body: 16, large: 24 } as const

/** Characters that fit a width at a font size: the font is fixed-width, one em per glyph. */
export function charsIn(width: number, font: number): number {
  return Math.floor(width / font)
}

/** Top panel: the title bar and the card under it. */
export const TOP = {
  header: { left: 0, top: 0, width: 640, height: 38 } satisfies Box,
  headerTitle: { left: 12, top: 11 },
  /** The clock's right edge. */
  clockRight: 571,
  battery: { left: 590, top: 12, width: 30, height: 14 } satisfies Box,
  card: { left: 35, top: 60, width: 570, height: 393, radius: 16 } satisfies Box,
  iconBacking: { left: 250, top: 78, width: 140, height: 140, radius: 12 } satisfies Box,
  iconSize: 112,
  /** Home: the title under the icon, clipped hard at 33 characters as the trailer shows. */
  titleTop: 228,
  titleChars: 33,
  legendTops: [267, 298, 329] as const,
  dateTop: 399,

  /**
   * Design-new screens reuse the card, shortened, with the legend on the wash beneath it. Their
   * legends run to 38 characters - 608px at 2x - which is wider than the card but not the panel.
   */
  screenCard: { left: 35, top: 60, width: 570, height: 340, radius: 16 } satisfies Box,
  screenTitleTop: 90,
  screenSubtitleTop: 134,
  noteTop: 214,
  statusTop: 262,
  screenLegendTop: 424,
} as const

/** The home grid. */
export const GRID_METRICS = {
  box: { left: 0, top: 0, width: 640, height: 480 },
  cols: GRID.cols,
  rows: GRID.rows,
  tileW: 180,
  tileH: 165,
  padding: [38, 39] as const,
  margin: [12, 24] as const,
}

/** Inside one tile. */
export const TILE = {
  radius: 10,
  /** The offset shadow's drop, right and down. */
  shadow: [3, 4] as const,
  border: 3,
  backing: { left: 10, top: 8, width: 160, height: 126, radius: 8 } satisfies Box,
  iconSize: 104,
  captionTop: 142,
  captionChars: 20,
} as const

export const DOTS = { centerY: 458, pitch: 16, size: 7 } as const

/** A settings list on the bottom panel. */
export const LIST = {
  left: 24,
  width: 592,
  top: 8,
  rowHeight: 46,
  pitch: 53,
  radius: 8,
  padX: 21,
  /** Rows that fit on the panel; a longer list scrolls. */
  visible: 8,
} as const

/** The in-game menu, centred on the bottom panel. */
export const MENU = {
  pitch: 56,
  boxHeight: 50,
  /** Padding either side of the label inside the cursor box. */
  boxPadX: 32,
  /** The outline is one font pixel wide at 3x. */
  outline: 3,
} as const

/** The title and switch hint across the top of the top panel while the menu is up. */
export const MENU_TOP = { titleTop: 40, hintTop: 71, outline: 2 } as const

/** The RetroAchievements unlock banner. */
export const TOAST = {
  box: { left: 44, top: 11, width: 550, height: 84, radius: 8 } satisfies Box,
  headHeight: 33,
  labelLeft: 15,
  labelTop: 8,
  pointsRight: 16,
  pointsTop: 6,
  icon: { left: 15, top: 39, width: 40, height: 40 } satisfies Box,
  nameLeft: 71,
  nameTop: 45,
} as const
