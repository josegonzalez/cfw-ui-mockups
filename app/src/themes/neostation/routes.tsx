import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { NeoStation } from '.'
import { NeoStationInteractive } from './Interactive'
import { NEOSTATION_MANIFEST, NEOSTATION_SCREENS } from './manifest'

const BY_SLUG = new Map(NEOSTATION_SCREENS.map((s) => [s.slug, s]))

/** Mount each manifest entry. A still is the live build with `animate={false}` and no input. */
export function neostationRoutes(): ScreenRoute[] {
  return NEOSTATION_MANIFEST.map((entry) => {
    if (entry.interactive)
      return {
        ...entry,
        render: () => <NeoStationInteractive device={entry.device} />,
      }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`NeoStation screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/* Keyed by slug: the props only seed state, so two stills must not share one. */}
          <NeoStation key={screen.slug} {...screen.seed} />
        </DeviceFrame>
      ),
    }
  })
}
