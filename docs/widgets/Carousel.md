# Carousel

A horizontal strip of items where the strip moves and the selection stays put.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | | The carousel box, usually **wider than the screen** |
| `items` | `CarouselItem[]` | `{ key, src, alt }` |
| `selectedIndex` | `number` | |
| `pitch` | `number` | Distance from one item's cell to the next |
| `itemWidth`, `itemHeight` | `number` | Cell size for an unselected item |
| `selectedLeft`, `selectedTop` | `number` | Top-left of the selected cell, within the box |
| `selectedScale` | `number?` | How much the selected item grows, about its own centre |
| `restOpacity` | `number?` | Opacity of the items either side |
| `transitionMs`, `easing` | | |

## The strip moves, not the selection

The selected item stays at a fixed point on screen and the row slides underneath it. That is
what keeps a neighbour visible at each edge, and it is why the box is deliberately wider than
the screen - the row is meant to bleed off both sides.

## Selection is scale and opacity

Not a highlight box. In the sources the selected item is genuinely larger and brighter than its
neighbours; drawing a frame around it instead would be a different design, not a simplification.

## Related

- `useCursor` drives `selectedIndex`
