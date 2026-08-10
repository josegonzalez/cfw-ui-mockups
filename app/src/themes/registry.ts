import type { ScreenRoute } from '../routes'
import { elementerialRoutes } from './elementerial/routes'
import { exampleRoutes } from './example-cfw/routes'
import { playstationXRoutes } from './playstation-x/routes'

/**
 * Every screen in the application.
 *
 * One entry per theme; each theme contributes its own routes. The phase still to come appends
 * Vitro Launcher here.
 */
export const ROUTES: readonly ScreenRoute[] = [
  ...elementerialRoutes(),
  ...playstationXRoutes(),
  ...exampleRoutes(),
]
