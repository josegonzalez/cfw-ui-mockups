import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { Elementerial } from '.'
import { ElementerialInteractive } from './Interactive'
import { ELEMENTERIAL_MANIFEST, ELEMENTERIAL_SCREENS } from './manifest'

const BY_SLUG = new Map(ELEMENTERIAL_SCREENS.map((screen) => [screen.slug, screen]))

/**
 * Mount each manifest entry.
 *
 * A static entry is the same component the interactive entry mounts, with motion settled to its
 * resting values rather than played. That is the invariant the whole snapshot mechanism rests
 * on: there is no second implementation that could drift.
 */
export function elementerialRoutes(): ScreenRoute[] {
  return ELEMENTERIAL_MANIFEST.map((entry) => {
    if (entry.interactive) {
      return { ...entry, render: () => <ElementerialInteractive device={entry.device} /> }
    }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`Elementerial screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          <Elementerial
            view={screen.view}
            scheme={screen.scheme}
            style={screen.style}
            system={screen.system}
          />
        </DeviceFrame>
      ),
    }
  })
}
