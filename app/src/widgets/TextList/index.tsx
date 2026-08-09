import { place, type Box } from '../../layout/box'
import { ListRow, type ListRowColors, type TextOverflow } from '../ListRow'
import type { TransitionSpec } from '../../anim/types'

export interface TextListItem {
  readonly key: string
  readonly label: string
  readonly sublabel?: string | undefined
  readonly icon?: string | undefined
}

export interface TextListProps {
  readonly box: Box
  readonly items: readonly TextListItem[]
  readonly selectedIndex: number
  /** Row pitch in device pixels, gaps excluded. */
  readonly rowHeight: number
  /** Vertical gap between rows. */
  readonly gap?: number | undefined
  readonly colors: ListRowColors
  readonly labelFont: number
  readonly sublabelFont?: number | undefined
  readonly iconSize?: number | undefined
  /**
   * Horizontal inset for row content. The selection background still spans the full width,
   * which is how the source themes draw it - the text is inset, the bar is not.
   */
  readonly rowPaddingX?: number | undefined
  readonly rowRadius?: number | undefined
  readonly selectedShiftX?: number | undefined
  readonly overflow?: TextOverflow | undefined
  readonly rowTransition?: readonly TransitionSpec[] | undefined
  readonly boldRows?: boolean | undefined
  /**
   * Index of the first visible row. Supply it from `useListWindow` to keep the window where the
   * user left it; omit it for the default "never scrolled" policy.
   */
  readonly firstVisible?: number | undefined
}

/**
 * Advance the scroll window so the selection stays visible, scrolling by the minimum needed.
 *
 * Genuinely stateful: where the window lands depends on where it already was. Selecting row 5
 * in a 5-row window scrolls one row if you arrived from row 4, but not at all if the window had
 * already scrolled past. A stateless function cannot express that, and approximating it
 * produces a list that jumps a whole page when it should step one row.
 *
 * The state is one integer, which is why this stays a pure function of it rather than becoming
 * hidden internal state - a renderer in another language keeps the same single number.
 */
export function nextFirstVisible(
  previousFirst: number,
  selectedIndex: number,
  visibleCount: number,
  total: number,
): number {
  if (visibleCount >= total) return 0
  const maxFirst = Math.max(0, total - visibleCount)

  let first = Math.min(Math.max(0, previousFirst), maxFirst)
  if (selectedIndex < first) first = selectedIndex
  else if (selectedIndex > first + visibleCount - 1) first = selectedIndex - visibleCount + 1

  return Math.min(Math.max(0, first), maxFirst)
}

/**
 * The default window when a screen does not track its own scroll position.
 *
 * Equivalent to having never scrolled: the list starts at the top and only moves once the
 * selection passes the bottom, at which point the selection sits on the last visible row. Sane
 * and predictable, and enough for a list that fits or is only stepped through once.
 *
 * A screen that wants the window to stay where the user left it passes `firstVisible` instead.
 */
export function firstVisibleIndex(
  selectedIndex: number,
  visibleCount: number,
  total: number,
): number {
  return nextFirstVisible(0, selectedIndex, visibleCount, total)
}

/**
 * A vertical list with one selected row.
 *
 * Deliberately has no scroll animation. The source list component snaps: the selection bar and
 * the scroll offset both move in one frame, and adding easing here would be a change to the
 * thing being reproduced rather than a polish on it. Row-level transitions are still available
 * through `rowTransition`, because one theme does animate the row itself.
 */
export function TextList({
  box,
  items,
  selectedIndex,
  rowHeight,
  gap = 0,
  colors,
  labelFont,
  sublabelFont,
  iconSize,
  rowPaddingX = 0,
  rowRadius,
  selectedShiftX,
  overflow,
  rowTransition,
  boldRows,
  firstVisible,
}: TextListProps) {
  const pitch = rowHeight + gap

  // Two counts, because they answer different questions. Scrolling must keep the selection
  // *fully* visible, so it counts whole rows. Drawing should fill the box, so it includes the
  // partial row at the bottom - a list that ends on a clean row edge reads as though it has
  // nothing more to show.
  const visibleCount = pitch > 0 ? Math.max(1, Math.floor((box.height + gap) / pitch)) : items.length
  const renderCount = pitch > 0 ? Math.max(1, Math.ceil((box.height + gap) / pitch)) : items.length

  const first =
    firstVisible !== undefined
      ? nextFirstVisible(firstVisible, selectedIndex, visibleCount, items.length)
      : firstVisibleIndex(selectedIndex, visibleCount, items.length)
  const window = items.slice(first, first + renderCount)

  // The container clips so a partial bottom row is cut cleanly. That clip is vertical in
  // intent, but `overflow` cannot be hidden on one axis and visible on the other, so the box is
  // widened by the selection shift - otherwise the shifted row is sliced off at its right edge.
  const clipWidth = box.width + Math.max(0, selectedShiftX ?? 0)

  return (
    <div
      style={{ ...place({ ...box, width: clipWidth }), overflow: 'hidden' }}
      data-widget="TextList"
    >
      {window.map((item, offset) => (
        <ListRow
          key={item.key}
          box={{ left: 0, top: offset * pitch, width: box.width, height: rowHeight }}
          label={item.label}
          sublabel={item.sublabel}
          icon={item.icon}
          selected={first + offset === selectedIndex}
          colors={colors}
          labelFont={labelFont}
          sublabelFont={sublabelFont}
          iconSize={iconSize}
          paddingX={rowPaddingX}
          radius={rowRadius}
          selectedShiftX={selectedShiftX}
          overflow={overflow}
          transition={rowTransition}
          bold={boldRows}
        />
      ))}
    </div>
  )
}
