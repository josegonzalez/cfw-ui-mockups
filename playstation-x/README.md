# PlayStation X

HTML mockups of the **PlayStation X** theme for the Batocera EmulationStation fork - a
PlayStation-styled theme that reproduces the PS3, PS4 and PS5 interfaces across 7 gamelist
view types and 3 system-carousel styles.

- Source: [github.com/pajarorrojo/es-theme-PlayStation-X](https://github.com/pajarorrojo/es-theme-PlayStation-X) @ `26ce759` (v43.1)
- Licence: CC BY-NC-SA 4.0
- Authoritative extraction, with a `file:line` for every value: [`reference/source-notes.md`](reference/source-notes.md)

The theme targets Batocera 39+ / RetroBat 6+ and also runs on EmuElec. It is a Batocera-fork
theme (`formatVersion 7`), not RetroPie ES or ES-DE.

## Screens

Eleven screens per device. `theme.html` is the interactive build - every view plus live subset
toggles in one page; the rest are static snapshots produced by the same code with
`interactive: false`.

| Screen | Source | 1280x720 | 640x480 | 720x480 | 1920x1152 |
| --- | --- | --- | --- | --- | --- |
| Interactive | all views | [theme](trimui-smart-pro/theme.html) | [theme](rg35xx/theme.html) | [theme](rg34xx/theme.html) | [theme](rg552/theme.html) |
| System view | `_theme_views/front.xml` | [x](trimui-smart-pro/system.html) | [x](rg35xx/system.html) | [x](rg34xx/system.html) | [x](rg552/system.html) |
| PS4 Style | `_theme_views/ps4-style.xml` | [x](trimui-smart-pro/ps4-style.html) | [x](rg35xx/ps4-style.html) | [x](rg34xx/ps4-style.html) | [x](rg552/ps4-style.html) |
| PS5 Style | `_theme_views/ps5-style.xml` | [x](trimui-smart-pro/ps5-style.html) | [x](rg35xx/ps5-style.html) | [x](rg34xx/ps5-style.html) | [x](rg552/ps5-style.html) |
| Detailed | `_theme_views/detailed.xml` | [x](trimui-smart-pro/detailed.html) | [x](rg35xx/detailed.html) | [x](rg34xx/detailed.html) | [x](rg552/detailed.html) |
| Grid | `_theme_views/grid.xml` | [x](trimui-smart-pro/grid.html) | [x](rg35xx/grid.html) | [x](rg34xx/grid.html) | [x](rg552/grid.html) |
| Horizontal Carousel | `_theme_views/carousel.xml` | [x](trimui-smart-pro/carousel.html) | [x](rg35xx/carousel.html) | [x](rg34xx/carousel.html) | [x](rg552/carousel.html) |
| Full Grid | `_theme_views/full-grid.xml` | [x](trimui-smart-pro/full-grid.html) | [x](rg35xx/full-grid.html) | [x](rg34xx/full-grid.html) | [x](rg552/full-grid.html) |
| Game by game | `_theme_views/single.xml` | [x](trimui-smart-pro/single.html) | [x](rg35xx/single.html) | [x](rg34xx/single.html) | [x](rg552/single.html) |
| Media tester | `_theme_views/test-media.xml` | [x](trimui-smart-pro/media-tester.html) | [x](rg35xx/media-tester.html) | [x](rg34xx/media-tester.html) | [x](rg552/media-tester.html) |
| Boot splash | `splash.xml` | [x](trimui-smart-pro/boot-splash.html) | [x](rg35xx/boot-splash.html) | [x](rg34xx/boot-splash.html) | [x](rg552/boot-splash.html) |
| Game launch | `gamesplash.xml` | [x](trimui-smart-pro/game-launch.html) | [x](rg35xx/game-launch.html) | [x](rg34xx/game-launch.html) | [x](rg552/game-launch.html) |

`splash.xml` and `gamesplash.xml` are separate theme roots, not views of `theme.xml`. They are
built as extra views of the same controller so they share the layout resolver and the runtime.

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
  width or height. `layout.js` keeps them in those units and resolves to px once per device.
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

Mockup-only keys in `theme.html`, deliberately outside the device map so they can never be
taken for device buttons: `[` `]` view, `/` system, `\` colorset, `'` accent, `,` `.` carousel
type, `-` `=` carousel size, `;` animations.

## Transitions

The theme declares **385 `<animation>` tags in 211 `<storyboard>` blocks across 21 files** -
a closed format of 7 properties, 8 easings and 5 events. Rather than hand-translate those into
CSS, `storyboards.js` carries them as data in the source's own vocabulary and `storyboard.js`
compiles them to Web Animations at runtime.

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
- **`settle()` is the static path.** It walks the same descriptors and writes resting values
  with zero Animations created. `interactive: false` and the chrome strip's animations-off
  toggle both route through it, which is what proves the snapshots and the live build agree.

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
install. `views.js` builds box art, screenshots and marquees as SVG data URIs. The reference
screenshots in `reference/` show real scraped art and will differ.

## Files

| File | Job |
| --- | --- |
| `playstation-x.css` | `@font-face`, the `@property` transform contract, element base styles, chrome strip |
| `palette.js` | colorset and secondary-accent tables; `applyColors`, `caratula`, `colorsetBackground` |
| `layout.js` | `DEVICES`, the normalized SPEC for all 11 views, `pick()` (last match wins), `resolve()` |
| `storyboard.js` | the animation runtime: easing map, `compile`, `play`, `settle`, `settleAll` |
| `storyboards.js` | the transcribed `<storyboard>` descriptors, one entry per theme element |
| `views.js` | sample library, generated art, and the data predicates (`if=` / `<visible>`) |
| `playstation-x.js` | the controller: `boot(root, opts)`, input, cursor, all 11 view builders, chrome strip |
| `reference/source-notes.md` | the authoritative extraction; every value carries a `file:line` |
| `reference/shot-*.jpg` | 25 screenshots fetched from the theme author's own site |

The storyboard work is split in two - `storyboard.js` is the engine, `storyboards.js` is the
data - so the transcription can be diffed against the XML without reading the compiler.

Load order is dependency order: `storyboard` → `storyboards` → `palette` → `layout` → `views`
→ `playstation-x`, then one inline `PlayStationX.boot(...)`.
