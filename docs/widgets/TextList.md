# TextList

A vertical list with one selected row, windowed so the selection stays in view.

Used by every theme in the repo. It is the single most common screen element on these devices,
because a handheld with a D-pad and no pointer navigates almost everything as a list.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `items` | `TextListItem[]` | `{ key, label, sublabel?, icon? }` |
| `selectedIndex` | `number` | Index into `items`, not into the visible window |
| `rowHeight` | `number` | Row height in device pixels |
| `gap` | `number?` | Vertical gap between rows |
| `colors` | `ListRowColors` | Passed through to each row |
| `labelFont`, `sublabelFont`, `iconSize` | `number?` | Device pixels |
| `rowPaddingX` | `number?` | Insets row *content*, not the selection bar |
| `rowRadius`, `selectedShiftX`, `overflow`, `rowTransition`, `boldRows` | | Passed through to `ListRow` |

## Windowing

`firstVisibleIndex(selectedIndex, visibleCount, total)` is exported and tested directly, because
it is pure arithmetic and the failure modes are subtle: scrolling one row early, or stranding
the selection off-screen at the end of a list.

The rules:

- If everything fits, never scroll.
- While the selection is inside the window, do not move.
- Once it passes the bottom, scroll by the **minimum** needed - one row, not a page.
- Stop at the end of the list, so the last page never shows blank rows below the final item.

Visible row count is derived from the box: `floor((height + gap) / (rowHeight + gap))`. The
`+ gap` matters - four 60px rows with three 20px gaps fill exactly 300px, and without it the
list would believe a fifth row fits.

## Animation

**None, deliberately.** The source list component snaps: the selection bar and the scroll offset
both move within one frame. The original theme's stylesheet says so in a comment, because it is
the sort of thing a later reader would "fix".

Adding easing here would change the thing being reproduced rather than polish it. Row-level
motion is still available through `rowTransition`, because one theme does animate the row
itself - a 50ms nudge on selection.

## The inset asymmetry

`rowPaddingX` insets the row's text but not its background. That is how the source themes draw
it: the selection bar spans the full list width while the label sits inside it. Insetting both
looks tidier and is wrong.

## Related

- [ListRow](ListRow.md) - the row this renders
- `useCursor` - drives `selectedIndex`
