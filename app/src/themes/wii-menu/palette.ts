/**
 * The Wii Menu's colours, sampled from the reference frames (`docs/themes/wii-menu/reference/frames/`)
 * where the capture is clean, and from WM4K's textures where it is not. The capture is analogue, so
 * a sampled value is the nearest plausible flat colour rather than a byte-exact one.
 */
export const PALETTE = {
  /** The signal's border, and the SD Card Menu's ground. */
  black: '#000000',
  /** The menu's ground: white at the top, a touch cooler towards the bar. */
  ground: '#fdfdfd',
  groundLow: '#f1f3f5',
  /** The bottom bar's fill, top to bottom (`menu.png` at x 30, y 380 and 455). */
  bar: '#e8ebee',
  barLow: '#d9dee3',
  /** The line along the bar's top edge, and every focus outline the menu draws. */
  cyan: '#34bee6',
  cyanSoft: '#9fdcf2',
  /** The seven-segment clock and the date (`menu.png` at the digits). */
  clock: '#8a9094',
  /** An empty slot's outline, and the outline of a channel that is not focused. */
  tileEdge: '#c9ccd0',
  /** The highlight bubble's text, and body text on the preview panels. */
  ink: '#3c3c3c',
  inkSoft: '#6e6e6e',
  /** A disabled button's label. */
  disabled: '#b8bcbf',
  /** The Health & Safety screen's link. */
  link: '#6d93d6',
  /** The HOME Menu's bars and the dimming behind them. */
  homeBar: 'rgba(0, 0, 0, 0.82)',
  homeDim: 'rgba(0, 0, 0, 0.45)',
  /** The Settings and Wii Options ground, and their buttons' lavender focus (`settings/pages/1-0.webp`). */
  settingsGround: '#0c0c0c',
  lavender: '#a2a2f2',
} as const
