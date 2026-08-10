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
| `scroll` | `'page' \| 'strip'` | See below |
| `transitionMs`, `easing` | | |

## Why not a CSS grid

Tiles are positioned from resolved metrics. A CSS grid distributes its rounding differently and
drifts by a pixel or two across a row, which is visible when the result is compared against a
reference screenshot at native resolution.

## Paging versus stripping

`page` turns a whole screen of tiles at a time; `strip` slides by one and keeps the selection in
view. The sources use one each, and they are genuinely different behaviours rather than a
setting one of them got wrong.

## Why appearance is a render prop

One theme alone has three grid views that share nothing visually: one captions under the art,
one dims the unselected and centres a wordmark, one zooms with square corners. What they share
is the geometry and the cursor, which is what this widget owns.

## Related

- `useGridCursor` drives `selectedIndex`
