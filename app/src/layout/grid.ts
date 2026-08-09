import type { Box } from './box'

export interface GridSpec {
  readonly box: Box
  /** Columns and rows, as the source formats author them. */
  readonly cols: number
  readonly rows: number
  /** Gap between cells, in device pixels. */
  readonly padX?: number
  readonly padY?: number
  /** Inset from the box edge, in device pixels. */
  readonly marginX?: number
  readonly marginY?: number
}

export interface GridMetrics {
  readonly cols: number
  readonly rows: number
  readonly cellW: number
  readonly cellH: number
  readonly padX: number
  readonly padY: number
  readonly marginX: number
  readonly marginY: number
  /** Cells per page. Paged grids turn a page when the cursor leaves this window. */
  readonly perPage: number
  /** Which column is centred, for grids that keep the selection in the middle. */
  readonly centerIndex: number
}

/**
 * Resolve a grid to cell dimensions.
 *
 * Cells divide the space left after the margins and the inter-cell gaps, which is how both
 * source formats define it: the authored numbers are the gaps, and the cell size falls out.
 */
export function gridMetrics(spec: GridSpec): GridMetrics {
  const cols = Math.max(1, spec.cols)
  const rows = Math.max(1, spec.rows)
  const padX = spec.padX ?? 0
  const padY = spec.padY ?? 0
  const marginX = spec.marginX ?? 0
  const marginY = spec.marginY ?? 0

  const usableW = spec.box.width - marginX * 2 - padX * (cols - 1)
  const usableH = spec.box.height - marginY * 2 - padY * (rows - 1)

  return {
    cols,
    rows,
    cellW: usableW / cols,
    cellH: usableH / rows,
    padX,
    padY,
    marginX,
    marginY,
    perPage: cols * rows,
    centerIndex: Math.floor(cols / 2),
  }
}

/** Top-left of one cell, relative to the grid box. */
export function cellOffset(
  metrics: GridMetrics,
  col: number,
  row: number,
): { left: number; top: number } {
  return {
    left: metrics.marginX + col * (metrics.cellW + metrics.padX),
    top: metrics.marginY + row * (metrics.cellH + metrics.padY),
  }
}

/** Where an index sits in the grid, counting across rows first. */
export function cellPosition(metrics: GridMetrics, index: number): { col: number; row: number } {
  const withinPage = ((index % metrics.perPage) + metrics.perPage) % metrics.perPage
  return {
    col: withinPage % metrics.cols,
    row: Math.floor(withinPage / metrics.cols),
  }
}

/** Which page an index falls on. */
export function pageOf(metrics: GridMetrics, index: number): number {
  return Math.floor(index / metrics.perPage)
}

export function pageCount(metrics: GridMetrics, total: number): number {
  return Math.max(1, Math.ceil(total / metrics.perPage))
}
