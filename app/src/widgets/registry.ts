import type { WidgetMeta } from './types'

import { meta as clock } from './Clock/meta'
import { meta as generatedArt } from './GeneratedArt/meta'
import { meta as headerBar } from './HeaderBar/meta'
import { meta as helpBar } from './HelpBar/meta'
import { meta as listRow } from './ListRow/meta'
import { meta as statusIndicators } from './StatusIndicators/meta'
import { meta as textList } from './TextList/meta'

/**
 * The widget vocabulary.
 *
 * Adding a widget means adding it here, writing `docs/widgets/<name>.md`, and writing a story.
 * `registry.test.ts` asserts all three exist, which is what keeps the catalogue from drifting
 * away from the code it documents.
 *
 * This list is also the eventual handoff: it is the set a second renderer would have to
 * implement.
 */
export const WIDGETS: readonly WidgetMeta[] = [
  clock,
  generatedArt,
  headerBar,
  helpBar,
  listRow,
  statusIndicators,
  textList,
]

export const WIDGET_NAMES: readonly string[] = WIDGETS.map((w) => w.name)

export function widgetMeta(name: string): WidgetMeta | undefined {
  return WIDGETS.find((w) => w.name === name)
}
