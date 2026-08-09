# VitroLauncher source notes

Exact values extracted from the VitroLauncher-muOS source
(`github.com/KevDoy/VitroLauncher-muOS`, a Love2D launcher for muOS). These are the
authoritative spec for the mockups. File:line references point into the source repo.

## Global

- **Responsive scale:** every dimension and font is multiplied by `s = screenH / 480`
  (`main.lua:414`, `carousel.lua:107`, `grid.lua:182`, `settings.lua:239`, `navpill.lua:58`).
  Both targets (640x480, 720x480) are 480 tall → **s = 1**, so all base numbers below are
  literal pixels. Width only shifts horizontally-centered positions.
- **Screens & switching:** `SCREEN_ORDER = {"recent","all","settings"}` (`main.lua:34`).
  L1/R1 = prev/next screen; SELECT toggles Settings; B leaves Settings (`main.lua:533-545`).
- **Draw order per frame** (`main.lua:389-451`): animated background → readability wash →
  active screen → top-right status pill (`w-12s, 12s`) → bottom nav pill → overlays.
- **Readability wash:** `rgba(0,0,0,0.25)` on dark schemes, `rgba(255,255,255,0.25)` on
  light (`main.lua:406-411`).

## Colors (`src/ui/draw.lua`)

- Foreground dark schemes: **white `#FFFFFF`** (`FG_DARK = {1,1,1}`, `draw.lua:8`).
- Foreground light scheme (white-blue): **`#1F242E`** (`FG_LIGHT = {0.12,0.14,0.18}`, `draw.lua:9`).
- No separate muted colors - muting is alpha on the same FG:
  - status time/battery **0.85**; settings unfocused row **0.85**, focused **1.0**;
    settings "more" hint **0.45**; nav active icon **1.0** / inactive **0.55**;
    L1/R1 glyphs **0.7**; subtle tile/icon border **0.25**; carousel playtime **0.9**;
    grid info line **0.9**; glass outline (transparency off) **0.5**.
- Focus/selection border: **white `#FFFFFF`** on dark; accent (luminance-nudged) on
  light/simple schemes (`Draw.setHighlight`, `draw.lua:82-89`). Width 4px, 3px outside art.
- Placeholder tile fill (no cover): **`#262626`** (`{0.15,0.15,0.15}`), first letter at 40%
  tile height, white **0.35** (`carousel.lua:178`, `grid.lua:147`).
- Battery: charging green **`#59D959`**, low (≤20%) red **`#E54033`** (`statusbar.lua:48-50`).
- Text drop shadow: black **0.55** on dark, **0.15** on light (`draw.lua:95-98`).

## Accent / color schemes (`src/ui/theme.lua:31-45`)

| Name | value | notes |
| --- | --- | --- |
| Blue | `#2245cc` | out-of-box default (Classic PSP blue) |
| Purple | `#7a3fd4` | |
| Red | `#c0264b` | |
| Orange | `#d97b1f` | |
| Green | `#1f9e46` | |
| Teal | `#12939c` | |
| Pink | `#d4569b` | clouds design reference |
| Silver | `#7f8c9b` | |
| Black | `#101216` | |
| Black & Blue | `black-blue` | bg `#0e141b`, accent `#1a9fff`, dark - **shipped default** |
| White & Blue | `white-blue` | bg `#e9edf2`, accent `#20a0d6`, **light** (flips text to `#1F242E`) |

- Single hex: `accent = bg = hex`, `light = false`; invalid hex → falls back `#2245cc`.
- Default background `theme = "waves"` (`config.lua:48`); default `wave_color = "#2245cc"`
  (`config.lua:36`). Shipped `config/config.json` overrides to `wave_color=black-blue`,
  `theme=waves`, `all_icon_size=small`, `nav_autohide=10`, `tooltips=false`,
  `button_layout=modern`, `show_titles=false`, `transparency=true`.

## Fonts (`src/ui/fonts.lua`)

Roboto Condensed **Bold** + **Regular** (`assets/fonts/RobotoCondensed-{Bold,Regular}.ttf`).
Sizes (px @480; `finalPx = round(basePx × s)`):

| Element | px | weight | file |
| --- | --- | --- | --- |
| Settings title | 30 | bold | `settings.lua:241` |
| Settings row label | 19 | bold | `settings.lua:249` |
| Settings row value | 15 | bold | `settings.lua:250` |
| Settings "more" hint | 13 | regular | `settings.lua:310` |
| Carousel focused title | 21 | bold | `carousel.lua:24` |
| Carousel playtime | 15 | regular | `carousel.lua:26` |
| Grid selected title | 21 | bold | `grid.lua:245` |
| Grid info line | 15 | regular | `grid.lua:249` |
| Status bar (time+battery) | 16 | bold | `main.lua:444` |
| Empty-state / toast | 22 / 18 | bold | `carousel.lua:113` / `main.lua:460` |

## Glass pills (`src/ui/glass.lua`)

- Transparency ON: three translucent PNG slices (`glass-bg-left/center/right.png`), caps keep
  aspect, center stretched. Drop shadow black **0.35** (dark) / **0.10** (light), y offset
  **3** / **1.5**, x **1.5**. Backdrop blur behind the art (offscreen canvas). Corners:
  full stadium (`r = h/2`). Mockup recreates this in CSS (translucent white gradient stadium
  + `backdrop-filter: blur` + shadow + top highlight).
- Transparency OFF: solid rounded stadium filled with Simple grays + FG-@0.5 outline, no blur:
  - dark: top **`#333337`** → bottom **`#202022`** (`{0.20,0.20,0.215}`/`{0.125,0.125,0.135}`)
  - light: top **`#F4F4F6`** → bottom **`#DDDEE2`** (`{0.955,...}`/`{0.865,...}`)
  (`simple.lua:49-54`, reused by glass fallback.)

## Last Played - carousel (`src/ui/carousel.lua`)

- BASE (`carousel.lua:14-27`): tile 160, tileFocused 200, gap 20, centerXFrac 0.50,
  centerY 0.44, cornerRatio 0.15, borderWidth 4, borderGap 3, titleSize 21, titleOffset 18,
  playtimeSize 15, playtimeGap 8.
- Sizes are heights; width = height × aspect. aspect `2/3` (default) or `1` (square)
  (`cover_aspect`, `config.lua:108`). Extra `sizeScale` from Cover Size:
  small 0.75 / medium 1.0 / **large 1.2 (default)** (`main.lua:315`, falls through `or 1.2`).
- Default large 2:3: unfocused **192×128**, focused **240×160** (grow **1.25×**).
- Row vertical center `0.44·h ≈ 211`; focused tile centered `0.50·w`. Uniform 20px gap.
- Corner radius `min(w,h)·0.15` (24px on the focused large tile) when `rounded_corners`
  (default true).
- Subtle border on all tiles: white @0.25, 2px. Focus border: white 4px, 3px outside
  (`radius+3`).
- Title (21 bold) under tile at `+18px`, **hidden by default** (`show_titles=false`).
  Playtime (15 regular @0.9), format `"<value> Played"` e.g. `"2h 15m Played"`
  (`stats.lua:120-128`: `<1m` / `45m` / `2h` / `2h 15m`; nil → line hidden).
- Focus fade: border opacity = focus `f`; title/playtime alpha = `max(0,(f-0.5)·2)`
  (text catches up in the second half of the grow).
- Cover fallback: `#262626` tile, first letter uppercased at 40% height, white @0.35.
- Empty: `"No games found.\nAdd folders with info.cfg inside the GAME directory."` 22 bold.

## All Titles - grid (`src/ui/grid.lua`)

- Layouts (`grid.lua:20-23`): large `2 rows × 5 cols, icon 98, gap 15`;
  **small (default) `3 rows × 7 cols, icon 68, gap 12`** (`all_icon_size=small`).
- Constants: GRID_TOP 70, NAME_Y 336, CORNER 0.16, ZOOM 0.14.
- At 640 (s=1): small gridW 548, x0 ≈ 46, y0 ≈ 69; large gridW 550, x0 = 45, y0 ≈ 77.5.
  At 720: large x0 = 85.
- Icons square. Source priority `iconPath or imgPath` (icon preferred, cover fallback).
  Radius `size·0.16`.
- Focus zoom `size·(1+0.14·f)` = **1.14×**; two-pass draw (resting then zoomed on top).
  Subtle border white @0.25 2px; focus border white 4px 3px outside.
- Bookmark badge (`bookmark.png`), top-left, inset `size·0.08` from left, `2px` above top,
  height `size·0.30`, full white. Toggle **Y**.
- Paging: right past last column → next page; left at first → prev; **X** skips a page.
  Glass edge arrows (`glass-arrow-right.png`, mirrored left) at `x=14` / `x=w-14`,
  `arrowCy = y0 + gridH/2`, height 20, alpha 0.9, shown per available direction. X-skip glyph
  by the right arrow when `tooltips` and `pageCount>1`. **No page dots, no page counter.**
- Bottom: selected title (21 bold) at `NAME_Y=336`, centered in `w·0.8`. Info line
  (15 regular @0.9) at `366`: `"{playtime} Played  |  [Y-glyph] to Bookmark"`
  (or `to Unbookmark`); playtime segment only when nonzero; **bookmark hint always shows**.
- Sort (`all_sort`): `az` (default) / `recent` / `playtime`. Bookmark placement
  (`all_bookmarks`): `first` (default) / `sorted`.

## Settings (`src/ui/settings.lua`)

- Title "Settings" (30 bold) at (40, 26). 7 visible rows; rowH 42, rowsTop 84, rowX 40,
  rowW `w-80`. Label 19 bold, value 15 bold.
- Focused row: glass pill behind it (`rowX, ry+2, rowW, rowH-4`), snaps (no slide);
  label alpha 1.0 vs 0.85; value right-aligned ending `rowX+rowW-22`, bracketed by glass
  `‹ ›` arrows when focused/changeable.
- Color row draws a color dot (radius 8); dual schemes = two half-circles bg|accent.
  Button-Style row draws button-glyph images with " / " between, height 18.
- "more" hint (13 regular @0.45) bottom-right at `y≈380` when the list continues.
- Controls: up/down move; left/right change value; A = activate (Reset Settings); B/L1 back.

### Rows in order (label → on-screen option strings → default)

1. **Color** → Blue/Purple/Red/Orange/Green/Teal/Pink/Silver/Black/Black & Blue/White & Blue/Custom → Blue (dot)
2. **Theme** → Waves/Particles/Clouds/Simple Dark/Simple Light → Waves
3. **Tooltips** → Yes/No → Yes
4. **Auto-Hide Navigation** → No/3s/5s/10s → No (cycles {0,3,5,10})
5. **Infinite Scrolling** → Yes/No → No
6. **Button Style** → `A / B` or `X / O` (glyph images) → A / B
7. **Default Screen** → Recent/All Titles → Recent
8. **Startup Fade-In** → Yes/No → Yes
9. **Show Playtime** → Yes/No → Yes
10. **Show Titles on Recents** → Yes/No → No
11. **Cover Size on Recents** → Small/Medium/Large → Large
12. **Title Limit on Recents** → 4/8/12/16 → 12
13. **Icon Size on All Titles** → `Small (3 Rows)` / `Large (2 Rows)` → Small (3 Rows)
14. **Sorting on All Titles** → A-Z/Recent/Time Played → A-Z
15. **Bookmarks on All Titles** → Show First/As Sorted → Show First
16. **Transparency** → Yes/No → Yes
17. **Screen Brightness** → `<n>%` or `--` (left/right adjusts)
18. **System Volume** → `<n>%` or `--` (±10)
19. **Reset Settings** → (empty; A activates)

## Status pill (`src/ui/statusbar.lua`)

- Top-right, top-right corner at `(w-12, 12)`; pillH 34, padX 14, gap 12. Time `"11:44 PM"`
  (no leading-zero hour) + battery icon (26×13, cap 2.5, fill inset 2.5) + `NN%`. FG @0.85.

## Nav pill (`src/ui/navpill.lua`)

- Segments `{recent, all, settings}` → icons `lastplayed/allTitles/settings.png`.
- pillH 54, iconSize 27, bubble 70×46, slotW 70, padX 4, pillW 218, centered
  `px=(w-218)/2` (211 @640, 251 @720), `py = h-18-54 = 408`.
- Active bubble = second smaller glass pill sliding between slots (SLIDE_SPEED 12,
  hold 0.15s). Active icon alpha 1.0, inactive 0.55.
- L1/R1 glyphs flank pill (when tooltips): `button_L1/R1.png`, height 22, gap 12, alpha 0.7.
- Autohide: `nav_autohide` {0,3,5,10}s; fade `NAV_FADE_TIME 0.35s` linear, reveal delay
  `0.15s`; input resets `navShownAt` (`main.lua:327-342`).

## Backgrounds

### Waves (`src/ui/wave.lua`) - GLSL fragment shader (port verbatim)

- Two filled sine crests in normalized uv (0=top,1=bottom):
  - `y1 = 0.76 + 0.13·sin(uv.x·2.2 + p.x) + 0.05·sin(uv.x·5.0 - p.y)`
  - `y2 = 0.92 + 0.12·sin(uv.x·2.8 - p.z) + 0.06·sin(uv.x·4.1 + p.w)`
  - fill `f = smoothstep(y-0.02, y+0.05, uv.y)`; rim `g = exp(-|uv.y-y|·55)`.
- Dark (additive): `col += f1·(tint·0.45+0.05); col += f2·(tint·0.70+0.10);
  col += (g1+g2)·(tint·0.6+0.4)·0.5`.
- Light (mix): `col = mix(col,tint,f1·0.20); mix(...,f2·0.32); mix(...,(g1+g2)·0.45)`.
- Gradient: dark `top = bg·0.20, bottom = bg·1.05`; light `top = bg·1.04,
  bottom = bg·{0.88,0.88,0.92}`.
- Phases advance at `time × {0.45,0.26,0.36,0.31}`, wrapped mod 2π.
- black-blue: bg `#0e141b` → gradTop ≈ `#030405`, gradBottom ≈ `#0E151C`, tint `#1a9fff`.

### Particles (`src/ui/particles.lua`)

- 4-corner gradient: top-right (lit) `#0B1030`, top-left/bottom-right `#06091D`,
  bottom-left (darkest) `#02030E`.
- 70 motes, additive, color `#C8D1F2`, size `1.5 + 20·z²` (1.5–21px), z biased far,
  alpha ≤0.85, twinkle. Light source at `(0.82,-0.18)` with soft glow (0.18) + beam (0.09).

### Clouds (`src/ui/clouds.lua`)

- Pixel size `round(h/160)=3`, nearest filter, Bayer 4×4 dither.
- Sky (4 stops top→bottom): `#4677AF` → `#589BC5` → `#71BDD5` → `#8DDAE2` (bottom = the "glow").
- Cloud ramp (Pink reference, shadow→sunlit): `#D65C9F` `#E87DB8` `#F2A1CD` `#F8C4E0`
  `#FCE3F1` `#FFF7FC`. 8 cauliflower sprites, 3 depth layers, drift right 0.002–0.008/s,
  sun upper-left. Accent recolors the cloud ramp; sky stays blue/cyan.

### Simple (`src/ui/simple.lua`)

- dark: top `#333337` → bottom `#202022`; light: top `#F4F4F6` → bottom `#DDDEE2`.
  Accent shows only on selection borders.

## Transitions (`main.lua`, `intro.lua`, `loading.lua`, and per-screen)

All focus/scroll motion is **exponential ease-out, no overshoot** (`v += (target-v)·min(1,dt·SPEED)`):

| Transition | timing | easing | file |
| --- | --- | --- | --- |
| Startup bg fade (black→bg) | 0.6s | smoothstep (ease-in-out) | `intro.lua:11,148` |
| Startup UI fade | 0.45s | smoothstep | `intro.lua:12,135` |
| Screen switch content | **instant** | none | `main.lua:136-149` |
| Carousel focus grow 1.0→1.25 & row scroll | SPEED 10, τ≈0.1s (~300ms) | ease-out | `carousel.lua:29,83-91` |
| Carousel title/playtime fade | after focus>0.5 | - | `carousel.lua:203` |
| Grid focus zoom 1.0→1.14 | SPEED 10 (~300ms) | ease-out | `grid.lua:28,69-72` |
| Grid page-turn / bookmark | **instant** | none | `grid.lua:92-124` |
| Nav bubble slide | SPEED 12 (~250ms), 0.15s hold | ease-out | `navpill.lua:24,52` |
| Nav autohide fade | 0.35s, 0.15s reveal delay | **linear** | `main.lua:41,340` |
| Power-off fade-to-black (hold 2s) | 2.0s / release 0.4s | **linear** | `main.lua:198-224` |
| Exit combo L1+X+START (hold 2s) | 2.0s progress bar (`w·0.5`) | **linear** | `main.lua:65,471` |
| Loading fade-in / hold / out | 1.1s / 0.25s / 0.5s | smoothstep | `loading.lua:17-19` |
| Loading "Loading..." pulse | `0.55+0.45·sin(t·4)` (~1.57s) | sine | `loading.lua:111` |

CSS: exp ease-out ≈ `cubic-bezier(0.25,0.46,0.45,0.94)`; smoothstep ≈ `ease-in-out`.

## Input map (`main.lua`, desktop keys)

L1/R1 switch screens · D-pad scroll · A launch · X grid skip-page · Y grid bookmark ·
SELECT toggle Settings · B leave Settings · hold Menu/Power 2s power-off ·
START+SELECT or hold L1+X+START 2s exit to muOS.
