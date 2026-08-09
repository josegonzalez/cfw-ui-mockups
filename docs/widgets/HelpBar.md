# HelpBar

The button-hint strip: a glyph badge and a label per hint.

Every handheld UI has one, usually pinned to the bottom of the screen. They differ only in how
the glyph is drawn and how the labels are cased, so the hints are data and the presentation is
props.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `items` | `HelpItem[]` | `{ glyph, label }` |
| `colors` | `HelpBarColors` | `{ fg, badgeBg?, badgeFg? }` |
| `font` | `number` | Device pixels; badge and gap sizes derive from it |
| `badge` | `'circle' \| 'plain'` | |
| `gap` | `number?` | Defaults to `font * 0.85` |
| `uppercase`, `bold` | `boolean?` | |

`glyph` is a device button: `a`, `b`, `x`, `y`, `l`, `r`, `start`, `select`, `menu`. It is
typed against the shared button union, so a hint cannot refer to a button that does not exist.

## Badge styles

**`circle`** - a filled disc with the letter knocked out.

**`plain`** - the letter alone, in the accent colour.

## Start and Select

Neither button carries a letter on the hardware - both are moulded pills. In the `circle` style
they are therefore drawn as a three-bar pictogram rather than as a disc reading "START", which
would be inventing a marking the device does not have.

In the `plain` style there is no badge to draw, so they spell out.

## Related

- `keymap.ts` - the button union these glyphs are drawn from
