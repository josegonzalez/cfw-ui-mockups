import { useState } from 'react'
import { nextFirstVisible } from '../widgets/TextList'

export interface ListWindowOptions {
  readonly selectedIndex: number
  readonly visibleCount: number
  readonly total: number
}

/**
 * Track a list's scroll position so it stays where the user left it.
 *
 * Scroll position is real state: selecting row 5 in a five-row window scrolls one row if you
 * arrived from row 4, and not at all if the window had already moved past. One integer is all
 * it takes, and it is derived during render rather than in an effect so the list never paints a
 * frame at the wrong offset.
 *
 * Uses React's adjust-state-during-render pattern rather than a ref. A ref would be mutated
 * even by a render that is later discarded, which under concurrent rendering can leave the
 * window at an offset no committed render ever asked for. Setting state during render is
 * discarded along with the render, so the two stay consistent.
 */
export function useListWindow({ selectedIndex, visibleCount, total }: ListWindowOptions): number {
  const [first, setFirst] = useState(0)

  const next = nextFirstVisible(first, selectedIndex, visibleCount, total)
  if (next !== first) setFirst(next)

  return next
}
