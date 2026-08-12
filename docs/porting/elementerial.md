# Porting notes: Elementerial

> The original vanilla-JS mockup this page compares against has since been removed - every
> implementation here is the interactive application. The comparisons below are kept as the
> record of what changed and why.

What changed between the original vanilla-JS mockup and `app/src/themes/elementerial/`.

The original was six files - a resolver, a palette module, a view builder, a controller, a
stylesheet and a generated mask stylesheet - driving 36 boot stubs. The port keeps the resolver
and the palette almost verbatim, because both were already pure functions of
`(device, options)`, and replaces the builder and controller with components.

## How the port is checked against the original

The resolver and the generated art are the two places where a transcription error is invisible
and total. Both are checked by running the **original** code under `node:vm` and comparing:

- The fixtures were captured by running the original's own `resolve()` under `node:vm`, across
  all 24 combinations of device, font size and grid direction, and the same for the library and
  the art factories. They are frozen now - the code that produced them went with the original -
  so treat a change to one as a deliberate decision rather than a refresh.

`layout.test.ts` and `art.test.ts` assert the port matches those fixtures value by value. A
self-snapshot would only prove the port agrees with itself; this proves it agrees with what it
reproduces.

## Deviations

**The 5:3 overlays now draw, so the RG552 screens differ from the original.** See "Defects
fixed" below. This is the one place where the port deliberately does not match the original.

**The scheme stays in the cascade; nothing a widget owns reads it.** Portability rule 3 bans
cascade dependence, and this is the documented exception: the five scheme tokens are written as
custom properties on `.el-root`, because that is exactly what the source does and it makes a
scheme change one style recalc across every view rather than a re-render. Widgets still take
their colours as props - the theme passes `var(--mainColor)` as a *value*, which a non-DOM
renderer resolves at build time instead.

**Subsets moved out of the theme.** The original's controller owned both the theme and the
mockup's own view/scheme/font-size switcher. Those are now `Interactive.tsx` and a shared
`SubsetPanel`, so `Elementerial` takes the same props whether it is a static screen or the live
build. That is what makes "a static screen is the live build with motion settled" true rather
than aspirational.

**The clock shows a fixed time on static screens.** As with every other theme here: the original
rendered the wall clock everywhere, so no two captures matched.

**Assets resolve through the bundler.** The original built asset paths as strings at runtime, so
a typo produced a silently empty box. `assets.ts` resolves every path through `import.meta.glob`,
which turns the same typo into a build error. It is also what let the 5:3 defect be found: the
overlay lookups return `null` when the file is genuinely absent, and a `null` is visible where a
broken `url()` is not.

**`masks.css` is gone.** It existed because Chrome CORS-blocks `mask-image` across `file://`
origins, so every mask had to be inlined as base64 by a generator script that was never
committed. Served over HTTP the real files work.

**The menu draws over the view it was opened from, as data.** The original tracked
`_lastGamelist` on the controller and toggled a CSS class on the layer beneath. The port passes
`behind` as a prop, so which view is underneath is part of the screen's description rather than
a side effect of navigation history.

## Defects fixed

**The 5:3 aspect drew neither overlay.** `elementerial.css` had rules for `ratio43`, `ratio11`
and `ratio32` but none for `ratio53`, so on all nine RG552 pages the on-screen-display scrim and
the rounded-corner border never drew - despite `assets/ratio53/osd-bg.png` and `borders.png` both
shipping, and despite `masks.css` carrying the 5:3 scrims. The port resolves overlays by asking
whether the artwork exists, so they draw wherever it does. The RG552 screens therefore differ
from the original, and that difference is the fix.

**The device frame styled the theme's help bar.** `shared/device-frame.css` declared a bare
`.pill` for the Start and Select buttons in the button cluster. Elementerial's help bar gives its
own Start and Select pictograms a `pill` class too, so the frame's `padding: 5px 12px` and inset
highlight applied to them - and with `box-sizing: border-box` that padded a 13.9x7.5px glyph out
to a flat 24x10px on every device. The theme's stated `1.15em x 0.62em` never took effect. The
frame's rule is now scoped to `.device__meta`, and `HelpBar` takes an explicit `badgeFont` so the
glyph is proportioned from its own size rather than from the label's.

**Declared and unused custom properties.** `--el-info-delay`, `--el-video-delay`, `--icon-star`
and `--icon-star_border` were written and never consumed. The delays are now real: the system
info fade runs its 150ms-out / 300ms-in cycle, and the star artwork is drawn by `StarRating`
rather than referenced by a property nothing read.

## Found by looking at it

Rendered and compared screen by screen, on every device. These are the ones no
automated check caught.

**Every view was invisible.** The theme's z-order runs from -9 (system artwork) to 100
(overlays), and `.el-root` paints an opaque `bgColor` fill. The original forced a stacking
context on its per-view wrapper (`.el-view { isolation: isolate }`); the port has no wrapper, so
without it every negative layer escaped to the nearest ancestor stacking context and painted
*behind* that fill. Element boxes, z-indexes, palette tokens and console output were all correct.
`.el-root` now declares `isolation: isolate`, and a test asserts it.

**The list clipped its own text at the wrong place.** The selection bar spans the full list width
while the label is inset by the engine's horizontal margin. Clipping the row rather than the
label let an over-long title run one margin's width past where the engine stops it.

**The row straddling the bottom edge was dropped.** The list box is not a whole number of rows.
Scrolling moves in whole rows, so the window is sized on rows that fit completely - but the
engine still paints the partial one. Sizing both on the same count made the video list show seven
rows where the original shows eight, the last one clipped.

**The grids filled the wrong way and stopped at the panel edge.** All three tile views advance
along the axis they scroll, so a sideways-scrolling grid is column-major: item 1 is *below* item
0, not beside it. The port filled row-major and paged. It also drew only whole pages, where the
original lays out every tile and clips, so the partly visible column at the right edge - the only
cue that there is more to scroll to - was missing.

**Elementflix cut its own artwork short.** Only the plain grid gives its caption a band of its
own; boxes and elementflix draw the caption over full-bleed art. Subtracting the caption height
in all three left the selected tile's white selector plate exposed below the art.

**The help bar sat under the video view's scrim.** The diagonal scrim is at z 4 and the hint bar
had no z of its own, so on the video and elementflix views the bar vanished. The clock and status
glyphs had the same problem against the OSD overlay at z 100. Both now carry the source's own
values - 20 for the hint bar, 101 for the status bar.

**The menu was wrong in three ways.** It drew over a basic game list rather than over whichever
view was showing; it kept the hint bar visible, where the engine hides it behind the menu; and it
clipped its last row in half instead of sizing the panel to a whole number of entries. Its
entries were also invented rather than transcribed.

## Checked against the reference screenshots

The four screenshots in [`themes/elementerial/reference/`](../themes/elementerial/reference/) are
from the theme's README, dated May 2023; the per-aspect layout files are from July 2025. They
disagree, and the port follows the source, as the original mockups did. Two divergences are
visible in a side-by-side and are expected rather than faults:

- the screenshots set the system name in title case, the source uppercases it
- the screenshots put the boxes caption in a band below the art, the source draws it as a chip
  over the art

Everything else - carousel pitch, selected scale, title and count placement, tile grid, the help
bar - matches. The badge proportions in particular corroborate the help-bar fix above: the
glyphs in the reference are small relative to their labels, which is what the source's `0.72em`
badge font gives and what the frame's leaked padding was overriding.

`source-notes.md` lists every divergence in full.

## Widget changes this phase forced

Phase 4 drew the vocabulary before any large theme existed, and this is where that guess got
corrected.

- **`TileGrid`** gained `order` (`row-major` / `column-major`) and two more scroll modes
  (`strip`, `rows`) alongside `page`. Paging was the only model it had; none of Elementerial's
  three grids page.
- **`MenuPanel`** gained `fitMenu`, which sizes the panel to whole entries, and three colour keys
  it was previously hardcoding: `valueFg`, and the button's border and selected pair.
- **`HelpBar`** gained `badgeFont`, so glyph size is stated rather than derived from the label.

## Not carried over

**The chrome strip's remaining subsets.** The original's strip also exposed grid game image,
default icon style, box art style, status bar, background style and carousel video. The panel
carries view, scheme, style, font size, grid direction and system - the six that change what the
screens actually look like. The rest are recorded in
[the theme page](../themes/elementerial.md#theme-and-config-format) and resolve to their
defaults.

**The 200ms view cross-fade** (`--el-view-swap`). It was mockup-only: EmulationStation does not
cross-fade between a gamelist and a grid, because you cannot switch between them at runtime. The
port renders one view.

## Verification

- `layout.test.ts` - the resolver against output captured from the original, across 24
  combinations, plus the properties that must hold per aspect.
- `art.test.ts` - the generated artwork against the original's own seeding, including the star
  threshold that needs an epsilon.
- `Elementerial.test.tsx` - every view renders, the partial row is drawn, the grids fill
  column-major and lay out every tile, the menu overlays the view behind it with the hint bar
  hidden and sized to whole entries, the status bar outranks the overlays, the root declares its
  stacking context, static screens ignore input, and the live build's cursors and subset keys
  work.
- `e2e/screens.spec.ts` - all 36 routes render with no console errors, draw content, and have
  nothing opaque covering them.
- `e2e/baseline.spec.ts` - a stored capture of every screen at the device's own resolution,
  which is the comparison a computed-style check cannot make.
