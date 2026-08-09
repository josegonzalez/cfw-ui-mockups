import { useCallback, useState } from 'react'

export interface CursorOptions {
  readonly count: number
  readonly initial?: number
  /** Wrap past the ends instead of stopping at them. */
  readonly wrap?: boolean
}

export interface Cursor {
  readonly index: number
  /** Which way the cursor last moved. Storyboards pick their event from this. */
  readonly direction: 1 | -1 | 0
  readonly move: (step: number) => void
  readonly setIndex: (index: number) => void
}

/**
 * A one-dimensional selection cursor.
 *
 * Direction is tracked because it is not cosmetic: a storyboard chooses between its
 * `activateNext` and `activatePrev` variants from it, and those often differ in sign rather
 * than in shape - an item slides in from the left or from the right depending on which way you
 * came. Losing the direction collapses both into one and the motion stops reading as movement.
 */
export function useCursor({ count, initial = 0, wrap = false }: CursorOptions): Cursor {
  const [state, setState] = useState<{ index: number; direction: 1 | -1 | 0 }>(() => ({
    index: clampIndex(initial, count, wrap),
    direction: 0,
  }))

  const move = useCallback(
    (step: number) => {
      if (step === 0) return
      setState((prev) => {
        const next = clampIndex(prev.index + step, count, wrap)
        if (next === prev.index) return prev
        return { index: next, direction: step > 0 ? 1 : -1 }
      })
    },
    [count, wrap],
  )

  const setIndex = useCallback(
    (index: number) => {
      setState((prev) => {
        const next = clampIndex(index, count, wrap)
        if (next === prev.index) return prev
        return { index: next, direction: next > prev.index ? 1 : -1 }
      })
    },
    [count, wrap],
  )

  return { index: state.index, direction: state.direction, move, setIndex }
}

/** Wrap or clamp an index into `[0, count)`. Returns 0 for an empty list. */
export function clampIndex(index: number, count: number, wrap: boolean): number {
  if (count <= 0) return 0
  if (!wrap) return Math.min(count - 1, Math.max(0, index))
  // Two-step modulo, because JS `%` keeps the sign of the dividend.
  return ((index % count) + count) % count
}
