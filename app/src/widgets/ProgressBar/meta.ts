import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'ProgressBar',
  summary: 'A determinate progress bar, clamped so a stray value cannot overflow its track.',
  usedBy: ['playstation-x', 'vitrolauncher'],
}
