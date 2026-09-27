# Coverflow

A row of cards where the centre one faces you and its neighbours turn away, each reflected onto
one floor.

Arrived with TortOS, whose systems row, games row, Muse's album shelf and their vertical forms are
all one of these with different numbers. [Carousel](Carousel.md) is the flat strip; this is the
row whose cards turn, shrink and fade by their distance from the centre, and it was kept separate
rather than grown out of that one because none of those three things is a variation of a strip
that slides.

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `box` | | The area the layout's fractions are of - usually the whole screen |
| `layout` | `CoverflowLayout` | Size, aspect, step, side scale, centre y, tilt, reflection floor, side alpha, vertical, fit rule, reflection gap |
| `items` | `CoverflowItem[]` | `{ key, width, height, contentBottom? }` - the art's own size, and where its opaque pixels stop |
| `position` | `number` | Which item is centred. Continuous: a fraction is a card mid-move, and on a ring it may run past either end |
| `halfWindow` | `number?` | Cards drawn either side of the centre; 3 by default |
| `wideArt` | `number?` | The aspect past which `wideArea` applies; 1.2 by default |
| `lastDir` | `-1 \| 0 \| 1` | The last move's direction, for a ring of two |
| `renderArt` | `(item, size) => ReactNode` | Draws one item's art at its fitted size - an image, or a generated card |

## Every mode is a layout, not a flag

A flat row is a layout with no tilt. One card at a time sliding in from off screen is a layout
whose step puts the neighbours past the edge. A stack is a vertical layout. The widget has no
idea which of those it is drawing, which is the property the source's own `cf_draw` was written
to have and the reason a new mode costs a row of numbers rather than code.

## Each card is its own projection

A card turns about its own vertical axis by `-tilt * clamp(d, -1, 1)`, where `d` is its distance
from the centre in steps, and is seen through a perspective six of its own half-widths away. A
shared camera would foreshorten the small side cards less than the large centre card; a
per-card one makes every card turn the same way whatever its size. In the browser that is a
`perspective` on each card's wrapper and a `rotateY` inside it, which is the source's
`F / (F + z)` weak-perspective projection exactly - see `docs/porting/tortos.md`.

## Fitting art to a card

Contain, by default. **Equal area** gives every card the frame's area in the art's own shape, so a
wide SNES box and a tall NES box read as the same size of thing rather than one being half the
area of the other; **wide area** does the same but only for art wider than `wideArt`, at a
fraction of the frame's area, which is how console photographs lying flat are kept from being
contained into a sliver.

## Depth is draw order

Cards are drawn far to near and nothing uses a z-index: the centre card is last in the document,
so it wins. This is deliberate - every fidelity fault this repo has had was an element painted in
the wrong order, and a sort is something a renderer without a stacking model can reproduce.

## Reflections end on one floor

Each card's reflection starts where its art's opaque pixels stop - `contentBottom`, so a console
centred in transparent padding does not reflect the padding - plus the layout's gap, and runs down
to `reflect` half-heights below the card's centre whatever the art's height. A short wide cover
gets a long reflection and a tall one a short one, and every card stands on the same surface. The
mirror image fades from 90/255 at the mirror line to nothing at the floor.

## Fallback

Declares `transform3d` and `maskImage`. Without them the cards are drawn flat - still scaled and
faded by distance, but not turned - and without reflections. TortOS's flat layouts already look
like that apart from the reflection, so the row is still recognisably the same design.

## Motion

None of its own. `position` is a prop, and whatever drives it - TortOS's shelf is retargeted by
every press and restarts from where the cards are drawn, which no fixed timeline can express -
lives in the theme. At rest `position` is the cursor, so a still needs no clock.
