/**
 * SimpleOS's colours.
 *
 * There is no theme format to read these from: SimpleOS draws with colours compiled into its own
 * binary and ships no palette file. Every value here is sampled from the release trailer (a median
 * over a small square, since single pixels off a video encode are noise) or, for the boot screens,
 * read straight off the splash bitmaps SimpleOS ships. `docs/themes/simpleos/reference/` has the
 * frames each was taken from.
 */
export const PALETTE = {
  /** The title bar across the top panel. */
  header: '#2e6cc9',
  headerText: '#ffffff',
  /** Top-panel wash, pale blue at the head fading to off-white at the foot. */
  topBgFrom: '#e6faff',
  topBgTo: '#fffff9',
  /** The white card the top panel's content sits on. */
  card: '#ffffff',
  cardShadow: 'rgba(46, 108, 201, 0.14)',
  text: '#1f2529',
  /** The button legend, set back in grey. */
  legend: '#6f7882',
  /** The date under the legend, and the titles on design-new screens. */
  accent: '#2e62b8',

  /** Bottom-panel wash behind the grid. */
  gridBgFrom: '#e4f9ff',
  gridBgTo: '#fffff5',
  tile: '#ffffff',
  /** The solid offset shadow under each tile. */
  tileShadow: '#d5dbe3',
  tileSelected: '#ffffc2',
  tileSelectedBorder: '#f2cd52',
  caption: '#282730',
  dotOn: '#2f6ec4',
  dotOff: '#c4cde5',

  /** The settings lists: a near-white wash and white rows, the cursor row pale yellow. */
  listBgFrom: '#faffff',
  listBgTo: '#fffff8',
  row: '#ffffff',
  rowShadow: '#eef1f4',
  rowSelected: '#ffffc5',
  rowText: '#212621',
  rowValue: '#847660',

  /** The in-game menu: white capitals outlined in black, the cursor a white box. */
  menuText: '#ffffff',
  menuOutline: '#000000',
  menuSelected: '#ffffff',
  menuSelectedText: '#000000',

  /** The RetroAchievements unlock banner. */
  toastHead: '#306ecd',
  toastHeadText: '#ffffff',
  toastBody: '#ffffff',
  toastIcon: '#227ef2',
  toastText: '#1e262d',
} as const

export type Palette = typeof PALETTE

/**
 * Tile backing colours for the placeholder icons.
 *
 * A real SimpleOS tile shows the game's own 32x32 banner icon on a panel in that icon's dominant
 * colour. The icons are the games' own art, so the mockup generates stand-ins instead; these
 * pairs are sampled from the trailer's tiles so the grid carries the same spread of pastels.
 */
export const ICON_COLORS: readonly (readonly [string, string])[] = [
  ['#9fe2b0', '#3f8f5a'],
  ['#d5e59a', '#6b7a2c'],
  ['#e8d7a8', '#6d5a2a'],
  ['#76c6f4', '#c2187a'],
  ['#b77ae6', '#4d2a8a'],
  ['#5f9aa0', '#8a5a2a'],
  ['#d99a9a', '#7a3a3a'],
  ['#d68aa0', '#5a1a2a'],
  ['#b88ad8', '#2a5ac8'],
  ['#6f9ad8', '#c83a3a'],
  ['#5f9a8a', '#9ac83a'],
  ['#7ab8e8', '#e8c83a'],
]
