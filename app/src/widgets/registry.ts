import type { WidgetMeta } from './types'

import { meta as anchoredImage } from './AnchoredImage/meta'
import { meta as badge } from './Badge/meta'
import { meta as carousel } from './Carousel/meta'
import { meta as clock } from './Clock/meta'
import { meta as fullScreenFade } from './FullScreenFade/meta'
import { meta as generatedArt } from './GeneratedArt/meta'
import { meta as glassPanel } from './GlassPanel/meta'
import { meta as headerBar } from './HeaderBar/meta'
import { meta as helpBar } from './HelpBar/meta'
import { meta as iconRow } from './IconRow/meta'
import { meta as listRow } from './ListRow/meta'
import { meta as menuPanel } from './MenuPanel/meta'
import { meta as progressBar } from './ProgressBar/meta'
import { meta as scrim } from './Scrim/meta'
import { meta as starRating } from './StarRating/meta'
import { meta as statusIndicators } from './StatusIndicators/meta'
import { meta as textList } from './TextList/meta'
import { meta as ticker } from './Ticker/meta'
import { meta as tileGrid } from './TileGrid/meta'

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
  anchoredImage,
  badge,
  carousel,
  clock,
  fullScreenFade,
  generatedArt,
  glassPanel,
  headerBar,
  helpBar,
  iconRow,
  listRow,
  menuPanel,
  progressBar,
  scrim,
  starRating,
  statusIndicators,
  textList,
  ticker,
  tileGrid,
]

export const WIDGET_NAMES: readonly string[] = WIDGETS.map((w) => w.name)

export function widgetMeta(name: string): WidgetMeta | undefined {
  return WIDGETS.find((w) => w.name === name)
}
