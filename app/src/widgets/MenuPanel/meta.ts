import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'MenuPanel',
  summary: 'A modal settings menu over a dimmed screen, with grouped rows, toggles and values.',
  usedBy: ['elementerial', 'vitrolauncher'],
  webOnly: ['maskImage'],
  fallback:
    'Row icons are masked so they take the row colour and invert on selection. Without masking they render as plain images in their own colour, which loses the inversion but keeps the row readable.',
}
