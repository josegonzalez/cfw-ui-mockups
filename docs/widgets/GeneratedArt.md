# GeneratedArt

Deterministic placeholder artwork, generated from a title rather than fetched.

None of these mockups ship real box art - it is copyrighted, and a mockup does not need it.
Every theme instead generates an image from the game's identity, so a screen looks populated
without shipping anything it should not.

## Determinism

Nothing here may use a random source. The same title must produce the same image on every run,
or every visual baseline fails on the next one. This is the constraint that shapes the whole
module, and it is asserted in the tests rather than assumed.

## Exports

| Export | What it does |
| --- | --- |
| `svgDataUri(svg)` | Encodes markup as a data URI |
| `hashString(value)` | FNV-1a, for picking a stable colour pair from a title |
| `paletteFor(title, palette)` | Picks a colour pair deterministically |
| `gradientArt(options)` | A two-stop gradient panel |
| `GeneratedArt` | The component that renders art into a resolved box |

`hashString` is FNV-1a: short, stable across runs, and good enough to scatter similar titles
into different buckets. It is not a security primitive and is not used as one.

## Component props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | `Box` | Resolved device pixels |
| `src` | `string` | A data URI, typically from `gradientArt` |
| `alt` | `string` | |
| `radius`, `shadow` | | |
| `fit` | `'cover' \| 'contain' \| 'fill'` | Defaults to `cover` |
| `pixelated` | `boolean?` | Pixel art must not be smoothed when scaled |

## Escaping

`gradientArt` escapes its label before embedding it, so a title containing `&` or `<` produces
valid SVG rather than a broken document. Tested, because a data URI that fails to parse renders
as nothing at all and is easy to miss.

## Related

- Each theme supplies its own palette and its own art generators built on these helpers
