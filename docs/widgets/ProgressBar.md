# ProgressBar

A determinate progress bar.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `value` | `number` | 0 to 1, clamped |
| `trackColor`, `fillColor` | `string` | |
| `fillColorEnd` | `string?` | Present makes the fill a gradient |
| `radius` | `number?` | Defaults to a full pill |

## Clamped, not trusted

A boot progress that briefly reports `1.02` would otherwise draw a fill wider than its track,
and with a radius that is a visibly wrong shape at the right end rather than a slightly long bar.

## Why the fill is a width

The rounded right end has to travel with the fill. A scaled fill would stretch its corner radius
along with it, so the end of the bar changes shape as it fills.
