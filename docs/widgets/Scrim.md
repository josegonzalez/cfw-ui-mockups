# Scrim

A tint over the screen, softened by a mask.

Every theme darkens part of a screen so text stays legible over artwork, and each does it
differently - which is why the mode is a prop rather than three near-identical components.

## Modes

| Mode | What it draws |
| --- | --- |
| `mask` | A flat colour shown through a soft mask, so the tint fades where the mask does |
| `image` | A pre-composited overlay image, drawn as-is |
| `wash` | A plain gradient or flat colour with no mask |

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `mode` | `ScrimMode` | |
| `color` | `string?` | The tint for `mask` and `wash` |
| `src` | `string?` | The mask for `mask`, the overlay for `image` |
| `opacity`, `z` | `number?` | |
| `flipX` | `boolean?` | Mirrors the mask, for a pair of opposing edge fades |

## Fallback

`mask` needs arbitrary image masking, which a simple renderer may not have. Without it the tint
is drawn as a soft gradient in the same colour.

That degradation is chosen deliberately. The alternative - dropping the mask and keeping the
flat fill - paints a solid sheet over the content, which is exactly the fault that once hid
every view in one of these themes behind a tinted overlay while every numeric check passed.

## Related

- [GeneratedArt](GeneratedArt.md) - what a scrim usually sits over
