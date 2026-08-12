/**
 * The theme's metrics, from `src/menu/ui_components/constants.h`.
 *
 * The display is 640x480 and the menu never draws into the overscan margin, so the visible area is
 * 576x432 inset at 32,24. Every number below is a literal device pixel - the menu has no scaling
 * factor, because an N64 has exactly one output size, and that is why this theme needs no resolve
 * step at all. There is one device and one set of numbers.
 */
export const DISPLAY = { w: 640, h: 480 } as const
export const OVERSCAN = { x: 32, y: 24 } as const
export const CENTER = { x: DISPLAY.w / 2, y: DISPLAY.h / 2 } as const

export const VISIBLE = {
  x0: OVERSCAN.x,
  y0: OVERSCAN.y,
  x1: DISPLAY.w - OVERSCAN.x,
  y1: DISPLAY.h - OVERSCAN.y,
  w: DISPLAY.w - OVERSCAN.x * 2,
  h: DISPLAY.h - OVERSCAN.y * 2,
} as const

/** `NEXTUI_*` in the source, name for name. */
export const PILL_HEIGHT = 40
export const BUTTON_SIZE = 28
export const BUTTON_MARGIN = 10
export const BUTTON_PADDING = 24
export const ROW_COUNT = 9
export const SETTINGS_ROW_HEIGHT = 40
export const ART_MAX = 288
export const TITLE_MAX_WIDTH = VISIBLE.w - 250

export const LIST_X = VISIBLE.x0
export const LIST_Y = VISIBLE.y0
export const HINT_Y = VISIBLE.y1 - PILL_HEIGHT
export const ART_X1 = VISIBLE.x1
export const ART_CENTER_Y = CENTER.y

/** The gap between two hint pills in a group. A local in `hint_group_draw_at`, not a constant. */
export const HINT_GAP = 8

/**
 * Where a titled list starts.
 *
 * Every screen that draws a title puts its list one pill-height plus a button margin below the top
 * of the visible area - the title occupies that pill height even though it is drawn as bare text.
 */
export const TITLED_LIST_Y = VISIBLE.y0 + PILL_HEIGHT + BUTTON_MARGIN

/** Where body text starts: the same drop, but a double margin rather than a single one. */
export const BODY_Y = VISIBLE.y0 + PILL_HEIGHT + BUTTON_MARGIN * 2
export const BODY_X = LIST_X + BUTTON_MARGIN

/** The `nextui_colors` hub tightens the pitch so all nine rows fit without scrolling. */
export const COLORS_ROW_HEIGHT = 36
export const SWATCH = {
  w: 52,
  h: COLORS_ROW_HEIGHT - 12,
  valueColumn: 110,
  frame: '#606060',
} as const

/** The palette picker's preview strip. */
export const PREVIEW = { size: 36, gap: 8, frame: '#606060' } as const

/** The colour editor's live swatch. */
export const EDITOR_SWATCH = { w: 200, h: 80 } as const

/** `ui_component_value_editor`'s three fields, at the source's `width_adjustment` of 4. */
export const VALUE_FIELD_WIDTH = (VISIBLE.w - 10 * 2) / 4
export const VALUE_FIELD_X = CENTER.x - (VALUE_FIELD_WIDTH * 3) / 2
export const VALUE_FIELD_Y = CENTER.y

/** The load screen has its own table of positions rather than sharing the browser's. */
export const LOAD = {
  margin: 32,
  heroY: 92,
  descW: 336,
  descLines: 3,
  descLineH: 28,
  bylineGap: 14,
  artX: 392,
  artW: 216,
  artH: 153,
  ledgerY: 289,
  ledgerCol2X: 332,
  ledgerColW: 276,
  ledgerRowH: 24,
  iconSize: 24,
  iconGap: 8,
  playerIconSize: 20,
  playerIconGap: 2,
  placeholderIcon: 72,
  placeholderGap: 10,
  placeholderBorder: 2,
} as const

/** `BPreplayBold` at four sizes - the menu loads one font file per size. */
export const FONT = { large: 32, medium: 24, small: 20, tiny: 16 } as const

/** Text drawn directly on the background, and text that is not quite either colour. */
export const MUTED = '#A0A0A0'

/**
 * How many rows fit under a title, at a given pitch.
 *
 * The source computes this per screen from the same three numbers rather than storing it, which
 * is why a screen with a footer line (Settings) fits one fewer row than one without (Collections).
 */
export function visibleRows(rowHeight: number, footer = 0): number {
  return Math.floor((HINT_Y - BUTTON_MARGIN - footer - TITLED_LIST_Y) / rowHeight)
}

/**
 * The browser's window: `nextui_file_list_draw`.
 *
 * The cursor is kept inside a fixed window rather than centred, so a list shorter than the window
 * never scrolls and the last page never leaves a gap. Note it clamps against `entries - rows` even
 * when that is negative, then clamps that back to 0 - the order matters for short lists.
 */
export function listWindow(selected: number, total: number, rows = ROW_COUNT): number {
  let start = 0
  if (selected < start) start = selected
  if (selected >= start + rows) start = selected - rows + 1
  if (start > total - rows) start = total - rows
  if (start < 0) start = 0
  return start
}

/**
 * The window the settings-style screens use.
 *
 * Deliberately a different function: the palette picker and Collections only ever scroll *down*
 * (`window_start = selected >= visible_rows ? selected - visible_rows + 1 : 0`), which is not the
 * same as the file list's two-sided clamp and shows at the top of a long list.
 */
export function forwardWindow(selected: number, rows: number): number {
  return selected >= rows ? selected - rows + 1 : 0
}
