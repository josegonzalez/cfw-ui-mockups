import type { CSSProperties, ReactNode } from 'react'
import { transitionsToCss } from '../../anim/waapi'
import type { EasingName } from '../../anim/types'

export interface TileGridMetrics {
  readonly box: { left: number; top: number; width: number; height: number }
  readonly cols: number
  readonly rows: number
  readonly tileW: number
  readonly tileH: number
  /** Inset from the grid box edge. */
  readonly padding: readonly [number, number]
  /** Gap between tiles. */
  readonly margin: readonly [number, number]
}

/**
 * Which way consecutive items run.
 *
 * `row-major` fills a row left to right and then wraps; `column-major` fills a column top to
 * bottom and then moves right. A grid that scrolls sideways is filled column-major, because the
 * axis items advance along has to be the axis the grid scrolls along - otherwise the second item
 * is off-screen while the first row is still half empty.
 */
export type TileOrder = 'row-major' | 'column-major'

/**
 * How the grid follows its cursor.
 *
 * - `page`     - jumps a whole screen of tiles at a time, drawing only the current page.
 * - `strip`    - scrolls sideways by one column, keeping the selected column near the middle.
 * - `rows`     - scrolls vertically by one row, keeping the selected row near the middle.
 * - `centered` - the selection never moves; the strip travels behind it. See below.
 * - `none`     - never scrolls.
 *
 * Every mode except `page` lays out all the items and clips to the box, so a partly visible
 * column or row at the edge is drawn rather than dropped - which is what the sources do, and
 * what makes it clear there is more to scroll to.
 */
export type TileScroll = 'page' | 'strip' | 'rows' | 'centered' | 'none'

export interface TileGridProps<T> {
  readonly metrics: TileGridMetrics
  readonly items: readonly T[]
  readonly selectedIndex: number
  /** Draws each tile. Receives its own box so nothing has to recompute geometry. */
  readonly renderTile: (item: T, state: TileState) => ReactNode
  readonly keyOf: (item: T, index: number) => string
  readonly order?: TileOrder | undefined
  readonly scroll?: TileScroll | undefined
  /**
   * Where the selected tile's left edge sits, in the strip's own coordinates, when
   * `scroll: 'centered'`.
   *
   * Centre-selection is a different behaviour from scrolling, not a variant of it: the cursor is
   * pinned and the content moves under it, so the selection frame can be a separate element that
   * never moves at all. That is exactly how the source builds it - the frame is authored at a
   * fixed position and the strip translates behind.
   *
   * The anchor is a number rather than a flag because the sources pin it two different ways: one
   * to a cell index within the grid's own box, the other to the centre of the screen. Both are
   * "put the selected column at this x", measured in whole cell pitches from the strip's origin.
   */
  readonly centerAnchor?: number | undefined
  readonly transitionMs?: number | undefined
  readonly easing?: EasingName | undefined
  readonly className?: string | undefined
  readonly z?: number | undefined
}

export interface TileState {
  readonly index: number
  readonly selected: boolean
  readonly box: { left: number; top: number; width: number; height: number }
  readonly col: number
  readonly row: number
}

/** Where a tile sits, relative to the grid box. */
export function tileBox(metrics: TileGridMetrics, index: number, order: TileOrder = 'row-major') {
  // No wrap on the second term: a scrolling grid runs past `rows` rows or `cols` columns, and a
  // paged one is handed an index already inside one page, so wrapping would only hide a bug.
  const col = order === 'row-major' ? index % metrics.cols : Math.floor(index / metrics.rows)
  const row = order === 'row-major' ? Math.floor(index / metrics.cols) : index % metrics.rows

  return {
    col,
    row,
    left: metrics.padding[0] + col * (metrics.tileW + metrics.margin[0]),
    top: metrics.padding[1] + row * (metrics.tileH + metrics.margin[1]),
    width: metrics.tileW,
    height: metrics.tileH,
  }
}

/**
 * How far the strip is scrolled along one axis, in lines.
 *
 * The selected line is pulled towards the middle of the window, then the result is clamped so
 * the last line never scrolls past the far edge and leaves a gap.
 */
export function firstVisibleLine(
  selectedLine: number,
  lastLine: number,
  visibleLines: number,
): number {
  const centred = selectedLine - Math.floor((visibleLines - 1) / 2)
  return Math.max(0, Math.min(centred, lastLine - visibleLines + 1))
}

/**
 * A grid of tiles with one selected.
 *
 * Tiles are positioned from resolved metrics rather than by a CSS grid, so their pitch matches
 * the source's own arithmetic exactly - a CSS grid distributes rounding differently and drifts
 * by a pixel or two across a row, which is visible against a reference screenshot.
 *
 * Tile *appearance* is a render prop, because the three grid views in one theme alone differ
 * completely: one captions under the art, one dims the unselected and shows a centred wordmark,
 * one zooms with square corners. What they share is the geometry and the cursor, which is what
 * lives here.
 */
export function TileGrid<T>({
  metrics,
  items,
  selectedIndex,
  renderTile,
  keyOf,
  order = 'row-major',
  scroll = 'page',
  centerAnchor,
  transitionMs = 0,
  easing = 'easeOut',
  className,
  z,
}: TileGridProps<T>) {
  const perPage = metrics.cols * metrics.rows
  const pitchX = metrics.tileW + metrics.margin[0]
  const pitchY = metrics.tileH + metrics.margin[1]

  const selected = tileBox(metrics, selectedIndex, order)
  const last = tileBox(metrics, Math.max(0, items.length - 1), order)

  // How many whole lines the box shows along each axis. Scrolling moves in whole lines, so a
  // line only half in view does not count towards the window even though it is drawn.
  const visibleCols = Math.max(
    1,
    Math.floor((metrics.box.width - metrics.padding[0] * 2 + metrics.margin[0]) / pitchX),
  )
  const visibleRows = Math.max(
    1,
    Math.floor((metrics.box.height - metrics.padding[1] * 2 + metrics.margin[1]) / pitchY),
  )

  /*
   * `centered` pins the cursor and moves the content, so whatever is selected lands on the
   * anchor. There is no windowing and no clamp - running off both ends is the point, because
   * the frame that marks the selection is a separate element that never moves.
   *
   * Measured in whole cell pitches from the strip's origin, deliberately ignoring padding. Both
   * sources translate this way, and it is why the frame sits a padding's width to the left of
   * the tile it surrounds rather than exactly on it.
   */
  const offset =
    scroll === 'centered'
      ? (centerAnchor ?? 0) - selected.col * pitchX
      : scroll === 'strip'
        ? -firstVisibleLine(selected.col, last.col, visibleCols) * pitchX
        : 0
  const page = scroll === 'page' ? Math.floor(selectedIndex / perPage) : 0
  const offsetY =
    scroll === 'page'
      ? -page * metrics.rows * pitchY
      : scroll === 'rows'
        ? -firstVisibleLine(selected.row, last.row, visibleRows) * pitchY
        : 0

  const visible = scroll === 'page' ? items.slice(page * perPage, (page + 1) * perPage) : items
  const firstIndex = scroll === 'page' ? page * perPage : 0

  const motion = transitionMs
    ? transitionsToCss([{ property: 'transform', duration: transitionMs, easing }])
    : undefined

  const stripStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    transform: `translate(${offset}px, ${offsetY}px)`,
    ...(motion ? { transition: motion } : {}),
  }

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${metrics.box.left}px`,
        top: `${metrics.box.top}px`,
        width: `${metrics.box.width}px`,
        height: `${metrics.box.height}px`,
        overflow: 'hidden',
        ...(z != null ? { zIndex: z } : {}),
      }}
      data-widget="TileGrid"
    >
      <div style={stripStyle} data-part="strip">
        {visible.map((item, offsetIndex) => {
          const index = firstIndex + offsetIndex
          const placed = tileBox(metrics, scroll === 'page' ? offsetIndex : index, order)

          return (
            <div
              key={keyOf(item, index)}
              style={{
                position: 'absolute',
                left: `${placed.left}px`,
                top: `${placed.top}px`,
                width: `${placed.width}px`,
                height: `${placed.height}px`,
              }}
              data-selected={index === selectedIndex || undefined}
            >
              {renderTile(item, {
                index,
                selected: index === selectedIndex,
                box: placed,
                col: placed.col,
                row: placed.row,
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
