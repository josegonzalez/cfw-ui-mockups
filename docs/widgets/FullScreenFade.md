# FullScreenFade

A full-screen fade, for launching a game or powering off.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `on` | `boolean` | Whether the fade currently covers the screen |
| `color` | `string?` | Defaults to black |
| `durationMs` | `number` | |
| `easing` | `EasingName?` | |
| `z` | `number?` | Defaults to 200, above every view |
| `label` | `string?` | Optional text shown during the fade |

## Always mounted

Driven by opacity rather than mounted on demand. The fade *is* the effect - an element that
appears at the moment it should already be fading has nothing to animate from, so it snaps.

## Related

- [animation.md](../animation.md) - the transition descriptors this compiles
