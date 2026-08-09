import type { ReactNode } from 'react'
import type { ScreenManifestEntry } from './themes/manifest'

export { screenId as routeId } from './themes/manifest'

/**
 * A screen the application can mount.
 *
 * The gallery enumerates from these rather than from hand-written links. The old gallery listed
 * 58 of 94 screens, leaving 36 unreachable, because every link was maintained by hand and
 * nothing noticed when a screen was added. Deriving the list makes that failure impossible
 * rather than merely unlikely.
 */
export interface ScreenRoute extends ScreenManifestEntry {
  readonly render: () => ReactNode
}

export function findRoute(routes: readonly ScreenRoute[], id: string): ScreenRoute | undefined {
  return routes.find((route) => `${route.theme}/${route.device}/${route.screen}` === id)
}
