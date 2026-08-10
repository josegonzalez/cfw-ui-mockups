# AnchoredImage

An image scaled to fit a slot, then shrunk to the size it actually became.

## Why it is not `object-fit: contain`

`contain` keeps the box at its declared size and letterboxes the image inside it. The anchor
then lands on the padding rather than on the artwork, and a corner radius rounds the empty box.

Sizing by `max-width` and `max-height` instead lets the element shrink to the fitted image, so
the anchor and the radius act on the picture's own edges. Both source themes that use this
position artwork by anchor, so the difference shifts every marquee and cover by half its
letterbox.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `AnchoredBoxSpec` | `posX`/`posY` is the anchor on screen; `originX`/`originY` is the fraction of the element's **own** size that sits on it |
| `src`, `alt` | `string` | |
| `className`, `style` | | For theme-specific decoration |

`origin [0.5, 0.5]` centres the image on the anchor; `[0, 0]` puts its top-left there.

## Related

- `placeContain` in the Elementerial layout resolver produces these boxes
