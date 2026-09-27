import type { NeoUnits } from './layout'
import { COLUMNS, type CardSize, type Entry } from './library'
import { recentSpan, virtualGrid } from './machine'

/**
 * The systems grid's geometry, in device px, from `_buildWideCardGrid`
 * (`my_systems_grid.dart:1130-1240`) and `calculateGridDimensions` (`grid_geometry.dart:122-151`).
 */

export interface CardBox {
  readonly index: number
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export interface GridGeometry {
  /** The grid's own box: 46.r below the top, 6.r in from each side, down to the 42.r footer. */
  readonly left: number
  readonly top: number
  readonly width: number
  readonly viewport: number
  readonly cols: number
  readonly colWidth: number
  readonly cards: readonly CardBox[]
  readonly total: number
  /** Where the scroll comes to rest with this card selected. */
  readonly offsetFor: (index: number) => number
}

export function gridGeometry(
  u: NeoUnits,
  list: readonly Entry[],
  size: CardSize,
  { compact = false, square = false }: { compact?: boolean; square?: boolean } = {},
): GridGeometry {
  const cols = COLUMNS[size]
  const left = u.r(6)
  const top = u.r(46)
  const width = u.W - u.r(6) * 2
  const viewport = u.H - top - u.r(42)
  const sp = u.r(6)
  const colWidth = (width - sp * (cols - 1)) / cols
  // Every card here is a system card at 0.80 - square with Hide system logos on - and the Recent
  // card spans whole rows of them.
  const cardH = colWidth / (square ? 1 : 0.8)
  const grid = virtualGrid(list, cols, compact)
  const [rw, rh] = recentSpan(cols, compact)
  const rowTop = (r: number) => r * (cardH + sp)
  const total = grid.length ? grid.length * (cardH + sp) - sp : 0

  const cards: CardBox[] = []
  const rowOf: number[] = []
  const seen = new Set<number>()
  grid.forEach((row, r) =>
    row.forEach((idx, c) => {
      if (idx === -1 || seen.has(idx)) return
      seen.add(idx)
      rowOf[idx] = r
      const recent = list[idx]!.kind === 'recent'
      const spanW = recent ? rw : 1
      const spanH = recent ? rh : 1
      cards.push({
        index: idx,
        left: c * (colWidth + sp),
        top: rowTop(r),
        width: spanW * colWidth + (spanW - 1) * sp,
        height: spanH * cardH + (spanH - 1) * sp,
      })
    }),
  )

  // The scroll's own arithmetic (`gamepad_grid_nav.dart:185-233`) takes a system card to be
  // `itemWidth + 32.r` tall, not the `itemWidth / 0.80` it is laid out at, so its centring is
  // approximate - the source's, kept.
  const itemH = square ? colWidth : colWidth + u.r(32)
  const rowH = itemH + sp
  const max = Math.max(0, total - viewport)
  const offsetFor = (index: number) => {
    const r = rowOf[index] ?? 0
    const spanH = list[index]?.kind === 'recent' ? rh : 1
    const actual = spanH * itemH + (spanH - 1) * sp
    return Math.min(max, Math.max(0, r * rowH + actual / 2 - viewport / 2))
  }

  return {
    left,
    top,
    width,
    viewport,
    cols,
    colWidth,
    cards,
    total,
    offsetFor,
  }
}
