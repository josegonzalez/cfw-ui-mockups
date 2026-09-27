import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
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

export const DS_STYLE_MANIFEST: readonly ScreenManifestEntry[] = DS_STYLE_DEVICES.flatMap((device) => [
  { theme: 'ds-style' as const, device, screen: 'interactive', title: 'Interactive', interactive: true },
  ...DS_STYLE_SCREENS.map((s) => ({
    theme: 'ds-style' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
  })),
])
