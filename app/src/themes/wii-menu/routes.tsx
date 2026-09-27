import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { WiiMenu } from '.'
import { WiiMenuInteractive } from './Interactive'
import { WII_MENU_MANIFEST, WII_MENU_SCREENS } from './manifest'

const BY_SLUG = new Map(WII_MENU_SCREENS.map((s) => [s.slug, s]))

/** Mount each manifest entry. A still is the live build with `animate={false}` and no input. */
export function wiiMenuRoutes(): ScreenRoute[] {
  return WII_MENU_MANIFEST.map((entry) => {
    if (entry.interactive) return { ...entry, render: () => <WiiMenuInteractive device={entry.device} /> }
    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`Wii Menu screen not in the table: ${entry.screen}`)
    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/* Keyed by slug: the props only seed state, so two stills must not share one. */}
          <WiiMenu key={screen.slug} {...screen.seed} />
        </DeviceFrame>
      ),
    }
  })
}
