import type { Panel } from './panel'

/**
 * The SPRUCE theme's text colours, as `Theme.text_color` and `text_color_selected` pick them per
 * purpose (`themes/theme.py:648-744`). Every other colour on screen - the #282828 ground, the #504945
 * selection bars, the icons - is baked into the skin's images, so the port draws those images rather
 * than naming their colours here.
 */
export interface Palette {
  /** The top-bar title, clock, battery and volume numbers (`title.color`, `batteryPercentage.color`). */
  readonly bar: string
  /** The index and its letter (`currentpage.color`). */
  readonly index: string
  /** The index total (`total.color`). */
  readonly total: string
  /** A grid's text, and messages (`grid.color`). */
  readonly grid: string
  readonly gridSelected: string
  /** Lists, descriptions and the empty view (`list.color`, the same selected or not in SPRUCE). */
  readonly list: string
  readonly listSelected: string
}

export function paletteFor(p: Panel): Palette {
  const c = p.config
  return {
    bar: c.title.color,
    index: c.currentpage.color,
    total: c.total.color,
    grid: c.grid.color,
    gridSelected: c.grid.selectedcolor,
    list: c.list.color,
    listSelected: c.list.selectedcolor,
  }
}

/** The ground every screen is cleared to: `background.png`, one flat colour at every size. */
export const GROUND = '#282828'
