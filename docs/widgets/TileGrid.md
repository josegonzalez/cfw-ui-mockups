# TileGrid

A grid of tiles with one selected.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `metrics` | `TileGridMetrics` | Box, columns, rows, tile size, padding and gaps, all resolved |
| `items` | `T[]` | |
| `selectedIndex` | `number` | |
| `renderTile` | `(item, state) => ReactNode` | Receives its own box, so nothing recomputes geometry |
| `keyOf` | `(item, index) => string` | |
| `order` | `'row-major' \| 'column-major'` | Which way consecutive items run. See below |
| `scroll` | `'page' \| 'strip' \| 'rows' \| 'none'` | See below |
| `transitionMs`, `easing` | | |

## Why not a CSS grid

Tiles are positioned from resolved metrics. A CSS grid distributes its rounding differently and
drifts by a pixel or two across a row, which is visible when the result is compared against a
reference screenshot at native resolution.

## Fill order

`row-major` fills a row left to right and wraps; `column-major` fills a column top to bottom and
then moves right. **The fill axis has to match the scroll axis.** A sideways-scrolling grid filled
row-major puts item 1 beside item 0 rather than below it, so the second item is off-screen while
the first row is still half empty. Both EmulationStation grids and the launcher grids here fill
along the axis they scroll.

## Scrolling

| Mode | Behaviour |
| --- | --- |
| `page` | Turns a whole screen of tiles at a time, and draws only the current page |
| `strip` | Scrolls sideways by one column, keeping the selected column near the middle |
| `rows` | Scrolls vertically by one row, keeping the selected row near the middle |
| `none` | Never scrolls |

`strip` and `rows` lay out **every** item and clip to the box. That is what makes the partly
visible column or row at the edge appear - and that sliver is often the only cue that there is
more to scroll to. Both stop at the end rather than scrolling past the last tile, so the far edge
never opens a gap.

The window is sized on lines that fit *completely*, because scrolling moves in whole lines. The
line straddling the edge is drawn but does not count towards the window.

## Why appearance is a render prop

One theme alone has three grid views that share nothing visually: one captions under the art,
one dims the unselected and centres a wordmark, one zooms with square corners. What they share
is the geometry and the cursor, which is what this widget owns.

## Related

- `useGridCursor` drives `selectedIndex`
