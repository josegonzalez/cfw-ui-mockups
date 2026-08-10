import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'Scrim',
  summary: 'A tint over the screen, softened by a mask or composited from an overlay image.',
  usedBy: ['elementerial', 'playstation-x', 'vitrolauncher'],
  webOnly: ['maskImage'],
  fallback:
    'Without arbitrary image masking the tint is drawn as a soft gradient in the same colour. It fails toward slightly wrong shading rather than toward a solid sheet over the content, which is the failure that actually happened here once.',
}
