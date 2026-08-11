import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { VitroLauncher } from '.'
import { VitroLauncherInteractive } from './Interactive'
import { VITRO_MANIFEST, VITRO_SCREENS } from './manifest'

const BY_SLUG = new Map(VITRO_SCREENS.map((s) => [s.slug, s]))

/**
 * Mount each manifest entry.
 *
 * A static entry is the same component with `animate={false}`, which for this theme means the
 * background renders exactly one frame at t=0 rather than pausing a running loop at an arbitrary
 * moment. That is what makes a capture of an animated background reproducible at all.
 */
export function vitroRoutes(): ScreenRoute[] {
  return VITRO_MANIFEST.map((entry) => {
    if (entry.interactive) {
      return { ...entry, render: () => <VitroLauncherInteractive device={entry.device} /> }
    }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`Vitro screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          <VitroLauncher
            screen={screen.screen}
            settings={screen.settings}
            battery={screen.battery ?? 85}
            charging={screen.charging ?? false}
            exitProgress={screen.exitProgress ?? null}
            loading={screen.loading ?? 0}
          />
        </DeviceFrame>
      ),
    }
  })
}
