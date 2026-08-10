# ListRow

One row of a selectable list: a label, an optional subtitle, and an optional icon tile.

The row owns its appearance; [TextList](TextList.md) owns which rows exist and where they sit.
Splitting it that way is what lets one list implementation carry a bare single-line row and a
row with an icon tile and a subtitle, without either theme knowing about the other.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `label` | `string` | |
| `sublabel`, `icon` | `string?` | `icon` is a short badge, typically one letter |
| `selected` | `boolean?` | |
| `colors` | `ListRowColors` | Separate unselected and selected values for every part |
| `labelFont`, `sublabelFont`, `iconSize` | `number?` | Device pixels |
| `paddingX`, `radius` | `number?` | |
| `selectedShiftX` | `number?` | Horizontal nudge applied only when selected |
| `overflow` | `'clip' \| 'ellipsis'` | See below |
| `transition` | `TransitionSpec[]?` | Compiled to a CSS transition |
| `bold` | `boolean?` | The selected row is always bold regardless |

## Colours

`ListRowColors` carries an unselected and a selected value for each part: label, sublabel,
background, icon background, icon foreground. Selection in these UIs is not a highlight drawn
over a row - it inverts the whole row, so every colour swaps at once.

Missing selected values fall back to their unselected counterpart, so a theme that only inverts
the background does not have to restate the rest.

## Overflow

`clip` is a hard cut with no marker. It is **not** a lesser `ellipsis`: one source theme clips
deliberately, matching its reference art, so the choice is authored rather than defaulted.

This is also the widget's one web-only capability. CSS ellipsis needs the layout engine to
measure text, which a simple renderer may not do. Declaring the rule as a prop means a renderer
that has to measure text itself has the information; `clip` needs no measurement at all.

## Related

- [TextList](TextList.md)
