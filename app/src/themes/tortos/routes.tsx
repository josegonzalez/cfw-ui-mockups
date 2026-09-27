import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { Tortos } from '.'
import { TortosInteractive } from './Interactive'
import { TORTOS_MANIFEST, TORTOS_SCREENS } from './manifest'

const BY_SLUG = new Map(TORTOS_SCREENS.map((s) => [s.slug, s]))

/**
 * Mount each manifest entry.
 *
 * A still is the live build with `animate={false}` and no input: every shelf drawn at its cursor,
 * the tint at the focused system's colour, and every marquee at its start.
 */
export function tortosRoutes(): ScreenRoute[] {
  return TORTOS_MANIFEST.map((entry) => {
    if (entry.interactive) return { ...entry, render: () => <TortosInteractive device={entry.device} /> }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`TortOS screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/* Keyed by slug: the props only seed state, so two stills must not share one. */}
          <Tortos key={screen.slug} {...screen.seed} />
        </DeviceFrame>
      ),
    }
  })
}
