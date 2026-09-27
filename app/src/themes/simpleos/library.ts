/**
 * Sample data and SimpleOS's own strings.
 *
 * Every label below is a string from the SimpleOS binary (`simpleos/system/bin/simpleos`), which
 * is the closest thing the release has to a string table - SimpleOS ships as a compiled program,
 * not as source. `docs/themes/simpleos/reference/strings.txt` is the region of that dump the UI
 * draws from. Where a screen needs a string the binary does not have, the porting notes on that
 * view say so.
 */

/** The titles in the trailer's library, in the order its grid shows them. */
export const GAMES: readonly string[] = [
  'C.O.P. - The Recruit',
  'Call of Duty 4 - Modern Warfare',
  'Castlevania - Order of Ecclesia',
  'CrossworDS',
  "Dr Kawashima's Brain Training - How Old Is Your Brain",
  'Golden Sun - Dark Dawn',
  'Grand Theft Auto - Chinatown Wars',
  'IL-2 Sturmovik - Birds of Prey',
  'Mario Hoops 3 on 3',
  'Mario Kart DS',
  'Need for Speed - ProStreet',
  'New Super Mario Bros.',
]

/** The home grid: three columns, two rows, a page at a time. */
export const GRID = { cols: 3, rows: 2 } as const
export const PER_PAGE = GRID.cols * GRID.rows

/** The trailer's clock, which is what every still is posed at. */
export const SAMPLE_CLOCK = { year: 2026, month: 9, day: 10, hour: 9, minute: 40 } as const

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** `%02d %s %04d`, the binary's date format. */
export function formatDate(c: { year: number; month: number; day: number }): string {
  return `${String(c.day).padStart(2, '0')} ${MONTHS[c.month - 1]} ${String(c.year).padStart(4, '0')}`
}

/** `%02d:%02d`. */
export function formatTime(c: { hour: number; minute: number }): string {
  return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`
}

/**
 * The home legend, verbatim. The runs of spaces are the source's own and are how it lines the
 * two columns up in a fixed-width font, so they are drawn as written.
 */
export const HOME_LEGEND: readonly string[] = [
  'A  play           X  archive',
  'START  options    SELECT  clock',
  'HOME  game config',
]

/** The in-game menu for the running title, from the README and the 20260914 changelog. */
export const MENU_CURRENT = [
  'RESUME',
  'SAVE',
  'LOAD',
  'ARCHIVE',
  'VIDEO',
  'CONTROLS',
  'RESET',
  'HOME',
] as const

/** The in-game menu when left/right has moved to another title: 20260913's changelog. */
export const MENU_OTHER = ['LOAD', 'ARCHIVE', 'HOME'] as const

export type MenuItem = (typeof MENU_CURRENT)[number]

/** The binary's `<  >`, drawn under the title to say left and right change it. */
export const SWITCH_HINT = '<  >'

/** Shader names, from the binary and the shader files shipped beside it. */
export const SHADERS: readonly string[] = [
  'OFF',
  'LCD1x',
  'Sharp bilinear',
  'zFast LCD',
  'NDS Color',
  'Natural Vision',
  'LCD1x + NDS Color',
  'Sharp + NDS Color',
  'zFast + NDS Color',
  'LCD1x + Natural Vision',
  'Sharp + Natural Vision',
  'zFast + Natural Vision',
  'LCD1x + NDS + NV',
  'Sharp + NDS + NV',
  'zFast + NDS + NV',
]

export const POWER_PROFILES = ['Conservative', 'Performance', 'High performance'] as const
export type PowerProfile = (typeof POWER_PROFILES)[number]

/** A per-game override: `GLOBAL` defers to Game settings. */
export type Override = 'GLOBAL' | 'ON' | 'OFF'
export const OVERRIDES: readonly Override[] = ['GLOBAL', 'ON', 'OFF']

/** The DS buttons the Controls screen remaps, in the order a DS lists them. */
export const DS_BUTTONS = [
  'A',
  'B',
  'X',
  'Y',
  'L',
  'R',
  'START',
  'SELECT',
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
] as const
export type DsButton = (typeof DS_BUTTONS)[number]

/** Every screen SimpleOS has, and the ones this port draws. */
export type View =
  | 'boot'
  | 'home'
  | 'archive'
  | 'options'
  | 'network'
  | 'retroachievements'
  | 'update'
  | 'game-settings'
  | 'power'
  | 'this-game'
  | 'controls'
  | 'video'
  | 'clock'
  | 'game'
  | 'quick-menu'

export const VIEWS: readonly { slug: View; label: string }[] = [
  { slug: 'boot', label: 'Boot' },
  { slug: 'home', label: 'Home' },
  { slug: 'archive', label: 'Archive' },
  { slug: 'options', label: 'Options' },
  { slug: 'network', label: 'Network' },
  { slug: 'retroachievements', label: 'RetroAchievements' },
  { slug: 'update', label: 'Update' },
  { slug: 'game-settings', label: 'Game settings' },
  { slug: 'power', label: 'Power management' },
  { slug: 'this-game', label: 'This game' },
  { slug: 'controls', label: 'Controls' },
  { slug: 'video', label: 'Video' },
  { slug: 'clock', label: 'Clock' },
  { slug: 'game', label: 'In game' },
  { slug: 'quick-menu', label: 'Quick menu' },
]

/**
 * What each settings screen says about itself on the top panel: its title, the line under it,
 * and its legend. Titles are the binary's capitalised headings; the lines are the binary's own
 * descriptions of the screen; the legends are its hint strings.
 */
export interface ScreenCopy {
  readonly title: string
  readonly subtitle?: string
  readonly legend: string
}

export const SCREEN_COPY: Partial<Record<View, ScreenCopy>> = {
  archive: { title: 'ARCHIVE', subtitle: 'Archived titles', legend: 'A  move      B  back' },
  options: { title: 'OPTIONS', subtitle: 'Network, update, power', legend: 'A  select     B  home' },
  network: { title: 'NETWORK', subtitle: 'Wi-Fi, RetroAchievements', legend: 'A  select     B  back' },
  retroachievements: { title: 'RETROACHIEVEMENTS', legend: 'A  select     B  back' },
  update: { title: 'UPDATE', subtitle: 'OTA or zip on the SD', legend: 'A  select     B  back' },
  'game-settings': {
    title: 'GAME SETTINGS',
    subtitle: 'Default for every title',
    legend: 'A  toggle     ←→  shader',
  },
  power: { title: 'POWER', subtitle: 'Power management', legend: 'A  select     B  back' },
  'this-game': {
    title: 'THIS GAME',
    subtitle: 'Overrides the global defaults',
    legend: 'A  cycle / Controls     B  home',
  },
  controls: { title: 'CONTROLS', subtitle: 'Remap DS buttons', legend: 'A  bind   X  add   B  back' },
  video: { title: 'VIDEO', subtitle: 'DraStic High res 3D', legend: 'A  APPLY HIRES      ←→  shader' },
  clock: { title: 'CLOCK', legend: 'tap arrows      A  save      B  cancel' },
}
