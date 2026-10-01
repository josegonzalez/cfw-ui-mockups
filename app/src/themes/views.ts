import { SCREEN_MANIFEST, type ScreenManifestEntry } from './manifest'
import { SCREEN_TYPES, UI_ELEMENTS, type Facet, type ScreenType, type UiElement } from './taxonomy'

/**
 * Lining the same view up across sets.
 *
 * Plain functions over the manifest and the taxonomy, with no React, so the views page, the
 * viewer bar and the Playwright suite all ask the same question the same way.
 */

export const VIEWS_PREFIX = 'views'

/** Where the views page is pointed: the index, or one facet term. */
export type ViewsTarget =
  | { readonly facet: null }
  | { readonly facet: 'type'; readonly slug: ScreenType }
  | { readonly facet: 'element'; readonly slug: UiElement }

function isScreenType(slug: string): slug is ScreenType {
  return Object.hasOwn(SCREEN_TYPES, slug)
}

function isUiElement(slug: string): slug is UiElement {
  return Object.hasOwn(UI_ELEMENTS, slug)
}

/**
 * Read a views target out of a URL fragment, or `null` when the fragment is not the views page.
 *
 * An unknown term lands on the index rather than on the landing page: someone who typed
 * `#views/type/setings` wanted the views page, and the index is where the right spelling is.
 */
export function viewsTargetFromHash(hash: string): ViewsTarget | null {
  const parts = hash.split('/')
  if (parts[0] !== VIEWS_PREFIX) return null
  const [, facet, slug = ''] = parts
  if (facet === 'type' && isScreenType(slug)) return { facet, slug }
  if (facet === 'element' && isUiElement(slug)) return { facet, slug }
  return { facet: null }
}

export function viewsHref(facet?: Facet, slug?: string): string {
  return facet && slug ? `#${VIEWS_PREFIX}/${facet}/${slug}` : `#${VIEWS_PREFIX}`
}

function carries(entry: ScreenManifestEntry, facet: Facet, slug: string): boolean {
  return facet === 'type'
    ? (entry.types as readonly string[]).includes(slug)
    : (entry.elements as readonly string[]).includes(slug)
}

/**
 * Every screen carrying a term, once each.
 *
 * A screen on four devices is one screen drawn four times, and the comparison is between sets,
 * not panels - so each (theme, screen) appears once, on the first device its theme lists. The
 * device switcher in the viewer is one click away for the rest. Manifest order, so a theme's
 * screens stay together and in the order the theme lists them.
 */
export function screensFor(facet: Facet, slug: string): ScreenManifestEntry[] {
  const seen = new Set<string>()
  const out: ScreenManifestEntry[] = []

  for (const entry of SCREEN_MANIFEST) {
    if (entry.interactive || !carries(entry, facet, slug)) continue
    const key = `${entry.theme}/${entry.screen}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(entry)
  }

  return out
}

export interface FacetSummary {
  readonly sets: number
  readonly screens: number
  /** The sets that have this view, in manifest order. */
  readonly themes: readonly ScreenManifestEntry['theme'][]
}

export function facetSummary(facet: Facet, slug: string): FacetSummary {
  const screens = screensFor(facet, slug)
  const themes = [...new Set(screens.map((s) => s.theme))]
  return { sets: themes.length, screens: screens.length, themes }
}

/**
 * Which sets draw which screen type, and the screen that stands for each pairing.
 *
 * The landing page's matrix is this, one row per set and one column per type. Each cell is the
 * first screen `screensFor` lists for that set, so a cell opens the same screen the type's
 * comparison shows first for that set rather than a second opinion about which one is canonical.
 */
export function coverage(): ReadonlyMap<ScreenType, ReadonlyMap<string, ScreenManifestEntry>> {
  const out = new Map<ScreenType, Map<string, ScreenManifestEntry>>()

  for (const slug of Object.keys(SCREEN_TYPES) as ScreenType[]) {
    const byTheme = new Map<string, ScreenManifestEntry>()
    for (const entry of screensFor('type', slug)) {
      if (!byTheme.has(entry.theme)) byTheme.set(entry.theme, entry)
    }
    out.set(slug, byTheme)
  }

  return out
}

/**
 * The same view in every other set: the first screen each other theme has with this screen's
 * primary type.
 *
 * Only the primary type, because a settings screen that happens to draw a keyboard is not
 * "the same view" as a search screen. The same device where the other theme has it, so the jump
 * changes one thing rather than two.
 */
export function sameTypeElsewhere(route: ScreenManifestEntry): ScreenManifestEntry[] {
  const primary = route.types[0]
  if (route.interactive || !primary) return []

  const byTheme = new Map<string, ScreenManifestEntry>()
  for (const entry of SCREEN_MANIFEST) {
    if (entry.interactive || entry.theme === route.theme || entry.types[0] !== primary) continue

    const held = byTheme.get(entry.theme)
    if (!held) {
      byTheme.set(entry.theme, entry)
    } else if (
      held.screen === entry.screen &&
      held.device !== route.device &&
      entry.device === route.device
    ) {
      byTheme.set(entry.theme, entry)
    }
  }

  return [...byTheme.values()]
}
