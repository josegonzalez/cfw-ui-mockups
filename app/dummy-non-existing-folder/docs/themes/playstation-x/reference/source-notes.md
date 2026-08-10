# PlayStation X - source notes

Authoritative extraction from the theme source. Every value here carries a `file:line` into
the upstream repo. The mockup's CSS and JS quote this file; where the two disagree, this file
is right and the code is a bug.

- Source: [github.com/pajarorrojo/es-theme-PlayStation-X](https://github.com/pajarorrojo/es-theme-PlayStation-X)
- Commit: `26ce759` - "V.43.1 (See changelog)", 2026-05-05
- Engine: Batocera EmulationStation fork, `<formatVersion>7</formatVersion>`
- Licence: CC BY-NC-SA 4.0
- Mode: reproduce

The theme targets Batocera 39+ / RetroBat 6+ and also runs on EmuElec and any other frontend
using the Batocera ES fork. It is **not** a RetroPie ES or ES-DE theme - `subset`,
`customView`, `imagegrid`, `stackpanel`, `storyboard`, `controllerActivity` and
`batteryIndicator` are all Batocera-fork elements.

## Devices

`theme.xml:4` sets `<theme defaultView="ps4Style" defaultTransition="instant">`.

Each of our four devices maps to exactly one of the theme's own `aspect-ratio` subset values
(`theme.xml:31-50`), so no aspect is invented:

| Device | Resolution | `aspect-ratio` | tinyScreen | defaultView |
| --- | --- | --- | --- | --- |
| `trimui-smart-pro` | 1280x720 | `16-9` | false | `ps4Style` |
| `rg35xx` | 640x480 | `4-3` | **true** | `carousel` |
| `rg34xx` | 720x480 | `3-2` | **true** | `carousel` |
| `rg552` | 1920x1152 | `5-3` | false | `ps4Style` |

`tinyScreen` is Batocera's `height <= 480` flag. `theme.xml:340` includes
`_theme_views/force-gridview.xml` when it is set, and that file's entire body is
`<theme defaultView="carousel"></theme>` - so the two 480-tall devices open on the
horizontal carousel gamelist, not PS4 Style.

`tinyScreen` also drives, among others: `batteryIndicator` moves `0.96 0.961` -> `0.935 0.94`
and grows `0.027` -> `0.06` (`theme.xml:453-456`); the `region` corner tag is hidden entirely
(`theme.xml:469`, `tinyScreen="false"`); `menutext` switches SST Roman -> SST Bold and
`0.028` -> `0.04` (`theme.xml:505-507`); `menutextsmall` gains `forceUppercase`
(`theme.xml:530`).

Note `_theme_views/ps4-style.xml:175` expresses the same idea as
`${screen.height} <= '480'` rather than `tinyScreen`. On our four devices the two coincide.
**Inference:** treated as equivalent.

## Subsets: what is live, what is pinned

The theme ships ~30 subsets (`theme.xml:31-445`). The mockup exposes 6 and pins the rest.
A `layout.js` variant row may only be conditioned on a **live** subset; every pinned axis is
evaluated at transcription time and inlined or dropped.

**Live** (the chrome strip): `colorset` (blue/black), `secondary_colorset` (default + 8),
`carousel-type` (PS5/PS4/PS3), `carousel` size (big/medium/small), `top-info`
(default/no-numbers/clean), `anim-system` + `anim-list` (folded into one animations toggle).

Plus the two that come from the device and are not user-settable here: `aspect-ratio`,
`tinyScreen`.

**Pinned**, with the value chosen and why:

| Subset | Pinned to | Why |
| --- | --- | --- |
| `region` | `eu` | The `us/` and `jp/` art folders are a full second and third copy of every system asset. |
| `frontend` | `Batocera` | Theme's own default; the splash art we copied. |
| `game-video`, `video-system`, `video-system-random`, `video-system-audio`, `videosnap-audio`, `video-gamelist-delay` | off / none | No video assets copied (`_theme_inc/videos` is 718 MB). Removes `videosnap-controls.xml` and the 36 `enabled="exists({game:video})"` tracks. |
| `animated-backg` | `NO` | Needs `background-movie.mp4` per colorset. |
| `grid-origin` | `fanart` | Matches the reference screenshots. |
| `main-origin` | `default` | The un-patched column positions. |
| `thumbnail-type` | `thumbnail` | |
| `showlogo` | `enabled` | |
| `game-description`, `info-bar` | shown | The richest layout; the `no` variants only remove elements. |
| `background-gamelist` | `fanart` | |
| `background-system` | `default` | |
| `system-description`, `system-console`, `system-logo`, `overlay-arts`, `overlay-gamelist-arts` | `YES` | |
| `system-rom-folder` | `YES` | |
| `iconset` | `PSX` | Help-system glyph set. |
| `system-avatar` | `custom` | Uses `custom-avatar.png`; avoids shipping 78 avatars. |
| `system-username` | `custom` | |
| `nav-sound` | `ps5` | Sound is carried in the data but never played. |
| `hotkey-guide` | `NO` | The `hotkey-tips/` PNGs are 112-130 KB each per language. |

Dropped aspect values: `16-10`, `5-4`, `21-9`. No device uses them, so those variant rows are
deleted at transcription - roughly 40% of the source's rows.

## Colors

Master palette, `theme.xml:646-652`:

| Variable | Hex |
| --- | --- |
| `psx-theme-yellow` | `F3C300` |
| `psx-theme-red` | `DF0024` |
| `psx-theme-green` | `00AC97` |
| `psx-theme-blue1` | `3CAEFB` |
| `psx-theme-blue2` | `0070d1` |
| `psx-theme-blue3` | `2E6DB4` |
| `psx-theme-blue4` | `003791` |

### Colorsets

`_theme_options/colorsets/blue.xml:6-41` and `black.xml`. Keys marked * carry
`ifSubset="secondary_colorset:default"` and are overridden by the secondary accent.

| Token | blue | black |
| --- | --- | --- |
| `menuSelectedColor` * | `ffffff` | `3CAEFB` |
| `menuSelectorColor` * | `0070d1` | `2d2828` |
| `menuSelectorColorEnd` * | `003791` | `000000` |
| `menuGrouptitle` | `3CAEFB` | `eeeeee` |
| `menuFontcolor` | `DFDCDC` | `cccccc` |
| `menuSeparatorColor` | `555555` | `555555` |
| `menuGroupSeparator` | `3CAEFB` | `dddddd` |
| `menuTitleColor` | `DFDCDC` | `DFDCDC` |
| `menubgColor` | `003791` | `2d2828` |
| `backgroundgrid` | `2E6DB4` | `aaaaaa` |
| `backgroundgridSelect` * | `F3C300` | `666666` |
| `menuFooter` | `555555` | `555555` |
| `gamelistSelectedColor` | `3CAEFB` | `3CAEFB` |
| `gamelistSelectorColor` * | `F3C300` | `666666` |
| `helpFontColor` / `helpIconColor` | `DFDCDC` | `DFDCDC` |
| `developerColor` | `00AC97` | `00AC97` |
| `genreColor` | `3CAEFB` | `3CAEFB` |
| `releaseColor` | `F3C300` | `F3C300` |
| `starFill` | `DF0024` | `DF0024` |
| `starUnfill` | `ffffff69` | `ffffff69` |
| `manualOnColor` / `savegameOnColor` | `3CAEFB` | `3CAEFB` |
| `cheevosOnColor` | `F3C300` | `F3C300` |
| `splash.progressbarActive` | `0070d1` | `0070d1` |
| `splash.progressbarActiveEnd` | `003791` | `111111` |
| `splash.progressbar` | `ffffff80` | `ffffff69` |
| `splash.labelColor` | `ffffff` | `ffffff` |
| `sistema.lineainferior` * | `0070d1` | `0070d1` |
| `sistema.pie` | `030a18` | `000000` |
| `gamelist.starFill` * | `DF0024` | `DF0024` |
| `grid.starFill` * | `F3C300` | `F3C300` |
| `ps4Style.tile.background` | `020C29` | `000000` |
| `dimColor` | `808080` | `808080` |

Background art: `_theme_options/colorsets/blue/background.jpg` (3840x2160) and
`black/background.jpg` (2560x1440). Copied as `assets/colorsets/{blue,black}-background.jpg`.

### Secondary accents

`_theme_options/colorsets/secondary_colors/*.xml`. Each overrides `sistema.lineainferior`,
`gamelistSelectorColor`, `backgroundgridSelect`, `gamelist.starFill`, `grid.starFill` and the
menu selector gradient.

| Name | Accent |
| --- | --- |
| blue | `0070d1` |
| yellow | `F2BC00` |
| green | `00AC97` |
| orange | `FF9E00` |
| red | `DF0024` |
| pink | `FF4DFF` |
| purple | `8159ED` |
| black | `666666` (grid select `cccccc`) |

### Literal colors used inline

Universal text glow `glowColor 00000035`, `glowSize 1`, `glowOffset 3 2` -> CSS
`text-shadow: 3px 2px 1px rgba(0,0,0,0.208)`. Start-button background `00000069`. Multidisc
chip background `00000066`. Test-media tag background `000000aa`. Collection chip glow
`ffffffe3`. Cheevos gold on tiles `F2BC00`; top-bar trophy/netplay gold `e8c820cc` /
`e8c820e6`. Controller activity `FFFFFF90` idle, `F3C30069` active, `FF000069` hotkey.
Gamesplash background tint `A0A0A0FF`. Dim placeholder `808080`.

Each system also paints its own gradient on the 0.002-height bottom rule via
`_theme_inc/infos/<theme>.xml` - e.g. `psx.xml` sets `linea-inferior` `color F2001A`,
`colorEnd 00AD9E`.

## Fonts

All from `_theme_inc/fonts/`. Copied with spaces renamed to hyphens, because spaces inside
`url()` over `file://` are a needless hazard.

| Upstream | Copied as | Refs | Role |
| --- | --- | --- | --- |
| `SST Bold.ttf` | `SST-Bold.ttf` | 65 | metadata rows, menu titles, game names in grid/single/full-grid, tinyScreen substitute |
| `SST Light.ttf` | `SST-Light.ttf` | 27 | large display type: system name, PS4-style game name, descriptions, clock, splash |
| `SST Roman.ttf` | `SST-Roman.ttf` | 18 | menu body, helpsystem, region tag, PS5-style game name |
| `SST Bold Italic.ttf` | `SST-Bold-Italic.ttf` | 3 | the collection "system-name" chip |
| `players.ttf` | `players.ttf` | 3 | icon font rendering `{game:playerCount}` as a glyph |

Not copied: `SST Ultra Light.ttf` and `players_pad.ttf` - zero references anywhere.

SST is Sony's corporate typeface and ships with the theme; we use the theme's own files.
Font sizes are normalized to **screen height**, so `0.029` = 2.9% of H (31 px at 1080p,
21 px at 720p).

## Storyboard format

This is the part the mockup ports as data rather than reimplementing as CSS. Counts below are
mechanical, from `checks/vocab.py` over the whole theme.

**385 `<animation>` tags in 211 `<storyboard>` blocks across 21 files.**

| Axis | Values, with counts |
| --- | --- |
| `property` | `opacity` 224, `offsetY` 67, `offsetX` 38, `y` 25, `scale` 23, `x` 7, `zIndex` 1 |
| `mode` | `easeOut` 93, `easeInOut` 79, `easeOutCubic` 73, `linear` 63, `easeIn` 42, `ease` 19, `bump` 13, `easeInCubic` 3 |
| `event` | none 73, `open` 30, `activateNext` 30, `activatePrev` 30, `deactivateNext` 24, `deactivatePrev` 24 |
| `repeat` | `forever` 23, `-1` 6 (identical meaning) |
| `autoreverse` | `true` 36, plus one `autoReverse="true"` (capital R) at `_theme_views/single.xml:61` |
| `enabled` | `exists({game:video})` 36 - the only predicate form |
| `begin` | 0, 50, 100, 200, 300, 400, 500, 520, 800, 1000, 1800, 2000, 5000, 16000 |
| `duration` | 1, 100, 150, 200, 300, 350, 400, 500, 550, 600, 800, 8000, 15000, 22222, 30000 |

Semantics:

- `begin` / `duration` are milliseconds.
- `offsetX` / `offsetY` are **fractions of screen width / height** (0.05 = 5% of W).
- `x` / `y` are absolute normalized positions in the same space.
- An animation with `from` but no `to` animates from that value to the element's **authored**
  value - which is why the end value cannot be baked into a stylesheet.
- `autoreverse="true"` yo-yos; `duration` is per leg.
- `repeat` on an `<animation>` makes that track infinite. `repeat` on the `<storyboard>`
  loops the whole group.
- `<sound path=...>` may appear inside a storyboard. We carry it in the data and never play
  it, so the descriptor table stays 1:1 with the XML.

### Easing map

| Source `mode` | CSS |
| --- | --- |
| `linear` | `linear` |
| `ease` | `cubic-bezier(0.25,0.1,0.25,1)` |
| `easeIn` | `cubic-bezier(0.42,0,1,1)` |
| `easeOut` | `cubic-bezier(0,0,0.58,1)` |
| `easeInOut` | `cubic-bezier(0.42,0,0.58,1)` |
| `easeInCubic` | `cubic-bezier(0.32,0,0.67,0)` |
| `easeOutCubic` | `cubic-bezier(0.33,1,0.68,1)` |
| `bump` | `cubic-bezier(0.34,1.56,0.64,1)` - **inference** |

`bump` is not a standard CSS curve. All 13 uses are `scale` from `0.9` or `0.94` to `1.0`,
and it never appears on `opacity` (where an overshoot would clamp), so it is read as an
overshoot pop.

### Compiler rules

Per `(element, property)`:

1. Partition the storyboard's animations into a finite list and at most one infinite tail.
2. Finite list -> **one** Animation of duration `max(begin + duration)`, keyframes built by
   walking the list and inserting explicit holds, `fill: 'forwards'`.
3. Infinite tail -> its own Animation, `delay: begin`, `iterations: Infinity`,
   `direction: autoreverse ? 'alternate' : 'normal'`.
4. Storyboard-level `repeat` -> merge every animation of that property into one looping track
   of length `max(begin + duration)`, keyframe offsets at `begin/groupLen`.
5. **A finite track can also be `autoreverse`**, and then it plays out *and back* - `duration`
   counts one leg. A lone autoreverse track maps exactly onto `iterations: 2,
   direction: 'alternate'`; one sharing its property with another animation has the return leg
   expanded into the merged keyframes instead. Both paths are implemented, though only the
   first occurs today: all 8 finite autoreverse tracks are alone on their property
   (`checks/check-autoreverse.py`).

   This rule is easy to miss, and missing it is not subtle: `marco-activo`'s 150 ms jolt
   (`animated-list.xml:125-126`) is finite and autoreverse, so without the return leg the
   selection frame ends **permanently displaced** by `offsetX -0.003 / offsetY -0.008` after
   the first cursor move. Correspondingly, an autoreverse track's *resting* value is its
   `from`, not its `to` - otherwise the static snapshots freeze mid-jolt.

**Verified mechanically** (`checks/check-repeat.py`): zero cases of two per-animation
`repeat=` on the same property of the same element, so rules 1-3 are total. All 16
storyboard-level `repeat=` blocks are in `_theme_views/top-info.xml` and `top-info-clean.xml`
and are handled by rule 4.

The `marco-activo` element is the case that exercises all four rules, and is the Phase 1 gate:

```xml
<!-- _theme_options/animated-list.xml:117-129 -->
<control name="marco-activo">
  <storyboard event="open">
    <animation property="opacity" from="0" to="0" duration="100" mode="linear" />
    <animation property="opacity" begin="300" from="0" to="1.0" duration="500" mode="easeInOut" />
    <animation property="opacity" from="1" to="0.3" begin="2000" duration="500" mode="easeInOut" autoreverse="true" repeat="forever" />
  </storyboard>
  <storyboard event="activateNext">
    <animation property="scale" from="0.94" to="1" duration="300" mode="bump" />
    <animation property="offsetX" to="-0.003" duration="150" mode="ease" autoreverse="true" />
    <animation property="offsetY" to="-0.008" duration="150" mode="ease" autoreverse="true" />
    <animation property="opacity" from="0" to="1.0" duration="500" mode="easeInOut" />
    <animation property="opacity" from="1" to="0.3" begin="1000" duration="500" mode="easeInOut" autoreverse="true" repeat="forever" />
  </storyboard>
  ...
</control>
```

`open` has two finite opacity tracks plus one infinite (rules 2 + 3, pulse at `begin=2000`);
`activateNext` has one finite opacity track plus the same infinite at `begin=1000`, and three
simultaneous transform channels.

### Transform composition

`offsetX`, `offsetY`, `x`, `y` and `scale` all map to `transform`, and the source animates up
to three of them at once (`animated-list.xml:124-126` does `scale` + `offsetX` + `offsetY`;
`animated-systems.xml:95-97` does `scale` + `x` + `y`). The runtime therefore never writes
`transform` - it animates five registered custom properties and lets CSS recompose:

```css
@property --px-ox { syntax:'<length>'; inherits:false; initial-value:0px; }
@property --px-oy { syntax:'<length>'; inherits:false; initial-value:0px; }
@property --px-x  { syntax:'<length>'; inherits:false; initial-value:0px; }
@property --px-y  { syntax:'<length>'; inherits:false; initial-value:0px; }
@property --px-sc { syntax:'<number>'; inherits:false; initial-value:1;   }

.px-anim {
  transform: translate(var(--px-x), var(--px-y))
             translate(var(--px-ox), var(--px-oy))
             scale(var(--px-sc));
}
```

Requires Chrome 85+ / Safari 16.4+ / Firefox 128+. Custom-property transforms run on the main
thread rather than the compositor; with ~20 concurrently animating nodes that is not a
concern.

`transform-origin` is set from each element's authored `origin`, so `marco-activo`
(`origin 0 0`, `_theme_options/carousel-sizes/big.xml:36`) scales from its top-left corner.
**Inference** - the source does not state a scale origin, but ES positions by `origin` so
scaling about the same point is the consistent reading.

## Transitions

| What | Motion | Timing | Easing | Source |
| --- | --- | --- | --- | --- |
| View to view | none | - | instant | `theme.xml:4` |
| System carousel scroll | fade + slide | 600 ms (400 with `anim-system`) | - | `_theme_views/front.xml:9-18`, `animated-systems.xml:10` |
| Carousel tile entry | `y` from +0.5 | 500 ms (300 ff / 400 sd) | easeOutCubic | `systemcarousels/carousel-ps4.xml:53-74` |
| Carousel selected tile | static scale 1.48-2.0x, neighbours opacity 0.7 (PS3: 1.0) | - | - | `carousel-sizes/*.xml`, `carousel-ps4.xml:26` |
| PS4/PS5 frame, on move | scale 0.94->1 + jolt offsetX -0.003 / offsetY -0.008 | 300 ms / 150 ms yo-yo | bump / ease | `animated-list.xml:123-126` |
| PS4/PS5 frame, idle | **opacity 1<->0.3 forever** | 500 ms per leg, begin 1000 (2000 on open) | easeInOut | `animated-list.xml:127`, `:121` |
| System background | scale 1->1.25 then 1.25->1 at 16 s, offsetY 0->0.08 yo-yo | 15 s each | easeOut / ease | `animated-systems.xml:13-20` |
| Gamelist background | scale 1->1.3, restarted per game; offsetY ±0.15 | 30 s | easeOut / ease | `animated-list.xml:35-55`, `:83-106` |
| Detailed panel scroll | out to ∓0.78 then in from ±0.78 | 500 ms out / 550 ms in; fade 400 / 800 | easeOutCubic | `animated-list.xml:10-33` |
| Grid metadata scroll | offsetX ±0.05 + crossfade | 300 ms | easeOutCubic | `animated-list.xml:62-81` |
| Full-grid scroll | offsetX ±0.30 | 300 ms | easeOutCubic | `image-sources.xml:325,330` |
| Game title | offsetY 0.06 -> 0 + fade | 300 ms (500 on open) | easeOut | `animated-list.xml:164-183` |
| Marquee / logo | scale 0.9 -> 1.0 | 350 ms | bump | `animated-list.xml:185-201` |
| Top-bar info ticker | A/B vertical crossfade ±0.02, loops | out at 2000, back at 5000, 350 ms each | easeIn / easeOut | `top-info.xml:115-130` |
| Cheevos icon | **opacity 0<->1 forever** | 350 ms per leg | easeInOut | `top-info.xml:192-193` |
| Status badges (14 places) | **opacity 1<->0.6 forever** | 400 ms per leg | easeInOut | `grid.xml:503-616`, `gamesplash.xml:313-358` |
| Overlay character art | **offsetX 0->0.028 forever** | 22.222 s per leg | linear | `gamelist-overlay.xml:266-315` |
| Single-view arrow | fade to 0.8, bob 0.005 yo-yo, fade out at 2 s | 500 / 300 / 500 ms | easeInOut | `single.xml:59-62` |
| Box-art launch flourish | scale 1->3, fly to x 0.27 / y 0.1, fade out | 400 ms @200, fade @520 | easeInCubic | `animated-systems.xml:74-100` |
| Gamelist entry (grid) | `y` from 0.2 + fade | 600 ms | easeOutCubic | `sound-effects/ps5.xml` |

Deliberately absent: there is no transition between views at all - `defaultTransition` is
`instant` globally, and `animateSelection` is `false` in every list
(`ps4-style.xml:57`, `carousel.xml:32`, `single.xml:46`). All motion comes from storyboards.

## Layout

Full per-element geometry lives in `../layout.js`, in the source's own normalized 0-1 numbers
with a `file:line` beside each block. Two rules govern it:

- **Last match wins.** ES resolves repeated property elements by taking the last one whose
  predicates match. The source depends on this: `theme.xml:194-197` places
  `<pos tinyScreen="true">` *before* `<pos tinyScreen="false">`, and
  `_theme_options/carousel-sizes/big.xml:15-16` has a bare `<pos>-0.523 0.111</pos>`
  immediately followed by a bare `<pos >-0.515 0.111</pos>` purely to override it. Any
  most-specific-wins scheme silently disagrees.
- **Two predicate kinds, resolved at different times.** `ifSubset` / `aspect-ratio` /
  `tinyScreen` depend only on device + chrome state, so they resolve once in `resolve()`.
  `if=` expressions over `{system.theme}` / `{system.name}` / `{screen.ratio}` and `<visible>`
  expressions over `{game:*}` depend on the selected item, so they are evaluated per render in
  `views.js`.

Key rails at 16:9 (multiply by W or H):

- Horizontal: `0.015` top-left cover, `0.022`/`0.025` left gutter, `0.162-0.165` PS4 first
  tile and Start button, `0.30` grid text column, `0.335` PS4 title, `0.55` detailed metadata
  column, `0.91` right media column.
- Vertical: `0.012-0.063` top HUD band, `0.085-0.475` tile strip, `0.424` Start button,
  `0.934` accent rule and footer scrim, `0.955` help prompts (`0.995` when prompts are off).

### Source quirks worth knowing

- `_theme_views/carousel.xml:28` carries **two `if=` attributes on one element**, which is
  malformed XML. We honour the last one, matching how a last-wins attribute parser behaves.
  Flagged as an **inference**.
- `_theme_options/animated-list.xml:90` has `zto="1"` where `to="1"` was meant, so that
  opacity track is a no-op on grid `activateNext`. Reproduced as written - the mockup should
  match the shipped behaviour, not the intended one.
- `_theme_views/single.xml:61` spells the attribute `autoReverse` rather than `autoreverse`.
  The parser accepts both.
- `theme.xml:641` includes `./videomarks.xml`, and `single.xml:282` includes
  `_theme_options/gamelist-overlay-arts-sinngle.xml`. **Neither file exists** in the repo -
  dangling optional includes. Nothing to port.

## Strings

From `_theme_lang/default_en.xml`. The mockup uses English only.

| Variable | String |
| --- | --- |
| `theme.start` | `Start` |
| `theme.welcome` | `Welcome to Playstation X for` |
| `GamesNumber` / `GamesFavs` / `NumberPlayed` | `Games` / `Favorites` / `Played` |
| `theme.mostplayed` | `Most played:` |
| `theme.collections` | `Collections` |
| `theme-timesPlayedLabel` / `theme-gameTimeLabel` | `Times Played:` / `Game Time:` |
| `theme-lastplayedLabel` | `Last Played` |
| `theme.multidisc` | `multi-disc` |
| `theme.items` | `Items:` |

View display names, as shown in the ES view picker: `Horizontal Carousel`, `PS4 Style`,
`PS5 Style`, `Full Grid`, `Game by game`.

Hard-coded, not in the lang file: `Loading ...`, `trackball compatible`,
`spinner compatible`, `game media tester`, the `</VIDEO>`-style test-media tags,
`Theme by pajarorrojo - Version 43.1` (`splash.xml:84`), `v.43` (`top-info.xml:418`) and
`2026` (`top-info.xml:514`).

The top-bar ticker alternates `{system:total} Games • {system:favorites} Favorites •
{system:gamesPlayed} Played` with `Most played: ...`, and in gamelists
`Times Played: N • Game Time: X` with `Last Played: ...`.

## Sample data coverage

Eight systems, chosen to exercise code paths rather than to look good:

| `system.theme` | Exercises |
| --- | --- |
| `psx` | the theme's identity; full description, console, background, overlay art |
| `snes` | `autoLayout` special case at `_theme_views/grid.xml:14` |
| `n64` | second member of that same case |
| `dreamcast` | the 7-tile carousel list at `_theme_views/carousel.xml:28` |
| `megadrive` | wide marquee, non-Sony/Nintendo logo |
| `gba` | handheld caratula aspect |
| `arcade` | different `hardwareType`; the only one with a `-b.png` black-colorset caratula |
| `auto-favorites` | a Collection. `{system.name}` is `favorites`, which hides `gridtile.favorite` (`grid.xml:116`) and shows the italic collection chip. No console art - collections have none. |

Twelve `psx` games, each earning its place:

| # | Fires |
| --- | --- |
| 1 | `publisher == developer` and both non-empty (`grid.xml:271`) |
| 2 | publisher only (`grid.xml:283`) |
| 3 | developer only (`grid.xml:275`) |
| 4 | neither -> the dim `-------------` placeholder (`detailed.xml:127`) |
| 5 | `stars` empty (`detailed.xml:175`) |
| 6 | `rom` contains `(Disc 1)` -> pulsing multi-disc chip (`grid.xml:607`) |
| 7 | `tags: ['finished']` -> `F11E` badge |
| 8 | `tags: ['in progress']` -> `F144` badge |
| 9 | `tags: ['buggy']` -> `F070` badge |
| 10 | `tags: ['liked']` -> `like` badge |
| 11 | `region: 'eu,us'` -> `force-world-flag` (`grid.xml:356`); `kidGame` + `hasSaveState` |
| 12 | `lang: 'en,fr,de'` -> text label instead of a flag (`grid.xml:381`); `gunGame` + `hasKeyboardMapping` + `hasManual`; `gametime: 0` -> `gameInfoExNull` (`top-info.xml:294`) |

Four of them are named to match the franchise cutouts we copied, so
`_theme_options/gamelist-overlay.xml`'s `contains(lower(name), ...)` matching is
demonstrable: Final Fantasy VII, Metal Gear Solid, Crash Bandicoot, and one Zelda title
placed in a non-`psx` system.

## Assets copied

~8.9 MB of the upstream's 2.5 GB. See `../assets/`. Everything not listed below was
deliberately left out; the biggest omissions are `_theme_inc/videos` (718 MB, 131 system
attract videos) and the per-system art for the other 372 systems.

- `fonts/` - the 5 referenced faces, spaces renamed to hyphens.
- `overlays/` - 7 full-screen scrims. `overlay-gamesplash.png` **downsampled** 3840x2160 ->
  1920x1080; it is a soft gradient, so the resample is invisible.
- `images/` - 26 chrome pieces and pictos. `badges/` - the 7 pulsing tag glyphs.
- `flags/` - 6 of 37. `colorsets/` - the 2 backgrounds, no `background-movie.mp4`.
- `caratulas/ logos/ consoles/ background/ overlay-arts/systems/` - the 8 systems above,
  plus the 4 `default*` tiles.
- `overlay-arts/` - 4 franchise cutouts, renamed with hyphens.

**Per-game art is generated, not copied.** The theme ships none - box art, screenshots and
marquees are scraped per install - so `views.js` builds them as SVG data URIs tinted from the
live accent. The reference screenshots show real scraped art; ours is a stand-in and is
expected to differ.

## Reference screenshots

`shot-*.jpg` in this directory, fetched from the theme's own site
(`https://es-theme-playstation-x.tocapixels.com/<n>/<nn>.jpg`) as linked from the upstream
`README.md`. All 3840x2160. Filenames keep the upstream numbering: `shot-41-00.jpg` is
`41/00.jpg`.

They are from theme versions 41-43 and several are in Spanish, so treat them as evidence for
**layout, colour and proportion**, not for the English strings. Where a screenshot and the
XML disagree on appearance, the screenshot wins and the deviation is recorded in the affected
screen's porting notes.

Identified so far:

| File | Screen |
| --- | --- |
| `shot-41-00.jpg` | boot splash, black colorset, Batocera frontend |
| `shot-42-05.jpg` | system view, PS4 carousel, black colorset, small system video |
| `shot-43-02.jpg` | PS4 Style gamelist, `psx`, with overlay art and multi-disc chip |
