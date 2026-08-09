import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'Clock',
  summary: 'The status-bar clock. Ticks only when the screen is live; static screens pin a fixed time.',
  usedBy: ['example-cfw', 'elementerial', 'playstation-x', 'vitrolauncher'],
}
