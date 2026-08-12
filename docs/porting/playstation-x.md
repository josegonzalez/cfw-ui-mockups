# Porting notes: PlayStation X

> The original vanilla-JS mockup this page compares against has since been removed - every
> implementation here is the interactive application. The comparisons below are kept as the
> record of what changed and why.

What changed between the original vanilla-JS mockup and `app/src/themes/playstation-x/`.

The original was six files - a resolver, a palette module, a storyboard compiler, a storyboard
table, a view builder and a controller - driving 48 boot stubs. The port keeps the resolver, the
palette and the storyboard table close to verbatim, promotes the compiler to the shared
animation system, and replaces the builder and controller with components.

This is the largest set in the repo: eleven views, 22 storyboards carrying 97 animation tracks
across 49 events, eight live subsets, and a layout that resolves through variant arrays where a
later matching row wins.

## Which source is authoritative

The original mockup was **not** the theme. It is one transcription of the theme's XML, made by
hand, and the golden fixtures below only ever proved that the port agrees with *that*.

Checking the top bar against the upstream file directly found rows the transcription never
carried, several of them load-bearing on the two 480-tall devices. So `topInfo` is now verified
against the XML, by `topInfo.test.ts`, which cites a line number for each value, and
`layout.test.ts` excludes it from that fixture. The other ten view blocks still rest on that
fixture and have not had the same treatment - **they should be assumed to carry similar gaps.**

To re-fetch a view file for checking, in a container rather than on the host:

```
docker run --rm curlimages/curl:latest -sL \
  https://raw.githubusercontent.com/pajarorrojo/es-theme-PlayStation-X/26ce759/_theme_views/top-info.xml
```

### The sweep

All eleven views were then checked the same way. The method was to replay the XML for each of the
four devices and match the result against the port's resolver **by resolved geometry rather than
by element name** - the theme reuses names across option files, so a name map would be guesswork,
but a box is self-verifying: if the port puts a node at the same pixels the source does, they are
the same element.

Four structural facts have to be honoured or the replay is meaningless, and each one produced a
round of false positives before it was:

- Views are `<customView name inherits="grid">`, so ps4Style, ps5Style, carousel, full-grid and
  single all layer on top of `grid`, and test-medias on top of `detailed`.
- A container, its element and its property may **each** carry `ifSubset`, and they compose. A
  `<pos ifSubset="aspect-ratio:4-3">` inside a `carousel-type:PS4` block applies only when both
  hold.
- The carousel option files are selected by `theme.xml`'s include, not by any condition inside
  them, so a row's *file* is part of its condition.
- `origin` is the fraction of the element's own size that sits on `pos`, so it has to be applied
  before comparing boxes.

Two more quirks are worth recording: `carousel.xml` is not well-formed XML - it redefines an
attribute, and EmulationStation's parser is lenient enough not to care - and several elements put
a data expression where a number belongs, such as
`<y>empty({game:desc}) ? 0.625 : 0.790</y>`.

**Result.** `ps5Style`, `grid`, `carousel`, `detailed`, `splash` and `gamesplash` agree with the
source exactly. `mediaTester`'s nine slots agree too, checked by hand because they live in the
component rather than the spec. The rest is below.

## How the port is checked against the original

Three places where a transcription error is invisible and total, all checked by running the
**original** code under `node:vm` and comparing value by value:

- The fixtures were captured by running the original's own resolver and palette under `node:vm`,
  across all 108 combinations of device, carousel type, carousel size and top-info variant, all
  18 colorset and accent pairs, and all 25 games. They are frozen now - the code that produced
  them went with the original - so treat a change to one as a deliberate decision.

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
first with no `src`. That orphan drew as an empty bordered box in the top-left of the single
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

**The top-bar achievements trophy never drew.** It blinks `opacity 0 -> 1` forever, and the
resting rule for an autoreverse track was its `from` - so it settled to fully transparent and was
absent from every static screen. It is the only track in the corpus whose `from` is the away-from-
authored end; the other fourteen start at the element's authored value and move off it, which is
why the rule held everywhere else. `docs/animation.md` carries the refinement: an infinite
alternator rests at the authored end, a finite one still rests at its `from`.

The reference screenshots show the trophy alongside the star and the year, and the port now
matches them on 16:9. On the two 480-tall devices the theme's own coordinates place the trophy
(`0.885` on `4-3`) inside the year's box (`0.875`, `0.048` wide), so the two overlap. That clash
is the theme's, not the port's - it was simply invisible while the icon was. No reference
screenshot of a 4:3 panel exists to check it against, so it is left as the numbers say.

**`transform-origin` was set by a CSS class rather than the resolved `origin`,** contradicting
`source-notes.md:319`. The resolved origin drives it. Verified against the reference screenshots
and the original across all four devices before keeping the change.

## Top bar: what checking against the XML found

All of these were in the original transcription too, so the port inherited them. Line numbers are
against `_theme_views/top-info.xml` at `26ce759`.

**The release year was drawn on the two 480-tall devices.** `:529` hides it on `4-3|3-2|5-4`,
and that row was missing. Because the trophy shifts right on those aspects (`:148`, `:150`) it
landed on top of the year, and the clash read as a z-order bug.

**The frontend logo and its plus pictogram were drawn on every view.** Both are authored under
`<view name="system">` (`:53`), so they belong to the system view alone; `:84-91` then hides them
on tinyScreen and on `4-3|5-4`. The port had them unscoped and always visible, which put the
yellow plus over the ticker on every gamelist.

**The blinking achievements pulse was bound to the wrong element.** `trophy-picto` (`:145`) is
static, always drawn, and has no storyboard. `cheevos-picto` (`:187`) is a *separate* image at
the same coordinates one z above, shown only for a game with achievements, and it is the one
carrying the `opacity 0 -> 1` blink. Conflating them is what made the trophy disappear.

**The blue dots were derived rather than placed.** Both are their own elements with their own
coordinates - `punto-azul` at `:404`, before the version tag, and `puntoazul-2` at `:434`, beside
the avatar. The port computed the first from the version tag's left edge and omitted the second
entirely. The derivation landed within a pixel or two, which is why it went unnoticed.

**Per-aspect rows were missing throughout**: the star's position on `5-3` (`:502`), the year's on
`16-10` and `5-3` (`:515-517`), the version tag's on `4-3|5-4` (`:420`), the clock's tinyScreen
font size (`:17`), the username's size and font size on `3-2` and `4-3` (`:481-487`), the
ticker's size on `4-3|5-4|3-2|5-3` (`:387`), and the cover art's `maxSize` on `3-2` (`:241`).

The visible result on the RG35XX and RG34XX is that the top-left corner is now empty - the logo,
the plus pictogram and the system cover art are all hidden there - and the ticker starts at the
screen edge instead (`:385` puts it at `0.065` rather than `0.162`). That is what the theme
says; the corner is deliberately reclaimed for the ticker on a small panel.

## The system view: what the sweep found

**Every device but the 16:9 one drew the chooser at the 16:9 coordinates.** The system block is a
three-axis matrix - carousel size by console style by aspect ratio - and the transcription carried
only the first two. 93 rows were missing across the carousel strip, the selection frame, the Start
pill, the system name, the console art, the logo, the folder chip and the character cutout.

The effect on a 4:3 panel is not subtle: the frame belongs at `0.063` and was drawn at `0.162`,
the strip origin at `-0.94` rather than `-0.595`, and the system name at `0.295` rather than
`0.335`. The chooser now uses the width of a small panel the way the theme intended instead of
leaving a gap down the left.

The rows are generated from the option files rather than hand-copied - a hundred-odd decimals is
a transcription error waiting to happen - and `systemView.test.ts` pins the result.

**`single`'s title was missing its small-screen override.** `single.xml` lifts it with
`<y if="${screen.height} <= '480'">0.278</y>`, the same idiom `ps4-style.xml` uses and which the
port already honoured there.

## Open questions the sweep raised

None of these are changed, because in each case the evidence does not clearly favour the source
over what the port and the original already agreed on. They are recorded so the next person does not
have to rediscover them.

**The bottom rule's `<y>0.995</y>`.** `linea-inferior` carries both `<pos>0 0.934</pos>` and an
unconditioned `<y>0.995</y>`, which would put the rule hard against the bottom edge, below the
hint bar. The reference screenshot of the real firmware shows it above the hint bar at about
`0.93`. The port draws `0.934` and matches the reference, so the `<y>` row appears to be inert
for this element - but the theme uses the same idiom elsewhere and it *is* honoured there, so the
rule that decides which wins is not known.

**`full-grid`'s metadata row.** The theme writes `<pos>x 0.577</pos>` - malformed, with a stray
`x`. The port reads `0.577` as the y, which is what the view's layout wants. A strict reading
discards the row and inherits `0.22` from `grid`, which would put the row under the tile grid.

**`single`'s one-cell grid.** `single` sets `autoLayout 1 1` and positions the grid mostly
off-screen left. Neither the port nor the original drew it, and there is no reference screenshot of
that view to settle what it should look like.

**`single`'s absolutely positioned system name**, at `0.213 0.512`. The port draws the collection
chip inline after the title instead. It only appears inside a Collection, so no static screen
shows it.

**A second element named `fullName`** in the carousel files, a large box at the carousel's own
position. Unmodelled, and its purpose is unclear from the markup alone.

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

**Then the same rule was applied to elements with no authored height at all,** which lifted the
hint bar and the folder chip by half a line each. A height authored as ~0 and no height are not
the same case: an unsized element keeps its top edge and sizes to its own content. The original
never hit this, because it called its `textLine` on six elements - five with real boxes and one
authored `0.001`. Both matched the original to the pixel on all four devices.

The hint bar's *height* differs from the original on three of the four, because it is content
sized and the font is no longer the same: honouring `SPEC.help`'s `{view: 'gamelist'}` rows drops
it from `0.03` to `0.026`. `rg35xx` is unaffected - it is `tinyScreen`, where the two coincide.

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
