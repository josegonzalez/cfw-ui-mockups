import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { Slot } from '.'
import { SlotInteractive } from './Interactive'
import { SLOT_MANIFEST, SLOT_SCREENS } from './manifest'

const BY_SLUG = new Map(SLOT_SCREENS.map((s) => [s.slug, s]))

/**
 * Mount each manifest entry.
 *
 * A static is the same component with `animate={false}`, which for this set means the shelf spring
 * is held at its resting value rather than integrated. That is the only thing motion-off changes:
 * the insert stills are posed by their `seat`, which is a prop rather than a clock.
 */
export function slotRoutes(): ScreenRoute[] {
  return SLOT_MANIFEST.map((entry) => {
    if (entry.interactive) {
      return { ...entry, render: () => <SlotInteractive device={entry.device} /> }
    }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`slot screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          <Slot
            view={screen.view}
            selected={screen.selected ?? 0}
            seat={screen.seat}
            hud={screen.hud ?? null}
            hudValue={screen.hudValue ?? 0.6}
            switcherSlot={screen.switcherSlot ?? 0}
            clockField={screen.clockField ?? 0}
            wallpaper={screen.wallpaper ?? false}
          />
        </DeviceFrame>
      ),
    }
  })
}
