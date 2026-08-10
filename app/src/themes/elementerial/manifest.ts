import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { SchemeStyle } from './palette'
import type { ElementerialView } from './index'

/** The devices the theme resolves a layout for, one per aspect class it supports. */
export const ELEMENTERIAL_DEVICES: readonly DeviceSlug[] = ['rg35xx', 'rg351m', 'rg552', 'rg-cubexx']

/**
 * The eight static screens.
 *
 * Each carries the scheme, style and system the original static page booted with. They differ
 * per screen on purpose: with fourteen schemes in two styles, showing every screen in the same
 * colours would hide the range the theme is actually built around. The slugs match the legacy
 * filenames so the A/B fidelity gate can pair them up by name.
 */
export interface ElementerialScreen {
  readonly slug: string
  readonly title: string
  readonly view: ElementerialView
  readonly scheme: string
  readonly style: SchemeStyle
  readonly system: string
}

export const ELEMENTERIAL_SCREENS: readonly ElementerialScreen[] = [
  { slug: 'system', title: 'System carousel', view: 'system', scheme: 'strawberry', style: 'dark', system: 'gba' },
  { slug: 'gamelist-basic', title: 'Game list - basic', view: 'basic', scheme: 'lime', style: 'dark', system: 'nes' },
  { slug: 'gamelist-detailed', title: 'Game list - detailed', view: 'detailed', scheme: 'mint', style: 'dark', system: 'gba' },
  { slug: 'gamelist-video', title: 'Game list - video', view: 'video', scheme: 'blueberry', style: 'dark', system: 'snes' },
  { slug: 'grid', title: 'Grid', view: 'grid', scheme: 'grape', style: 'dark', system: 'snes' },
  { slug: 'boxes', title: 'Boxes', view: 'boxes', scheme: 'snes', style: 'light', system: 'gba' },
  { slug: 'elementflix', title: 'Elementflix', view: 'elementflix', scheme: 'bubblegum', style: 'dark', system: 'psx' },
  { slug: 'menu', title: 'Menu', view: 'menu', scheme: 'gb', style: 'light', system: 'gb' },
]

export const ELEMENTERIAL_MANIFEST: readonly ScreenManifestEntry[] = ELEMENTERIAL_DEVICES.flatMap(
  (device) => [
    {
      theme: 'elementerial' as const,
      device,
      screen: 'interactive',
      title: 'Interactive',
      interactive: true,
    },
    ...ELEMENTERIAL_SCREENS.map((screen) => ({
      theme: 'elementerial' as const,
      device,
      screen: screen.slug,
      title: screen.title,
      interactive: false,
    })),
  ],
)
