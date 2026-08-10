# StatusIndicators

The status cluster: wifi, battery, and whatever else a theme puts in its corner.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `items` | `StatusItem[]` | A discriminated union, see below |
| `size` | `number` | Icon and battery height in device pixels |
| `gap` | `number` | |
| `font`, `color` | | For text items |
| `battery` | `BatteryColors?` | Shell, fill, low fill, charging fill |
| `lowThreshold` | `number?` | Percentage below which the low colour applies. Defaults to 20 |
| `align` | `'left' \| 'right'` | Defaults to `right` |

## Item kinds

```ts
| { kind: 'icon';    key, src, alt }
| { kind: 'text';    key, text, color? }
| { kind: 'battery'; key, percent, charging? }
```

A discriminated union rather than an open shape, so the set of things a status bar can show
stays enumerable. Between them, the themes in this repo show all three: shipped artwork, a plain
percentage, and a drawn cell.

## The drawn battery

Themes that ship battery artwork pass `icon` items and get their own assets. Themes that do not
pass a `battery` item and get one drawn to the same dimensions, with three colour branches:
normal, low, and charging.

`percent` is clamped to 0-100, so bad data produces a full or empty cell rather than a fill
that overflows its shell.

## Related

- [Clock](Clock.md) - usually sits beside this in a status bar
