import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { ExampleOs } from '.'
import { EXAMPLE_MANIFEST, type ExampleView } from './manifest'

/**
 * Mount each manifest entry. A static entry is the live build with motion settled.
 *
 * The live build is inline here rather than in an `Interactive.tsx`, because this theme has no
 * mockup-only subsets to expose. The other three do - fourteen colour schemes, eleven views, five
 * backgrounds - and each keeps that state in its own `Interactive.tsx` so the theme's props stay
 * the same set a static screen passes. Reach for that file when there is something to switch;
 * until then it is a layer with nothing in it.
 */
export function exampleRoutes(): ScreenRoute[] {
  return EXAMPLE_MANIFEST.map((entry) => ({
    ...entry,
    render: () =>
      entry.interactive ? (
        <DeviceFrame device={entry.device}>
          <ExampleOs />
        </DeviceFrame>
      ) : (
        <DeviceFrame device={entry.device} animate={false} interactive={false}>
          <ExampleOs view={entry.screen as ExampleView} />
        </DeviceFrame>
      ),
  }))
}
