import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { NextUi } from '.'
import { NextUiInteractive } from './Interactive'
import { NEXTUI_MANIFEST, NEXTUI_SCREENS } from './manifest'

const BY_SLUG = new Map(NEXTUI_SCREENS.map((s) => [s.slug, s]))

/**
 * Mount each manifest entry.
 *
 * A static is the same component with `animate={false}`, which here settles exactly one thing:
 * a marquee renders at its resting offset rather than wherever the scroll happened to be. That
 * is the whole difference between a static and the live build, because the marquee is the only
 * animation the theme has.
 */
export function nextuiRoutes(): ScreenRoute[] {
  return NEXTUI_MANIFEST.map((entry) => {
    if (entry.interactive) {
      return { ...entry, render: () => <NextUiInteractive device={entry.device} /> }
    }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`NextUI screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          <NextUi
            view={screen.view}
            palette={screen.palette ?? 'Default'}
            titlePill={screen.titlePill ?? false}
            selected={screen.selected ?? 0}
          />
        </DeviceFrame>
      ),
    }
  })
}
