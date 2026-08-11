import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'GlassPanel',
  summary:
    'A frosted stadium that samples the moving background beneath it, used for every piece of Vitro chrome.',
  usedBy: ['vitrolauncher'],
  webOnly: ['backdropBlur'],
  fallback:
    'A flat gray gradient with a hairline outline - the same look the launcher itself ships for its Transparency = off setting, so the degraded variant is authored upstream rather than invented.',
}
