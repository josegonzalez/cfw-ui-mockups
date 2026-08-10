# Ticker

A stack of blocks where one is visible at a time.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `items` | `TickerItem[]` | `{ key, content }`. Two is the common case |
| `activeIndex` | `number` | Which block is showing |
| `color`, `align`, `className` | | |

## Why every block is rendered

All the blocks occupy the same box and only opacity distinguishes them. That is how the sources
build it, and it buys two things: the blocks can cross-fade rather than replacing each other, and
the box never resizes as the content changes. A ticker that reflowed on each swap would jitter
whatever sits beside it - and in the one place this is used, that is the whole top bar.

## The widget does not own the clock

`activeIndex` is a prop. A widget with its own timer could not be screenshotted reproducibly and
could not be settled for a static snapshot, which is the invariant the whole static-screen
mechanism rests on. The screen owns the cycling; the widget owns the presentation.

## Related

- [Scrim](Scrim.md) - the other widget whose job is to not disturb its neighbours
