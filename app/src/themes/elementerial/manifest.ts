import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'
import type { SchemeStyle } from './palette'
import type { ElementerialView } from './index'

/** The devices the theme resolves a layout for, one per aspect class it supports. */
export const ELEMENTERIAL_DEVICES: readonly DeviceSlug[] = ['rg35xx', 'rg351m', 'rg552', 'rg-cubexx']

/**
 * The eight static screens.
 *
 * Each carries the scheme, style and system the original static page booted with. They differ
 * per screen on purpose: with fourteen schemes in two styles, showing every screen in the same
 * colours would hide the range the theme is actually built around. The slugs are the theme's own view
 * names.
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

/**
 * What each screen is, by slug. The shared chrome (hint bar, clock, wifi and battery glyphs) is
 * on every view except the menu, which draws none behind its panel.
 */
export const ELEMENTERIAL_TAGS: Record<string, ScreenTags> = {
  system: { types: ['system-list'], elements: ['carousel', 'hint-bar', 'status-bar'] },
  'gamelist-basic': { types: ['game-list'], elements: ['list', 'hint-bar', 'status-bar'] },
  'gamelist-detailed': { types: ['game-list', 'game-details'], elements: ['list', 'artwork-panel', 'hint-bar', 'status-bar'] },
  'gamelist-video': { types: ['game-list'], elements: ['list', 'artwork-panel', 'hint-bar', 'status-bar'] },
  grid: { types: ['game-list'], elements: ['grid', 'hint-bar', 'status-bar'] },
  boxes: { types: ['game-list'], elements: ['grid', 'hint-bar', 'status-bar'] },
  elementflix: { types: ['game-list'], elements: ['carousel', 'artwork-panel', 'hint-bar', 'status-bar'] },
  menu: { types: ['settings'], elements: ['list', 'toggle'] },
}

export const ELEMENTERIAL_MANIFEST: readonly ScreenManifestEntry[] = ELEMENTERIAL_DEVICES.flatMap(
  (device) => [
    {
      theme: 'elementerial' as const,
      device,
      screen: 'interactive',
      title: 'Interactive',
      interactive: true,
      ...LIVE_TAGS,
    },
    ...ELEMENTERIAL_SCREENS.map((screen) => ({
      theme: 'elementerial' as const,
      device,
      screen: screen.slug,
      title: screen.title,
      interactive: false,
      ...ELEMENTERIAL_TAGS[screen.slug]!,
    })),
  ],
)
