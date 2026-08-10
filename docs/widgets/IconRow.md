# IconRow

A horizontal run of status markers.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `children` | `ReactNode` | Already filtered - see below |
| `gap` | `number` | Device pixels |
| `align`, `className` | | |

Thin on purpose. The value is that spacing and overflow live in one place, so a game with six
badges and one with none produce the same left edge and neither pushes its neighbours around.

## Filtering belongs to the screen

Which badges apply is decided by the theme's own `<visible>` predicates, each of which cites a
line of the source. A row that took a game and worked it out itself would be a second copy of
those rules, living somewhere they cannot be checked against the thing they reproduce.

## Related

- [Badge](Badge.md) - what goes in it
