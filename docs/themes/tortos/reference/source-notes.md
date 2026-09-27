# TortOS source notes

What the mockup set was built from: the TortOS source at
[`ericreinsmidt/TortOS`](https://github.com/ericreinsmidt/TortOS), tag `v1.0-3-g9b9c342`, a C
launcher on SDL2, SDL_ttf and SDL_image for the TrimUI Brick. Every value below is quoted from that
tree with a file and line; where one was measured off a reference frame instead, it says which.

| Source | What it gives |
| --- | --- |
| `src/main.c` | every screen, the shelf, the menu panel, the input loops (10,753 lines) |
| `src/coverflow.c` | the coverflow layouts, its projection, its motion, the cube |
| `src/ui.c` | the type scale, text, marquee, glow, rails, the panel, the generated card, the play-mode marks |
| `src/ui.h` | the base palette |
| `src/cards.h` | UI Theme and UI Direction |
| `src/sys_menu.c`, `src/game_menu.c`, `src/wifi_menu.c`, `src/bt_menu.c`, `src/controls.c` | the rows of the menus that are built outside `main.c` |
| `src/keyboard.c` | the on-screen keyboard |
| `src/menu.c` | the cursor and window rules every list shares |
| `config/systems.cfg` | the eleven systems, their order and their accents |
| `res/fonts/menu.ttf` | Josefin Sans Regular, the only font the launcher opens |
| `res/cards/classic/`, `res/cards/fancy/` | the two sets of system card art |
| `res/readme/*.png` | ten 1024x768 screenshots, copied here as `readme-*.png` |

`measure-cards.mjs` measures the card art the way the launcher does at decode time;
`extract-advances.mjs` pulls the font's advance widths and GPOS kerning into a table.

**One of the reference frames is older than the source.** `readme-hare.png` has 64px rows and its
text measures exactly 43/49 of the current size - it predates the type scale's 1.15 - and its panel
is 800 wide where the current rule gives 835. The other nine agree with the source.

## Global

- Screen 1024x768 (`src/platform.h:13-14`). One device.
- Redraws only when something changes, polling every 16ms, at least once a second
  (`src/main.c:10613-10630`).
- Hold to repeat: 300ms, then every 90ms (`src/platform.c:56-57`).

## Drawing primitives (`src/ui.c`)

- **Text** (`ui_text`, 175): a surface drawn at (x, y), its top at y, anchored left, centre or right.
  Width by `TTF_SizeUTF8`. The reference frames only measure out with the font's GPOS kerning
  applied, so the device's SDL_ttf shapes with HarfBuzz.
- **Fit** (`ui_fit_text`, 351): the longest prefix that fits with `"..."` appended, stepping back
  UTF-8-safely.
- **Marquee** (`ui_text_marquee`, 266): text wider than its box ping-pongs - 1400ms still, 70px/s
  out, 900ms still at the far end, back (203-231). Its edges fade over 36px in 3px slices, each side
  only while something is hidden on it. One clock per subject, restarted when the subject changes
  (`mq_phase`, `src/main.c:2848`).
- **Scroll-through** (`ui_scrollthrough`, 233): the one-way form, for a synopsis laid out twice.
- **Glow** (`ui_glow`, 370): one 192px texture of alpha `(1 - d)^3`, stretched over a rect times a
  spread, tinted with `SetTextureColorMod`/`AlphaMod`, drawn with `SDL_BLENDMODE_ADD`.
- **Rounded rect** (`ui_round_rect`, 637): scanline fills. **Panel** (`ui_panel`, 667): the rect in
  the accent at full strength, then a rect `UI_PANEL_BORDER` 12 inside it in (22,24,32,252).
- **Rails** (`ui_rail`, 554; `ui_rail_v`, 600): see Layout.
- **Generated card** (`make_card`, 815): see Layout.
- **Play-mode marks** (878-1059): strokes with round ends and arrowheads in a unit square, rendered
  4x4 supersampled into a white texture and tinted.
- **Heart** (`draw_heart`, `src/main.c:2227`): a fan over `x = 16 sin^3 t`,
  `y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t`, 48 segments, scaled by `rad / 16`.

## Screens

The shelf is either the systems row or one system's games (`src/main.c:74`). Every other screen is
a nested loop that draws the shelf, a dim, and its own panel - never the panel of the screen that
opened it.

| Screen | Drawn by | Reached by |
| --- | --- | --- |
| Systems row | `draw_systems` (2690) | boot; B from a games shelf |
| Games shelf | `draw_games` (3048), `draw_game_text` (2887) | A on a system |
| Cubic | `draw_both` (2531), `draw_games_face` (3027), `cf_draw_cube` | UI Direction = Cubic |
| No games found | `draw_no_games` (3094) | a card with no ROMs |
| TortOS menu | `tortos_menu_for` (6481), rows `sys_menu_build` (`src/sys_menu.c:79-143`) | MENU on the systems row; MENU in Cubic |
| System menu | same, rows `src/sys_menu.c:26-76` | MENU on a games shelf; B in Cubic; MENU in Muse |
| Wi-Fi | `wifi_screen` (4716), rows `src/wifi_menu.c` | TortOS menu |
| Bluetooth | `bt_screen` (5585), rows `src/bt_menu.c` | TortOS menu |
| Play Time | `stats_screen` (5783) | TortOS menu |
| About TortOS | `about_screen` (6025) | TortOS menu |
| Controls | `controls_screen` (6101), rows `src/controls.c` | TortOS menu |
| Over The Hare | `xfer_screen` (4937) | TortOS menu, online |
| Box Art | `art_screen` (5188) | TortOS menu, system menu, game details; online |
| Sign-in | `ra_signin_screen` (4748), `ss_signin_screen` (4814), `kb_prompt` | Cheevos, ScreenScraper rows |
| Game details | `game_info_screen` (5496), rows `gi_rows` (`src/game_menu.c:7`) | X on a game |
| Synopsis | `synopsis_screen` (8105) | A on Synopsis |
| Achievements | `cheevos_screen` (8152) | A on Cheevos; the in-game menu |
| Achievement | `cheevo_detail_screen` (6961) | A on an achievement |
| In-game menu | `game_menu` (8384), rows `gm_rows` | MENU in a game |
| Save / Load | `slot_strip`, `slot_draw` (6617) | Save, Load |
| Muse shelf | `muse_shelf_screen` (7826) | SELECT anywhere but a game; A on Muse's card |
| Tracks | `muse_tracks` (7616) | A on an album |
| Now Playing | `muse_now_screen` (7471), `np_draw` (7346) | A on a track; SELECT when something is loaded |
| Wait / result panel | `wait_panel` (4302) | rescans, sign-in, Wi-Fi |
| Confirm | `confirm_panel` (4344) | X on a saved network |

**MENU closes every menu screen at once; B leaves one** (`g_menu_closing`, `menu_leaving`,
`src/main.c:4325-4332`). The flag is put down on the shelf, in `game_menu` and in Muse, so MENU
stops there. MENU inside Muse opens Muse's own menu, and MENU inside that closes only it
(`muse_menu`, 7454).

## Font

Josefin Sans Regular, `res/fonts/menu.ttf`, at five sizes: `(int)(32 * 1.15 * mul + 0.5)`
(`src/ui.c:35-42, 99`).

| Role | mul | Size | Comment in source |
| --- | --- | --- | --- |
| TITLE | 1.62 | 60 | 52 |
| MENU | 1.34 | 49 | 43 |
| LABEL | 1.50 | 55 | 48 |
| META | 1.00 | 37 | 32 |
| CARD | 1.94 | 71 | 62 |

The comments are the sizes before the base took its 1.15, and every pixel figure commented against
them is stale by the same factor. Josefin's metrics are ascent 750, descent 250, no line gap, with
USE_TYPO_METRICS set, so height and line skip are both exactly the size. No `kern` table; GPOS pair
kerning only. The watermark on a generated card opens the same face at 560.

## Layout

### Coverflow (`src/coverflow.c:40-147`)

Card height = 768 x size, width = height x aspect; `step` is in card widths, or card heights when
stood on end.

| Layout | size | aspect | step | side scale | centre y | tilt | reflect | side alpha | fit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SYSTEMS | .81 | .78 | .82 | .38 | .415 | 0 | 1.34 | 140 | wide area .80 |
| SYSTEMS_V | .88 | .78 | 1.30 | 1 | .45 | 0 | 1.34 | 255 | vertical, wide area 1.0 |
| GAMES | .60 | .72 | .74 | .62 | .47 | .82 | 1.52 | 150 | equal area |
| GAMES_V | .60 | .72 | 1.50 | 1 | .47 | 0 | 1.52 | 255 | vertical, equal area |
| GAME_FACE | .60 | .72 | 3.20 | 1 | .47 | 0 | 1.52 | 255 | equal area |
| ALBUMS | .60 | 1.00 | .74 | .62 | .54 | .82 | 1.52 | 150 | contain |
| ALBUMS_V | .60 | 1.00 | 1.50 | 1 | .54 | 0 | 1.52 | 255 | vertical |
| ALBUM_FACE | .60 | 1.00 | 3.20 | 1 | .54 | 0 | 1.52 | 255 | contain |

(`CF_LAYOUT_SINGLE` is defined, and named by a stale comment at `src/main.c:3020`, but nothing draws with it - a cube face uses `GAME_FACE`.) Seven cards drawn (`CF_HALF_WINDOW` 3), far to near
by `|d|`, one slot per item on a ring (`cf_draw`, 623).

- **Projection** (`proj_point`, 460): a card yawed by `ang = -tilt * clamp(d, -1, 1)` about its
  own vertical axis; a point `lx` goes to `lx cos` at depth `lx sin`, scaled by `F / (F + z)` with
  `F = half-width * 6 + 1`. Scale and alpha go linearly to `side_scale` and `side_alpha` one step
  out. Drawn as 16 strips with `SDL_RenderGeometry`.
- **Fit** (`draw_card`, 485): contain; or equal area, `w = sqrt(area * ar)`, `h = sqrt(area / ar)`;
  or wide area for art wider than `CF_WIDE_ART` 1.2.
- **Reflection** (558-619): a mirrored copy from `content_bottom` (`src/main.c:398`, the first row
  from the bottom with alpha > 8) plus the set's gap, down to `reflect` half-heights below centre,
  vertex alpha `alpha * 90 / 255` at the mirror line to 0 at the floor.
- **Reflection gap** by card set (`src/cards.h:69-70`): Plain Jane 0, Fancy Pants 0.21 (system art
  only).

### Shelf text (`src/main.c:2738-3009`)

- Systems row: the name in TITLE at y=618, centred, fitted to 976, only when the art does not name
  itself (Fancy Pants); "N games" / "N albums" / "no games in Roms/<folder>" in META at y=690.
- Games shelf: the title in TITLE at y=40, centred in a box that reserves the heart's width on both
  sides - `lead = line/2 + 3 * (line * 2/5)` - sliding when wider. The heart's seat is
  `x = margin + hrad`, `hrad = line * 2/5`, `y = 40 + line/2 + descent/2`, in the owning system's
  colour. Muse's artist in MENU, DIM, at `40 + line + 4`. "i / n" in META DIM at y=690 centred, or
  at (24, 700) stood on end.
- Cubic: "i / n" at (24, 700); the system's name right-aligned to 1000 at y=700, fitted to what the
  count leaves with 40px between.
- Glows: the bottom wash {0, 528, 1024, 480} in the tint at 34, spread 1.7; the focused system card
  at 110, 2.4; a focused game card or cube face at 100, 2.3.

### Rails (`src/ui.c:554-635`)

Horizontal track x 90-934, y 739, 6 tall; vertical x 23, y 90-678, 6 wide, running bottom-up. Track
white at alpha 16; the marker `track / count` long (at least 18), alpha 235, placed from the shelf's
drawn position, with a copy a lap behind while it overhangs the far end. The systems rail's marker is
a window onto a strip of every system's colour, boundaries blending by `0.40 * (1 - |2f - 1|)`.

### Menu panel (`menu_draw_ex`, `src/main.c:3397-4164`)

| | Value |
| --- | --- |
| Row height | MENU line x 3/2 = 73 |
| Pad | row x 3/4 = 54 |
| Rule row | pad/2 + 2 = 29 |
| Note row | MENU height + pad/3 = 67 |
| Label-value gap | 73 |
| Heading band | LABEL line x lines + pad; rows start pad/2 below |
| Radius, border, margin | 20, 12, 24 |
| Plate | x = panel + pad/2, w = panel - pad, radius row/4, white at 34 |
| Width | the widest row, or fixed; the shelf menus' fixed width is the widest row any of them can show (`menu_shelf_width`, 6179), floored at 800 - 2 x pad (`menu_std_width`, 6255) |
| Height | capped at 768 - 48; past that the rows window (`menu_window_first`, `src/menu.c`) or, with no cursor, the body scrolls itself |
| Arrows | a triangle row/3 wide, half that tall, 8px off the rows, (138,143,163,200) |

Text colour is weighed by how much of the plate covers the row: a live label SOFT to TEXT, a dead
one DIM to SOFT, a live value DIM to the accent, a dead value DIM, and a per-row override (the
earned cyan). A two-column row gives the longer of label and value the room, and only the
selected row - or one the cursor can never reach - slides; the rest are cut with "...".

In `readme-menu.png` the shelf menus are 835 wide: the widest row on that build is ScreenScraper's
"not in this build".

### Other screens

- **Generated card** (`src/ui.c:693-863`): 512x656 with a 22px corner (an album's 512x512, square);
  a gradient `v = 38 - 18k` as `(0.86v, 0.92v, 1.2v)`; the first letter at 560 in the accent at
  alpha 55, placed at `(w - tw * 0.62, h - th * 0.80)`; a 6px accent band along the top; the title
  in CARD from `0.38 h`, x=48, wrapped to `w - 96`, at most four lines 4px apart; a 90x3 rule in the
  accent at 220, 12 below.
- **Keyboard** (`src/keyboard.c`): an 860x580 panel centred; title LABEL SOFT at +22; field at +74,
  804 wide, MENU height + 10, radius 8; keys 72x60, gap 6, ten by four from +150; space bar
  full width, 48 tall; hint chips in META, padding 3, 14 wide padding, radius 6, rows of four and
  three from `580 - 20 - line - (line + 8)`.
- **Save / Load** (`slot_draw`, 6617): heading LABEL DIM at y=39; the picture fitted to its aspect
  in {162, 129, 700, 451}, framed 12px in the tint; slot name MENU TEXT at +36; timestamp META at
  `+42 + MENU line`; seven dots 36 apart, radius 12 drawn with corner 6.
- **Now Playing** (7328-7441): cover 432 square at (80, 140); text from x=568, 392 wide; "N of M"
  at +36 with the mark `1.5 x META height` 18px after it; title +24, artist +10, album; bar at
  y=440, 6 tall; times at +16; "Next:" at `572 - META height`; hint line at y=696.
- **Low-battery dot**: (990, 34), radius 9, (224,72,72).

## Colour

`src/ui.h` and `src/main.c`.

| Name | Value |
| --- | --- |
| Background | (7,8,12) |
| Text / soft / dim | (237,237,242) / (198,201,214) / (148,153,172) |
| TortOS cyan (menus, Favorites, earned) | 0x3DD6FF |
| Muse green | 0x9CD345 |
| Panel fill | (22,24,32,252) |
| Rule | accent at 70 |
| Plate | white at 34 |
| Keyboard key / selected / field / chip | (32,35,46) / (62,68,86) / (16,18,26) / (52,56,70) |
| Empty slot / idle dot | (12,13,18,238) / (90,94,110) |
| Dims behind panels | 120 over the shelf; 150 behind the keyboard; 185 behind achievements and slots over a game |

Per-system accents are `config/systems.cfg`: NES C4443A, Master System C12216, Game Boy 7E9B47,
Genesis 3E82D6, TurboGrafx-16 E8641E, Game Gear 00B589, SNES 816EBA, Neo Geo Pocket C2478F,
Game Boy Color E0B23A, Neo Geo Pocket Color 00AA4F, Game Boy Advance 6B5BD6.

Which accent a panel wears: cyan for TortOS's own screens; the live tint for a system's menu, the
achievements and the in-game menu; the owning system's for game details; green for Muse.

## Motion

| What | Duration | Curve | Source |
| --- | --- | --- | --- |
| Horizontal shelf move | 240ms | ease-out cubic, `1 - (1-u)^3` | `ANIM_MS`, `ease_out`, `src/coverflow.c:168-186` |
| Vertical shelf move | 360ms | smoothstep, `u^2 (3 - 2u)` | `shelf_pacing`, `src/main.c:2458` |
| Cubic turn | 450ms | smoothstep, chased | `src/main.c:2440` |
| A move past eight cards | a departure of up to 8 (2 in Vertical) on ease-in cubic, then a cut | | `cf_set_cursor_dir`, `src/coverflow.c:314-324` |
| Vertical systems name | out over the first 30% of the linear clock, back over the last 30%, swapped at 50% | | `cf_label`, 329 |
| Background tint | `1 - e^(-9 dt)` per frame, dt capped 0.1s, lands within 12 | | `tick_tint`, `src/main.c:3154` |
| Menu plate | two chained exponential decays, tau 22ms | | 3780-3861 |
| Menu window scroll | two chained decays, tau 55ms, at most 0.55 of a row; jumps snap | | 3726-3778 |
| Cube | faces at right angles on an axis R = span/2 behind the glass, F = 0.85 span; lit `0.45 + 0.55 cos phi`; the cube backs away `k = 1 - 0.18 sin(frac pi)` | | `cf_draw_cube`, `src/coverflow.c:807` |
| Power off | 430ms slide in (ease-out cubic), 260ms head `1 - k^2`, 210ms dim | | `anim_poweroff`, `src/main.c:3241` |
| Launch zoom (cold start only) | 190ms, scale `1 + 2.2 k^2`, alpha `1 - k` | | `anim_launch`, 3183 |

Every move restarts from the drawn position; a chase shelf is never more than a step behind. Several
channels run at once on one interaction: a shelf move, the tint and the rail marker together. Every
track has a resting value - the cursor, the focused accent - so a still needs no clock.

## Depth

- The shelf is drawn far to near by distance from centre; the centre card last.
- The cube draws the face nearer to square-on last (`dn >= df`).
- Every screen draws the shelf, then a full-screen dim, then its own panel; the glow is drawn before
  the panel it surrounds. Nothing re-bases depth: SDL draws in call order.

## Degradable effects

| Effect | Where | What the source does without it |
| --- | --- | --- |
| Per-card perspective | the games row, albums | the systems rows are the same row with tilt 0 |
| Reflection | every coverflow | Plain Jane's gap is 0; nothing drops it |
| Additive glow | shelf, panels, cover | none - it is the only lighting |
| Render to texture | the cube's two faces | `draw_face_for` falls back to one face flat when a target fails (2581) |
| Marquee edge fades | long titles and rows | hard clip |

## Theming

UI Theme picks the card art (Plain Jane, Fancy Pants) and whether the shelf prints the system's
name; UI Direction picks Horizontal, Vertical or Cubic. Both are rows in the TortOS menu and apply
live. Neither changes a colour or a font. There is one palette.

## Input

| Screen | Buttons |
| --- | --- |
| Systems row | Left/Right (Up/Down when Vertical, up advancing) move and wrap; A enters, or opens Muse on its card; MENU the TortOS menu; SELECT Muse |
| Games shelf | along the row step and wrap; across it jump a letter; L1/R1 +-7; A launch; B back; X details; Y favourite; MENU the system's menu |
| Cubic | Up/Down system; Left/Right, L1/R1 game; A launch (Muse: its tracks); B the system's menu; X, Y as above; MENU the TortOS menu |
| Menus | Up/Down skip dead rows and wrap; Left/Right repeat and cycle a value; A acts; B back; MENU out; SELECT Muse |
| Keyboard | D-pad (both axes wrap); A type; B delete; X shift; Y symbols; L1/R1 cursor; START done; MENU cancel |
| Achievements | Up/Down wrap; L1/R1 page by 8; A detail; B, MENU close |
| Play Time, Bluetooth | Up/Down clamp; Left/Right window (Play Time); Y by game/system; A go |
| Save / Load | Left/Right cycle, skipping unusable slots; A choose; B back |
| Muse shelf | as a games shelf; A an album; B, SELECT close Muse; MENU Muse's menu |
| Tracks | Up/Down wrap; A play and open Now Playing; L1/R1 track; Left/Right seek 10s; B back; SELECT close; MENU Muse's menu |
| Now Playing | A play/pause; Y mode; L1/R1 track; Left/Right seek 10s; B back; SELECT close; MENU Muse's menu |

No chords and no hold gestures (the keyboard's header mentions B held on an empty field; no code
does it). F1/F2 brightness, the volume rocker and POWER are global.

## Data model

- System (`src/config.h:10-28`): name, folder, core, tag, card, accent, extensions, disc BIOS.
  Favorites first, the eleven in file order, Muse last; empty systems hidden.
- Game (`src/library.h`): name (file less extension), title (cut before " (" or " ["), file, date
  added, play seconds, last played.
- Game details (`src/game_menu.h:82-95`): year, genre, achievement counts, has art/set/scrape/synopsis.
- Achievement (`src/cheevos.h:37-44`): points, earned, title, description.
- Saves: six slots and Auto, each a picture and a time, "Aug 23 9:21:05 AM".
- Play time: seconds, launches, longest, last played, lost, per window and by game or system.
- Muse: artist, album, track; state, position, length, index, next; four play modes.

## What has no equivalent here yet

- A per-card perspective coverflow: `Carousel` is a flat strip. Added as `Coverflow`.
- A cube of two whole screens turning in 3D: theme-local.
- Additive blending: no widget blends by adding.
- Text measured from a font's own advances and kerning: every earlier set sized text by CSS.
