# Example OS

A fictional launcher, and the scaffold reference. **Copy `app/src/themes/example-cfw/` as the
starting point for a real firmware**, and copy this page as the starting point for its
documentation.

It is deliberately the smallest complete theme in the repo: two screens, one palette, no assets.
Everything a theme needs and nothing it does not.

## Source

n/a - this is a template, not a reproduction. A real theme's page names the upstream repository
and the commit it was read at, and links its extracted spec in `reference/source-notes.md`.

Mode: **design-new**. There is no screenshot to match, so there is no fidelity gate beyond the
diff against its stored baseline.

## What a theme is made of

```
app/src/themes/example-cfw/
  manifest.ts   which screens exist, on which devices - plain data, no React
  palette.ts    named colours
  data.ts       the strings and metadata the screens display
  layout.ts     resolve(device) -> boxes in device pixels
  index.tsx     the theme root: state, input, and which view to render
  routes.tsx    mounts each manifest entry in a device frame
  views/        one component per screen
```

The split matters. `manifest.ts` is free of React and CSS imports so tooling that only needs the
list of screens can read it without pulling in the application - the Playwright suite does
exactly that.

## The theme root

A theme root does four things, and `index.tsx` is all of them:

1. resolve the layout for the device it was mounted at
2. own the cursor and any navigation state
3. translate button presses into cursor and navigation moves
4. render the current view

It reads the device and the motion flag from context rather than taking them as props, so the
same component renders live, static, or in fallback mode without knowing which. A static screen
is not a second implementation - it is this one with `animate: false`.

## Layout

`resolve(device)` is a pure function returning boxes in device pixels. Every position on screen
comes from it; no view computes geometry of its own, and nothing derives position from CSS flow.

The spec is written as fractions of the screen, so the layout resolves for any device in the
registry. The original was authored as literal pixels for one 640x480 panel; the fractions are
exact divisions of those values, and `layout.test.ts` asserts that at 640x480 the resolver
reproduces them precisely. That is what stops "generalised" from quietly meaning "changed".

## Palette

Six named colours, passed to widgets as props. No widget reads a CSS custom property, because a
renderer without a cascade cannot provide one.

| Token | Value | Used for |
| --- | --- | --- |
| `background` | `#12141c` | the screen |
| `panel` | `#1b1e2b` | footer, detail column |
| `accent` | `#4cc9f0` | selection, rules, highlights |
| `text` | `#e7e9f0` | primary text |
| `muted` | `#8b90a3` | subtitles, hints |
| `onAccent` | `#0b0d13` | text on an accent-filled row |
| `onAccentMuted` | `#0b3b47` | a subtitle on an accent-filled row |
| `tile` / `tileText` | `#2a2e40` / `#cfd3e0` | the icon tile on a menu row |

## Screens

| Screen | What it shows |
| --- | --- |
| Main menu | Header with clock and battery, a five-row menu, a hint strip |
| Game list | Header with a back chevron and a count, a game list, a detail column, a hint strip |

Both resolve for `rg35xx` and `rg-cubexx`. Adding a device is one entry in `manifest.ts`.

## Input

| Button | Main menu | Game list |
| --- | --- | --- |
| D-pad up/down | move selection, wrapping | move selection, wrapping |
| A | open the focused item | launch (no-op) |
| B | nothing - this is the root | back to the main menu |

## Navigation

**This is the only theme in the repo that navigates between screens.** The others swap views
inside a single mounted root and never leave it.

It uses `useScreenNav`, which keeps a back stack rather than the original's fixed per-screen back
target. "B goes back" means where you came from, and once a screen is reachable from two places a
fixed target is wrong from one of them. With two screens the two models coincide, so nothing
about the reproduction changes.

## Widgets used

[HeaderBar](../widgets/HeaderBar.md), [TextList](../widgets/TextList.md) and
[ListRow](../widgets/ListRow.md), [HelpBar](../widgets/HelpBar.md),
[Clock](../widgets/Clock.md), [StatusIndicators](../widgets/StatusIndicators.md),
[GeneratedArt](../widgets/GeneratedArt.md).

No new widget was needed to port it, which is the result the phase was structured to test: if
the smallest theme had required inventing a widget, the vocabulary would have been drawn too
narrowly.

## Adding a theme

1. Copy this directory and rename it. Add the slug to `ThemeSlug` in `app/src/widgets/types.ts`.
2. Fill `palette.ts` from the firmware's theme format, keeping the source's own key names so a
   grep hits both.
3. Fill `data.ts` with the real on-screen strings. Do not invent labels.
4. Write `layout.ts` from the source's own layout definitions, as fractions of the screen.
5. Write one view component per screen, each opening with a PORTING NOTES block.
6. List the screens in `manifest.ts` and mount them in `routes.tsx`. Tag every static screen with
   its `types` and `elements` from [views.md](../views.md), and give the live build `LIVE_TAGS`.
7. Register the theme's routes in `app/src/themes/registry.ts`.
8. Add it to `app/src/themes/manifest.ts` and to the catalogue in `app/src/themes/catalogue.ts`.
9. Copy this page to `docs/themes/<slug>.md` and fill it in, and record every deviation from the
   source in `docs/porting/<slug>.md`.
10. Run `npm run test:e2e:update` to write the new screens' baselines, then look at them.

## What the three real ports taught

This scaffold was written before any of them, and it has been brought back into line with what
they settled on. The differences are worth knowing before copying it.

**`Interactive.tsx` is optional, and this theme is the case where it is not needed.** A theme with
mockup-only subsets - fourteen colour schemes, eleven views, five backgrounds - keeps that state in
its own `Interactive.tsx` so the theme's own props stay exactly the set a static screen passes.
That is what makes "a still is the live build with motion settled" true rather than aspirational.
With nothing to switch, the live route is two lines in `routes.tsx` and the extra file would be a
layer with nothing in it.

**A theme root gets a stacking context.** Every set here paints a full-bleed background under its
content, and every one of them at some point had that background swallow the screen. If the theme
has a root element with a background fill, give it `isolation: isolate` so a depth inside it cannot
escape. This scaffold has no such layer, which is why it has no such rule - and why it would not
have taught you the lesson.

**Geometry resolves once, up front.** `layout.ts` here resolves fractions to device pixels in a
pure function of `(device, options)`. The two large sets do the same through a bigger `spec.ts`
with per-condition variant rows. Either way the rule is the same: a view component receives
numbers, never a formula, and never reads back from the DOM.

**Motion is not the same as inertness.** `animate={false}` settles motion. What makes a screen
inert is `interactive={false}`, which gives it no input provider. Do not gate a press handler on
`animate` - it reads as harmless and makes the screen impossible to drive with a stable background,
which is exactly what an interaction trace needs.

**Look at the screen.** Every serious fault in this repo was a compositing fault that passed the
entire test suite. Whatever else you do, render it and compare it against the source's own
screenshots.
