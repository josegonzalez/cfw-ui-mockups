import { describe, expect, it } from 'vitest'
import { cellOffset, cellPosition, gridMetrics, pageCount, pageOf } from './grid'

const box = { left: 0, top: 0, width: 640, height: 300 }

describe('gridMetrics', () => {
  it('divides the space left after margins and gaps', () => {
    const m = gridMetrics({ box, cols: 3, rows: 2, padX: 4, padY: 4, marginX: 8, marginY: 8 })

    expect(m.cellW).toBeCloseTo((640 - 16 - 8) / 3, 6)
    expect(m.cellH).toBeCloseTo((300 - 16 - 4) / 2, 6)
  })

  it('fills the box exactly when there are no gaps', () => {
    const m = gridMetrics({ box, cols: 4, rows: 2 })
    expect(m.cellW).toBe(160)
    expect(m.cellH).toBe(150)
  })

  it('reports the page size and the centre column', () => {
    expect(gridMetrics({ box, cols: 5, rows: 2 })).toMatchObject({ perPage: 10, centerIndex: 2 })
    expect(gridMetrics({ box, cols: 4, rows: 2 }).centerIndex).toBe(2)
  })

  it('never produces a zero-column grid', () => {
    expect(gridMetrics({ box, cols: 0, rows: 0 })).toMatchObject({ cols: 1, rows: 1 })
  })
})

describe('cellOffset', () => {
  it('steps by cell size plus gap, from the margin', () => {
    const m = gridMetrics({ box, cols: 3, rows: 2, padX: 10, padY: 6, marginX: 5, marginY: 5 })

    expect(cellOffset(m, 0, 0)).toEqual({ left: 5, top: 5 })
    expect(cellOffset(m, 1, 0).left).toBeCloseTo(5 + m.cellW + 10, 6)
    expect(cellOffset(m, 0, 1).top).toBeCloseTo(5 + m.cellH + 6, 6)
  })
})

describe('cellPosition', () => {
  const m = gridMetrics({ box, cols: 3, rows: 2 })

  it('counts across rows first', () => {
    expect(cellPosition(m, 0)).toEqual({ col: 0, row: 0 })
    expect(cellPosition(m, 2)).toEqual({ col: 2, row: 0 })
    expect(cellPosition(m, 3)).toEqual({ col: 0, row: 1 })
  })

  it('wraps into the page, so an index on page two maps to its local slot', () => {
    expect(cellPosition(m, 6)).toEqual({ col: 0, row: 0 })
    expect(cellPosition(m, 8)).toEqual({ col: 2, row: 0 })
  })

  it('handles a negative index without producing a negative column', () => {
    expect(cellPosition(m, -1)).toEqual({ col: 2, row: 1 })
  })
})

describe('paging', () => {
  const m = gridMetrics({ box, cols: 3, rows: 2 })

  it('maps an index to its page', () => {
    expect(pageOf(m, 0)).toBe(0)
    expect(pageOf(m, 5)).toBe(0)
    expect(pageOf(m, 6)).toBe(1)
  })

  it('counts pages, and always has at least one', () => {
    expect(pageCount(m, 18)).toBe(3)
    expect(pageCount(m, 13)).toBe(3)
    expect(pageCount(m, 0)).toBe(1)
  })
})
