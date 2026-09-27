import type { Button } from '../../input/keymap'
import type { Platform } from './library'
import { gamesOf, systemDef } from './library'
import { HIDABLE, type State, type Tab } from './machine'
import { THEME_IDS, type ThemeId } from './palette'

/**
 * The Settings tab (`lib/screens/settings_screen/new_settings_screen.dart`): a menu a quarter of
 * the screen wide beside a page, the page always the one under the menu's cursor. Right or A enters
 * the page, B or Left leaves it.
 *
 * The values here are the ones other screens read: which tabs the strip shows, the colour theme,
 * the clock format, the three NeoGlass settings, the Recent card and which systems the grid lists.
 */

const wrap = (i: number, n: number) => (n <= 0 ? 0 : ((i % n) + n) % n)
const clamp = (i: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, i))

export type SettingsPage = 'general' | 'directories' | 'tools' | 'systems' | 'themes' | 'systemArt' | 'about' | 'exit'

/** The menu. Secondary Screen appears only with a second display, which neither device has. */
export const SETTINGS_PAGES: readonly SettingsPage[] = ['general', 'directories', 'tools', 'systems', 'themes', 'systemArt', 'about', 'exit']

export type GeneralRow =
  | 'androidSettings'
  | 'scanOnStartup'
  | 'ignoreHidden'
  | 'autoUpdateApp'
  | 'autoUpdateSystems'
  | 'sfx'
  | 'sfxVolume'
  | 'use12h'
  | 'subfolderAll'
  | 'cloudIcon'
  | 'achievementBadges'
  | 'raMatch'
  | 'tab:search'
  | 'tab:sync'
  | 'tab:achievements'
  | 'tab:scraper'
  | 'tab:romm'
  | 'language'
  | 'fullscreen'
  | 'allFiles'
  | 'defaultLauncher'
  | 'disableSecondary'
  | 'bartop'

/** `general_settings_content.dart:528-1037`, by platform. */
export function generalRows(platform: Platform): GeneralRow[] {
  return [
    ...(platform === 'android' ? (['androidSettings'] as const) : []),
    'scanOnStartup',
    'ignoreHidden',
    'autoUpdateApp',
    'autoUpdateSystems',
    'sfx',
    'sfxVolume',
    'use12h',
    'subfolderAll',
    'cloudIcon',
    'achievementBadges',
    'raMatch',
    'tab:search',
    'tab:sync',
    'tab:achievements',
    'tab:scraper',
    'tab:romm',
    'language',
    ...(platform === 'linux' ? (['fullscreen'] as const) : []),
    ...(platform === 'android' ? (['allFiles', 'defaultLauncher', 'disableSecondary'] as const) : []),
    ...(platform === 'linux' ? (['bartop'] as const) : []),
  ]
}

export const LANGUAGES = [
  'English',
  'Español',
  'Русский',
  '简体中文',
  '繁體中文',
  'Português',
  'Français',
  'Deutsch',
  'Italiano',
  'Bahasa Indonesia',
  '日本語',
  '한국어',
] as const

export const SFX_LEVELS = ['Low', 'Medium', 'High'] as const

export interface Dialog {
  readonly kind: 'confirm' | 'info'
  readonly title: string
  readonly body: string
  readonly confirm: string
  readonly icon: string
  readonly accent: 'error' | 'primary'
}

export interface SettingsState {
  readonly menu: number
  readonly inPane: boolean
  readonly item: number
  /** General's toggles, by row. */
  readonly toggles: Readonly<Partial<Record<GeneralRow, boolean>>>
  readonly sfxVolume: number
  readonly language: number
  /** The language picker's cursor while it is open. */
  readonly picker: number | null
  readonly glassBlur: number
  readonly glassTransparency: number
  readonly glassBorder: number
  readonly recentCard: boolean
  readonly recentCompact: boolean
  readonly favoritesCard: boolean
  readonly hiddenSystems: readonly string[]
  readonly hideLogos: boolean
  readonly dialog: Dialog | null
  /** Confirm Exit has quit the app. */
  readonly exited: boolean
}

/** `config_model.dart` defaults. */
export const INITIAL_SETTINGS: SettingsState = {
  menu: 0,
  inPane: false,
  item: 0,
  toggles: {
    scanOnStartup: true,
    ignoreHidden: true,
    autoUpdateApp: true,
    autoUpdateSystems: true,
    sfx: true,
    use12h: false,
    subfolderAll: false,
    cloudIcon: true,
    achievementBadges: false,
    raMatch: false,
    fullscreen: true,
    allFiles: true,
    defaultLauncher: true,
    disableSecondary: false,
    bartop: false,
  },
  sfxVolume: 2,
  language: 0,
  picker: null,
  glassBlur: 0,
  glassTransparency: 10,
  glassBorder: 2,
  recentCard: true,
  recentCompact: false,
  favoritesCard: true,
  hiddenSystems: [],
  hideLogos: false,
  dialog: null,
  exited: false,
}

/** The real systems the Systems page lists, as the grid has them. */
export const settingsSystems = (): string[] =>
  gamesOf('all')
    .map((g) => g.system)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => systemDef(a).name.localeCompare(systemDef(b).name))

/** The Themes page's grid: System, the fourteen, then Import. */
export const THEME_CELLS: readonly (ThemeId | 'system' | 'import')[] = ['system', ...THEME_IDS, 'import']
export const THEME_COLUMNS = 4

/** How many focusable items a page has. */
export function pageItems(s: State, page: SettingsPage): number {
  switch (page) {
    case 'general':
      return generalRows(s.platform).length
    case 'directories':
      // User data, rescan, add folder, the one folder, and ES-DE's three.
      return 7
    case 'tools':
      return 3
    case 'systems':
      return 3 + settingsSystems().length
    case 'themes':
      return 3 + THEME_CELLS.length
    case 'systemArt':
      return 2
    case 'about':
      return 6
    case 'exit':
      return 1
  }
}

const set = (s: State, patch: Partial<SettingsState>): State => ({ ...s, settings: { ...s.settings, ...patch } })

/** Directories rows 4-6 are ES-DE's; Import is inert until an ES-DE folder is set, which it is not. */
const DIRECTORY_DISABLED = [5]

export function reduceSettings(s: State, button: Button): State {
  const st = s.settings
  if (st.exited) return s
  if (st.dialog) {
    if (button === 'a' || button === 'b') return set(s, { dialog: null })
    return s
  }
  if (st.picker !== null) {
    switch (button) {
      case 'up':
      case 'down':
        return set(s, { picker: wrap(st.picker + (button === 'up' ? -1 : 1), LANGUAGES.length) })
      case 'a':
        return set(s, { language: st.picker, picker: null })
      case 'b':
        return set(s, { picker: null })
      default:
        return s
    }
  }
  const page = SETTINGS_PAGES[st.menu]!
  const n = pageItems(s, page)
  if (!st.inPane) {
    switch (button) {
      case 'up':
      case 'down':
        return set(s, { menu: wrap(st.menu + (button === 'up' ? -1 : 1), SETTINGS_PAGES.length), item: 0 })
      case 'right':
      case 'a':
        return n ? set(s, { inPane: true, item: 0 }) : s
      default:
        return s
    }
  }
  if (page === 'themes') return reduceThemes(s, button)
  switch (button) {
    case 'b':
    case 'left':
      return set(s, { inPane: false, item: 0 })
    case 'up':
    case 'down':
      // System Art's list wraps; every other page clamps.
      if (page === 'systemArt') return set(s, { item: wrap(st.item + (button === 'up' ? -1 : 1), n) })
      return set(s, { item: clamp(st.item + (button === 'up' ? -1 : 1), 0, n - 1) })
    case 'a':
      return activate(s, page)
    default:
      return s
  }
}

function toggle(s: State, row: GeneralRow): State {
  return set(s, { toggles: { ...s.settings.toggles, [row]: !s.settings.toggles[row] } })
}

function activate(s: State, page: SettingsPage): State {
  const st = s.settings
  switch (page) {
    case 'general': {
      const row = generalRows(s.platform)[st.item]!
      if (row.startsWith('tab:')) {
        const tab = row.slice(4) as Tab
        const hidden = s.hidden.includes(tab) ? s.hidden.filter((t) => t !== tab) : [...s.hidden, tab]
        return { ...s, hidden: HIDABLE.filter((t) => hidden.includes(t)) }
      }
      if (row === 'sfxVolume') return st.toggles.sfx ? set(s, { sfxVolume: (st.sfxVolume + 1) % 3 }) : s
      if (row === 'language') return set(s, { picker: st.language })
      // These open the operating system's own screens, which the mockup has none of.
      if (row === 'androidSettings' || row === 'allFiles' || row === 'defaultLauncher') return s
      return toggle(s, row)
    }
    case 'directories':
      if (DIRECTORY_DISABLED.includes(st.item)) return s
      if (st.item === 3)
        return set(s, {
          dialog: {
            kind: 'confirm',
            title: 'Remove',
            body: 'This will remove this ROM folder from your library sources. Your files on disk are not deleted.',
            confirm: 'Remove',
            icon: 'folder_delete_rounded',
            accent: 'error',
          },
        })
      if (st.item === 6)
        return set(s, {
          dialog: {
            kind: 'confirm',
            title: 'Reset ES-DE Import',
            body: 'Remove imported metadata and media links so the import can be re-run.',
            confirm: 'Reset ES-DE Import',
            icon: 'restart_alt_rounded',
            accent: 'error',
          },
        })
      return s
    case 'tools':
      return set(s, { dialog: TOOL_DIALOGS[st.item]! })
    case 'systems': {
      if (st.item === 0) return set(s, { recentCard: !st.recentCard })
      if (st.item === 1) return st.recentCard ? set(s, { recentCompact: !st.recentCompact }) : s
      if (st.item === 2) return set(s, { favoritesCard: !st.favoritesCard })
      const id = settingsSystems()[st.item - 3]!
      const hidden = st.hiddenSystems.includes(id) ? st.hiddenSystems.filter((x) => x !== id) : [...st.hiddenSystems, id]
      return set(s, { hiddenSystems: hidden })
    }
    case 'systemArt':
      return st.item === 0 ? set(s, { hideLogos: !st.hideLogos }) : s
    case 'about':
      return s
    case 'exit':
      return set(s, { exited: true })
    default:
      return s
  }
}

const TOOL_DIALOGS: readonly Dialog[] = [
  {
    kind: 'confirm',
    title: 'Match RetroAchievements Games',
    body: 'Check your whole library for achievement sets, instead of one game at a time.',
    confirm: 'Confirm',
    icon: 'emoji_events_rounded',
    accent: 'primary',
  },
  {
    kind: 'info',
    title: 'Clean Orphaned Metadata',
    body: 'No orphaned metadata found.',
    confirm: 'OK',
    icon: 'cleaning_services_rounded',
    accent: 'primary',
  },
  {
    kind: 'confirm',
    title: 'Organize Multi-Disc Games',
    body: 'Automatically creates .m3u files for multi disc games and organises them into folders.',
    confirm: 'Confirm',
    icon: 'folder_managed_rounded',
    accent: 'primary',
  },
]

/**
 * The Themes page (`themes_settings_content.dart:113-202`): three NeoGlass rows, then the grid.
 * Down from the last row enters the grid; the grid wraps top to bottom; Right wraps a row.
 */
function reduceThemes(s: State, button: Button): State {
  const st = s.settings
  const cells = THEME_CELLS.length
  const rows = Math.ceil(cells / THEME_COLUMNS)
  const inGrid = st.item >= 3
  const cell = st.item - 3
  const col = cell % THEME_COLUMNS
  const row = Math.floor(cell / THEME_COLUMNS)
  switch (button) {
    case 'b':
      return set(s, { inPane: false, item: 0 })
    case 'left':
      if (!inGrid || col === 0) return set(s, { inPane: false, item: 0 })
      return set(s, { item: st.item - 1 })
    case 'right':
      if (!inGrid) return s
      return set(s, { item: 3 + (col + 1 < THEME_COLUMNS && cell + 1 < cells ? cell + 1 : row * THEME_COLUMNS) })
    case 'up':
      if (!inGrid) return set(s, { item: st.item === 0 ? 3 + cells - 1 : st.item - 1 })
      if (row === 0) return set(s, { item: 2 })
      return set(s, { item: st.item - THEME_COLUMNS })
    case 'down':
      if (!inGrid) return set(s, { item: st.item + 1 })
      if (row + 1 < rows) return set(s, { item: 3 + Math.min(cells - 1, cell + THEME_COLUMNS) })
      return set(s, { item: 3 + col })
    case 'a': {
      if (st.item === 0) return set(s, { glassBlur: (st.glassBlur + 1) % 3 })
      if (st.item === 1) return set(s, { glassTransparency: (st.glassTransparency + 10) % 40 })
      if (st.item === 2) return set(s, { glassBorder: (st.glassBorder + 1) % 5 })
      const c = THEME_CELLS[cell]!
      if (c === 'import') return s
      // System follows the platform's brightness; both devices run dark.
      return { ...s, theme: c === 'system' ? 'dark' : c, themeName: c }
    }
    default:
      return s
  }
}
