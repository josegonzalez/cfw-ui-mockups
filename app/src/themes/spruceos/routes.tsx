import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { SpruceOS } from '.'
import { SpruceOSInteractive } from './Interactive'
import { SPRUCEOS_MANIFEST, SPRUCEOS_SCREENS, seedFor } from './manifest'

const BY_SLUG = new Map(SPRUCEOS_SCREENS.map((s) => [s.slug, s]))

/** Mount each manifest entry. A still is the live build with `animate={false}` and no input. */
export function spruceosRoutes(): ScreenRoute[] {
  return SPRUCEOS_MANIFEST.map((entry) => {
    if (entry.interactive) return { ...entry, render: () => <SpruceOSInteractive device={entry.device} /> }
    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`spruceOS screen not in the table: ${entry.screen}`)
    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/* Keyed by slug: the props only seed state, so two stills must not share one. */}
          <SpruceOS key={screen.slug} device={entry.device} {...seedFor(screen, entry.device)} />
        </DeviceFrame>
      ),
    }
  })
}
