# SimpleOS source notes

Exact values extracted for SimpleOS (`github.com/boorngos/SimpleOS`), an overlay on Anbernic's own
Linux that turns the RG DS into a DS-only machine. These are the authoritative spec for the
mockups.

**There is no source to read.** SimpleOS ships as a release zip - shell scripts, two Python
helpers, shader files, splash bitmaps and one compiled program, `simpleos/system/bin/simpleos`.
Everything below comes from four places, and each value says which:

| Source | What it is | Cited as |
| --- | --- | --- |
| The release zip, `VERSION` `20260915` | `README.txt`, `CHANGELOG.txt`, the splash BMPs, the binary | file name |
| The binary's strings | the UI region of `strings -n 4` over the binary | [`strings.txt`](strings.txt) line |
| The binary's symbols | its own functions and objects, with sizes, from the ELF symbol table | [`symbols.txt`](symbols.txt) |
| The release trailer | `youtube.com/watch?v=VN8mWzVBWzw`, 46s at 1920x1080 | the frame saved beside this file |

The binary is not stripped and carries its debug file names, so its structure is readable even
though its code is not: `source/common/{app,ui,draw,video,pad,keymap,library,covers,ndsicon,settings,hw,ra,paths}.c`
and `source/shell/main.c`. It is cross-compiled with Zig for aarch64 glibc.

The set built from these notes is at `app/src/themes/simpleos/`; what the port changed is in
[`porting/simpleos.md`](../../../porting/simpleos.md).

## Global

- **Two panels, 640x480 each.** The splash bitmaps `simpleos/system/splash/logo.bmp` and
  `logo2.bmp` are 640x480x24, and the boot shows one per panel (`trailer-boot.png`). The device is
  the Anbernic RG DS; [`rg-ds.png`](rg-ds.png) is the reference photograph of the body.
- **Two windows, one per panel.** `Video_top` and `Video_bot` return the two renderers
  (`symbols.txt`); `SIMPLEOS_OUT_TOP`, `SIMPLEOS_OUT_BOT`, `SIMPLEOS_STACKED` and
  `SIMPLEOS_WINDOWED` pick the outputs (`strings.txt` 404, 366, 449, 447); `Video_pointerStacked` maps a
  touch when both are stacked in one window. The touch panel is the bottom one
  (`Video_eventOnBot`).
- **Renderer: SDL2's 2D renderer and nothing else.** Besides libc and libm, the only library the
  binary links is `libSDL2-2.0.so.0` - no SDL_image, no SDL_ttf, no GL of its own. The calls it makes are `SDL_RenderFillRect`, `SDL_RenderDrawPoint`, `SDL_RenderCopy`,
  `SDL_RenderSetClipRect`, `SDL_SetRenderDrawBlendMode`, `SDL_SetTextureAlphaMod`,
  `SDL_SetTextureBlendMode`, `SDL_SetTextureScaleMode` and `SDL_RenderSetLogicalSize`. There is no
  `SDL_RenderCopyEx`: nothing is rotated or flipped.
- **Paint order is call order.** There is no scene graph, container or z index: each `Ui_*`
  function draws its screen front to back with `Draw_*` calls into one renderer.

## Drawing primitives (`source/common/draw.c`)

From the symbol table, with sizes in bytes. What each draws is read from its name; where a use is
given, it is the likeliest match on screen rather than something the binary states.

| Symbol | Size | What it draws |
| --- | --- | --- |
| `Draw_fill` | 216 | a filled rectangle |
| `Draw_rect` | 588 | a rectangle outline |
| `Draw_round` | 1152 | a filled rounded rectangle - the cards, tiles and rows |
| `Draw_roundBorder` | 844 | a rounded outline - the selected tile's border |
| `Draw_pixel` | 156 | one pixel; what the font is blitted with |
| `Draw_text` | 500 | a string in the 8x8 font at an integer scale |
| `Draw_textCenter` | 144 | centred |
| `Draw_textShadow` | 120 | with a dark offset copy - the in-game menu's labels |
| `Draw_textWidth` | 140 | width of a string: length x 8 x scale |
| `Draw_textMarquee` | 232 | a string that scrolls when it does not fit |
| `Draw_textScroll` | 452 | a clipped, scrolled string |
| `Draw_battery` | 568 | the title bar's battery glyph |
| `draw_text_clipped` | 224 | a string hard-cut at a width |
| `draw_icon_or_letter` | 368 | a title's icon texture, or its initial when there is none |
| `draw_sos_logo_tex` | 440 | the logo as a texture |
| `draw_wait_dots` | 224 | a busy indicator |

## Screens (`source/common/ui.c`)

One function per screen, each with a `*Hit` twin for touch:

| Symbol | Size | Screen | In the trailer |
| --- | --- | --- | --- |
| `Ui_splash` | 1452 | the two splash bitmaps, "Touch the touch screen to continue." | `trailer-boot.png` |
| `Ui_home` | 1660 | the grid on the bottom, the highlighted title on the top | `trailer-home.png`, `trailer-home-page-2.png` |
| `Ui_empty` | 708 | home with no games; the strings "No games" and "Put .nds files in games/" are presumably its | no |
| `Ui_archive` | 868 | "Archived titles" | no |
| `Ui_options` | 10368 | START: Network, Update, Game settings, Power management, and their sub-lists; also the on-screen keyboard | RetroAchievements only: `trailer-retroachievements.png` |
| `Ui_map` | 1440 | Controls: remap DS buttons | no |
| `Ui_clock` | 2360 | the clock and timezone | no |
| `Ui_menu` | 740 | the in-game menu | `trailer-quick-menu.png`, `trailer-quick-menu-title.png`, `trailer-game-switcher.png` |
| `Ui_video` | 880 | VIDEO: HIGH RES 3D and the shader | no |
| `Ui_game` | 488 | while DraStic runs | yes |
| `Ui_osd` | 868 | `SAVED`, `LOADED`, the RetroAchievements unlock | `trailer-unlock.png` |
| `Ui_install` | 1244 | the OTA / manual update progress | no |
| `Ui_nightDim` | 92 | a software veil for NIGHT brightness | no |

`Ui_options` being more than a quarter of all the UI code is the size of its menu tree, not of any
effect.

## Font

- **One font: `FONT8X8`**, a 776-byte object in `.rodata` at file offset `0x4f58` - 97 glyphs of
  8 rows, one byte per row, **most significant bit leftmost**. Glyphs 0-94 are printable ASCII from
  space; glyph 96 is a right arrow. It is not the public-domain `font8x8_basic` table: its bytes
  for `A` do not occur in the binary.
- **Three scales**: 1x (tile captions, the unlock banner's label, `<  >`), 2x (body text, the
  title bar, list rows, legends) and 3x (the date, the in-game menu). Measured off the trailer and
  consistent to the pixel at 0.819 scale.
- The face is rebuilt as a TrueType font for the mockups by [`extract-font8x8.py`](extract-font8x8.py)
  and [`build-font8x8.py`](build-font8x8.py): every set bit is one square on an 8-unit grid.
- The legends need `←→` and the table has only `→`. How the binary draws `←` is not recoverable
  from the strings (the arrows fall outside `strings`' printable range); the rebuilt font mirrors
  `→`.

## Layout (measured, one 640x480 panel)

### Top panel, home (`trailer-home.png`, panel at 0.819)

| Element | Box / position | Notes |
| --- | --- | --- |
| Title bar | 0,0 640x38 | `SIMPLE OS` 2x at x 12; time 2x right edge 571; battery 590-623 |
| Card | 35,60 570x393, radius ~16 | white, soft shadow |
| Icon backing | 250,78 140x140, radius ~12 | the title's colour |
| Title | centred, top 228, 2x | **hard cut at 33 characters, no ellipsis**: "Dr Kawashima's Brain Training - H" |
| Legend | centred, tops 267 / 298 / 329, 2x | three strings, verbatim, with their runs of spaces |
| Date | centred, top 399, 3x | `%02d %s %04d` |

### Bottom panel, home

| Element | Value |
| --- | --- |
| Grid | 3 columns x 2 rows, a page at a time |
| Tile | 180x165 at a 192x189 pitch, first at 38,39; radius ~10; white with a solid 3,4 offset shadow |
| Selected tile | pale yellow fill, 3px yellow border |
| Icon backing | 160x126 inset 10,8; the icon ~104 square centred on it |
| Caption | 1x, centred, top 142, **hard cut at 20 characters** |
| Page dots | 7px, 16px pitch, centred on y 458; current blue |

### Lists (`trailer-retroachievements.png`, panel at 1.572)

| Element | Value |
| --- | --- |
| Rows | 592x46 at a 53px pitch from y 8, 24px in from each side, radius ~8 |
| Text | 2x; label 21px in from the left, value right-aligned 21px in from the right |
| Selected row | pale yellow fill; others white on a faint rule |
| Title | none on the bottom panel |

### In-game menu (`trailer-quick-menu.png`, panel at 0.803)

| Element | Value |
| --- | --- |
| Items | 3x capitals, centred, 56px pitch, white with a dark edge (`Draw_textShadow`) |
| Cursor | a white box ~32px either side of the label and 50px tall, black text |
| Scrim | none: the game shows through unchanged |
| Top panel | the title 2x centred at y ~48, `<  >` 1x under it at y ~75, both with the dark edge |

### Unlock banner (`trailer-unlock.png`, panel at 1.569)

`44,11 550x84`, rounded: a 33px blue strip with `RETROACHIEVEMENTS` 1x and the points 2x
right-aligned, over a white body with a blue cup (~40px) and the achievement's name 2x.

## Colour

No palette file exists; SimpleOS's colours are compiled in. Sampled as a median over a small
square (video encoding makes single pixels noise):

| Where | Value |
| --- | --- |
| Title bar | `#2e6cc9` |
| Top wash | `#e6faff` to `#fffff9` |
| Grid wash | `#e4f9ff` to `#fffff5` |
| List wash | `#faffff` to `#fffff8` |
| Selected tile / row | `#ffffc2` / `#ffffc5` |
| Selected tile border | a deeper yellow, ~`#f2cd52` (the sample is too thin to read cleanly) |
| Text / legend / list value | `#1f2529` / `#6f7882` / `#847660` |
| Page dot on / off | `#2f6ec4` / `#c4cde5` |
| Unlock strip / cup | `#306ecd` / `#227ef2` |
| Splash washes (bitmaps) | `#b6ddfb` to `#e6f2fc`; warning `#d4eaf9` |

## Motion

**None observed.** At 30fps the trailer moves the grid cursor, flips pages, opens and closes the
in-game menu and moves its cursor each on a single frame (`trailer-page-flip-30fps.png`). The
binary has no easing, tween or timeline symbols (`ease|tween|lerp|anim|bezier|spring|interp` over
`symbols.txt` hits only `Pad_released`). What does move over time:

- `Draw_textMarquee` and `Draw_textScroll`: long strings scroll somewhere. Not observed in the
  trailer, where every long title seen is hard-cut.
- `draw_wait_dots`: a busy indicator while signing in, scanning or updating.
- `Ui_osd`: `SAVED`, `LOADED` and the unlock banner appear and go; their duration is not visible.

## Depth

Painter's order within each screen function, one screen per panel. Nothing re-bases depth
because nothing groups: there is no container type. What overlaps what:

- the in-game menu over DraStic's own output, with no scrim;
- the unlock banner over the game's top panel;
- `Ui_nightDim`'s veil over everything, when NIGHT is below the panel's floor.

## Degradable effects

None. There is no blur, mask, shader or reflection in the UI - the only alpha is
`SDL_SetTextureAlphaMod` on textures and blended fills. The shaders in `simpleos/system/shaders/`
are DraStic's game-image filters, not UI effects.

## Theming

None switchable. One fixed look; the only runtime visual changes are brightness and NIGHT.

## Input

From `README.txt`, `CHANGELOG.txt` and the binary's legend strings:

| Where | Buttons |
| --- | --- |
| Splash | touch continues |
| Home | D-pad moves; `A  play`; `X  archive`; `START  options`; `SELECT  clock`; `HOME  game config` (MENU on the RG DS) |
| Options lists | `A  select     B  back` (`B  home` off Options itself) |
| Game settings | `A  toggle     ←→  shader` |
| This game | `A  cycle / Controls     B  home`; each option cycles `GLOBAL` / `ON` / `OFF` |
| Controls | `A  bind   X  add   B  back`; `DEFAULT` clears; "Press a button or stick" |
| Clock | `tap arrows      A  save      B  cancel` |
| Archive | `A  move      B  back` |
| In game | MENU opens the menu; left/right change title; a tap highlights, a second confirms |
| Global | MENU+L1 / MENU+R1 brightness (below the minimum is NIGHT); Anbernic+right stick power profile; Anbernic+SELECT fast-forward; Anbernic+L2 load, +R2 save; Anbernic+X FPS; MENU+POWER unfreezes |

Pad input has held-button repeat (`Pad_repeat`, `repeat_at`, `menu_repeat_at`) and a slow-repeat
variant (`Pad_slow`).

The in-game menu for the running title is `RESUME / SAVE / LOAD / ARCHIVE / VIDEO / CONTROLS /
RESET / HOME` (`CUR_ITEMS`, 64 bytes: eight pointers); for another title it is `LOAD / ARCHIVE /
HOME` (`OTH_ITEMS`, 24 bytes: three). The trailer's build shows seven, without CONTROLS
(20260914 added it).

## Data model

Per title: its name (the ROM file name without extension, `Sos_stripExt`), its 32x32 banner icon
(`Nds_readIcon`, `decode_banner_buf`; cached in `covers.dat`, which begins `SOS1` and stores a name
and an offset per title), an archived flag (`Library_toggleArchive`), whether a savestate exists
(`GameOpt_hasSavestate`), and per-game overrides for auto-load, auto-resume, HIGH RES 3D and the
shader (`GameOpt_*`). RetroAchievements adds a game ID by MD5 of the ROM (`Ra_hashNds`,
`Ra_identify`) and each achievement's title and points (`Ra_writeAchFromPatch`).

## What has no equivalent here yet

- The on-screen keyboard (`KBD_HI`, `KBD_LO`, `opt_type_key`) for Wi-Fi and RetroAchievements
  credentials.
- The timezone picker ("Pick a region, then a city.", `tz_*`).
- The update progress screen (`Ui_install`) and `Ui_empty`'s first-run guidance beyond its two
  lines.
- The marquee: where it runs and how fast.
