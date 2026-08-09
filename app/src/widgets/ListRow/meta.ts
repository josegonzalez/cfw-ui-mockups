import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'ListRow',
  summary: 'One row of a selectable list: label, optional subtitle and icon tile.',
  usedBy: ['example-cfw', 'elementerial', 'playstation-x', 'vitrolauncher'],
  webOnly: ['cssEllipsis'],
  fallback:
    'Truncation is declared by the `overflow` prop rather than left to the layout engine, so a renderer that measures text itself has the rule. `clip` needs no measurement at all.',
}
