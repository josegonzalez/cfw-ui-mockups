/**
 * The Wii composes a 608x456 frame and its video interface puts that frame, unscaled, inside a
 * 640x480 signal with a black border - 16 pixels each side, 12 top and bottom. Both reference
 * captures show it: the capture card's picture spans x 14-624, y 10-465, and Dolphin's the same
 * proportion (`docs/themes/wii-menu/reference/source-notes.md`). The RG35XX's panel is exactly that
 * signal, so the port draws the frame 1:1 at that offset and never scales anything.
 *
 * Every coordinate in this theme is a pixel of the 608x456 frame.
 */
export const W = 608
export const H = 456
export const BORDER_X = 16
export const BORDER_Y = 12

/** The channel grid (`frames/menu-page-2.png`, measured from its tile edges). */
export const TILE = { w: 120, h: 90, pitchX: 128, pitchY: 96, x: 53, y: 37, radius: 12 } as const
/** One page of the grid: the strip moves this far to turn a page. */
export const PAGE_W = TILE.pitchX * 4

/**
 * The page arrows, over the grid's left and right edges. The visible arrow is about 26x42; its
 * 64x64 texture has a margin, so it is drawn at 48 and centred on the measured arrow.
 */
export const ARROW = { size: 48, cy: 175, leftCx: 41, rightCx: 570 } as const

/**
 * The bottom bar. Its top edge is a cyan line at y 330 under the buttons, dipping to y 379 across
 * the middle to make room for the clock.
 */
export const BAR = { top: 330, dip: 379, dipFrom: 150, dipTo: 458, curve: 56 } as const
export const WII_BUTTON = { cx: 73, cy: 385, d: 76 } as const
export const MAIL_BUTTON = { cx: 537, cy: 385, d: 76 } as const
export const SD_BUTTON = { x: 138, y: 380, w: 32, h: 40 } as const
/** The clock's digits and AM/PM, centred as a group; the date is centred on the screen under them. */
export const CLOCK_BOX = { cx: 339, cy: 350, digit: 44 } as const
export const DATE_Y = 388

/** The channel preview's panel: the grid fades away behind it (`frames/preview-disc.png`). */
export const PANEL = { x: 12, y: 8, w: 585, h: 439, radius: 44, split: 340 } as const
export const PREVIEW_BUTTONS = { y: 357, h: 63, w: 237, left: 61, right: 313 } as const

/** Where a grid slot sits on screen when its page is showing. */
export function tileBox(slotOnPage: number) {
  const c = slotOnPage % 4
  const r = Math.floor(slotOnPage / 4)
  return { x: TILE.x + c * TILE.pitchX, y: TILE.y + r * TILE.pitchY, w: TILE.w, h: TILE.h }
}
