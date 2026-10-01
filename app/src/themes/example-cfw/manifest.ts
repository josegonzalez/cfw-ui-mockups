import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'

export type ExampleView = 'main-menu' | 'game-list'

export const EXAMPLE_VIEWS: readonly ExampleView[] = ['main-menu', 'game-list']

export const EXAMPLE_VIEW_LABEL: Record<ExampleView, string> = {
  'main-menu': 'Main menu',
  'game-list': 'Game list',
}

export const EXAMPLE_VIEW_TAGS: Record<ExampleView, ScreenTags> = {
  'main-menu': { types: ['home'], elements: ['list', 'hint-bar', 'status-bar'] },
  'game-list': { types: ['game-list'], elements: ['list', 'artwork-panel', 'hint-bar'] },
}

/**
 * Devices this theme is published for.
 *
 * The original shipped one 640x480 panel. The layout now resolves from fractions, so adding a
 * device is one entry here rather than a second copy of every screen - which is the point of
 * the scaffold.
 */
export const EXAMPLE_DEVICES: readonly DeviceSlug[] = ['rg35xx', 'rg-cubexx']

export const EXAMPLE_MANIFEST: readonly ScreenManifestEntry[] = EXAMPLE_DEVICES.flatMap(
  (device) => [
    {
      theme: 'example-cfw' as const,
      device,
      screen: 'interactive',
      title: 'Interactive',
      interactive: true,
      ...LIVE_TAGS,
    },
    ...EXAMPLE_VIEWS.map((view) => ({
      theme: 'example-cfw' as const,
      device,
      screen: view,
      title: EXAMPLE_VIEW_LABEL[view],
      interactive: false,
      ...EXAMPLE_VIEW_TAGS[view],
    })),
  ],
)
