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
| [FullScreenFade](FullScreenFade.md) | A full-screen fade for launch and power-off | elementerial, vitrolauncher |
| [GeneratedArt](GeneratedArt.md) | Deterministic placeholder artwork | all |
| [HeaderBar](HeaderBar.md) | A screen header with an optional rule | example-cfw, elementerial |
| [HelpBar](HelpBar.md) | The button-hint strip | example-cfw, elementerial, playstation-x |
| [ListRow](ListRow.md) | One row of a selectable list | all |
| [MenuPanel](MenuPanel.md) | A modal settings menu over a dimmed screen | elementerial, vitrolauncher |
| [Scrim](Scrim.md) | A tint over the screen, softened by a mask | all but example-cfw |
| [StarRating](StarRating.md) | A row of rating stars, tinted with the accent | elementerial, playstation-x |
| [StatusIndicators](StatusIndicators.md) | Wifi, battery and other corner indicators | all |
| [TextList](TextList.md) | A vertical list with one selected row | all |
| [TileGrid](TileGrid.md) | A grid of tiles, paged or scrolled as a strip | all but example-cfw |

## Still to come

The kit is grown by the theme that needs it, not designed up front. A vocabulary invented for
three themes before any of them exists is guesswork; one grown against real screens is not.

| Widget | Arrives with |
| --- | --- |
| `Ticker`, `Badge`, `IconRow`, `ProgressBar` | PlayStation X |
| `GlassPanel` | Vitro Launcher |

Elementerial's additions have landed. Two things it did *not* need a widget for: the edge fades
in its Elementflix view are a [Scrim](Scrim.md) with a fade mask, and its favourite heart is a
positioned image. Neither earns a name of its own.

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
