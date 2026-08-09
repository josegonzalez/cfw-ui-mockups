/**
 * Example OS content.
 *
 * A real theme's data module carries the strings and metadata its screens display, so the
 * screens themselves stay free of literals. Keeping it separate is also what lets a screen be
 * rendered with different content in a story without touching the screen.
 */

export interface MenuEntry {
  readonly key: string
  readonly label: string
  readonly sublabel: string
  readonly icon: string
  /** The screen this entry opens. Entries without one are inert placeholders. */
  readonly opens?: 'game-list'
}

export const MENU: readonly MenuEntry[] = [
  { key: 'recents', label: 'Recents', sublabel: 'Jump back in', icon: 'R' },
  { key: 'favorites', label: 'Favorites', sublabel: 'Your pinned games', icon: 'F' },
  { key: 'games', label: 'Games', sublabel: 'Browse by system', icon: 'G', opens: 'game-list' },
  { key: 'apps', label: 'Apps', sublabel: 'Tools and extras', icon: 'A' },
  { key: 'settings', label: 'Settings', sublabel: 'System configuration', icon: 'S' },
]

export interface Game {
  readonly key: string
  readonly title: string
  readonly year: number
  readonly lastPlayed: string
  /** Cover art gradient. Authored per game so the list reads as distinct titles at a glance. */
  readonly art: readonly [string, string]
}

export const SYSTEM_NAME = 'Super Nintendo'

export const GAMES: readonly Game[] = [
  { key: 'chrono', title: 'Chrono Drifter', year: 1995, lastPlayed: 'Last played 2d ago', art: ['#7b5cff', '#31d0ff'] },
  { key: 'pixel', title: 'Pixel Knights', year: 1993, lastPlayed: 'Last played 5d ago', art: ['#ff6b6b', '#ffb03a'] },
  { key: 'moon', title: 'Moon Circuit', year: 1996, lastPlayed: 'Never played', art: ['#3ad29f', '#4cc9f0'] },
  { key: 'neon', title: 'Neon Samurai', year: 1994, lastPlayed: 'Last played 1w ago', art: ['#ff4d9d', '#7b5cff'] },
  { key: 'turbo', title: 'Turbo Grove', year: 1992, lastPlayed: 'Never played', art: ['#ffd166', '#ff6b6b'] },
  { key: 'crystal', title: 'Crystal Vault', year: 1997, lastPlayed: 'Last played 3w ago', art: ['#4cc9f0', '#3ad29f'] },
  { key: 'star', title: 'Star Relay', year: 1995, lastPlayed: 'Never played', art: ['#7b5cff', '#ff4d9d'] },
]
