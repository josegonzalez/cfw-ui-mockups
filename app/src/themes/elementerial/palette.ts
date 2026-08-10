/**
 * Elementerial's 14 colour schemes, each in dark and light.
 *
 * Transcribed from `settings/colors/<scheme>/scheme-{dark,light}.xml`. Token names are the
 * theme's own variable names, so a grep for `fgColor` finds both the source XML and this file.
 *
 * The theme expresses opacity by appending a two-hex alpha pair from a percent table, as
 * `${fgColor}${percent.90}`. That table is `ALPHA` below, and only the token/percent pairs the
 * source actually references are derived - inventing the rest would suggest the theme uses
 * combinations it does not.
 */

export type SchemeStyle = 'dark' | 'light'

export interface SchemeTokens {
  readonly fgColor: string
  readonly mainColor: string
  readonly onMainColor: string
  readonly bgColor: string
  readonly sectColor: string
}

export interface Scheme {
  readonly id: string
  readonly label: string
  /** Which placeholder-artwork set this scheme uses; four schemes reuse another's. */
  readonly grid: string
  readonly dark: SchemeTokens
  readonly light: SchemeTokens
}

/** The percent-to-hex-alpha table from the source's `variables.xml`. */
export const ALPHA: Readonly<Record<number, string>> = {
  90: 'E6',
  80: 'CC',
  70: 'B3',
  60: '99',
  50: '80',
  40: '66',
  30: '4D',
  20: '33',
  10: '1A',
  5: '0D',
}

/** Only the token/percent pairs the source's scheme XML actually references. */
export const ALPHA_USED: Readonly<Record<keyof SchemeTokens, readonly number[]>> = {
  fgColor: [90, 80, 30, 5],
  mainColor: [70, 10],
  onMainColor: [],
  bgColor: [10],
  sectColor: [60, 10],
}

export const SCHEMES: readonly Scheme[] = [
  {
    id: 'strawberry',
    label: 'Strawberry',
    grid: 'strawberry',
    dark: { fgColor: 'FFFFFF', mainColor: 'ED5353', onMainColor: 'FFEBEB', bgColor: '1D1616', sectColor: 'ff8c82' },
    light: { fgColor: '1f2428', mainColor: 'ED5353', onMainColor: 'FFEBEB', bgColor: 'FFEBEB', sectColor: 'a10705' },
  },
  {
    id: 'orange',
    label: 'Orange',
    grid: 'orange',
    dark: { fgColor: 'FFFFFF', mainColor: 'F37329', onMainColor: 'FFF2EB', bgColor: '1D1816', sectColor: 'ffc27d' },
    light: { fgColor: '35261d', mainColor: 'F37329', onMainColor: 'FFF2EB', bgColor: 'FFF2EB', sectColor: 'cc3b02' },
  },
  {
    id: 'banana',
    label: 'Banana',
    grid: 'banana',
    dark: { fgColor: 'FFFFFF', mainColor: 'F9C440', onMainColor: '1D1B16', bgColor: '1D1B16', sectColor: 'fff394' },
    light: { fgColor: '352e1d', mainColor: 'F9C440', onMainColor: '1D1B16', bgColor: 'FFFDEB', sectColor: 'd48e15' },
  },
  {
    id: 'lime',
    label: 'Lime',
    grid: 'lime',
    dark: { fgColor: 'FFFFFF', mainColor: '68B723', onMainColor: '191D16', bgColor: '191D16', sectColor: 'd1ff82' },
    light: { fgColor: '26311b', mainColor: '68B723', onMainColor: '191D16', bgColor: 'F3FFEB', sectColor: '3a9104' },
  },
  {
    id: 'mint',
    label: 'Mint',
    grid: 'mint',
    dark: { fgColor: 'FFFFFF', mainColor: '28BCA3', onMainColor: '161D1C', bgColor: '161D1C', sectColor: '89ffdd' },
    light: { fgColor: '1d3531', mainColor: '28BCA3', onMainColor: '161D1C', bgColor: 'EBFFFC', sectColor: '0e9a83' },
  },
  {
    id: 'blueberry',
    label: 'Blueberry',
    grid: 'blueberry',
    dark: { fgColor: 'FFFFFF', mainColor: '3689E6', onMainColor: 'EBF5FF', bgColor: '16191D', sectColor: '8cd5ff' },
    light: { fgColor: '121921', mainColor: '3689E6', onMainColor: 'EBF5FF', bgColor: 'EBF5FF', sectColor: '0d52bf' },
  },
  {
    id: 'grape',
    label: 'Grape',
    grid: 'grape',
    dark: { fgColor: 'FFFFFF', mainColor: 'A56DE2', onMainColor: 'F8EFFF', bgColor: '19161D', sectColor: 'e4c6fa' },
    light: { fgColor: '281d35', mainColor: 'A56DE2', onMainColor: 'F8EFFF', bgColor: 'F8EFFF', sectColor: '7239b3' },
  },
  {
    id: 'bubblegum',
    label: 'Bubblegum',
    grid: 'bubblegum',
    dark: { fgColor: 'FFFFFF', mainColor: 'DE3E80', onMainColor: 'FFEBF4', bgColor: '1D1619', sectColor: 'fe9ab8' },
    light: { fgColor: '311b24', mainColor: 'DE3E80', onMainColor: 'FFEBF4', bgColor: 'FFEBF4', sectColor: 'bc245d' },
  },
  {
    id: 'cocoa',
    label: 'Cocoa',
    grid: 'cocoa',
    dark: { fgColor: 'FFFFFF', mainColor: '8A715E', onMainColor: 'F7F3F0', bgColor: '1D1916', sectColor: 'a3907c' },
    light: { fgColor: '362d26', mainColor: '8A715E', onMainColor: 'F7F3F0', bgColor: 'F7F3F0', sectColor: '57392d' },
  },
  {
    id: 'slate',
    label: 'Slate',
    grid: 'slate',
    dark: { fgColor: 'FFFFFF', mainColor: '667885', onMainColor: 'F2F4F7', bgColor: '171A1C', sectColor: '95a3ab' },
    light: { fgColor: '1f2428', mainColor: '667885', onMainColor: 'F2F4F7', bgColor: 'F2F4F7', sectColor: '485a6c' },
  },
  {
    id: 'snes',
    label: 'Snes Scheme',
    grid: 'grape',
    dark: { fgColor: 'FFFFFF', mainColor: 'BF89F6', onMainColor: '000000', bgColor: '2C2821', sectColor: 'CCA0F8' },
    light: { fgColor: '291d35', mainColor: '8B4ACC', onMainColor: 'FFFFFF', bgColor: 'E8DEC9', sectColor: '7332B3' },
  },
  {
    id: 'gb',
    label: 'Game Boy Scheme',
    grid: 'strawberry',
    dark: { fgColor: 'FFFFFF', mainColor: 'E06C7A', onMainColor: '000000', bgColor: '242628', sectColor: '52BF40' },
    light: { fgColor: '351d20', mainColor: 'BD283A', onMainColor: 'FFFFFF', bgColor: 'C8CCD0', sectColor: '1B5412' },
  },
  {
    id: 'pikachu',
    label: 'Pikachu Edition',
    grid: 'blueberry',
    dark: { fgColor: 'FFFFFF', mainColor: '628FE9', onMainColor: '000000', bgColor: '211D12', sectColor: 'FF6678' },
    light: { fgColor: '1f2428', mainColor: '1A4DB2', onMainColor: 'FFFFFF', bgColor: 'FBD051', sectColor: 'BD283A' },
  },
  {
    id: 'redBerries',
    label: 'Red Berries',
    grid: 'slate',
    dark: { fgColor: 'FFFFFF', mainColor: 'CC3D49', onMainColor: 'FFFFFF', bgColor: '16191D', sectColor: 'D3A1F7' },
    light: { fgColor: '351d1f', mainColor: 'CC3D49', onMainColor: 'FFFFFF', bgColor: 'EBF5FF', sectColor: '7239B3' },
  },
]

export const SCHEME_IDS: readonly string[] = SCHEMES.map((s) => s.id)

export function schemeById(id: string): Scheme {
  return SCHEMES.find((s) => s.id === id) ?? SCHEMES[0]!
}

/**
 * The custom properties one scheme resolves to.
 *
 * Elementerial is the one theme where the cascade genuinely earns its place: a scheme change is
 * a single style recalc across every view, with no rebuild and no re-render. The portability
 * rule is about *widgets* not reading the cascade - these variables are consumed by the theme's
 * own decorative CSS, and every value a widget needs is passed to it as a prop.
 */
export function schemeVariables(schemeId: string, style: SchemeStyle): Record<string, string> {
  const scheme = schemeById(schemeId)
  const tokens = scheme[style === 'light' ? 'light' : 'dark']
  const vars: Record<string, string> = {}

  for (const [key, hex] of Object.entries(tokens) as [keyof SchemeTokens, string][]) {
    vars[`--${key}`] = `#${hex}`
    for (const percent of ALPHA_USED[key]) {
      vars[`--${key}-${percent}`] = `#${hex}${ALPHA[percent]}`
    }
  }

  // The carousel background is bgColor at zero alpha, which has no percent-table entry.
  vars['--bgColor-0'] = `#${tokens.bgColor}00`

  return vars
}
