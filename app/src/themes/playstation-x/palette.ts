/**
 * The theme's colour variables.
 *
 * Token names are the theme's own, from `_theme_options/colorsets/{blue,black}.xml`, so a grep
 * for `backgroundgridSelect` hits both the XML and this file.
 *
 * Two colorsets, and a secondary accent that overrides eight of their keys. Everything else is
 * fixed per colorset.
 */

/** `theme.xml:646-652` - the master palette every colorset draws from. */
export const MASTER = {
  'psx-theme-yellow': '#F3C300',
  'psx-theme-red': '#DF0024',
  'psx-theme-green': '#00AC97',
  'psx-theme-blue1': '#3CAEFB',
  'psx-theme-blue2': '#0070d1',
  'psx-theme-blue3': '#2E6DB4',
  'psx-theme-blue4': '#003791',
} as const

/**
 * The keys the secondary accent overrides.
 *
 * Upstream these carry `ifSubset="secondary_colorset:default"`, which is the source's way of
 * saying "unless an accent is chosen". Exactly eight, and a test holds the count - a ninth
 * added to one place and not the other is the kind of thing nothing else would notice.
 */
export const SECONDARY_KEYS = [
  'menuSelectedColor',
  'menuSelectorColor',
  'menuSelectorColorEnd',
  'backgroundgridSelect',
  'gamelistSelectorColor',
  'sistema.lineainferior',
  'gamelist.starFill',
  'grid.starFill',
] as const

export type ColorSet = 'blue' | 'black'
export type SecondaryColor =
  | 'default'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple'
  | 'black'

export type Tokens = Record<string, string>

/** `_theme_options/colorsets/blue.xml:6-41` */
const BLUE: Tokens = {
  menuSelectedColor: 'ffffff',
  menuSelectorColor: '0070d1',
  menuSelectorColorEnd: '003791',
  menuGrouptitle: '3CAEFB',
  menuFontcolor: 'DFDCDC',
  menuSeparatorColor: '555555',
  menuGroupSeparator: '3CAEFB',
  menuTitleColor: 'DFDCDC',
  menubgColor: '003791',
  backgroundgrid: '2E6DB4',
  backgroundgridSelect: 'F3C300',
  menuFooter: '555555',
  gamelistSelectedColor: '3CAEFB',
  gamelistSelectorColor: 'F3C300',
  helpFontColor: 'DFDCDC',
  helpIconColor: 'DFDCDC',
  developerColor: '00AC97',
  genreColor: '3CAEFB',
  releaseColor: 'F3C300',
  starFill: 'DF0024',
  starUnfill: 'ffffff69',
  manualOnColor: '3CAEFB',
  savegameOnColor: '3CAEFB',
  cheevosOnColor: 'F3C300',
  'splash.progressbarActive': '0070d1',
  'splash.progressbarActiveEnd': '003791',
  'splash.progressbar': 'ffffff80',
  'splash.labelColor': 'ffffff',
  'sistema.lineainferior': '0070d1',
  'sistema.pie': '030a18',
  'gamelist.starFill': 'DF0024',
  'ps4Style.tile.background': '020C29',
  'grid.starFill': 'F3C300',
  dimColor: '808080',
}

/** `_theme_options/colorsets/black.xml` */
const BLACK: Tokens = {
  menuSelectedColor: '3CAEFB',
  menuSelectorColor: '2d2828',
  menuSelectorColorEnd: '000000',
  menuGrouptitle: 'eeeeee',
  menuFontcolor: 'cccccc',
  menuSeparatorColor: '555555',
  menuGroupSeparator: 'dddddd',
  menuTitleColor: 'DFDCDC',
  menubgColor: '2d2828',
  backgroundgrid: 'aaaaaa',
  backgroundgridSelect: '666666',
  menuFooter: '555555',
  gamelistSelectedColor: '3CAEFB',
  gamelistSelectorColor: '666666',
  helpFontColor: 'DFDCDC',
  helpIconColor: 'DFDCDC',
  developerColor: '00AC97',
  genreColor: '3CAEFB',
  releaseColor: 'F3C300',
  starFill: 'DF0024',
  starUnfill: 'ffffff69',
  manualOnColor: '3CAEFB',
  savegameOnColor: '3CAEFB',
  cheevosOnColor: 'F3C300',
  'splash.progressbarActive': '0070d1',
  'splash.progressbarActiveEnd': '111111',
  'splash.progressbar': 'ffffff69',
  'splash.labelColor': 'ffffff',
  'sistema.lineainferior': '0070d1',
  'sistema.pie': '000000',
  'gamelist.starFill': 'DF0024',
  'ps4Style.tile.background': '000000',
  'grid.starFill': 'F3C300',
  dimColor: '808080',
}

/**
 * `_theme_options/colorsets/secondary_colors/*.xml` - each overrides `SECONDARY_KEYS`.
 *
 * `accent` is written to `sistema.lineainferior` and `gamelistSelectorColor`; `gridSelect` is
 * `backgroundgridSelect`, which differs only for black.
 */
const SECONDARY: Record<SecondaryColor, { accent: string; end: string; gridSelect: string } | null> =
  {
    default: null,
    blue: { accent: '0070d1', end: '003791', gridSelect: '0070d1' },
    yellow: { accent: 'F2BC00', end: 'F2BC00', gridSelect: 'F2BC00' },
    green: { accent: '00AC97', end: '00AC97', gridSelect: '00AC97' },
    orange: { accent: 'FF9E00', end: 'FF9E00', gridSelect: 'FF9E00' },
    red: { accent: 'DF0024', end: 'DF0024', gridSelect: 'DF0024' },
    pink: { accent: 'FF4DFF', end: 'FF4DFF', gridSelect: 'FF4DFF' },
    purple: { accent: '8159ED', end: '8159ED', gridSelect: '8159ED' },
    black: { accent: '666666', end: '666666', gridSelect: 'cccccc' },
  }

const COLORSETS: Record<ColorSet, Tokens> = { blue: BLUE, black: BLACK }

export const SECONDARY_COLORS = Object.keys(SECONDARY) as SecondaryColor[]
export const COLOR_SETS = Object.keys(COLORSETS) as ColorSet[]

/**
 * The engine writes colours as `RRGGBB` or `RRGGBBAA`. Turn either into a CSS colour.
 *
 * The eight-digit form is the one worth knowing about: `ffffff69` is white at 41%, and reading
 * it as a six-digit colour with stray characters gives opaque white and a silently wrong screen.
 */
export function cssColor(hex: string | undefined | null): string {
  if (!hex) return 'transparent'
  const h = String(hex).replace('#', '')
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16) / 255
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a.toFixed(3)})`
  }
  return `#${h}`
}

/** Resolve a colorset plus secondary accent into a flat token map. */
export function tokens(colorset: ColorSet, secondary: SecondaryColor): Tokens {
  const base = COLORSETS[colorset] ?? BLUE
  const out: Tokens = { ...base }

  const sec = SECONDARY[secondary]
  if (sec) {
    out.gamelistSelectorColor = sec.accent
    out['sistema.lineainferior'] = sec.accent
    out.backgroundgridSelect = sec.gridSelect
    out['grid.starFill'] = sec.accent
    out['gamelist.starFill'] = sec.accent
    out.menuSelectorColor = sec.accent
    out.menuSelectorColorEnd = sec.end
    out.menuSelectedColor = sec.accent
  }
  return out
}

/**
 * The tokens as CSS custom properties.
 *
 * Every token the theme resolves is published, not just the ones something happens to read
 * today. The original wrote a hand-picked subset and then hardcoded several colours that should
 * have come from it - the gold trophy was a `filter: invert(70%) sepia(90%)` hack over a white
 * icon, and the multi-disc chip a literal `#F3C300` - so changing the accent left them behind.
 * See `docs/porting/playstation-x.md`.
 */
export function paletteVariables(colorset: ColorSet, secondary: SecondaryColor): Tokens {
  const t = tokens(colorset, secondary)
  const out: Tokens = {}
  for (const [key, value] of Object.entries(t)) {
    out[`--psx-${key.replace(/\./g, '-')}`] = cssColor(value)
  }
  return out
}

/** A token as a CSS value, for the few places a component needs one directly. */
export function token(colorset: ColorSet, secondary: SecondaryColor, key: string): string {
  return cssColor(tokens(colorset, secondary)[key])
}
