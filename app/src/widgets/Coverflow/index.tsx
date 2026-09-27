import type { ReactNode } from 'react'
import { useWebEffects } from '../../render/RenderModeProvider'

/**
 * One row's geometry, as fractions of the box it is laid out in.
 *
 * Field for field TortOS's `cf_layout`, which is the only source that has needed one so far; the
 * names are general because nothing in them is about TortOS. A flat row is a layout with no tilt,
 * a single card sliding in from off screen is one whose step puts its neighbours past the edge,
 * and a stack is a vertical one - the widget does not know any of those modes exist.
 */
export interface CoverflowLayout {
  /** Card height, as a fraction of the box height. */
  readonly size: number
  /** Card width over card height. */
  readonly aspect: number
  /** Centre-to-centre distance between neighbours, in card widths (card heights when vertical). */
  readonly step: number
  /** How small a card one step out is drawn, relative to the centre card. */
  readonly sideScale: number
  /** Where the centre card's centre sits, as a fraction of the box height. */
  readonly centerY: number
  /** Yaw of a card one step out, in radians. Zero is a flat row. */
  readonly tilt: number
  /** Where every reflection ends, in card half-heights below the card's centre. */
  readonly reflect: number
  /** Opacity of a card one step out, 0-255. */
  readonly sideAlpha: number
  /** Stack the row down the box instead of across it. */
  readonly vertical: boolean
  /** Give every card the frame's area in the art's own shape, rather than containing it. */
  readonly equalArea: boolean
  /** Give only art wider than `wideArt` this fraction of the frame's area. Zero never does. */
  readonly wideArea: number
  /** Clear air between art and its reflection, in card half-heights. */
  readonly reflectGap: number
}

export interface CoverflowItem {
  readonly key: string
  /** The art's own pixel size, which is what the fit reads. */
  readonly width: number
  readonly height: number
  /**
   * Where the art's opaque pixels stop, as a fraction of its height. The reflection starts here
   * rather than at the canvas edge, so art centred in transparent padding does not reflect its
   * padding. Defaults to 1.
   */
  readonly contentBottom?: number | undefined
}

export interface CoverflowProps<T extends CoverflowItem> {
  /** The area the layout's fractions are of. Usually the whole screen. */
  readonly box: { left: number; top: number; width: number; height: number }
  readonly layout: CoverflowLayout
  readonly items: readonly T[]
  /**
   * Which item is centred, as a continuous position. A fraction is a card mid-move; on a ring
   * the position may run past either end, and the widget wraps it.
   */
  readonly position: number
  /** How many cards either side of the centre are drawn. */
  readonly halfWindow?: number | undefined
  /** The aspect past which art counts as wide, for `wideArea`. */
  readonly wideArt?: number | undefined
  /**
   * The last move's direction. A ring of two has the other card one step out on *both* sides at
   * rest, and it is drawn behind the direction of travel - the one just passed.
   */
  readonly lastDir?: -1 | 0 | 1 | undefined
  /** Draws an item's art at the fitted size. Receives that size so nothing recomputes it. */
  readonly renderArt: (item: T, size: { width: number; height: number }) => ReactNode
  readonly z?: number | undefined
}

interface Slot<T> {
  readonly item: T
  readonly d: number
}

/**
 * Which items are on screen and how far each is from the centre, far to near.
 *
 * Exported for the test: the rules here - one slot per item on a ring however wide the window,
 * nearest copy wins, a tie on a ring of two goes behind the direction of travel - are the ones the
 * source learned by shipping them wrong.
 */
export function coverflowSlots<T>(
  items: readonly T[],
  position: number,
  halfWindow: number,
  lastDir: number,
): Slot<T>[] {
  const count = items.length
  if (count <= 0) return []
  const loops = count >= 2
  const half = Math.min(count - 1, halfWindow)
  const base = Math.floor(position + 0.5)
  const slots: { index: number; d: number }[] = []

  for (let k = -half; k <= half; k++) {
    const i = base + k
    const d = i - position
    if (Math.abs(d) > half + 0.5) continue
    let index = i
    if (loops) index = ((i % count) + count) % count
    else if (i < 0 || i >= count) continue

    const dup = slots.find((s) => s.index === index)
    if (dup) {
      const nearer = Math.abs(d) < Math.abs(dup.d)
      const tieBehind = Math.abs(d) === Math.abs(dup.d) && lastDir !== 0 && d < 0 === lastDir > 0
      if (nearer || tieBehind) dup.d = d
      continue
    }
    slots.push({ index, d })
  }

  return slots
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .map((s) => ({ item: items[s.index]!, d: s.d }))
}

/**
 * The art's drawn half-size inside a card frame of half-size `hw` x `hh`.
 *
 * Contain by default. Equal area keeps the frame's area and takes the art's shape, so a wide box
 * and a tall one read as the same size of thing rather than one being half the other.
 */
export function fitArt(
  layout: CoverflowLayout,
  art: { width: number; height: number },
  hw: number,
  hh: number,
  wideArt: number,
): { ahw: number; ahh: number } {
  if (art.width <= 0 || art.height <= 0) return { ahw: hw, ahh: hh }
  const ar = art.width / art.height
  if (layout.equalArea || (layout.wideArea > 0 && ar > wideArt)) {
    const area = hw * hh * (layout.equalArea ? 1 : layout.wideArea)
    return { ahw: Math.sqrt(area * ar), ahh: Math.sqrt(area / ar) }
  }
  return ar > hw / hh ? { ahw: hw, ahh: hw / ar } : { ahw: hh * ar, ahh: hh }
}

/**
 * A row of cards where the centre one faces you and its neighbours turn away.
 *
 * **Each card is its own projection.** A card is yawed about its own vertical axis and seen
 * through a perspective whose distance scales with the card - six half-widths - so every card is
 * foreshortened the same way whatever its size, rather than all of them sharing one camera. That
 * is what the source's weak-perspective projection does, and a single shared perspective would
 * foreshorten the small side cards less than the large centre one.
 *
 * **Drawn far to near,** in document order, so the centre card is painted last and wins. Nothing
 * here uses z-index: depth is the draw order and the draw order is the sort.
 *
 * **Reflections end on one floor.** However tall the fitted art, its mirror image runs down to
 * `reflect` half-heights below the card's centre, so a short wide cover gets a longer reflection
 * and every card appears to stand on the same surface.
 *
 * In the fallback render mode cards are drawn flat - scaled and faded but not turned - and without
 * reflections, since both need a perspective transform and a gradient mask.
 */
export function Coverflow<T extends CoverflowItem>({
  box,
  layout,
  items,
  position,
  halfWindow = 3,
  wideArt = 1.2,
  lastDir = 0,
  renderArt,
  z,
}: CoverflowProps<T>) {
  const web = useWebEffects()
  const ch = box.height * layout.size
  const cw = ch * layout.aspect
  const step = (layout.vertical ? ch : cw) * layout.step
  const cx = box.width * 0.5
  const cy = box.height * layout.centerY

  return (
    <div
      style={{
        position: 'absolute',
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        overflow: 'hidden',
        ...(z != null ? { zIndex: z } : {}),
      }}
      data-widget="Coverflow"
    >
      {coverflowSlots(items, position, halfWindow, lastDir).map(({ item, d }) => {
        const c = 1 - Math.min(1, Math.abs(d))
        const scale = layout.sideScale + (1 - layout.sideScale) * c
        const alpha = Math.trunc(layout.sideAlpha + (255 - layout.sideAlpha) * c) / 255
        const ang = web ? -layout.tilt * Math.max(-1, Math.min(1, d)) : 0
        const hw = cw * 0.5 * scale
        const hh = ch * 0.5 * scale
        const { ahw, ahh } = fitArt(layout, item, hw, hh, wideArt)
        const ox = layout.vertical ? cx : cx + d * step
        const oy = layout.vertical ? cy + d * step : cy

        // The reflection: from where the art's content stops, plus the gap, down to the floor.
        const cb = item.contentBottom ?? 1
        const yCb = -ahh + cb * 2 * ahh + layout.reflectGap * hh
        const f = ahh > 0.001 ? Math.min(cb, Math.max(0.02, (layout.reflect * hh - yCb) / (2 * ahh))) : layout.reflect
        const size = { width: 2 * ahw, height: 2 * ahh }

        return (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              left: `${ox - ahw}px`,
              top: `${oy - ahh}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
              // Six half-widths, and one pixel, as the source's focal length.
              ...(web ? { perspective: `${hw * 6 + 1}px` } : {}),
            }}
            data-part="card"
            data-d={+d.toFixed(3)}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: alpha,
                ...(ang ? { transform: `rotateY(${ang}rad)` } : {}),
              }}
            >
              {renderArt(item, size)}
              {web && f > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: `${ahh + yCb}px`,
                    width: `${size.width}px`,
                    height: `${f * size.height}px`,
                    overflow: 'hidden',
                    // Vertex alpha 90/255 at the mirror line, falling to nothing at the floor.
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.353), rgba(0,0,0,0))',
                  }}
                  data-part="reflection"
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: `${-(1 - cb) * size.height}px`,
                      width: `${size.width}px`,
                      height: `${size.height}px`,
                      transform: 'scaleY(-1)',
                    }}
                  >
                    {renderArt(item, size)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
