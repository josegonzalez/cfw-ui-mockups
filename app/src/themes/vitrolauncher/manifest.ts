import type { DeviceSlug } from '../../device/devices'
import type { ScreenManifestEntry } from '../manifest'
import type { VitroScreen } from './views/Chrome'
import type { VitroSettings } from './library'
import { LIVE_TAGS, type ScreenTags } from '../taxonomy'

/** The two devices the launcher targets. Both are 480 tall, so its `s = h / 480` scale is 1. */
export const VITRO_DEVICES: readonly DeviceSlug[] = ['rg35xx', 'rg34xx']

/**
 * The static screens.
 *
 * The three the launcher has, plus three that pose a state the live build only passes through -
 * the two solid-chrome variants and the exit banner. Those exist because a transition nobody can
 * pause is a transition nobody can hand off, and `Transparency = off` is a real setting whose
 * look is otherwise only reachable by changing it and taking a photograph.
 */
export interface VitroScreenDef {
  readonly slug: string
  readonly title: string
  readonly screen: VitroScreen
  readonly settings?: Partial<VitroSettings>
  readonly battery?: number
  readonly charging?: boolean
  readonly exitProgress?: number
  readonly loading?: number
}

/**
 * Tags by underlying screen: the palette, background, transparency and battery variants are the
 * same screen, so they carry its tags. The nav pill is `tabs` and the status pill `status-bar` on
 * all three. Last Played is the recents carousel; its covers are the items, so no artwork panel.
 */
export const VITRO_TAGS: Record<VitroScreen, ScreenTags> = {
  recent: {
    types: ['collection', 'game-list'],
    elements: ['carousel', 'tabs', 'status-bar'],
  },
  all: { types: ['game-list'], elements: ['grid', 'tabs', 'status-bar'] },
  settings: { types: ['settings'], elements: ['list', 'tabs', 'status-bar'] },
}

/** The exit banner is the one posed state that draws something its screen does not. */
function tagsFor(s: VitroScreenDef): ScreenTags {
  const base = VITRO_TAGS[s.screen]
  return s.exitProgress === undefined
    ? base
    : { ...base, elements: [...base.elements, 'progress-bar'] }
}

export const VITRO_SCREENS: readonly VitroScreenDef[] = [
  { slug: 'last-played', title: 'Last Played', screen: 'recent' },
  { slug: 'all-titles', title: 'All Titles', screen: 'all' },
  { slug: 'settings', title: 'Settings', screen: 'settings' },
  {
    slug: 'particles',
    title: 'Particles background',
    screen: 'recent',
    settings: { theme: 'particles', color: 2 },
  },
  {
    slug: 'clouds',
    title: 'Clouds background',
    screen: 'all',
    settings: { theme: 'clouds', color: 4 },
  },
  {
    slug: 'simple-light',
    title: 'Simple Light',
    screen: 'settings',
    settings: { theme: 'simple-light', color: 10 },
  },
  {
    slug: 'no-transparency',
    title: 'Transparency off',
    screen: 'recent',
    settings: { transparency: false },
  },
  { slug: 'low-battery', title: 'Low battery', screen: 'all', battery: 12 },
  { slug: 'exit-combo', title: 'Exit to muOS', screen: 'recent', exitProgress: 0.62 },
]

export const VITRO_MANIFEST: readonly ScreenManifestEntry[] = VITRO_DEVICES.flatMap((device) => [
  {
    theme: 'vitrolauncher' as const,
    device,
    screen: 'interactive',
    title: 'Interactive',
    interactive: true,
    ...LIVE_TAGS,
  },
  ...VITRO_SCREENS.map((s) => ({
    theme: 'vitrolauncher' as const,
    device,
    screen: s.slug,
    title: s.title,
    interactive: false,
    ...tagsFor(s),
  })),
])
