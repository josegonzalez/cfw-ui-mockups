import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useListWindow } from './useListWindow'

describe('useListWindow', () => {
  it('starts at the top', () => {
    const { result } = renderHook(() => useListWindow({ selectedIndex: 0, visibleCount: 5, total: 20 }))
    expect(result.current).toBe(0)
  })

  it('remembers where it scrolled to', () => {
    // The behaviour a stateless policy cannot express: stepping down one row at a time scrolls
    // one row at a time, and stepping back up does not snap the window to the top.
    const { result, rerender } = renderHook(
      ({ selectedIndex }) => useListWindow({ selectedIndex, visibleCount: 5, total: 20 }),
      { initialProps: { selectedIndex: 0 } },
    )

    for (const selectedIndex of [1, 2, 3, 4]) {
      rerender({ selectedIndex })
      expect(result.current).toBe(0)
    }

    rerender({ selectedIndex: 5 })
    expect(result.current).toBe(1)

    rerender({ selectedIndex: 6 })
    expect(result.current).toBe(2)

    // Back up into the window: no movement.
    rerender({ selectedIndex: 3 })
    expect(result.current).toBe(2)

    // Past the top: the window follows.
    rerender({ selectedIndex: 1 })
    expect(result.current).toBe(1)
  })

  it('stops at the end of the list', () => {
    const { result, rerender } = renderHook(
      ({ selectedIndex }) => useListWindow({ selectedIndex, visibleCount: 5, total: 20 }),
      { initialProps: { selectedIndex: 0 } },
    )

    rerender({ selectedIndex: 19 })
    expect(result.current).toBe(15)
  })

  it('collapses to the top when everything fits', () => {
    const { result } = renderHook(() => useListWindow({ selectedIndex: 4, visibleCount: 10, total: 5 }))
    expect(result.current).toBe(0)
  })
})
