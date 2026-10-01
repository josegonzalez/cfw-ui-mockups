import { createContext, use, useMemo, type ReactNode } from 'react'
import type { RenderMode } from '../render/RenderModeProvider'

/**
 * Per-view overrides supplied by the URL rather than by a route.
 *
 * Two of the e2e gates need to pose a screen in a way its route does not: the fallback baselines
 * need every screen in `fallback` mode, and the settle invariant needs the *interactive* build
 * with motion off so it can be compared against the static one.
 *
 * These are defaults, not commands - an explicit prop on `DeviceFrame` still wins. That ordering
 * is what makes the settle invariant meaningful: a static route passes `animate={false}` itself
 * and is unaffected, while an interactive route passes nothing and takes the override. If this
 * forced the value instead, the test would be comparing a screen against itself.
 */
export interface ViewOverrides {
  readonly animate?: boolean | undefined
  readonly renderMode?: RenderMode | undefined
  /** `false` mutes a live build. */
  readonly sound?: boolean | undefined
  /**
   * Drops the bezel. Set by the views page, which lines up a dozen sets' screens as tiles and
   * would otherwise be comparing a dozen device bodies. Never read from the URL.
   */
  readonly bare?: boolean | undefined
}

const ViewOverridesContext = createContext<ViewOverrides>({})

export function ViewOverridesProvider({
  overrides,
  children,
}: {
  overrides: ViewOverrides
  children: ReactNode
}) {
  const value = useMemo(() => overrides, [overrides])
  return <ViewOverridesContext value={value}>{children}</ViewOverridesContext>
}

export function useViewOverrides(): ViewOverrides {
  return use(ViewOverridesContext)
}

/**
 * Read the overrides out of a query string.
 *
 * `?still=1` disables motion; `?mode=fallback` selects the degraded renderer; `?sound=off` mutes
 * a live build. All are mockup harness controls with no counterpart in any firmware, which is why
 * they are query parameters rather than anything a theme can see.
 */
export function parseViewOverrides(search: string): ViewOverrides {
  const params = new URLSearchParams(search)
  const out: ViewOverrides = {}
  const still = params.get('still')
  const mode = params.get('mode')
  const sound = params.get('sound')
  return {
    ...out,
    ...(still === '1' || still === 'true' ? { animate: false } : {}),
    ...(mode === 'fallback' || mode === 'web' ? { renderMode: mode } : {}),
    ...(sound === 'off' || sound === '0' ? { sound: false } : {}),
  }
}
