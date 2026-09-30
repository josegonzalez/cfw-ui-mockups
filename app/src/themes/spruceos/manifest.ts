import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { Seed } from './machine'

/** Every device spruceOS runs on that this repo has a shell for (`spruce/<device>/`, `mainui.py:63-117`). */
export const SPRUCEOS_DEVICES: readonly DeviceSlug[] = [
  'miyoo-a30',
  'miyoo-flip',
  'miyoo-mini',
  'miyoo-mini-v4',
  'trimui-brick',
  'trimui-smart-pro',
  'rg35xx',
  'rg40xx',
  'rg34xx',
  'rg28xx',
  'rg-cubexx',
  'miniloong-pocket1',
]

/** One device per panel, which carries every still. */
export const REPRESENTATIVES: readonly DeviceSlug[] = [
  'miyoo-a30',
  'rg34xx',
  'rg-cubexx',
  'miyoo-mini-v4',
  'miniloong-pocket1',
  'trimui-brick',
  'trimui-smart-pro',
]

/**
 * The other devices carry the stills whose reference frames differ from their panel's
 * representative by more than the top bar's Wi-Fi icon, and the main menu, which every device
 * carries as the live build's settle twin. `docs/themes/spruceos/reference/README.md` records how
 * the frames were compared.
 */
export const OWN_STILLS: Readonly<Partial<Record<DeviceSlug, readonly string[]>>> = {
  // Bluetooth, Reboot, and its own apps and settings categories.
  'miyoo-flip': [
    'main-menu',
    'apps',
    'apps-down',
    'settings',
    'settings-bottom',
    'settings-power',
    'settings-additional',
  ],
  // No Wi-Fi, volume or popups; animation speed 2; a shorter About.
  'miyoo-mini': [
    'main-menu',
    'main-popup',
    'main-popup-down',
    'system-popup',
    'game-popup',
    'apps',
    'apps-down',
    'apps-popup',
    'settings',
    'settings-bottom',
    'settings-animation',
    'settings-about',
    'game-switcher-popup',
  ],
  // Reboot, and the Anbernic apps.
  rg35xx: ['main-menu', 'apps', 'apps-down', 'settings-power'],
  // The RG35XX's frames exactly: the same PyUI device, `ANBERNIC_RGXX640480`.
  rg40xx: ['main-menu'],
  // No Wi-Fi, Reboot, and the Anbernic apps.
  rg28xx: ['main-menu', 'apps', 'apps-down', 'settings', 'settings-bottom', 'settings-power'],
}

export interface SpruceScreenDef {
  readonly slug: string
  readonly title: string
  readonly seed: Seed
  /** Buttons for a device that reaches the same screen another way (`stills.txt`'s overrides). */
  readonly overrides?: Readonly<Partial<Record<DeviceSlug, string>>> | undefined
}

/**
 * The stills, each posed the way its reference frame was rendered: the same buttons from a fresh
 * start, in the harness's letters (`docs/themes/spruceos/reference/stills.txt`, which a test holds
 * this table to). `main-menu` is the live build's opening screen and its settle twin.
 */
export const SPRUCEOS_SCREENS: readonly SpruceScreenDef[] = [
  { slug: 'main-menu', title: 'Main menu', seed: {} },
  { slug: 'main-games', title: 'Main menu, Games', seed: { events: 'lll' } },
  { slug: 'main-apps', title: 'Main menu, Apps', seed: { events: 'll' } },
  { slug: 'main-settings', title: 'Main menu, Settings', seed: { events: 'l' } },
  { slug: 'main-popup', title: 'Main menu popup', seed: { events: 'm' } },
  { slug: 'main-popup-down', title: 'Main menu popup, Settings', seed: { events: 'md' } },
  { slug: 'games', title: 'Games', seed: { events: 'llla' } },
  { slug: 'games-row2', title: 'Games, second row', seed: { events: 'lllad' } },
  { slug: 'system-popup', title: 'System popup', seed: { events: 'lllam' } },
  { slug: 'game-list', title: 'Game list', seed: { events: 'lllaa' } },
  { slug: 'game-list-down', title: 'Game list, second game', seed: { events: 'lllaad' } },
  { slug: 'game-list-grid', title: 'Game list, grid', seed: { events: 'lllaae' } },
  { slug: 'game-list-icons', title: 'Game list, icons', seed: { events: 'lllaaee' } },
  { slug: 'game-list-carousel', title: 'Game list, carousel', seed: { events: 'lllaaeee' } },
  { slug: 'game-popup', title: 'Game popup', seed: { events: 'lllaam' } },
  { slug: 'game-config', title: 'Game configuration', seed: { events: 'lllaax' } },
  { slug: 'boxart-prompt', title: 'Optimise box art?', seed: { events: 'lllaa', boxartPrompt: true } },
  { slug: 'favorites', title: 'Favorites', seed: { events: 'lllla' } },
  { slug: 'recents', title: 'Recents', seed: { events: 'mdda' }, overrides: { 'trimui-smart-pro': 'a' } },
  { slug: 'search-keyboard', title: 'Rom Search', seed: { events: 'ma' } },
  { slug: 'apps', title: 'Apps', seed: { events: 'lla' } },
  { slug: 'apps-down', title: 'Apps, second app', seed: { events: 'llad' } },
  { slug: 'apps-popup', title: 'App popup', seed: { events: 'llam' } },
  { slug: 'settings', title: 'Settings', seed: { events: 'la' } },
  { slug: 'settings-bottom', title: 'Settings, last row', seed: { events: 'lau' } },
  { slug: 'settings-power', title: 'Power off?', seed: { events: 'laa' } },
  { slug: 'settings-theme-settings', title: 'Theme Settings', seed: { events: 'lauuuuuua' } },
  { slug: 'settings-sound', title: 'Sound Settings', seed: { events: 'lauuuuua' } },
  { slug: 'settings-additional', title: 'Additional Settings', seed: { events: 'lauuuua' } },
  { slug: 'settings-animation', title: 'Animation Settings', seed: { events: 'lauuuuada' } },
  { slug: 'settings-tasks', title: 'Tasks', seed: { events: 'lauuua' } },
  { slug: 'settings-about', title: 'About this Device', seed: { events: 'lauua' } },
  { slug: 'game-switcher', title: 'Game Switcher', seed: { gsTrigger: true } },
  { slug: 'game-switcher-next', title: 'Game Switcher, next game', seed: { events: 'r', gsTrigger: true } },
  { slug: 'game-switcher-popup', title: 'Game Switcher popup', seed: { events: 'm', gsTrigger: true } },
]

/** A still's seed on one device, with that device's override applied. */
export function seedFor(def: SpruceScreenDef, device: DeviceSlug): Seed {
  const events = def.overrides?.[device]
  return events === undefined ? def.seed : { ...def.seed, events }
}

/** The stills a device carries. */
export function stillsFor(device: DeviceSlug): readonly SpruceScreenDef[] {
  if (REPRESENTATIVES.includes(device)) return SPRUCEOS_SCREENS
  const own = OWN_STILLS[device] ?? ['main-menu']
  return SPRUCEOS_SCREENS.filter((s) => own.includes(s.slug))
}

export const SPRUCEOS_MANIFEST: readonly ScreenManifestEntry[] = SPRUCEOS_DEVICES.flatMap((device) => [
  { theme: 'spruceos' as const, device, screen: 'interactive', title: 'Interactive', interactive: true },
  ...stillsFor(device).map((s) => ({
    theme: 'spruceos' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
  })),
])
