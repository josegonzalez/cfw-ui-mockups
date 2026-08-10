# PlayStation X

Mockups of the **PlayStation X** theme for the Batocera EmulationStation fork - a
PlayStation-styled theme that reproduces the PS3, PS4 and PS5 interfaces across 7 gamelist
view types and 3 system-carousel styles.

- Source: [github.com/pajarorrojo/es-theme-PlayStation-X](https://github.com/pajarorrojo/es-theme-PlayStation-X) @ `26ce759` (v43.1)
- Licence: CC BY-NC-SA 4.0
- Authoritative extraction, with a `file:line` for every value: [`reference/source-notes.md`](playstation-x/reference/source-notes.md)
- Reference screenshots from the theme author's own site: [`reference/`](playstation-x/reference/)
- What changed in the React port: [`porting/playstation-x.md`](../porting/playstation-x.md)

Implemented at `app/src/themes/playstation-x/`. The archived original is under
[`legacy/playstation-x/`](../../legacy/playstation-x/).

The theme targets Batocera 39+ / RetroBat 6+ and also runs on EmuElec. It is a Batocera-fork
theme (`formatVersion 7`), not RetroPie ES or ES-DE.

This is the repo's largest set, and the one that supplies the shared animation system: its
`<storyboard>` format is the only motion format among the three themes that is a system rather
than a handful of transitions, so the compiler was promoted to `app/src/anim/`.

## Screens

Every view is published on every device the theme supports: four devices x (one interactive
build carrying all eleven views and every subset + eleven static snapshots) = 48 routes. A
static route is the same component with `animate={false}`, so motion settles to its resting
values rather than playing - there is no second implementation to drift.

| Screen | Source | Route (same slug under each device) |
| --- | --- | --- |
| Interactive, all views and subsets | all views | `#playstation-x/<device>/interactive` |
| System view | `_theme_views/front.xml` | `#playstation-x/<device>/system` |
| PS4 Style | `_theme_views/ps4-style.xml` | `#playstation-x/<device>/ps4-style` |
| PS5 Style | `_theme_views/ps5-style.xml` | `#playstation-x/<device>/ps5-style` |
| Detailed | `_theme_views/detailed.xml` | `#playstation-x/<device>/detailed` |
| Grid | `_theme_views/grid.xml` | `#playstation-x/<device>/grid` |
| Horizontal Carousel | `_theme_views/carousel.xml` | `#playstation-x/<device>/carousel` |
| Full Grid | `_theme_views/full-grid.xml` | `#playstation-x/<device>/full-grid` |
| Game by game | `_theme_views/single.xml` | `#playstation-x/<device>/single` |
| Media tester | `_theme_views/test-media.xml` | `#playstation-x/<device>/media-tester` |
| Boot splash | `splash.xml` | `#playstation-x/<device>/boot-splash` |
| Game launch | `gamesplash.xml` | `#playstation-x/<device>/game-launch` |

The slugs match the legacy filenames, so the A/B capture in `e2e/capture.spec.ts` pairs each
screen with its original by name.

Unlike Elementerial, every static screen boots with the same subsets - blue, PS4, medium,
default top info, on the PlayStation system. This theme's variation is in its eleven views, so
varying the palette as well would only make the set harder to compare against itself.

`splash.xml` and `gamesplash.xml` are separate theme roots, not views of `theme.xml`, which is
why neither carries the top bar, the hint bar or any of the shared chrome. They are rendered by
the same component so they share the layout resolver and the animation runtime.

## Views

Eight of the eleven are the same handful of elements at different coordinates, and they group
into four shapes:

| Shape | Views | What is distinctive |
| --- | --- | --- |
| Centre-selected strip | `ps4Style`, `carousel` | The cursor is pinned and the strip moves; the frame that marks the selection never moves |
| Paged grid | `ps5Style`, `grid`, `fullGrid` | Turns a page rather than scrolling by a row |
| Single card | `single` | One game at a time, with an arrow marking that there are more |
| Text list | `detailed`, `mediaTester` | A list down the left, a panel or a diagnostic sheet down the right |

`system` is the chooser, and the two boot screens stand alone.

A view draws exactly the nodes it declares. `detailed`, for instance, declares `gamelist`,
`image`, `gamedata`, `gamedata2`, `lineaInfos` and `gamedesc` - and no `iconos`, so it has no
badge row. `MetaRows` and `SideMedia` mirror the source's own `buildMetaRows` and
`buildSideMedia` and render per declared node, so a view cannot wire them wrongly.

## Devices

Each device maps to exactly one of the theme's own `aspect-ratio` subset values
(`theme.xml:31-50`), so no aspect ratio is invented.

| Device | Resolution | Aspect | `aspect-ratio` | tinyScreen | Opens on |
| --- | --- | --- | --- | --- | --- |
| `trimui-smart-pro` | 1280x720 | 16:9 | `16-9` | no | PS4 Style |
| `rg35xx` | 640x480 | 4:3 | `4-3` | **yes** | Horizontal Carousel |
| `rg34xx` | 720x480 | 3:2 | `3-2` | **yes** | Horizontal Carousel |
| `rg552` | 1920x1152 | 5:3 | `5-3` | no | PS4 Style |

`tinyScreen` is Batocera's `height <= 480` flag. `theme.xml:340` includes
`_theme_views/force-gridview.xml` when it is set, and that file's entire body is
`<theme defaultView="carousel"></theme>` - so the two 480-tall devices open on the carousel
gamelist rather than PS4 Style. It also hides the region tag and the top-bar cover art, and
raises several font sizes.

## Theme / config format

Batocera-ES XML. The parts that matter here:

- **`<subset>`** - user-selectable option groups declared in `theme.xml`, each pulling in an
  include. The theme ships ~30; this mockup exposes 6 live and pins the rest. The pinned list,
  with the value chosen and why, is in `reference/source-notes.md`.
- **`<storyboard>` / `<animation>`** - the animation format, ported as data. See below.
- **Normalized coordinates** - every position, size and font size is a fraction of screen
  width or height. `spec.ts` keeps them in those units and `resolve()` produces px once per device.
- **Property variants** - an element may repeat a property with different predicates
  (`ifSubset=`, `aspect-ratio=`, `tinyScreen=`, `if=`). **Last match wins**, which the source
  depends on.

## Palette

From `_theme_options/colorsets/{blue,black}.xml`. Token names below are the theme's own.
Keys marked * are overridden by the secondary accent.

| Token | blue | black | Use |
| --- | --- | --- | --- |
| `releaseColor` | `F3C300` | `F3C300` | release year in metadata rows |
| `genreColor` | `3CAEFB` | `3CAEFB` | genre, and its bullet |
| `developerColor` | `00AC97` | `00AC97` | developer |
| `gamelist.starFill` * | `DF0024` | `DF0024` | filled star pips |
| `starUnfill` | `ffffff69` | `ffffff69` | empty star pips |
| `dimColor` | `808080` | `808080` | the `-------------` placeholder |
| `gamelistSelectorColor` * | `F3C300` | `666666` | list selection |
| `gamelistSelectedColor` | `3CAEFB` | `3CAEFB` | selected list text |
| `sistema.lineainferior` * | `0070d1` | `0070d1` | the bottom accent rule |
| `sistema.pie` | `030a18` | `000000` | footer scrim |
| `backgroundgridSelect` * | `F3C300` | `666666` | selected grid tile edge |
| `ps4Style.tile.background` | `020C29` | `000000` | tile plate |
| `cheevosOnColor` | `F3C300` | `F3C300` | trophy glyphs |
| `helpFontColor` | `DFDCDC` | `DFDCDC` | help bar |

Master palette (`theme.xml:646-652`): yellow `F3C300`, red `DF0024`, green `00AC97`,
blue1 `3CAEFB`, blue2 `0070d1`, blue3 `2E6DB4`, blue4 `003791`.

Nine secondary accents override the starred keys: default, blue `0070d1`, yellow `F2BC00`,
green `00AC97`, orange `FF9E00`, red `DF0024`, pink `FF4DFF`, purple `8159ED`, black `666666`.

Each system also paints its own left-to-right gradient on the bottom rule, from
`_theme_inc/infos/<theme>.xml` - `psx` is `F2001A` to `00AD9E`.

The universal text glow is `glowColor 00000035`, `glowSize 1`, `glowOffset 3 2`, which becomes
`text-shadow: 3px 2px 1px rgba(0,0,0,0.208)`.

## Fonts

SST is Sony's corporate typeface and ships with the theme. Copied from `_theme_inc/fonts/`
with spaces renamed to hyphens - spaces inside `url()` over `file://` are a needless hazard.

| File | Weight | Use |
| --- | --- | --- |
| `SST-Light.ttf` | 300 | system name (0.068), PS4-style game name (0.054), descriptions (0.029), clock |
| `SST-Roman.ttf` | 400 | menu body, help bar, region tag, PS5-style game name (0.032) |
| `SST-Bold.ttf` | 700 | metadata rows (0.023), grid/single game names (0.05), tinyScreen substitute |
| `SST-Bold-Italic.ttf` | 700 italic | the collection chip (0.023) |
| `players.ttf` | - | icon font, renders `{game:playerCount}` as a controller glyph |

Sizes are fractions of **screen height**: `0.029` is 21 px at 720p, 33 px at 1152p.

Not copied: `SST Ultra Light.ttf` and `players_pad.ttf` - zero references anywhere.

## Input map

Derived from the theme's `helpsystem` prompts. The key table is the repo-standard one.

| Button | Key | Action |
| --- | --- | --- |
| D-pad | Arrows | move the cursor |
| A | `Z` | launch the selected game |
| B | `X` | back |
| X | `A` | search / random |
| Y | `S` | game options / toggle favourite |
| Start | `Enter` | menu |
| Select | `Right Shift` | options |
| L / R | `Q` / `W` | page / jump |
| Menu | `Esc` | quit menu |

Mockup-only keys on the interactive route, deliberately outside the device map so they can
never be taken for device buttons: `[` `]` view, `/` system, `\` colorset, `'` accent, `,` `.`
carousel type, `-` `=` carousel size, `;` animations. Top info has no key - it never had one in
the original either - and is cycled from the subset panel below the device.

These drive the mockup harness, not the firmware. They live in `Interactive.tsx`, outside the
theme, so `PlayStationX` takes the same props whether it is a static screen or the live build.

## Transitions

The theme declares **385 `<animation>` tags in 211 `<storyboard>` blocks across 21 files** -
a closed format of 7 properties, 8 easings and 5 events. Most are per-element repetitions of the
same motion; transcribed, the corpus this mockup carries is **97 tracks across 49 events in 22
storyboards**, in `storyboards.ts`.

They are carried as data in the source's own vocabulary rather than hand-translated into CSS.
`app/src/anim/compile.ts` turns them into a renderer-neutral timeline of segments and
`waapi.ts` is the web adapter that turns that timeline into keyframes - so a future renderer
implements a second adapter against the same timeline rather than inheriting a Web Animations
dependency.

`bindings.ts` pairs every storyboard with the element that carries it. Three of them were
transcribed into the original mockup and never attached to anything, so their motion existed as
data and never ran; the table makes an unbound storyboard a test failure.

The signature motion is `marco-activo`, the selection frame: on every cursor move it runs
`scale 0.94 -> 1` over 300 ms on `bump` easing, plus a 150 ms yo-yo jolt of
`offsetX -0.003 / offsetY -0.008`, then settles into a forever `opacity 1 <-> 0.3` pulse.
Ambient tracks run on their own clocks: the 5350 ms top-bar ticker, the 30 s background Ken
Burns, the 22.222 s character-art drift, the 400 ms badge pulses.

Two things make this work:

- **The runtime never writes `transform`.** Up to three transform channels animate at once
  (`animated-list.xml:124-126` runs `scale` + `offsetX` + `offsetY` together), and two CSS
  animations cannot both write `transform`. Each channel drives its own registered custom
  property and the browser recomposes them - see the `@property` block in `playstation-x.css`.
- **Settling is the static path.** It walks the same descriptors and writes resting values with
  zero Animations created. `animate={false}` and the subset panel's animations-off toggle both
  route through it, which is what proves the snapshots and the live build agree. An autoreverse
  track's resting value is its `from`, not its `to` - without that the selection frame ends
  permanently displaced after the first cursor move.

Full transitions table, the compiler rules and the easing map: `reference/source-notes.md`.

Requires `@property` support - Chrome 85+, Safari 16.4+, Firefox 128+.

## Assets

~8.9 MB, sampled from ~925 MB of upstream art. Everything omitted is listed in
`reference/source-notes.md`; the biggest omissions are `_theme_inc/videos` (718 MB) and the
per-system art for the other 372 systems.

Eight systems are included, chosen to exercise code paths rather than to look good: `psx`,
`snes` and `n64` (the `autoLayout` special case at `grid.xml:14`), `dreamcast` (the 7-tile
carousel list), `megadrive`, `gba`, `arcade`, and `auto-favorites` (a Collection, whose
`{system.name}` of `favorites` hides the per-tile heart and shows the italic system chip).

**Per-game art is generated, not copied** - the theme ships none, since it is scraped per
install. `art.ts` builds box art, screenshots and marquees as SVG data URIs. The reference
screenshots in `reference/` show real scraped art and will differ.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the theme root: resolves the layout, owns the cursor, picks a view |
| `Interactive.tsx` | the live build's eight subsets and their mockup-only keys |
| `routes.tsx` / `manifest.ts` | the 48 routes, and the screen list as plain data |
| `spec.ts` | the normalized spec for all eleven views, every value carrying a `file:line` |
| `layout.ts` | `matches` / `pick` (last match wins), `resolveTree`, `resolve(device, state)` |
| `palette.ts` | the colorset and accent tables; `tokens()` and `paletteVariables()` |
| `storyboards.ts` | the transcribed `<storyboard>` descriptors |
| `bindings.ts` | which storyboard drives which element, so none can go unbound |
| `library.ts` / `library.data.ts` | the sample library and the data predicates (`if=` / `<visible>`) |
| `art.ts` / `assets.ts` | generated per-game art, and bundler-resolved asset paths |
| `playstation-x.css` | `@font-face`, the `@property` transform contract, element base styles |
| `views/` | `Chrome`, `parts`, and the four view files |
| `reference/source-notes.md` | the authoritative extraction; every value carries a `file:line` |
| `reference/shot-*.jpg` | 25 screenshots from the theme author's own site |

The storyboard work stays split - the engine is shared in `app/src/anim/`, the data is
`storyboards.ts` - so the transcription can be diffed against the XML without reading the
compiler.

## How it is checked

Three golden-fixture suites run the **original** code under `node:vm` and compare value by
value: `resolve()` across all 108 device and subset combinations, the palette across all 18
colorset and accent pairs, and the art factories across all 25 games. A self-snapshot would
only prove the port agrees with itself.

Two invariants the compiler's simplifying assumptions depend on existed as prose and as two
uncommitted Python scripts; both are executable assertions now.

The fixtures prove the numbers and say nothing about what those numbers paint, so every screen
was also rendered and compared against its legacy page on all four devices. That pass found
eleven faults that every numeric check had passed. They are listed, with the class of fault, in
[`porting/playstation-x.md`](../porting/playstation-x.md), and `views/views.test.tsx` asserts
each one.
