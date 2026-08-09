import { DeviceFrame } from '../../device/DeviceFrame'
import type { ScreenRoute } from '../../routes'
import { ExampleOs } from '.'
import { EXAMPLE_MANIFEST, type ExampleView } from './manifest'

/** Mount each manifest entry. Static entries are the live build with motion settled. */
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
