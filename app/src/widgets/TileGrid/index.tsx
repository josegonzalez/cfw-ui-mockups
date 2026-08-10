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

export interface TileGridProps<T> {
  readonly metrics: TileGridMetrics
  readonly items: readonly T[]
  readonly selectedIndex: number
  /** Draws each tile. Receives its own box so nothing has to recompute geometry. */
  readonly renderTile: (item: T, state: TileState) => ReactNode
  readonly keyOf: (item: T, index: number) => string
  /**
   * Scrolls the strip rather than paging.
   *
   * A horizontal strip that keeps the selection in view is a different behaviour from a grid
   * that turns pages, and both sources use one each.
   */
  readonly scroll?: 'page' | 'strip' | undefined
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
export function tileBox(metrics: TileGridMetrics, index: number) {
  const col = index % metrics.cols
  const row = Math.floor(index / metrics.cols) % metrics.rows

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
  scroll = 'page',
  transitionMs = 0,
  easing = 'easeOut',
  className,
  z,
}: TileGridProps<T>) {
  const perPage = metrics.cols * metrics.rows
  const pitchX = metrics.tileW + metrics.margin[0]
  const pitchY = metrics.tileH + metrics.margin[1]

  // A paged grid jumps a whole screen of tiles; a strip slides by one.
  const offset =
    scroll === 'strip'
      ? -Math.max(0, selectedIndex - Math.floor((metrics.cols - 1) / 2)) * pitchX
      : 0
  const page = scroll === 'page' ? Math.floor(selectedIndex / perPage) : 0
  const offsetY = scroll === 'page' ? -page * metrics.rows * pitchY : 0

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
          const placed = tileBox(metrics, scroll === 'page' ? offsetIndex : index)

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
