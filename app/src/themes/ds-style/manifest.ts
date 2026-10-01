import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'
import type { Seed } from './machine'

export const DS_STYLE_DEVICES: readonly DeviceSlug[] = ['rg-sp']

export interface DsScreenDef {
  readonly slug: string
  readonly title: string
  readonly seed: Seed
}

/**
 * The stills. Each is posed the way its reference frame was rendered: the same buttons pressed
 * from a fresh start, in the reference renderer's letters (`docs/themes/ds-style/reference/stills.txt`,
 * which a test holds this table to). `home` is the live build's opening screen and the settle pair.
 */
export const DS_STYLE_SCREENS: readonly DsScreenDef[] = [
  { slug: 'home', title: 'Home', seed: {} },
  { slug: 'home-games', title: 'Home, Games', seed: { events: 'd' } },
  { slug: 'home-apps', title: 'Home, Apps', seed: { events: 'dr' } },
  { slug: 'home-settings', title: 'Home, Settings', seed: { events: 'dd' } },
  { slug: 'home-power', title: 'Home, Power', seed: { events: 'ddrr' } },
  { slug: 'systems', title: 'Systems', seed: { events: 'da' } },
  { slug: 'games', title: 'Games, Horizontal', seed: { events: 'daddar' } },
  { slug: 'games-vertical', title: 'Games, Vertical', seed: { events: 'daddars' } },
  { slug: 'games-list', title: 'Games, List', seed: { events: 'daddarss' } },
  { slug: 'games-list-art', title: 'Games, List + Art', seed: { events: 'daddarsss' } },
  { slug: 'games-marquee', title: 'Games, a long title', seed: { events: 'daddddddassdd' } },
  { slug: 'favourites', title: 'Favourites', seed: { events: '2' } },
  { slug: 'recents', title: 'Recents', seed: { events: '1' } },
  { slug: 'apps', title: 'Apps', seed: { events: 'dra' } },
  { slug: 'search', title: 'Search', seed: { events: 'daddarx' } },
  { slug: 'search-results', title: 'Search results', seed: { events: 'daddarxdrrrrrrrralllllllladddra' } },
  { slug: 'launch-mode', title: 'Launch mode', seed: { events: 'dat' } },
  { slug: 'confirm-shutdown', title: 'Shutdown?', seed: { events: 'ddrra' } },
  { slug: 'favourite-added', title: 'Added to favourites', seed: { events: 'daddary' } },
  { slug: 'launching', title: 'Launching', seed: { launching: true } },
  { slug: 'volume', title: 'Volume', seed: { hardware: { kind: 1, level: 60 } } },
  { slug: 'brightness', title: 'Brightness', seed: { hardware: { kind: 2, level: 57 } } },
  { slug: 'settings', title: 'Settings', seed: { events: 'm' } },
  { slug: 'settings-browsing', title: 'Settings, Browsing', seed: { events: 'ma' } },
  { slug: 'settings-artwork', title: 'Settings, Artwork', seed: { events: 'mda' } },
  { slug: 'settings-appearance', title: 'Settings, Appearance', seed: { events: 'mdda' } },
  { slug: 'settings-startup', title: 'Settings, Startup', seed: { events: 'mddda' } },
  { slug: 'settings-sound', title: 'Settings, Sound', seed: { events: 'mdddda' } },
  { slug: 'settings-system', title: 'Settings, System', seed: { events: 'mddddda' } },
  { slug: 'settings-controls', title: 'Settings, Controls', seed: { events: 'mdddddda' } },
  { slug: 'settings-bind', title: 'Binding a button', seed: { events: 'mddddddadda' } },
  { slug: 'setting-help', title: 'A setting explained', seed: { events: 'max' } },
  { slug: 'help', title: 'Help', seed: { events: 'mddddddda' } },
  { slug: 'help-2', title: 'Help, page 2', seed: { events: 'mdddddddar' } },
  { slug: 'about', title: 'About', seed: { events: 'mdddddddda' } },
  { slug: 'about-2', title: 'About, credits', seed: { events: 'mddddddddar' } },
  { slug: 'snake', title: 'Snake', seed: { events: 'mddddddddat' } },
  { slug: 'dark-home', title: 'Dark mode', seed: { events: 'mddadabb' } },
  { slug: 'dark-games', title: 'Dark mode, a list', seed: { events: 'mddadabbdaddarss' } },
  { slug: 'red', title: 'Red', seed: { events: 'mddarrrrrrrrrbb' } },
  { slug: 'bright-green', title: 'Bright Green', seed: { events: 'mddarrrrrrbb' } },
  { slug: 'purple', title: 'Purple', seed: { events: 'mddalbb' } },
  { slug: 'gba-art', title: 'GBA res. art', seed: { events: 'mdaddddabbdaddar' } },
  { slug: 'lcd-grid', title: 'LCD grid', seed: { prefs: { lcd: true } } },
]

/**
 * What each still is, by slug. Every view carries the title bar's clock except About and Snake,
 * whose bar swaps it for a page number or a score. The default view mode is Horizontal, so Games,
 * Favourites and Recents are carousels. Settings values are plain text, so no toggles.
 */
export const DS_STYLE_TAGS: Record<string, ScreenTags> = {
  home: { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'home-games': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'home-apps': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'home-settings': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'home-power': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  systems: { types: ['system-list'], elements: ['list', 'status-bar'] },
  games: { types: ['game-list'], elements: ['carousel', 'artwork-panel', 'status-bar'] },
  'games-vertical': { types: ['game-list'], elements: ['carousel', 'artwork-panel', 'status-bar'] },
  'games-list': { types: ['game-list'], elements: ['list', 'status-bar'] },
  'games-list-art': { types: ['game-list'], elements: ['list', 'artwork-panel', 'status-bar'] },
  'games-marquee': { types: ['game-list'], elements: ['list', 'status-bar'] },
  favourites: { types: ['collection', 'game-list'], elements: ['carousel', 'artwork-panel', 'status-bar'] },
  recents: { types: ['collection', 'game-list'], elements: ['carousel', 'artwork-panel', 'status-bar'] },
  apps: { types: ['apps'], elements: ['list', 'status-bar'] },
  search: { types: ['search'], elements: ['keyboard', 'status-bar'] },
  'search-results': { types: ['search', 'game-list'], elements: ['carousel', 'artwork-panel', 'status-bar'] },
  'launch-mode': { types: ['game-list'], elements: ['list', 'popup-menu', 'status-bar'] },
  'confirm-shutdown': { types: ['power'], elements: ['dialog', 'artwork-panel', 'status-bar'] },
  'favourite-added': { types: ['collection', 'game-list'], elements: ['carousel', 'artwork-panel', 'dialog', 'status-bar'] },
  launching: { types: ['loading'], elements: ['toast', 'artwork-panel', 'status-bar'] },
  volume: { types: ['overlay'], elements: ['slider', 'artwork-panel', 'status-bar'] },
  brightness: { types: ['overlay'], elements: ['slider', 'artwork-panel', 'status-bar'] },
  settings: { types: ['settings'], elements: ['list', 'status-bar'] },
  'settings-browsing': { types: ['settings'], elements: ['list', 'status-bar'] },
  'settings-artwork': { types: ['settings'], elements: ['list', 'status-bar'] },
  'settings-appearance': { types: ['settings', 'appearance'], elements: ['list', 'status-bar'] },
  'settings-startup': { types: ['settings'], elements: ['list', 'status-bar'] },
  'settings-sound': { types: ['settings'], elements: ['list', 'status-bar'] },
  'settings-system': { types: ['settings'], elements: ['list', 'status-bar'] },
  'settings-controls': { types: ['settings', 'controls'], elements: ['list', 'status-bar'] },
  'settings-bind': { types: ['controls', 'settings'], elements: ['list', 'dialog', 'status-bar'] },
  'setting-help': { types: ['settings', 'help'], elements: ['list', 'dialog', 'status-bar', 'text-block'] },
  help: { types: ['help'], elements: ['list', 'page-indicator', 'status-bar', 'text-block'] },
  'help-2': { types: ['help'], elements: ['list', 'page-indicator', 'status-bar', 'text-block'] },
  about: { types: ['about'], elements: ['page-indicator', 'text-block'] },
  'about-2': { types: ['about'], elements: ['page-indicator', 'text-block'] },
  snake: { types: ['apps'], elements: [] },
  'dark-home': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'dark-games': { types: ['game-list'], elements: ['list', 'status-bar'] },
  red: { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'bright-green': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  purple: { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
  'gba-art': { types: ['game-list'], elements: ['carousel', 'artwork-panel', 'status-bar'] },
  'lcd-grid': { types: ['home'], elements: ['artwork-panel', 'status-bar'] },
}

export const DS_STYLE_MANIFEST: readonly ScreenManifestEntry[] = DS_STYLE_DEVICES.flatMap((device) => [
  { theme: 'ds-style' as const, device, screen: 'interactive', title: 'Interactive', interactive: true, ...LIVE_TAGS },
  ...DS_STYLE_SCREENS.map((s) => ({
    theme: 'ds-style' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
    ...DS_STYLE_TAGS[s.slug]!,
  })),
])
