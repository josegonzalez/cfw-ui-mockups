import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'
import type { PsxView } from './layout'

/** The devices the theme resolves a layout for, one per aspect subset it declares. */
export const PSX_DEVICE_SLUGS: readonly DeviceSlug[] = [
  'trimui-smart-pro',
  'rg35xx',
  'rg34xx',
  'rg552',
]

/**
 * The eleven static screens.
 *
 * Unlike Elementerial, every one boots with the same subsets - blue, PS4, medium, default top
 * info, on the PlayStation system. That is what the original static pages did, and it is the
 * right call here: this theme's variation is in its eleven views, so varying the palette as well
 * would only make the set harder to compare against itself.
 *
 * The slugs are the theme's own view names, hyphenated.
 */
export interface PsxScreen {
  readonly slug: string
  readonly title: string
  readonly view: PsxView
}

export const PSX_SCREENS: readonly PsxScreen[] = [
  { slug: 'system', title: 'System', view: 'system' },
  { slug: 'ps4-style', title: 'PS4 Style', view: 'ps4Style' },
  { slug: 'ps5-style', title: 'PS5 Style', view: 'ps5Style' },
  { slug: 'detailed', title: 'Detailed', view: 'detailed' },
  { slug: 'grid', title: 'Grid', view: 'grid' },
  { slug: 'carousel', title: 'Horizontal carousel', view: 'carousel' },
  { slug: 'full-grid', title: 'Full grid', view: 'fullGrid' },
  { slug: 'single', title: 'Game by game', view: 'single' },
  { slug: 'media-tester', title: 'Media tester', view: 'mediaTester' },
  { slug: 'boot-splash', title: 'Boot splash', view: 'splash' },
  { slug: 'game-launch', title: 'Game launch', view: 'gamesplash' },
]

/** What each screen is, by slug. The top info bar and the hint bar are shared chrome on every view but the two splashes. */
export const PSX_TAGS: Record<string, ScreenTags> = {
  system: { types: ['system-list'], elements: ['carousel', 'artwork-panel', 'hint-bar', 'status-bar'] },
  'ps4-style': { types: ['game-list'], elements: ['carousel', 'artwork-panel', 'hint-bar', 'status-bar'] },
  'ps5-style': { types: ['game-list'], elements: ['grid', 'page-indicator', 'artwork-panel', 'hint-bar', 'status-bar'] },
  detailed: { types: ['game-list', 'game-details'], elements: ['list', 'artwork-panel', 'hint-bar', 'status-bar'] },
  grid: { types: ['game-list'], elements: ['grid', 'page-indicator', 'artwork-panel', 'hint-bar', 'status-bar'] },
  carousel: { types: ['game-list'], elements: ['carousel', 'artwork-panel', 'hint-bar', 'status-bar'] },
  'full-grid': { types: ['game-list'], elements: ['grid', 'artwork-panel', 'hint-bar', 'status-bar'] },
  single: { types: ['game-details', 'game-list'], elements: ['artwork-panel', 'hint-bar', 'status-bar'] },
  'media-tester': { types: ['game-details'], elements: ['list', 'artwork-panel', 'hint-bar', 'status-bar'] },
  'boot-splash': { types: ['boot', 'loading'], elements: ['logo', 'progress-bar'] },
  'game-launch': { types: ['loading'], elements: ['artwork-panel'] },
}

export const PSX_MANIFEST: readonly ScreenManifestEntry[] = PSX_DEVICE_SLUGS.flatMap((device) => [
  {
    theme: 'playstation-x' as const,
    device,
    screen: 'interactive',
    title: 'Interactive',
    interactive: true,
    ...LIVE_TAGS,
  },
  ...PSX_SCREENS.map((screen) => ({
    theme: 'playstation-x' as const,
    device,
    screen: screen.slug,
    title: screen.title,
    interactive: false,
    ...PSX_TAGS[screen.slug]!,
  })),
])
