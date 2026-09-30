import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { DreamcastBios } from '.'
import { DreamcastBiosInteractive } from './Interactive'
import { DREAMCAST_BIOS_MANIFEST, DREAMCAST_BIOS_SCREENS } from './manifest'

const BY_SLUG = new Map(DREAMCAST_BIOS_SCREENS.map((s) => [s.slug, s]))

/** Mount each manifest entry. A still is the live build with `animate={false}` and no input. */
export function dreamcastBiosRoutes(): ScreenRoute[] {
  return DREAMCAST_BIOS_MANIFEST.map((entry) => {
    if (entry.interactive) return { ...entry, render: () => <DreamcastBiosInteractive device={entry.device} /> }
    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`Dreamcast BIOS screen not in the table: ${entry.screen}`)
    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/* Keyed by slug: the props only seed state, so two stills must not share one. */}
          <DreamcastBios key={screen.slug} {...screen.seed} />
        </DeviceFrame>
      ),
    }
  })
}
