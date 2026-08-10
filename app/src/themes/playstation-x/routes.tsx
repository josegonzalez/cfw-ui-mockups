import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { PlayStationX } from '.'
import { PlayStationXInteractive } from './Interactive'
import { PSX_MANIFEST, PSX_SCREENS } from './manifest'

const BY_SLUG = new Map(PSX_SCREENS.map((screen) => [screen.slug, screen]))

/**
 * Mount each manifest entry.
 *
 * A static entry is the same component the interactive entry mounts, with motion settled to its
 * resting values rather than played. This theme is the strongest case for that invariant: 385
 * animation tracks across 22 storyboards means a hand-drawn static screen would have been wrong
 * somewhere, and nothing would have caught it.
 */
export function playstationXRoutes(): ScreenRoute[] {
  return PSX_MANIFEST.map((entry) => {
    if (entry.interactive) {
      return { ...entry, render: () => <PlayStationXInteractive device={entry.device} /> }
    }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`PlayStation X screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          <PlayStationX view={screen.view} />
        </DeviceFrame>
      ),
    }
  })
}
