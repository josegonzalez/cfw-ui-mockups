/**
 * PORTING NOTES
 * CFW: spruceOS (PyUI)   Devices: miyoo-a30 miyoo-flip miyoo-mini miyoo-mini-v4 trimui-brick trimui-smart-pro rg35xx rg40xx rg34xx rg28xx rg-cubexx miniloong-pocket1
 * Source: spruceUI/spruceOS `App/PyUI/main-ui/views/carousel_view.py`
 * Mode: reproduce
 *
 * Layout:        A game list in CAROUSEL view: an odd number of slots, at least three, the middle
 *                one 50% of the width and the rest sharing the remainder, each less 10px a side. Every
 *                picture fitted into its slot's width and the usable height, centred on the usable
 *                area. Too few games are repeated until there are more than two slots' worth.
 * Focus & selection: the middle slot is the focus; the focused game's name titles the top bar,
 *                whose clock and icons hide.
 * Buttons:       LEFT/RIGHT move and wrap; A, X, MENU, SELECT and B as the other game views.
 * Transitions:   each slot slides to its neighbour's place and size over `10 // speed` frames,
 *                linearly. PyUI draws those frames as fast as it can with no pacing; the port gives
 *                them 60 a second, which is 167ms at speed 1.
 * Notes:         the index counts the games, not the repeated slots.
 */
import { useMemo } from 'react'
import { Animated } from '../../../anim/Animated'
import type { StoryboardMap } from '../../../anim/types'

/** No motion: the picture where it rests. */
const STILL: StoryboardMap = {}
import { boxArt } from '../assets'
import { anchor, fit } from '../layout'
import { gameList, gameText, type Screen } from '../machine'
import { isAlphabetized } from '../text'
import { IndexText, Page, boxStyle, useSpruce } from './parts'

/** `get_width_percentages` with neither shrinking nor overhang: the remainder shared evenly. */
function slotWidths(cols: number, primary: number, w: number): number[] {
  const k = Math.floor(cols / 2)
  const side = Math.floor((100 - primary) / (cols - 1))
  const pct = [...Array<number>(k).fill(side), primary, ...Array<number>(k).fill(side)]
  const extra = (100 - pct.reduce((a, b) => a + b, 0)) / pct.length
  return pct.map((p) => Math.round(((p + extra) / 100) * w))
}

export function carouselSlots(cols: number, primary: number, w: number) {
  const widths = slotWidths(cols, primary, w)
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0))
  return { centres: starts.map((x, i) => x + Math.floor(widths[i]! / 2)), widths: widths.map((x) => x - 20) }
}

export function Carousel({ screen }: { screen: Extract<Screen, { kind: 'games' }> }) {
  const { state, geo, animate } = useSpruce()
  const { games, named } = gameList(state, screen.source)
  const texts = games.map((g) => gameText(g, named))
  // The options repeat until there are more than twice the columns (`carousel_view.py:73-74`).
  let n = games.length
  while (n && n <= geo.carousel.cols * 2) n *= 2
  let cols = Math.min(Math.max(3, geo.carousel.cols), n)
  if (cols % 2 === 0) cols += 1
  cols = Math.min(cols, n)
  const { centres, widths } = carouselSlots(cols, geo.carousel.primaryPercent, geo.w)
  const half = Math.floor(cols / 2)
  const sel = screen.grid.sel
  const centreY = Math.floor(geo.usableH / 2) + geo.topH
  const frames = Math.floor(10 / state.animationSpeed)
  const duration = animate && state.animations && frames > 1 ? Math.round((frames * 1000) / 60) : 0
  // Memoised per move: a new storyboard object restarts its animation on every re-render.
  const boards = useMemo(
    () =>
      centres.map((_, v) =>
        duration && screen.dir ? slide(centres, widths, v, screen.dir, geo.w, duration) : undefined,
      ),
    // `sel` is here so each move gets fresh boards, and with them a fresh run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cols, duration, screen.dir, sel, geo.w],
  )
  return (
    <Page title={games[sel] ? texts[sel]! : ''} hideIcons>
      {Array.from({ length: cols }, (_, v) => {
        const i = (((sel - half + v) % games.length) + games.length) % games.length
        const game = games[i]!
        const size = fit([250, 250], widths[v]!, geo.usableH)
        const b = anchor(centres[v]!, centreY, size, 'MIDDLE_CENTER')
        return (
          <Animated
            key={`${sel}:${v}`}
            storyboard={boards[v] ?? STILL}
            event="open"
            style={{ ...boxStyle(b), zIndex: v === half ? 1 : 0 }}
          >
            <img
              alt=""
              src={boxArt(game.system, game.name)}
              draggable={false}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </Animated>
        )
      })}
      <IndexText
        index={(sel % games.length) + 1}
        total={games.length}
        letter={isAlphabetized(texts) ? (texts[sel]?.[0] ?? '') : ''}
      />
    </Page>
  )
}

/**
 * Where a slot's picture came from: the neighbouring slot's place and size, on the side the focus
 * moved toward. The picture entering at the edge comes from one slot's pitch beyond it.
 */
function slide(
  centres: readonly number[],
  widths: readonly number[],
  v: number,
  dir: number,
  w: number,
  duration: number,
): StoryboardMap {
  const from = v + dir
  const inside = from >= 0 && from < centres.length
  const pitch = centres[1]! - centres[0]!
  const dx = inside ? centres[from]! - centres[v]! : dir * pitch
  const scale = inside ? widths[from]! / widths[v]! : 1
  return {
    open: {
      animations: [
        { property: 'offsetX', from: dx / w, to: 0, duration, mode: 'linear' },
        { property: 'scale', from: scale, to: 1, duration, mode: 'linear' },
      ],
    },
  }
}
