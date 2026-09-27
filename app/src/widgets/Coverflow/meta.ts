import type { WidgetMeta } from '../types'

export const meta: WidgetMeta = {
  name: 'Coverflow',
  summary: 'A row of cards where the centre one faces you and its neighbours turn away, each reflected onto one floor.',
  usedBy: ['tortos'],
  webOnly: ['transform3d', 'maskImage'],
  fallback:
    'Flat cards, still scaled and faded by distance but not turned, and no reflections - the layouts with no tilt already look like this, so the row stays readable as the same design.',
}
