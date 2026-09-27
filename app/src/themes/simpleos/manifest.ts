import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { View } from './library'

/**
 * One device.
 *
 * SimpleOS is an overlay for the Anbernic RG DS and nothing else - its README's first line says
 * so, and its whole layout assumes two panels.
 */
export const SIMPLEOS_DEVICES: readonly DeviceSlug[] = ['rg-ds']

export interface SimpleOsScreenDef {
  readonly slug: string
  readonly title: string
  readonly view: View
  readonly home?: number
  readonly cursor?: number
  readonly running?: number
  readonly menuTitle?: number
  readonly osd?: 'SAVED' | 'LOADED'
  readonly binding?: 'bind' | 'add'
  readonly clockField?: number
  readonly toast?: boolean
  readonly archived?: readonly number[]
}

/**
 * The statics.
 *
 * Every screen once, posed the way the trailer poses it wherever the trailer shows it: CrossworDS
 * highlighted on home, the cursor on LOAD in Castlevania's menu, the switcher on C.O.P. from New
 * Super Mario Bros., the unlock over Mario Kart DS.
 */
export const SIMPLEOS_SCREENS: readonly SimpleOsScreenDef[] = [
  { slug: 'boot', title: 'Boot', view: 'boot' },
  { slug: 'home', title: 'Home', view: 'home', home: 3 },
  { slug: 'home-page-2', title: 'Home, page 2', view: 'home', home: 7 },
  { slug: 'archive', title: 'Archive', view: 'archive', archived: [4, 7] },
  { slug: 'options', title: 'Options', view: 'options' },
  { slug: 'network', title: 'Network', view: 'network' },
  { slug: 'retroachievements', title: 'RetroAchievements', view: 'retroachievements' },
  { slug: 'update', title: 'Update', view: 'update' },
  { slug: 'game-settings', title: 'Game settings', view: 'game-settings', cursor: 3 },
  { slug: 'power', title: 'Power management', view: 'power', cursor: 1 },
  { slug: 'this-game', title: 'This game', view: 'this-game', home: 3 },
  { slug: 'controls', title: 'Controls', view: 'controls', home: 3 },
  { slug: 'controls-binding', title: 'Controls: binding', view: 'controls', home: 3, cursor: 4, binding: 'bind' },
  { slug: 'clock', title: 'Clock', view: 'clock', clockField: 3 },
  { slug: 'in-game', title: 'In game', view: 'game', running: 2 },
  { slug: 'quick-menu', title: 'Quick menu', view: 'quick-menu', running: 2, cursor: 2 },
  { slug: 'game-switcher', title: 'Game switcher', view: 'quick-menu', running: 11, menuTitle: 0 },
  { slug: 'saved', title: 'Saved', view: 'game', running: 2, osd: 'SAVED' },
  { slug: 'video', title: 'Video', view: 'video', running: 2, cursor: 1 },
  { slug: 'unlock', title: 'Achievement unlocked', view: 'game', running: 9, toast: true },
]

export const SIMPLEOS_MANIFEST: readonly ScreenManifestEntry[] = SIMPLEOS_DEVICES.flatMap(
  (device) => [
    {
      theme: 'simpleos' as const,
      device,
      screen: 'interactive',
      title: 'Interactive',
      interactive: true,
    },
    ...SIMPLEOS_SCREENS.map((s) => ({
      theme: 'simpleos' as const,
      device,
      screen: s.slug,
      title: s.title,
      interactive: false,
    })),
  ],
)
