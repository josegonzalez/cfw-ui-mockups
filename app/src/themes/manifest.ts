import type { DeviceSlug } from '../device/devices'
import type { ThemeSlug } from '../widgets/types'
import { EXAMPLE_MANIFEST } from './example-cfw/manifest'

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

export const SCREEN_MANIFEST: readonly ScreenManifestEntry[] = [...EXAMPLE_MANIFEST]

/** Stable URL fragment for a screen. */
export function screenId(entry: Pick<ScreenManifestEntry, 'theme' | 'device' | 'screen'>): string {
  return `${entry.theme}/${entry.device}/${entry.screen}`
}
