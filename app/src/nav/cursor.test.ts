import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { clampIndex, useCursor } from './useCursor'
import { useGridCursor } from './useGridCursor'
import { gridMetrics } from '../layout/grid'

describe('clampIndex', () => {
  it('clamps at the ends when not wrapping', () => {
    expect(clampIndex(-1, 5, false)).toBe(0)
    expect(clampIndex(5, 5, false)).toBe(4)
  })

  it('wraps in both directions', () => {
    // JS `%` keeps the sign of the dividend, so a naive modulo returns -1 here.
    expect(clampIndex(-1, 5, true)).toBe(4)
    expect(clampIndex(5, 5, true)).toBe(0)
    expect(clampIndex(-7, 5, true)).toBe(3)
  })

  it('returns 0 for an empty list rather than -1', () => {
    expect(clampIndex(3, 0, false)).toBe(0)
    expect(clampIndex(3, 0, true)).toBe(0)
  })
})

describe('useCursor', () => {
  it('moves and records direction', () => {
    const { result } = renderHook(() => useCursor({ count: 5 }))

    expect(result.current.direction).toBe(0)
    act(() => result.current.move(1))
    expect(result.current.index).toBe(1)
    expect(result.current.direction).toBe(1)

    act(() => result.current.move(-1))
    expect(result.current.index).toBe(0)
    expect(result.current.direction).toBe(-1)
  })

  it('stops at the ends without wrap, keeping the previous direction', () => {
    const { result } = renderHook(() => useCursor({ count: 3 }))
    act(() => result.current.move(-1))
    expect(result.current.index).toBe(0)
    expect(result.current.direction).toBe(0)
  })

  it('wraps when asked', () => {
    const { result } = renderHook(() => useCursor({ count: 3, wrap: true }))
    act(() => result.current.move(-1))
    expect(result.current.index).toBe(2)
  })

  it('honours the initial index', () => {
    const { result } = renderHook(() => useCursor({ count: 5, initial: 3 }))
    expect(result.current.index).toBe(3)
  })

  it('ignores a zero step', () => {
    const { result } = renderHook(() => useCursor({ count: 5, initial: 2 }))
    act(() => result.current.move(0))
    expect(result.current.direction).toBe(0)
  })
})

describe('useGridCursor', () => {
  // 3x2 pages over 14 items: two full pages plus a short third.
  const metrics = gridMetrics({ box: { left: 0, top: 0, width: 600, height: 300 }, cols: 3, rows: 2 })
  const setup = (overrides = {}) =>
    renderHook(() => useGridCursor({ count: 14, metrics, ...overrides }))

  it('moves within a page', () => {
    const { result } = setup()
    act(() => result.current.move(1, 0))
    expect(result.current).toMatchObject({ index: 1, col: 1, row: 0, page: 0 })

    act(() => result.current.move(0, 1))
    expect(result.current).toMatchObject({ index: 4, col: 1, row: 1 })
  })

  it('turns the page at a horizontal edge, holding the row', () => {
    // Keeping the row across a page turn is what stops the selection appearing to teleport.
    const { result } = setup({ initial: 5 }) // last column, bottom row, page 0
    act(() => result.current.move(1, 0))
    expect(result.current).toMatchObject({ page: 1, col: 0, row: 1, index: 9 })
  })

  it('wraps backwards off page zero onto the last page', () => {
    const { result } = setup({ initial: 0 })
    act(() => result.current.move(-1, 0))
    expect(result.current.page).toBe(2)
  })

  it('clamps at a horizontal edge when asked to', () => {
    const { result } = setup({ initial: 2, horizontal: 'clamp' })
    act(() => result.current.move(1, 0))
    expect(result.current.index).toBe(2)
  })

  it('flows onto the neighbouring row when asked to', () => {
    const { result } = setup({ initial: 2, horizontal: 'flow' })
    act(() => result.current.move(1, 0))
    expect(result.current.index).toBe(3)
  })

  it('clamps vertical movement inside the page by default', () => {
    // Down from the bottom row has no natural target in a paged grid.
    const { result } = setup({ initial: 3 })
    act(() => result.current.move(0, 1))
    expect(result.current.index).toBe(3)
  })

  it('flows vertically when asked to', () => {
    const { result } = setup({ initial: 3, verticalFlows: true })
    act(() => result.current.move(0, 1))
    expect(result.current.index).toBe(6)
  })

  it('never lands past the end on a short final page', () => {
    // Page 2 holds only indices 12 and 13, so the bottom row is empty.
    const { result } = setup({ initial: 11 })
    act(() => result.current.move(1, 0))
    expect(result.current.index).toBeLessThanOrEqual(13)
  })

  it('skips whole pages and wraps', () => {
    const { result } = setup({ initial: 1 })
    act(() => result.current.skipPage(1))
    expect(result.current).toMatchObject({ page: 1, index: 7 })

    act(() => result.current.skipPage(2))
    expect(result.current.page).toBe(0)
  })

  it('does nothing on an empty grid', () => {
    const { result } = renderHook(() => useGridCursor({ count: 0, metrics }))
    act(() => result.current.move(1, 0))
    expect(result.current.index).toBe(0)
  })
})
