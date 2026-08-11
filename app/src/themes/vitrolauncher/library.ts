/**
 * The sample library, the settings schema and their defaults.
 *
 * Transcribed from `screens.js`. Kept as data rather than built into components so the settings
 * screen renders itself from the same declaration the launcher reads, which is how the real app
 * works - `defaults.cfg` supplies the shape and `config/config.json` overrides values.
 */

export interface VitroGame {
  readonly id: string
  readonly name: string
  readonly system: string
  readonly playSeconds: number
  readonly bookmarked: boolean
}

const g = (name: string, system: string, mins: number, bookmarked = false): VitroGame => ({
  id: name,
  name,
  system,
  playSeconds: mins * 60,
  bookmarked,
})

export const GAMES: readonly VitroGame[] = [
  g('Golden Sun', 'gba', 740, true),
  g('Chrono Trigger', 'snes', 1360, true),
  g('Metal Slug X', 'arcade', 65),
  g('Castlevania: Symphony of the Night', 'psx', 390),
  g('Super Metroid', 'snes', 195),
  g('Sonic the Hedgehog 2', 'genesis', 45),
  g("The Legend of Zelda: Link's Awakening", 'gb', 290, true),
  g('Final Fantasy VI', 'snes', 900),
  g('Advance Wars', 'gba', 545),
  g('Street Fighter Alpha 3', 'arcade', 120),
  g('Super Mario World', 'snes', 340),
  g('Crash Bandicoot', 'psx', 180),
  g('Mega Man X', 'snes', 110),
  g("Kirby's Adventure", 'nes', 150, true),
  g('Fire Emblem', 'gba', 1090),
  g('Tetris', 'gb', 30),
  g('Doom II', 'ports', 75),
  g('Gran Turismo 2', 'psx', 610),
]

/**
 * Playtime, in the launcher's own phrasing.
 *
 * Four cases and they are not interchangeable: under a minute reads `<1m`, under an hour reads
 * minutes, ten hours or more drops the minutes entirely, and an exact hour does too.
 */
export function formatPlaytime(seconds: number): string {
  if (!seconds || seconds <= 0) return ''
  const total = Math.floor(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (total < 1) return '<1m'
  if (h === 0) return `${m}m`
  if (h >= 10 || m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/* ---- colour schemes: the Settings screen's "Color" row ---- */

export interface VitroColor {
  readonly l: string
  readonly accent: string
  readonly bg: string
  /** The one scheme with a light background, which flips the whole UI to dark-on-light. */
  readonly light?: boolean
}

export const COLORS: readonly VitroColor[] = [
  { l: 'Blue', accent: '#2245cc', bg: '#2245cc' },
  { l: 'Purple', accent: '#7a3fd4', bg: '#7a3fd4' },
  { l: 'Red', accent: '#c0264b', bg: '#c0264b' },
  { l: 'Orange', accent: '#d97b1f', bg: '#d97b1f' },
  { l: 'Green', accent: '#1f9e46', bg: '#1f9e46' },
  { l: 'Teal', accent: '#12939c', bg: '#12939c' },
  { l: 'Pink', accent: '#d4569b', bg: '#d4569b' },
  { l: 'Silver', accent: '#7f8c9b', bg: '#7f8c9b' },
  { l: 'Black', accent: '#101216', bg: '#101216' },
  { l: 'Black & Blue', accent: '#1a9fff', bg: '#0e141b' },
  { l: 'White & Blue', accent: '#20a0d6', bg: '#e9edf2', light: true },
]

export type BackgroundTheme = 'waves' | 'particles' | 'clouds' | 'simple-dark' | 'simple-light'

/* ---- settings schema ---- */

export type SettingType = 'color' | 'options' | 'toggle' | 'percent' | 'buttons' | 'action'

export interface SettingOption {
  readonly v: string | number
  readonly l: string
}

export interface SettingDef {
  readonly key: string
  readonly label: string
  readonly type: SettingType
  readonly options?: readonly SettingOption[]
}

export const SETTINGS: readonly SettingDef[] = [
  { key: 'color', label: 'Color', type: 'color' },
  {
    key: 'theme',
    label: 'Theme',
    type: 'options',
    options: [
      { v: 'waves', l: 'Waves' },
      { v: 'particles', l: 'Particles' },
      { v: 'clouds', l: 'Clouds' },
      { v: 'simple-dark', l: 'Simple Dark' },
      { v: 'simple-light', l: 'Simple Light' },
    ],
  },
  { key: 'tooltips', label: 'Tooltips', type: 'toggle' },
  {
    key: 'nav_autohide',
    label: 'Auto-Hide Navigation',
    type: 'options',
    options: [
      { v: 0, l: 'No' },
      { v: 3, l: '3s' },
      { v: 5, l: '5s' },
      { v: 10, l: '10s' },
    ],
  },
  { key: 'infinite', label: 'Infinite Scrolling', type: 'toggle' },
  {
    key: 'button_style',
    label: 'Button Style',
    type: 'buttons',
    options: [
      { v: 'retro', l: 'A / B' },
      { v: 'modern', l: 'X / O' },
    ],
  },
  {
    key: 'default_screen',
    label: 'Default Screen',
    type: 'options',
    options: [
      { v: 'recent', l: 'Recent' },
      { v: 'all', l: 'All Titles' },
    ],
  },
  { key: 'startup_fade', label: 'Startup Fade-In', type: 'toggle' },
  { key: 'show_playtime', label: 'Show Playtime', type: 'toggle' },
  { key: 'show_titles', label: 'Show Titles on Recents', type: 'toggle' },
  {
    key: 'cover_size',
    label: 'Cover Size on Recents',
    type: 'options',
    options: [
      { v: 'small', l: 'Small' },
      { v: 'medium', l: 'Medium' },
      { v: 'large', l: 'Large' },
    ],
  },
  {
    key: 'recent_limit',
    label: 'Title Limit on Recents',
    type: 'options',
    options: [
      { v: 4, l: '4' },
      { v: 8, l: '8' },
      { v: 12, l: '12' },
      { v: 16, l: '16' },
    ],
  },
  {
    key: 'all_icon_size',
    label: 'Icon Size on All Titles',
    type: 'options',
    options: [
      { v: 'small', l: 'Small (3 Rows)' },
      { v: 'large', l: 'Large (2 Rows)' },
    ],
  },
  {
    key: 'all_sort',
    label: 'Sorting on All Titles',
    type: 'options',
    options: [
      { v: 'az', l: 'A-Z' },
      { v: 'recent', l: 'Recent' },
      { v: 'playtime', l: 'Time Played' },
    ],
  },
  {
    key: 'all_bookmarks',
    label: 'Bookmarks on All Titles',
    type: 'options',
    options: [
      { v: 'first', l: 'Show First' },
      { v: 'sorted', l: 'As Sorted' },
    ],
  },
  { key: 'transparency', label: 'Transparency', type: 'toggle' },
  { key: 'brightness', label: 'Screen Brightness', type: 'percent' },
  { key: 'volume', label: 'System Volume', type: 'percent' },
  { key: 'reset', label: 'Reset Settings', type: 'action' },
]

export interface VitroSettings {
  color: number
  theme: BackgroundTheme
  tooltips: boolean
  nav_autohide: number
  infinite: boolean
  button_style: 'retro' | 'modern'
  default_screen: 'recent' | 'all'
  startup_fade: boolean
  show_playtime: boolean
  show_titles: boolean
  cover_size: 'small' | 'medium' | 'large'
  recent_limit: number
  all_icon_size: 'small' | 'large'
  all_sort: 'az' | 'recent' | 'playtime'
  all_bookmarks: 'first' | 'sorted'
  transparency: boolean
  brightness: number
  volume: number
}

/** The shipped config, with tooltips and retro A/B on for a clearer mockup. */
export function defaults(): VitroSettings {
  return {
    color: 9,
    theme: 'waves',
    tooltips: true,
    nav_autohide: 10,
    infinite: false,
    button_style: 'retro',
    default_screen: 'recent',
    startup_fade: true,
    show_playtime: true,
    show_titles: false,
    cover_size: 'large',
    recent_limit: 12,
    all_icon_size: 'small',
    all_sort: 'az',
    all_bookmarks: 'first',
    transparency: true,
    brightness: 80,
    volume: 60,
  }
}

/** The All Titles list, sorted the way the settings ask for. */
export function sortedGames(settings: VitroSettings): VitroGame[] {
  const list = [...GAMES]
  if (settings.all_sort === 'az') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  } else if (settings.all_sort === 'playtime') {
    list.sort((a, b) => b.playSeconds - a.playSeconds || a.name.localeCompare(b.name))
  }
  // 'recent' keeps the declaration order, which is most-recent first.
  if (settings.all_bookmarks === 'first') {
    list.sort((a, b) => Number(b.bookmarked) - Number(a.bookmarked))
  }
  return list
}
