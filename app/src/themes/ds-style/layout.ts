/**
 * DS Style lays out on its 240x160 canvas and the RG SP shows it at exactly 3x (`source/dsstyle.c:45-46`,
 * `ui.h:369-390`). Every coordinate in this theme is the source's logical one; `px` turns it into
 * the panel's device pixels, which is what the views draw in.
 */
export const W = 240
export const H = 160
export const SCALE = 3

export const px = (n: number) => n * SCALE

/** The glyph advance and the line a text row takes (`dsstyle.c:120-122`). */
export const GLYPH = 6
export const LINE = 12
