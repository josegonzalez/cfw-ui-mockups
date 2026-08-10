# StarRating

A row of rating stars, tinted with the theme accent.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `{ left, top }` | Top-left of the row |
| `rating` | `number` | 0 to 1 |
| `size` | `number` | Height of one star in device pixels |
| `color` | `string` | |
| `count` | `number?` | Defaults to 5 |
| `filledSvg`, `emptySvg` | `string` | Inline SVG for the two states |
| `z` | `number?` | |

## Why the artwork is passed in as markup

The stars take the theme's accent colour, and an `<img>` cannot be tinted. Passing the SVG in as
a string lets `fill` cascade onto it. The source themes ship their own star artwork, so the
paths come from their files rather than being drawn here.

## The epsilon

`isStarFilled` compares against `(index + 1) / count - 0.001`.

Without that epsilon a rating of exactly `0.8` leaves the fourth of five stars empty through
binary floating-point error. It is one of the commonest ratings in the sample libraries, so the
bug would be visible immediately and puzzling.

## Related

- Each theme supplies its own star artwork
