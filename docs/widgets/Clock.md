# Clock

The status-bar clock.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `font` | `number` | |
| `color` | `string` | |
| `format` | `'12h' \| '24h'` | Defaults to `12h` |
| `align` | `'left' \| 'center' \| 'right'` | Defaults to `right` |
| `bold` | `boolean?` | |
| `time` | `{ hours, minutes }?` | Overrides both the live clock and the static default |

## Determinism

A static screen renders a **fixed** time, exported as `STATIC_TIME`.

This is a deliberate change from the originals, which drew the real wall clock even on static
snapshots. That meant no two captures of the same screen ever matched, which makes visual
baselines impossible. Pinning it is what allows the screenshot suite to exist at all.

10:24 was chosen as an unremarkable time that exercises both a two-digit hour and a two-digit
minute.

## Ticking

The clock re-reads the time every 20 seconds, and only when the screen is animating. The
interval matches the source themes, which chose it because a handheld status clock shows minutes
and a faster tick would only cost battery.

Passing `time` explicitly disables ticking entirely, which is what a story or a test does.

## Formatting

The 12-hour form has no leading zero on the hour, and renders both midnight and noon as 12
rather than 0. The 24-hour form zero-pads both fields.

## Related

- `ScreenContext` - supplies the `animate` flag that decides whether the clock is live
