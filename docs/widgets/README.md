# Widget catalogue

The shared vocabulary every screen is built from.

This list is the deliverable. The React application is the reference renderer that proves the
vocabulary is complete and correct against real screens, but the vocabulary itself is what a
second renderer would implement. Everything here therefore holds to
[portability.md](../portability.md): typed props, resolved pixel geometry, no cascade
dependence, motion as data.

Each widget is registered in `app/src/widgets/registry.ts`. A test asserts that the registry,
this directory and the Storybook stories all cover the same set, so the catalogue cannot drift
away from the code.

## The vocabulary

| Widget | What it is | Used by |
| --- | --- | --- |
| [AnchoredImage](AnchoredImage.md) | An image fitted to a slot, then shrunk to its fitted size | elementerial, playstation-x |
| [Carousel](Carousel.md) | A strip where the strip moves and the selection stays put | all but example-cfw |
| [Clock](Clock.md) | The status-bar clock | all |
| [Coverflow](Coverflow.md) | A row whose centre card faces you and whose neighbours turn away, reflected onto one floor | tortos |
| [FullScreenFade](FullScreenFade.md) | A full-screen fade for launch and power-off | elementerial, vitrolauncher |
| [GeneratedArt](GeneratedArt.md) | Deterministic placeholder artwork | all |
| [GlassPanel](GlassPanel.md) | A frosted stadium that samples the background beneath it | vitrolauncher |
| [HeaderBar](HeaderBar.md) | A screen header with an optional rule | example-cfw, elementerial |
| [HelpBar](HelpBar.md) | The button-hint strip | example-cfw, elementerial, playstation-x |
| [ListRow](ListRow.md) | One row of a selectable list | all |
| [MenuPanel](MenuPanel.md) | A modal settings menu over a dimmed screen | elementerial, vitrolauncher |
| [Scrim](Scrim.md) | A tint over the screen, softened by a mask | all but example-cfw |
| [StarRating](StarRating.md) | A row of rating stars, tinted with the accent | elementerial, playstation-x |
| [StatusIndicators](StatusIndicators.md) | Wifi, battery and other corner indicators | all |
| [TextList](TextList.md) | A vertical list with one selected row | all |
| [TileGrid](TileGrid.md) | A grid of tiles, paged or scrolled as a strip | all but example-cfw |

## How the kit grew

The vocabulary was grown by the theme that needed it rather than designed up front - a set
invented for four themes before any of them exists is guesswork; one grown against real screens is
not.

| Arrived with | Widgets |
| --- | --- |
| Example OS and Elementerial | the first cut - lists, grids, chrome, art |
| PlayStation X | `Ticker`, `Badge`, `IconRow`, `ProgressBar` |
| Vitro Launcher | `GlassPanel` |
| NextUI | none, and it uses none |
| TortOS | `Coverflow` |

Three sets added between one and four widgets each, which is the useful signal: the first cut was
close to right, and what the later themes needed were leaf components rather than changes to the
shape of the vocabulary.

**NextUI is the interesting case, because it adds nothing and takes nothing.** It is the only set
here that is not a handheld frontend: a Nintendo 64 flashcart menu, drawn to a television, whose
whole visual language is a stadium pill sized to the text inside it. Its list rows are pills that
fit their own label, its hint bar is a measured group of individually-backed pills naming buttons
no handheld has, and its titles are 32px text with a documented vertical fudge. `TextList` and
`HelpBar` both assume a row-shaped box and a handheld glyph set, so reusing either would have meant
widening them until they stopped saying anything.

That is a result rather than a gap. It says the kit is a vocabulary for *this* class of screen -
frontends and launchers on handhelds - and that a genuinely different device draws its own
primitives. A C system should expect the same: a shared kit, plus themes that opt out of it.

Several things did *not* earn a widget. Elementerial's Elementflix edge fades are a
[Scrim](Scrim.md) with a fade mask; its favourite heart is a positioned image. Vitro's four
animated backgrounds are a continuous render loop rather than a timeline, so they live in the theme
and stay outside both the widget kit and the animation system.

## Conventions

**Geometry.** Every widget takes a `box` of resolved device pixels and positions itself
absolutely. None derives its position from document flow.

**Colours.** Passed as props. No widget reads a CSS custom property or relies on inheritance,
because a renderer without a cascade cannot provide either.

**Optional props** are declared `?: T | undefined` rather than `?: T`. With
`exactOptionalPropertyTypes` on, the plain form cannot receive an explicit `undefined`, which
would force every caller to assemble props by conditional spread.

**Motion** is declared as descriptors and passed in, never performed by the widget. See
[animation.md](../animation.md).

**Slots** are named props typed `ReactNode` - `HeaderBar`'s `right`, for instance. A slot is a
child widget subtree, which a template system models as a child node list. This is not the same
as a props spread, which stays banned.

**Web-only capabilities** are declared in the widget's registry entry alongside the fallback it
renders instead. A widget declaring one without the other fails the registry test.

## What a C system would have to provide

The vocabulary is settled: five sets are ported, the last three handheld sets needed between one
and four new leaf widgets each rather than any change to its shape, and the one non-handheld set
needed none of it. So this is the handoff - what a second
renderer, with no DOM and no cascade, would have to implement to draw every screen in this repo.

**Twenty widgets.** Each is a pure function of typed props onto a rectangle. None reads ambient
state, so each can be compiled independently.

**One geometry primitive.** A `Box` of resolved device pixels - `left`, `top`, `width`, `height`,
plus an optional font size, corner radius and depth. Every position in every theme resolves to one
of these before a widget sees it, so the renderer never needs a layout engine. Two placement forms
exist: a plain box, and an *anchored* box that sizes to its content and then shifts by a fraction
of its own size. The second is not a special case of the first, and themes depend on it.

**A depth model with real stacking.** Every fault this repo has had was a compositing fault, and
all four came from the same place: an element that was numerically correct and painted in the
wrong order. A renderer needs a total order over drawn elements that a caller can reason about
locally - if a container can silently re-base the depths inside it, as a CSS stacking context
does, the same class of bug is waiting.

**Motion as a timeline of segments.** `channel, from, to, begin, duration, easing`, plus repeat
and alternate. Seven channels - opacity, two offsets, two positions, scale, depth - and eleven
easings, which is every curve the sets between them use. Two properties matter beyond the obvious: several channels animate on one element at
once and must compose rather than overwrite, and every track has a defined *resting* value so a
still can be drawn without running a clock. See [animation.md](../animation.md).

**Text with declared metrics.** Family, size, weight, and an explicit wrap and truncation rule.
No widget relies on the renderer measuring text for it, and where the source truncates, the rule
is a prop rather than a CSS property.

**Three image fit modes** - contain, cover, and the anchored fit above - each with a corner radius
and an optional nearest-neighbour scale for pixel art.

**One capability flag.** Whether the richer path is available. Five effects across the sets need
it: backdrop blur, an arbitrary mask, CSS ellipsis, a fragment shader, and a perspective transform.
All but the shader are declared by widgets alongside the fallback they render instead; the shader
belongs to Vitro's wave background, which is a render loop rather than a widget and carries its own
2D approximation. TortOS's cube and its additive glow are theme-local and degrade the same way - a
cut between faces, a normal blend. A renderer implementing none of them still draws every screen
in this repo.

(The capability list also names `boxReflect`, which no widget currently declares - PlayStation X's
carousel reflection was dropped during the port. It is kept in the type because the effect is real
in the source and a future screen may want it.)

What it would *not* need: a cascade, a layout engine, document flow, or a way to express a
selector. Nothing in the vocabulary uses any of them.
