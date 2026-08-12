# NextUI theme source notes

Exact values extracted from N64FlashcartMenu (`github.com/Polprzewodnikowy/N64FlashcartMenu`, a
libdragon flashcart menu for the Nintendo 64). These are the authoritative spec for the mockups.
File:line references point into the source repo, under `src/menu/`.

The theme is inspired by [NextUI](https://nextui.loveretro.games/), the handheld custom firmware,
and adopts its seven-slot palette format whole. [`theme-notes.md`](theme-notes.md) beside this file
is the project's own user-facing documentation of the theme, kept verbatim.

## Global

- **Output:** 640x480, fixed. `DISPLAY_WIDTH` / `DISPLAY_HEIGHT`, with
  `DISPLAY_CENTER_X` 320 and `DISPLAY_CENTER_Y` 240 (`ui_components/constants.h:39,44`).
  A console has one output size, so **there is no scale factor anywhere in the theme** - every
  number below is a literal device pixel.
- **Overscan:** the menu never draws into the margin. `VISIBLE_AREA_X0/Y0/X1/Y1` are
  32 / 24 / 608 / 456, giving `VISIBLE_AREA_WIDTH` 576 and `VISIBLE_AREA_HEIGHT` 432
  (`constants.h:61,66,71,76,82,87`).
- **Theme switch:** `theme_is_nextui()` (`ui_components/theme.c:81`) guards every drawing site; the
  other branch is the menu's original "classic" look. Stored as `theme=nextui` in
  `sd:/menu/config.ini`.
- **Draw order per frame**, from each view's `draw`: `ui_components_background_draw()` →
  the view's own content → context menu → message box (`views/browser.c:893-951`).
- **Background:** with no image set, a flat `rdpq_clear` in the Background slot
  (`ui_components/background.c:297`). With one, the image is pre-multiplied by
  `NEXTUI_BACKGROUND_OVERLAY_COLOR` = `RGBA32(0,0,0,0x60)` at load
  (`background.c:133`, `constants.h:400`) - the classic theme uses a heavier overlay.

## Colour slots (`ui_components/theme.h:25-32`)

Seven, in palette-file order. `color1`..`color7` map onto them positionally.

| # | Slot | Paints |
| --- | --- | --- |
| 1 | `THEME_COLOR_MAIN` | Selection pill, button circles, progress fills |
| 2 | `THEME_COLOR_ACCENT` | Chrome pills, the title pill, the folder placeholder tint |
| 3 | `THEME_COLOR_ACCENT2` | Button glyph letters |
| 4 | `THEME_COLOR_LIST_TEXT` | Unselected list text |
| 5 | `THEME_COLOR_LIST_TEXT_SELECTED` | Text on the selection pill |
| 6 | `THEME_COLOR_HINT` | Hint pill text, screen titles, load-screen icons |
| 7 | `THEME_COLOR_BACKGROUND` | Screen background when no image is set |

Stock palette, used when a configured colour fails to parse (`theme.c:11-13`):

```
FFFFFF  9B2257  1E2329  FFFFFF  000000  FFFFFF  000000
```

**Three colours are not slots** and stay literal in every palette:

- `NEXTUI_MUTED_COLOR` = `A0A0A0` - dimmed ledger rows, unselected values, footnotes
  (`constants.h:403`).
- The neutral swatch frame `606060`, so a swatch showing the Background colour stays visible
  against the background (`views/nextui_colors.c:27`, `nextui_palette_view.c:23`).
- `STL_GREEN` / `STL_RED` in the Datel editor's On / Off column
  (`views/datel_code_editor.c:305`).

The dialog panel behind every overlay is also a literal, `RGBA32(0x2A,0x2A,0x2A,0xFF)`
(`ui_components/common.c:240`).

## Palettes (`assets/palettes/*.txt`)

Eighteen ship compiled in; custom ones are read from `sd:/menu/palettes/`. Format is NextUI's, so
palettes written for a handheld drop straight in:

```text
version=1
name=Slate Cyan
color1=0x45CFC3FF
...
color7=0x182233FF
```

Colours are `0xRRGGBB` or `0xRRGGBBAA` with the alpha ignored; `name` is optional and falls back to
the filename. `title_pill=1` is an N64FlashcartMenu extension - **no built-in carries it**, and a
palette written for a NextUI device cannot.

| File | Display name | color1..7 |
| --- | --- | --- |
| `Default` | Default | `FFFFFF 9B2257 1E2329 FFFFFF 000000 FFFFFF 000000` |
| `Brick_Blush` | Brick Blush | `B5442E F6DFD9 FBEAE6 33201D FBEAE6 8A6259 FBECE8` |
| `Catppuccin_Frappe` | Catppuccin Frappe | `A6D189 292C3C 232634 C6D0F5 232634 A5ADCE 303446` |
| `Catppuccin_Latte` | Catppuccin Latte | `8839EF E6E9EF EFF1F5 4C4F69 EFF1F5 6C6F85 EFF1F5` |
| `Catppuccin_Macchiato` | Catppuccin Macchiato | `F5A97F 1E2030 24273A CAD3F5 24273A A5ADCB 24273A` |
| `Catppuccin_Mocha` | Catppuccin Mocha | `CBA6F7 181825 1E1E2E CDD6F4 1E1E2E A6ADC8 1E1E2E` |
| `Charcoal_Coral` | Charcoal Coral | `FF6B5B 161416 2A0D06 F2F0EC 2A0D06 948F8C 1D1B1E` |
| `Deep_Violet` | Deep Violet | `6C4BC9 E7DCF7 F4EFFD 241B3D F4EFFD 6E6389 F1EAFA` |
| `Forest_Lime` | Forest Lime | `B7DD5B 0A1712 1B2708 E7EFE7 1B2708 7F998A 0F1F18` |
| `Ink_Gold` | **Ink & Gold** | `F2A93B 0C0E17 241A05 E7E6F2 241A05 8A87A3 12141F` |
| `Maroon_Rose` | Maroon Rose | `E9A6A0 1C0B0E 2E100C F3E6E4 2E100C 9C7B78 271014` |
| `MinUI` | MinUI | `FFFFFF 262626 999999 FFFFFF 000000 FFFFFF 000000` |
| `Mossy_Sage` | Mossy Sage | `4B6B3F E4EBD9 EBF3E4 1F2A1B EBF3E4 647459 EEF2E6` |
| `Mustard_Butter` | Mustard Butter | `B08117 F5E9C4 FDF3DA 2E2610 FDF3DA 8A7A45 FBF3DC` |
| `Plum_Magenta` | Plum Magenta | `D6559E 170F1D 2E0A1F EEE6F2 2E0A1F 93849E 1F1526` |
| `Slate_Cyan` | Slate Cyan | `45CFC3 111A28 0A2320 E6EDF3 0A2320 7E8FA3 182233` |
| `Teal_Powder` | Teal Powder | `1E6E76 DCEBEF E7F5F5 17232E E7F5F5 5B7480 E9F2F5` |
| `Terracotta_Cream` | Terracotta Cream | `C1602E F1E8D9 FCEEE4 2B2118 FCEEE4 7A6E5C F7F1E7` |

**`Ink & Gold` is the only one whose display name is not its filename with underscores removed.**
Reading the filename instead gets seventeen right and one wrong.

Changes apply live: `settings_save` → `theme_init` → `fonts_theme_refresh_styles`, no reboot
(`views/nextui_colors.c:47-51`). The seven are also stored individually in `config.ini` as
`theme_color1`..`theme_color7`.

## Fonts (`fonts.c:14-17`)

BPreplay **Bold**, one file per size - the menu loads four faces rather than scaling one.

| Tier | px | File | Used for |
| --- | --- | --- | --- |
| `FNT_NEXTUI_LARGE` | 32 | `BPreplayBold-32.font64` | Screen titles, and nothing else |
| `FNT_NEXTUI_MEDIUM` | 24 | `BPreplayBold-24.font64` | Registered; no view this theme touches draws it |
| `FNT_NEXTUI_SMALL` | 20 | `BPreplayBold-20.font64` | List rows, settings rows, hints, glyphs, values |
| `FNT_NEXTUI_TINY` | 16 | `BPreplayBold-16.font64` | Load-screen ledger and byline, dense body text |

Styles, registered on the NextUI faces only so palette colours cannot leak into the classic look
(`fonts.c:37-43`):

| Style | Colour |
| --- | --- |
| `STL_DEFAULT` | `THEME_COLOR_LIST_TEXT` |
| `STL_BLACK` | `THEME_COLOR_LIST_TEXT_SELECTED` |
| `STL_NEXTUI_GLYPH` | `THEME_COLOR_ACCENT2` |
| `STL_NEXTUI_HINT` | `THEME_COLOR_HINT` |
| `STL_GRAY` | `A0A0A0`, fixed (`fonts.c:27`) |

## Layout constants (`ui_components/constants.h:373-449`)

| Constant | Value |
| --- | --- |
| `NEXTUI_PILL_HEIGHT` | 40 |
| `NEXTUI_BUTTON_SIZE` | 28 |
| `NEXTUI_BUTTON_MARGIN` | 10 |
| `NEXTUI_BUTTON_PADDING` | 24 |
| `NEXTUI_ROW_COUNT` | 9 |
| `NEXTUI_LIST_X` / `NEXTUI_LIST_Y` | `VISIBLE_AREA_X0` / `VISIBLE_AREA_Y0` = 32 / 24 |
| `NEXTUI_HINT_Y` | `VISIBLE_AREA_Y1 - 40` = 416 |
| `NEXTUI_SETTINGS_ROW_HEIGHT` | 40 |
| `NEXTUI_ART_MAX_WIDTH` / `_HEIGHT` | 288 / 288 |
| `NEXTUI_ART_X1` | `VISIBLE_AREA_X1` = 608 |
| `NEXTUI_ART_CENTER_Y` | `DISPLAY_CENTER_Y` = 240 |
| `NEXTUI_TITLE_MAX_WIDTH` | `VISIBLE_AREA_WIDTH - 250` = 326 |

Load screen, its own table (`constants.h:411-449`):

| Constant | Value | | Constant | Value |
| --- | --- | --- | --- | --- |
| `LOAD_MARGIN` | 32 | | `LOAD_LEDGER_Y` | 289 |
| `LOAD_HERO_Y` | 92 | | `LOAD_LEDGER_COL2_X` | 332 |
| `LOAD_DESC_W` | 336 | | `LOAD_LEDGER_COL_W` | 276 |
| `LOAD_DESC_LINES` | 3 | | `LOAD_LEDGER_ROW_H` | 24 |
| `LOAD_DESC_LINE_H` | 28 | | `LOAD_ICON_SIZE` / `_GAP` | 24 / 8 |
| `LOAD_BYLINE_GAP` | 14 | | `LOAD_PLAYER_ICON_SIZE` / `_GAP` | 20 / 2 |
| `LOAD_ART_X` | 392 | | `LOAD_PLACEHOLDER_ICON` | 72 |
| `LOAD_ART_W` / `_H` | 216 / 153 | | `LOAD_PLACEHOLDER_GAP` / `_BORDER` | 10 / 2 |

Shared, used by the theme's overlays:

| Constant | Value | Where |
| --- | --- | --- |
| `MESSAGEBOX_MAX_WIDTH` / `_MARGIN` | 360 / 32 | `constants.h:141,146` |
| `LOADER_WIDTH` / `_HEIGHT` | 320 / 24 | `constants.h:120,125` |
| `LOADER_X` / `_Y` | centred, `centre_y - 12 - 8` | `constants.h:130,135` |
| `SEEKBAR_WIDTH` / `_HEIGHT` | 524 / 24 | `constants.h:104,99` |
| `SEEKBAR_X` / `_Y` | centred, `VISIBLE_AREA_Y1 - 24 - 80` | `constants.h:109,114` |
| `TEXT_MARGIN_HORIZONTAL` | 10 | `constants.h:152` |

## Primitives (`ui_components/nextui.c`, 366 lines total)

The whole theme is eleven functions. Every one of the twenty-three views is built from them.

| Function | Line | Notes |
| --- | --- | --- |
| `pill_draw` | 52 | Stadium. Blits `pill_cap_40` (or `_60` at h≥50) at each end and stretches the innermost fully-opaque texture column across the middle, so body and caps go through the same blend pipeline - a flat fill quantises differently and makes the caps look translucent. Width is floored at `2 × cap`. |
| `tinted_sprite_draw` | 84 | `TEX0 × PRIM` modulate. Icon art is pure white, so the output is exactly the tint. Deliberately *not* the pill's constant-colour combiner, which renders black on real hardware though emulators draw it correctly. |
| `text_width` | 99 | Builds a `WRAP_NONE` paragraph and returns its bbox width. **The most load-bearing call in the theme** - pill widths, group anchors and right-aligned values are all derived from it. |
| `pill_text_draw` | 115 | Text box, `VALIGN_CENTER`. **A width of 0 disables bounding**: the caller already sized the box, so nothing truncates. Non-zero wraps with `WRAP_ELLIPSES`. |
| `button_glyph_draw` | 128 | One letter → a `BUTTON_SIZE` circle; a word → a mini pill of `text + 2 × BUTTON_PADDING`. Both in the Main colour at `y + (40-28)/2`, glyph text in Accent2, centred manually because a box sized to the glyph is too tight for the wrap machinery and drops the text. |
| `hint_pill_width` | 164 | `BUTTON_MARGIN + glyph [+ BUTTON_MARGIN + label] + BUTTON_PADDING`. Asymmetric: 10 in on the left, 24 on the right. |
| `hint_group_draw_at` | 173 | Measures the group, then anchors it whole: right groups end at `VISIBLE_AREA_X1`, left groups start at `NEXTUI_LIST_X`. **One pill per hint**, gap 8. |
| `title_draw` | 213 | Bare: 32px in the Hint colour, box `PILL_HEIGHT + 16` tall at `y - 8`, because a 32px face in a 40px box exceeds the paragraph bound and drops the text. Pilled: 20px on an Accent stadium of `text + 48`. |
| `body_text_draw` | 258 | One `WRAP_WORD` block at `(LIST_X + 10, Y0 + 40 + 20)`, filling to `HINT_Y - 10`. |
| `row_draw` | 291 | Label left at `LIST_X + 10`, value right-aligned at `right_edge - value_width`, both 20px, 30px tall. Value in `STL_GRAY`. |
| `panel_draw` | 342 | 16px rounded rect from four `panel_corner_16` blits plus stretched fills. Corners overlap when a side is under 32. |

## Per-view geometry

`list_y` below is `VISIBLE_AREA_Y0 + NEXTUI_PILL_HEIGHT + NEXTUI_BUTTON_MARGIN` = **74** wherever a
title is drawn.

| View | Source | Title | List | Rows |
| --- | --- | --- | --- | --- |
| Browser | `views/browser.c:893` | **none** | from `y=24`, pitch 40 | 9 |
| Collections | `views/collections.c` | `Collections` | 74, pitch 40 | `(416-10-74)/40` = 8 |
| History / Favorites | `views/history_favorites.c:357` | `Favorites` / `History` / collection name | 74, pitch 40 | 8 |
| Settings | `views/settings_editor.c:486` | `Settings` | 74, pitch 40 | `(416-10-40-74)/40` = **7** |
| Menu Colors | `views/nextui_colors.c:102` | `Menu Colors` | 74, pitch **36** | 9, never scrolls |
| Palettes | `views/nextui_palette_view.c:145` | `Palettes` | 74, pitch 40 | 8 |
| Colour editor | `views/nextui_color_editor.c:88` | the slot's name | — | — |
| Load ROM | `views/load_rom.c:634` | cleaned ROM name, capped 326 | — | — |
| Flashcart info | `views/flashcart_info.c:52` | `Flashcart Information` | `y=74`, pitch 30, half-row gap after row 2 | 10 |
| Music player | `views/music_player.c:91` | cleaned track name | `y=74`, pitch 32 | 3 |
| Controller Pak | `views/cpakfs_manager.c:643` | `Controller Pak Manager` | `y=74`, then +32 / +64 | — |
| Datel editor | `views/datel_code_editor.c:484` | `Datel Code Editor` | 74, pitch 40 | 8 |

Settings fits one fewer row than Collections because it reserves a row's height for the selected
row's description, drawn centred at `HINT_Y - 40 - 10` = 366 (`settings_editor.c:549-556`).

### The file list (`ui_components/file_list.c:69-146`)

- Nine rows from `NEXTUI_LIST_Y`, pitch `NEXTUI_PILL_HEIGHT`.
- Text at `LIST_X + BUTTON_PADDING` = 56.
- `available_width = (VISIBLE_AREA_X1 - right_margin) - LIST_X - 2 × BUTTON_PADDING`, floored at
  `BUTTON_PADDING`. The browser sets `right_margin` to the art width plus two button margins, and
  gives **row 0 alone** a wider margin so it clears the START pill (`browser.c:900-908`).
- Selected: a Main-colour pill at `LIST_X`, width `min(text, available) + 2 × BUTTON_PADDING` -
  **sized to the label, not to the row**. Marquees when clamped, otherwise drawn unbounded.
- Unselected: bounded text, so `WRAP_ELLIPSES`. `ENTRY_TYPE_OTHER` takes `STL_GRAY`.
- **Window** - two-sided clamp, so it scrolls back as soon as the cursor passes the top, and the
  last page sits flush with the bottom:

  ```c
  if (selected < start) start = selected;
  if (selected >= start + ROW_COUNT) start = selected - ROW_COUNT + 1;
  if (start > entries - ROW_COUNT) start = entries - ROW_COUNT;
  if (start < 0) start = 0;
  ```

  Collections, Favorites and the palette picker use a **different, forward-only** window:
  `start = selected >= visible_rows ? selected - visible_rows + 1 : 0`.

### Settings-style rows

Selected rows draw **two** pills (`settings_editor.c:527-530`, `nextui_colors.c:135-138`):

1. an Accent pill the full `VISIBLE_AREA_WIDTH`, then
2. a Main-colour pill of `label_width + 2 × BUTTON_PADDING` on top of it.

Value right-aligned at `VISIBLE_AREA_X1 - BUTTON_PADDING - value_width`, in `STL_DEFAULT` when the
row is selected and `STL_GRAY` when it is not.

Menu Colors adds a swatch per slot row: `SWATCH_WIDTH` 52 x `ROW_HEIGHT - 12` 24, at
`X1 - 24 - VALUE_COLUMN_WIDTH(110) - 24 - 52`, inside a 2px `606060` frame
(`nextui_colors.c:27-31,150-156`).

### Box art (`ui_components/browser_art.c:617-670`)

- Contain-fit: `scale = min(288/w, 288/h)`, then `x = NEXTUI_ART_X1 - draw_w`,
  `y = NEXTUI_ART_CENTER_Y - draw_h/2`. Right-anchored, vertically centred.
- A folder with no art draws the `folder_icon` sprite (160x128) tinted with the Accent colour,
  centred in the art area at `x = ART_X1 - (288 + 160)/2`.
- `ui_components_browser_art_width()` returns what the list must clear: the drawn art width, or
  `(288 + 160)/2` = 224 for the folder placeholder.
- Lookup order: `.media/<name>.sprite` → `.media/<name>.png` → metadata pack
  `sd:/menu/metadata/<c0>/<c1>/<c2>/<c3>/boxart_front.png`.

### Overlays

- **Dialog** (`common.c:232-246`): borderless 16px rounded panel `2A2A2A`, centred, sized to
  content plus `MESSAGEBOX_MARGIN`.
- **Context menu** (`context_menu.c:112-178`): one 16px paragraph of all rows, centre-aligned; the
  panel is its bbox plus 32; an Accent pill behind the selected row spans **the whole panel width**
  at one line's height - unlike every list in the theme, whose pill hugs its label.
- **Message box** (`common.c:254-284`): 16px, centre-aligned, wrapped at 360.
- **Loader** (`common.c:151-168`): Accent stadium 320x24 at the display centre less 8, Main-colour
  fill of `progress × 320` over it.
- **Seekbar** (`common.c:129-143`): the same two stadiums at 524x24.

All four are drawn **after** the view's own content, so the screen stays visible behind them.

## Animation

**One, and only one: the marquee** (`nextui.c:309-340`).

```c
if (text_width <= w) { draw normally; return; }
if (text changed)    { offset = 0; hold = 45; }
if (hold > 0)              hold--;
else if (offset < max)   { offset += 2; if (offset >= max) { offset = max; hold = 45; } }
else                     { offset = 0; hold = 45; }
```

- Hold 45 frames → scroll left 2px per frame → hold 45 → **assign the offset straight back to 0**.
  A snap, not a ping-pong, and linear throughout: there is no easing anywhere in the theme.
- At 60fps the holds are 750 ms and the scroll is `overflow / 2` frames, so **cycle length depends
  on how far the text overruns** and two marquees on one screen are genuinely out of step.
- Clipped by `rdpq_set_scissor(x, y, x+w, y+h)` for the duration of the draw.
- Resets whenever the text changes, and the text changes whenever the cursor moves - so a still is
  drawn at offset 0.

Two things that look like animation are not:

- **The palette picker's live preview** is a re-render. Moving the cursor calls
  `nextui_palette_apply` → `theme_init` → `fonts_theme_refresh_styles`, so the whole screen
  redraws in the highlighted palette, background colour included
  (`nextui_palette_view.c:119-126`). It also clears flat rather than to the background image, so
  the Background slot is always visible (`nextui_palette_view.c:155`).
- **The load screen's staged progress** is I/O scheduling. `nextui_load_stage` runs 0→3 across the
  first frames so the screen appears instantly and the art lands a frame or two later
  (`load_rom.c:569-583`).

## Input

| Button | Action |
| --- | --- |
| Up / Down | Move the selection. **Wraps at both ends** (`settings_editor.c:466-470`, `nextui_colors.c:71-75`) |
| Left / Right | Page by `NEXTUI_ROW_COUNT` in the browser (`browser.c:763-773`); cycle metadata images on the load screen; change a value on a settings row |
| A | Open / play / change / apply |
| B | Back to the screen this one was opened from |
| R | The view's options menu, or the reset its hint names |
| Z | Save / licenses / dump a note, per view |
| START | Settings, from the browser and the list screens; extended info from a load screen |
| C-Up / C-Down | Fast-scroll; larger steps in the colour editor |

**Back is an origin per screen**, not a table: `nextui_origin_mode` (`settings_editor.c:447`),
`origin_mode` (`nextui_colors.c:44`) and `load_origin_mode` (`load_rom.c:566`) each record the
screen their owner was opened from.

Mode transitions are `menu->next_mode = MENU_MODE_*`; the browser's full switch on entry type is
`browser.c:782-840`.

## Display names (`theme.c:112-150`)

The browser cleans names the way NextUI does:

1. Strip a `N) ` sorting prefix - it orders the entry but is not shown.
2. Strip extensions repeatedly while the suffix is 3 to 5 characters, so `.p8.png` goes entirely.
3. Strip everything from the last `(` or `[` onward, unless that would empty the name.
4. Trim trailing whitespace.

`GoldenEye 007 (USA).z64` shows as `GoldenEye 007`. When two entries clean to the same string, both
keep their full filenames so they stay distinguishable.

## Data model

Per game, on the load screen (`load_rom.c:634-765`):

| Field | Source, in order |
| --- | --- |
| Title | Filename, cleaned |
| Description | `metadata.ini` `short-desc`, then the compiled-in game database, then "No description available." |
| Developer / Publisher / Released | `metadata.ini`, then the database |
| Players | `metadata.ini`, then the database. Drawn as four head icons, supported ones in the Hint colour and the rest in `A0A0A0` |
| Save type | Built-in save database by game code; a per-game override wins |
| TV region | The ROM header's destination code; override wins |
| Expansion / Rumble / Transfer PAK | Built-in feature database by game code |
| Datel Cheats / Patches | The menu's own per-game settings |

Ledger values of `Not used`, `Off` or `Not required` render dimmed but stay visible
(`load_rom.c:630-632`).
