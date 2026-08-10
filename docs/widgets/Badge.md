# Badge

One status marker: a glyph, optionally on a filled chip.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `kind` | `BadgeKind` | What it means. A closed set - see below |
| `size` | `number` | Height in device pixels; everything else is proportioned from it |
| `color` | `string` | |
| `background` | `string?` | Present makes it a chip, absent a plain glyph |
| `glyph` | `string` | The character to draw |
| `label`, `title` | `string?` | |

## Why the kind is enumerated

`BadgeKind` is a union rather than a string: `favorite`, `cheevos`, `multidisc`, `manual`,
`savegame`, `kidGame`, `gunGame`, `finished`, `inProgress`, `buggy`. A badge is a status
vocabulary - a renderer has to know every value to draw it, and an unrecognised one would
silently render nothing rather than failing.

## Why the glyph is a prop

Each theme draws these from its own icon font at its own codepoints. A table inside the widget
would either be one theme's table pretending to be general, or the union of every theme's, which
no single theme uses. The widget owns the shape and the sizing; the theme owns the glyph.

## Related

- [IconRow](IconRow.md) - lays a run of these out
