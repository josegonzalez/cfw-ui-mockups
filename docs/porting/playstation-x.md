# Porting notes: PlayStation X

What changed between [`legacy/playstation-x/`](../../legacy/playstation-x/) and
`app/src/themes/playstation-x/`.

The original was six files - a resolver, a palette module, a storyboard compiler, a storyboard
table, a view builder and a controller - driving 48 boot stubs. The port keeps the resolver, the
palette and the storyboard table close to verbatim, promotes the compiler to the shared
animation system, and replaces the builder and controller with components.

This is the largest set in the repo: eleven views, 22 storyboards carrying 97 animation tracks
across 49 events, eight live subsets, and a layout that resolves through variant arrays where a
later matching row wins.

## How the port is checked against the original

Three places where a transcription error is invisible and total, all checked by running the
**original** code under `node:vm` and comparing value by value:

- `scripts/gen-psx-golden.mjs` boots `legacy/playstation-x/layout.js` and captures `resolve()`
  for all 108 combinations of device, carousel type, carousel size and top-info variant, and
  `palette.js` for all 18 colorset and accent pairs.
- `scripts/gen-psx-data.mjs` does the same for the library and the art factories, across all 25
  games.

`layout.test.ts`, `palette.test.ts` and `art.test.ts` assert the port matches those fixtures. A
self-snapshot would only prove the port agrees with itself.

Two of the compiler's invariants existed as prose in `source-notes.md` and as two Python check
scripts that were never part of any run. Both are now executable assertions in
`storyboards.test.ts`: no property group carries more than one `repeat` track, and every finite
autoreverse track is alone on its property. The compiler's simplifying assumptions depend on
both.

**The golden fixtures did not catch a single one of the faults listed under "Fidelity faults"
below.** Every one of those was found by rendering the screen and looking at it. The fixtures
prove the numbers; they say nothing about what those numbers paint.

## Deviations

**The subsets moved out of the theme.** The original's controller owned both the theme and the
mockup's own view/colorset/carousel switcher, and split every change into three update classes -
colour-only, geometry, animations - because a rebuild would discard the cursor and every running
animation. Those are now `Interactive.tsx` and the shared `SubsetPanel`, and the update classes
are gone: React re-renders with the same component identity, so the cursor and the storyboards
survive a colour change on their own.

**The scheme stays in the cascade; nothing a widget owns reads it.** As with Elementerial, and
for the same reason. All 34 palette tokens are written as custom properties on `.psx`, because
that is what the source does and it makes a colorset change one style recalc. Widgets still take
their colours as prop values.

**The clock shows a fixed time on static screens.** The original rendered the wall clock, so no
two captures of the same screen matched.

**Assets resolve through the bundler.** `assets.ts` resolves every path through
`import.meta.glob`, so a wrong filename is a build error rather than a silently empty box.

**The hint bar stops before the battery.** Both are frontend elements the theme only positions,
and EmulationStation lays them out together - it fits the prompt row into whatever the battery
leaves. The mockup draws the prompts as fixed text, so without an explicit stop the last prompt
runs underneath the battery. The prompt row is clipped at the battery's left edge; on a 640x480
panel that truncates `LAUNCH`.

## Defects fixed

Each of these was found by reading the source; each now has a test.

**`buildSingle` created a second marquee `<img>` that overwrote `this.marqueeEl`**, orphaning the
first with no `src`. That orphan is the empty bordered box in the top-left of the legacy single
view. The port draws one.

**`SPEC.battery` was fully specified and never rendered.** It is drawn, at its authored box. The
theme ships no battery image, so it is drawn rather than blitted.

**`SPEC.help`'s `{view: 'gamelist'}` variant rows were unreachable**, because `view` was never
placed into the matcher state - so the hint bar was always sized for the system view. The theme
root supplies it.

**`SPEC.fullGrid.systemName` was defined and never rendered.** It draws, down the left column
under the metadata block.

**Three storyboards were transcribed and never bound**: `systemcarousel`, `caratula-overlay` and
`gamegrid-enter`. All three are bound, and `bindings.ts` is a table pairing every storyboard with
the element that carries it, so an unbound one is now a test failure rather than dead data.

**Seven custom properties were written by `applyColors` and consumed nowhere**, while colours
that should have come from tokens were hardcoded. `paletteVariables()` publishes all 34 tokens
and the two hardcodes are gone: the gold trophy was
`filter: invert(72%) sepia(85%) saturate(1200%) hue-rotate(2deg)` over a white pictogram, which
meant the colour could not follow the accent and was not a token at all - it is a mask painted
from `cheevosOnColor`. The multi-disc chip was a literal `#F3C300`.

**`transform-origin` was set by a CSS class rather than the resolved `origin`,** contradicting
`source-notes.md:319`. The resolved origin drives it. Verified against the reference screenshots
and the legacy pages across all four devices before keeping the change.

## Fidelity faults found by looking at the screen

These were introduced by the port, not inherited. They are recorded because the class of fault
matters more than the individual bugs: **every one of them left the geometry numerically
correct**, so the golden fixtures, the unit tests and any computed-style check all passed while
the screen was visibly wrong. `views.test.tsx` now asserts each one.

**The tile grid painted underneath the background.** The wrapper that carries the grid's entry
animation always has a transform, and a transformed element is a stacking context - which
re-bases every z-index inside it against the wrapper's own. Left at `auto`, the whole grid sat at
0 and the z-45 background covered it. The wrapper now carries the grid's own z. This is the same
class of fault as Elementerial's missing `isolation: isolate`, from the opposite direction.

**`padding` meant the wrong thing.** In this theme both `padding` and `margin` inset a tile
*within its own cell* - `left = i * cellW + padX; width = cellW - padX * 2`. Handed to `TileGrid`
as its box inset, the grid shifted by one pad and the tiles stayed at full cell size, which made
the PS4 row tall enough to bury the Start pill underneath it.

**Single-line text was placed at its box's top edge.** EmulationStation centres a text element
vertically inside its authored box, and the theme relies on it two ways: with a real height the
line centres inside it, and where the height is authored as ~0 - `system_name` is
`size 0.6 0.001` - there is no box to centre in and the line centres on the `y` itself. Taking
that 0.001 literally gave a half-pixel-tall element. `textLine()` in `views/Chrome.tsx` is the
rule.

**`boxOf` dropped the z-index.** Every call site re-applied it by hand, which is a rule that only
has to be missed once - and was, on the icon row, which then had no z-index and painted under the
background. `boxOf` carries `z` now.

**The detailed view drew a badge row where the star rating belongs.** `detailed` declares
`gamelist`, `image`, `gamedata`, `gamedata2`, `lineaInfos` and `gamedesc`, and no `iconos`.
`MetaRows` and `SideMedia` now draw exactly the nodes a view declares, mirroring the source's
`buildMetaRows` and `buildSideMedia`, so a view cannot wire them wrongly.

**Three views lost their featured image** by not calling `SideMedia` at all - grid, carousel and
full grid.

**The PS5 title was left-aligned**; the source right-aligns it.

**The media tester drew empty frames for unscraped slots.** The source draws
`no-image-default.png`, the frontend's own placeholder, which is what makes a missing asset read
as missing rather than as a slot that failed to load.

**`text-overflow: ellipsis` did nothing**, because the list row was a flex container and the
property does not apply to a flex container's own text.

**The splash progress bar had rounded ends.** The widget's default is a pill; the source's bar is
a plain rectangle.
