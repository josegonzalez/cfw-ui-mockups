import type { ScreenRoute } from '../routes'
import { elementerialRoutes } from './elementerial/routes'
import { exampleRoutes } from './example-cfw/routes'

/**
 * Every screen in the application.
 *
 * One entry per theme; each theme contributes its own routes. Phases still to come append
 * PlayStation X and Vitro Launcher here.
 */
export const ROUTES: readonly ScreenRoute[] = [...elementerialRoutes(), ...exampleRoutes()]
