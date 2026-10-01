import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { SimpleOs } from '.'
import { SimpleOsInteractive } from './Interactive'
import { SIMPLEOS_MANIFEST, SIMPLEOS_SCREENS } from './manifest'

const BY_SLUG = new Map<string, (typeof SIMPLEOS_SCREENS)[number]>(SIMPLEOS_SCREENS.map((s) => [s.slug, s]))

/**
 * Mount each manifest entry.
 *
 * A still is the same component with `animate={false}` and no input. SimpleOS has no motion, so the
 * only thing that makes a still a still here is that it is posed and cannot be driven.
 */
export function simpleosRoutes(): ScreenRoute[] {
  return SIMPLEOS_MANIFEST.map((entry) => {
    if (entry.interactive) {
      return { ...entry, render: () => <SimpleOsInteractive device={entry.device} /> }
    }

    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`SimpleOS screen not in the table: ${entry.screen}`)

    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/*
            Keyed by slug: the props only seed state, so moving between two stills without a remount
            would keep the first one's state and draw it under the second one's name.
          */}
          <SimpleOs
            key={screen.slug}
            view={screen.view}
            home={screen.home}
            cursor={screen.cursor}
            running={screen.running}
            menuTitle={screen.menuTitle}
            osd={screen.osd}
            binding={screen.binding}
            clockField={screen.clockField}
            toast={screen.toast}
            archived={screen.archived}
          />
        </DeviceFrame>
      ),
    }
  })
}
