import type { ScreenRoute } from '../routes'
import { elementerialRoutes } from './elementerial/routes'
import { exampleRoutes } from './example-cfw/routes'
import { dsStyleRoutes } from './ds-style/routes'
import { neostationRoutes } from './neostation/routes'
import { nextuiRoutes } from './nextui/routes'
import { playstationXRoutes } from './playstation-x/routes'
import { simpleosRoutes } from './simpleos/routes'
import { tortosRoutes } from './tortos/routes'
import { slotRoutes } from './slot/routes'
import { vitroRoutes } from './vitrolauncher/routes'

/**
 * Every screen in the application.
 *
 * One entry per theme; each theme contributes its own routes.
 */
export const ROUTES: readonly ScreenRoute[] = [
  ...elementerialRoutes(),
  ...playstationXRoutes(),
  ...vitroRoutes(),
  ...nextuiRoutes(),
  ...slotRoutes(),
  ...simpleosRoutes(),
  ...tortosRoutes(),
  ...neostationRoutes(),
  ...dsStyleRoutes(),
  ...exampleRoutes(),
]
