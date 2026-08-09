import { useCallback, useMemo, useState } from 'react'
import { pageOf, type GridMetrics } from '../layout/grid'
import { clampIndex } from './useCursor'

/**
 * How a grid behaves when the cursor runs off a horizontal edge.
 *
 * The two original grid themes disagreed, and both readings are defensible, so it is a
 * parameter rather than a choice baked in:
 *
 * - `clamp`   - stop at the edge.
 * - `flow`    - continue onto the neighbouring row, treating the grid as one long sequence.
 * - `page`    - jump to the facing column of the adjacent page, holding the row. This keeps the
 *               eye on the same line across a page turn, which is what a paged launcher wants.
 */
export type GridEdgeBehaviour = 'clamp' | 'flow' | 'page'

export interface GridCursorOptions {
  readonly count: number
  readonly metrics: GridMetrics
  readonly initial?: number
  readonly horizontal?: GridEdgeBehaviour
  /** Vertical movement is clamped inside the page unless this is true. */
  readonly verticalFlows?: boolean
}

export interface GridCursor {
  readonly index: number
  readonly direction: 1 | -1 | 0
  readonly page: number
  readonly col: number
  readonly row: number
  readonly move: (dx: number, dy: number) => void
  readonly setIndex: (index: number) => void
  /** Skip a whole page, as the shoulder buttons do. */
  readonly skipPage: (delta: number) => void
}

/**
 * A two-dimensional selection cursor over a paged grid.
 *
 * Vertical movement stays inside the current page by default. That is not an oversight: in a
 * paged grid, down from the bottom row has no natural target, and silently turning the page
 * under the user reads as the selection teleporting.
 */
export function useGridCursor({
  count,
  metrics,
  initial = 0,
  horizontal = 'page',
  verticalFlows = false,
}: GridCursorOptions): GridCursor {
  const [state, setState] = useState<{ index: number; direction: 1 | -1 | 0 }>(() => ({
    index: clampIndex(initial, count, false),
    direction: 0,
  }))

  const commit = useCallback((next: number, prev: number) => {
    if (next === prev) return null
    return { index: next, direction: next > prev ? (1 as const) : (-1 as const) }
  }, [])

  const move = useCallback(
    (dx: number, dy: number) => {
      if (count <= 0) return
      setState((prev) => {
        const { cols, perPage } = metrics
        const page = Math.floor(prev.index / perPage)
        const within = prev.index - page * perPage
        const col = within % cols
        const row = Math.floor(within / cols)

        let next = prev.index

        if (dx !== 0) {
          const targetCol = col + dx
          if (targetCol >= 0 && targetCol < cols) {
            next = page * perPage + row * cols + targetCol
          } else if (horizontal === 'flow') {
            next = prev.index + dx
          } else if (horizontal === 'page') {
            const facingCol = targetCol < 0 ? cols - 1 : 0
            const targetPage = page + (targetCol < 0 ? -1 : 1)
            const lastPage = Math.max(0, Math.ceil(count / perPage) - 1)
            const wrappedPage = ((targetPage % (lastPage + 1)) + lastPage + 1) % (lastPage + 1)
            next = wrappedPage * perPage + row * cols + facingCol
          }
        }

        if (dy !== 0) {
          const targetRow = row + dy
          if (targetRow >= 0 && targetRow < metrics.rows) {
            next = page * perPage + targetRow * cols + col
          } else if (verticalFlows) {
            next = prev.index + dy * cols
          }
        }

        // A page-relative target can land past the end of a short final page.
        next = Math.min(count - 1, Math.max(0, next))
        return commit(next, prev.index) ?? prev
      })
    },
    [count, metrics, horizontal, verticalFlows, commit],
  )

  const setIndex = useCallback(
    (index: number) => {
      setState((prev) => commit(clampIndex(index, count, false), prev.index) ?? prev)
    },
    [count, commit],
  )

  const skipPage = useCallback(
    (delta: number) => {
      if (count <= 0 || delta === 0) return
      setState((prev) => {
        const { perPage } = metrics
        const pages = Math.max(1, Math.ceil(count / perPage))
        const page = Math.floor(prev.index / perPage)
        const within = prev.index - page * perPage
        // Wrap across pages, holding the slot within the page.
        const nextPage = ((page + delta) % pages + pages) % pages
        const next = Math.min(count - 1, nextPage * perPage + within)
        return commit(next, prev.index) ?? prev
      })
    },
    [count, metrics, commit],
  )

  const derived = useMemo(() => {
    const { cols, perPage } = metrics
    const page = pageOf(metrics, state.index)
    const within = state.index - page * perPage
    return { page, col: within % cols, row: Math.floor(within / cols) }
  }, [metrics, state.index])

  return {
    index: state.index,
    direction: state.direction,
    page: derived.page,
    col: derived.col,
    row: derived.row,
    move,
    setIndex,
    skipPage,
  }
}
