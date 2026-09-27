import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { DsStyle } from '.'
import { DsStyleInteractive } from './Interactive'
import { DS_STYLE_MANIFEST, DS_STYLE_SCREENS } from './manifest'

const BY_SLUG = new Map(DS_STYLE_SCREENS.map((s) => [s.slug, s]))

/** Mount each manifest entry. A still is the live build with `animate={false}` and no input. */
export function dsStyleRoutes(): ScreenRoute[] {
  return DS_STYLE_MANIFEST.map((entry) => {
    if (entry.interactive) return { ...entry, render: () => <DsStyleInteractive device={entry.device} /> }
    const screen = BY_SLUG.get(entry.screen)
    if (!screen) throw new Error(`DS Style screen not in the table: ${entry.screen}`)
    return {
      ...entry,
      render: () => (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          {/* Keyed by slug: the props only seed state, so two stills must not share one. */}
          <DsStyle key={screen.slug} {...screen.seed} />
        </DeviceFrame>
      ),
    }
  })
}
