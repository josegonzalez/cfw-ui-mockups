import type { DeviceSlug } from '../device/devices'
import type { ThemeSlug } from '../widgets/types'
import { ELEMENTERIAL_MANIFEST } from './elementerial/manifest'
import { EXAMPLE_MANIFEST } from './example-cfw/manifest'
import { DS_STYLE_MANIFEST } from './ds-style/manifest'
import { NEOSTATION_MANIFEST } from './neostation/manifest'
import { NEXTUI_MANIFEST } from './nextui/manifest'
import { PSX_MANIFEST } from './playstation-x/manifest'
import { SIMPLEOS_MANIFEST } from './simpleos/manifest'
import { TORTOS_MANIFEST } from './tortos/manifest'
import { SLOT_MANIFEST } from './slot/manifest'
import { VITRO_MANIFEST } from './vitrolauncher/manifest'
import { WII_MENU_MANIFEST } from './wii-menu/manifest'

/**
 * What screens exist, as plain data.
 *
 * Deliberately free of React and CSS imports, so tooling that only needs the list of screens -
 * the Playwright suite, a future index generator - can read it without pulling in the
 * application. The renderers live in `registry.ts` alongside the components they mount.
 */
export interface ScreenManifestEntry {
  readonly theme: ThemeSlug
  readonly device: DeviceSlug
  /** Screen slug, unique within a theme. */
  readonly screen: string
  readonly title: string
  /** The theme's live, navigable build rather than a static snapshot. */
  readonly interactive: boolean
}

export const SCREEN_MANIFEST: readonly ScreenManifestEntry[] = [
  ...ELEMENTERIAL_MANIFEST,
  ...PSX_MANIFEST,
  ...VITRO_MANIFEST,
  ...NEXTUI_MANIFEST,
  ...SLOT_MANIFEST,
  ...SIMPLEOS_MANIFEST,
  ...TORTOS_MANIFEST,
  ...NEOSTATION_MANIFEST,
  ...DS_STYLE_MANIFEST,
  ...WII_MENU_MANIFEST,
  ...EXAMPLE_MANIFEST,
]

/** Stable URL fragment for a screen. */
export function screenId(entry: Pick<ScreenManifestEntry, 'theme' | 'device' | 'screen'>): string {
  return `${entry.theme}/${entry.device}/${entry.screen}`
}
