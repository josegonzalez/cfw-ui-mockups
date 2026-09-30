# spruceOS source notes

The UI is **PyUI**, spruceOS's own launcher: `App/PyUI/main-ui/` in
[spruceUI/spruceOS](https://github.com/spruceUI/spruceOS) at `2b7bc4a79`, Python drawing with pysdl2.
Every path below is relative to `App/PyUI/main-ui/` unless it starts with `Themes/SPRUCE/`, `Emu/`,
`App/` or `Saves/`, which are relative to the repository root. The theme is the default `SPRUCE`.

Every value was read from the source, and the frames in `render/` were drawn by PyUI itself (see
`README.md`), so where a number here and a frame disagree, the frame is what PyUI does.

## Devices and resolutions

spruceOS builds for the devices in `spruce/<device>/`; `mainui.py:63-117` maps each `-device` name to
its class, and each class gives its panel (`screen_width`, `screen_height`).

| Device name | Class | Panel | Wi-Fi |
| --- | --- | --- | --- |
| `MIYOO_A30` | `devices/miyoo/a30/miyoo_a30.py` | 640x480 | yes |
| `MIYOO_FLIP` | `devices/miyoo/flip/miyoo_flip.py` | 640x480 | yes |
| `MIYOO_MINI`, `MIYOO_MINI_PLUS` | `devices/miyoo/mini/miyoo_mini_common.py` with `MIYOO_MINI_V1_V2_V3_VARIABLES` / `MIYOO_MINI_PLUS` | 640x480 | Plus only |
| `MIYOO_MINI_V4`, `MIYOO_MINI_FLIP` | the same, `MIYOO_MINI_V4_VARIABLES` / `MIYOO_MINI_FLIP_VARIABLES` | 752x560 | Flip only |
| `TRIMUI_BRICK`, `TRIMUI_BRICK_PRO` | `devices/trimui/trim_ui_brick*.py` | 1024x768 | yes |
| `TRIMUI_SMART_PRO`, `TRIMUI_SMART_PRO_S` | `devices/trimui/trim_ui_smart_pro*.py` | 1280x720 | yes |
| `ANBERNIC_RGXX640480` | `devices/anbernic/anbernic_xx_640_x_480.py` | 640x480 | yes |
| `ANBERNIC_RGXX720480` | `devices/anbernic/anbernic_xx_720_x_480.py` | 720x480 | yes |
| `ANBERNIC_RG28XX` | `devices/anbernic/anbernic_rg28xx.py` (`screen_rotation` 0) | 640x480 | no |
| `ANBERNIC_RGCUBEXX` | `devices/anbernic/anbernic_rgcubexx.py` | 720x720 | yes |
| `MINILOONG_POCKET1` | `devices/miniloong/miniloong_pocket1.py` | 960x720 | yes |

The Wi-Fi column is read from the rendered frames: a device without Wi-Fi draws no Wi-Fi icon in the
top bar, and that icon is the only difference between the frames of devices that share a panel -
except the Smart Pro S, whose top-bar ground renders one level darker than the Smart Pro's
(`#282828` against `#292929`), for a reason not traced.

**Drawing target.** Everything is drawn into `render_canvas`, an ARGB1555 target texture
(`display/display.py:119-125`), then copied to the window. The Miyoo Minis initialise the display twice
(`double_init_sdl_display`, `miyoo_mini_common.py:926`), and `Display.reinitialize`
(`display.py:343-350`) destroys the canvas without recreating it, so on a Mini PyUI draws straight to
the window. SDL's software renderer, which renders the reference frames, keeps full 8-bit colour even
on the ARGB1555 target; whether device GPUs quantise to 5 bits per channel is not settled here.

**Filtering.** `SDL_HINT_RENDER_SCALE_QUALITY` is `"2"` (`display.py:255`), so every scaled texture is
filtered linearly.

## Theme loading

- `Theme.set_theme_path` (`themes/theme.py:39-58`) uses `config_<w>x<h>.json` with `skin_<w>x<h>/`
  and `icons_<w>x<h>/` if the config exists, **instead of** `config.json` rather than merged.
  Otherwise `config.json`, `skin/`, `icons/` (`_get_asset_folder`, `theme.py:147-155`).
- SPRUCE ships configs for 720x480, 720x720, 752x560, 960x720, 1024x768 and 1280x720. **640x480 has
  none** and takes `config.json`. The folder `Themes/SPRUCE/skin_640_480/` matches no lookup and is
  never used.
- Getters ask for `.qoi` files and fall back to the `.png` of the same name (`_resolve_file`,
  `theme.py:199-227`); SPRUCE ships PNGs. There is no `bg/` folder, so no page backgrounds.
- The only default injected is `showBottomBar = true` (`theme.py:158-159`).
- **Multipliers** (`theme.py:72-82`): `m = min(w/640, h/480)`; `width_mult`, `height_mult` stretch the
  longer axis.

| Panel | m | width_mult | height_mult |
| --- | --- | --- | --- |
| 640x480 | 1.0 | 1.0 | 1.0 |
| 720x480 | 1.0 | 1.125 | 1.0 |
| 720x720 | 1.125 | 1.0 | 1.3333 |
| 752x560 | 1.1667 | 1.0071 | 1.0 |
| 960x720 | 1.5 | 1.0 | 1.0 |
| 1024x768 | 1.6 | 1.0 | 1.0 |
| 1280x720 | 1.5 | 1.3333 | 1.0 |

## Fonts

- Every purpose but the shadowed ones uses `list.font` or `grid.font`, both `nunwen.ttf` in SPRUCE
  (`theme.py:490-540`): a 4.7MB merge of Nunito and WenQuanYi Micro Hei. The four SHADOWED purposes
  read `shadowed.font`, which SPRUCE lacks, and fall back to `main-ui/themes/font.ttf` (Inconsolata
  Medium). Size is in points at 72 dpi, so points are pixels.
- Text is rendered with `TTF_RenderUTF8_Blended` (`display.py:643`): anti-aliased, no outline, no
  style, no hinting call. Only the first line of a string is drawn, and on the default devices there
  is no truncation or ellipsis in `render_text` (`device_common.py:404-413`).
- **Sizes** (`get_font_size`, `theme.py:543-596`). SPRUCE's `title.size`, `batteryPercentage.size`,
  `currentpage.size`, `total.size` and `hint.*` are never read: the top-bar title, battery number,
  clock and page index all use `list.size`.

| Panel | `list.size`: list, title, message, top bar, battery, clock, index, keyboard | `grid.grid1x4`: one-row grid | `grid.grid3x4`: multi-row grid, descriptions | shadowed / small (font.ttf) |
| --- | --- | --- | --- | --- |
| 640x480 | 24 | 25 | 18 | 40 / 26 |
| 720x480 | 24 | 25 | 18 | 40 / 26 |
| 720x720 | 27 | 28 | 20 | 45 / 29 |
| 752x560 | 28 | 29 | 21 | 46 / 30 |
| 960x720 | 36 | 37 | 27 | 60 / 39 |
| 1024x768 | 38 | 40 | 28 | 64 / 41 |
| 1280x720 | 36 | 37 | 27 | 60 / 39 |

## Colours

| Key | Value | Used for (`text_color`, `theme.py:648-744`) |
| --- | --- | --- |
| `batteryPercentage.color`, `title.color` | #EBDBB2 | battery number, clock, volume number, top-bar title |
| `currentpage.color` | #EBDBB2 | the index and its letter |
| `total.color` | #D65D0E | the index total |
| `grid.color` | #7C6F64 | unselected grid text, messages |
| `grid.selectedcolor` | #FBF1C7 | selected grid text |
| `list.color`, `list.selectedcolor` | #FBF1C7 | list rows, selected or not; descriptions; empty-view text |

Colours baked into the skin: the ground (`background.png`, `bg-title.png`, `tips-bar-bg.png`,
`bg-pop-menu-4.png`) #282828; the selection bars (`bg-list-s`, `bg-list-l`, `bg-list-s2`,
`bg-game-item-f`, `bg-btn-01-f`) #504945; the spruce logo in `bg-title.png` about #665C54; main-menu
`-n` icons #7C6F64, `ic-game-f` #689D6A, `ic-favorite-f` #D7B45F; system icons greyscale in `icons/`,
colour in `icons/sel/`.

## Top bar (`menus/common/top_bar.py:80-146`)

- `bg-title.png` at (0, 0), native size; the **spruce logo is baked into it**. Bar height =
  max(its height, text height, icon heights); `center = height // 2`; padding 10.
- **Right cluster**, right to left from `x = w - 20`, each MIDDLE_RIGHT at the bar's centre, then
  `x -= width + 10`:
  1. battery number, no "%" (`:114`);
  2. battery icon (`theme.py:404-426`): not charging `power-full-icon` (>=81), `power-80%-icon` (>=51),
     `power-50%-icon` (>=21), `power-20%-icon` (>=10), else `power-0%-icon`; charging the
     `ic-power-charge-*` set;
  3. Wi-Fi icon if the device has Wi-Fi and it is on (`theme.py:429-441`): `icon-wifi-signal-01..04`
     for BAD..GREAT, `icon-wifi-locked` when off;
  4. for 3s after a volume change: the volume on a 0-20 scale (`displayVolumeNumbers` is true in
     SPRUCE), then `icon-volume-NN.png`.
- **Clock** MIDDLE_LEFT at `topBarInitialXOffset`, `%I:%M %p` by default (`top_bar.py:149-156`).
- **Title** MIDDLE_CENTER at (w/2, centre).

| Panel | bar h | centre | battery right edge | clock x |
| --- | --- | --- | --- | --- |
| 640x480, 720x480 | 60 | 30 | w - 20 | 60 |
| 720x720 | 67 | 33 | 700 | 67 |
| 752x560 | 70 | 35 | 732 | 70 |
| 960x720, 1280x720 | 90 | 45 | w - 20 | 90 |
| 1024x768 | 96 | 48 | 1004 | 96 |

Top-bar icon sizes: battery and Wi-Fi 40px square at 640 and 720x480, 45 at 720x720, 46 at 752x560,
60 at 960x720 and 1280x720, 64 at 1024x768.

## Bottom bar (`menus/common/bottom_bar.py`)

`tips-bar-bg.png` BOTTOM_LEFT at (0, h). The standard bar then draws `icon-A-54` and "Okay",
`icon-B-54` and "Back" (`:35-69`). **In SPRUCE both icons are fully transparent and as wide as the
screen**, so the texts are drawn off screen and the visible bottom bar is a plain #282828 strip,
identical on every screen. Bar heights match the top bar's.

## Page index (`display.py:1147-1183`)

At the bottom right: `x = w - 10`, `y = h - max(5, bottom_h // 4)`, BOTTOM_RIGHT. Right to left: the
total in #D65D0E, then the index zero-padded to the total's digit count with "/" in #EBDBB2, a 10px
gap, then the letter. The letter is the selected item's first character, **only if** the displayed
texts equal Python's `sorted()` of them (case-sensitive, `views/view.py:10-12`); otherwise none.

Shown on every list (forced, `views/list_view.py:135-140`) including popups, on grids only when
rows > 1 (`views/grid_view.py:268-273`), and always on carousels.

## Views

`ViewCreator.create_view` (`views/view_creator.py:28-253`) chooses the class by `ViewType`
(`views/view_type.py:3-10`); an empty option list is `EmptyView`. Theme strings resolve with
`getattr`, and the code's own defaults `"GRID_VIEW"` and `"DESCRIPTIVE_LIST_VIEW"` are not members,
so they fall back to GRID and ICON_AND_DESC.

### Grid (`views/grid_view.py`) - the main menu and the system select

- `x_pad = 10`, `icon_width = (w - 20) / cols`; cell centre x = `int(10 + col * icon_width) +
  icon_width // 2`; `row_spacing = usable_h / rows`; `bottom_row_y = row * row_spacing + row_spacing +
  top_h`; `cell_y = bottom_row_y - row_spacing // 2` (`:155-237`).
- Image MIDDLE_CENTER at (x, cell_y + img_offset // 2); with text in a multi-row grid `img_offset =
  -text_h`. Text BOTTOM_CENTER: one row at `y = int(h * 310 / 480)`, several rows at `bottom_row_y -
  text_h`.
- Selected background `bg-game-item-f` (rows > 1) FIT into `int((resized + 20m) * 1.05)` square;
  `bg-game-item-n` is a transparent pixel. A one-row grid in SPRUCE has no background.
- Movement: LEFT/RIGHT +-1; UP/DOWN +-cols, snapping to the first or last item before wrapping; L1/R1
  +-cols*rows; L2/R2 the same by letter; everything wraps modulo the length. `animate_transition`
  (`:361-432`) is never called.

**Main menu:** GRID, one row, `mainMenuColCount` columns (4; 5 at 1280x720), text on, no background,
no index. Images `ic-<entry>-n.png` / `-f.png` at native size: 100x140 at 640 and 720x480, 112x156,
115x162, 150x210 at 960 and 1280, 160x224 at 1024x768.

| Panel | cols | icon centres x | icon centre y | text bottom y |
| --- | --- | --- | --- | --- |
| 640x480 | 4 | 87, 242, 397, 552 | 240 | 310 |
| 720x480 | 4 | 97, 272, 447, 622 | 240 | 310 |
| 720x720 | 4 | 97, 272, 447, 622 | 360 | 465 |
| 752x560 | 4 | 101, 284, 467, 650 | 280 | 361 |
| 960x720 | 4 | 127, 362, 597, 832 | 360 | 465 |
| 1024x768 | 4 | 135, 386, 637, 888 | 384 | 496 |
| 1280x720 | 5 | 136, 388, 640, 892, 1144 | 360 | 465 |

**System select:** GRID, 2 rows by 4 (5 at 1280x720); icons `icons/<sys>.png` and `icons/sel/<sys>.png`
at native size (resize NONE): 120x130 at 640 and 720x480, 134x146, 139x151, 180x195 at 960 and 1280,
192x208. Title "Games"; index at the bottom right.

| Panel | selection bg | row 0 cell_y / bottom_row_y | row 1 |
| --- | --- | --- | --- |
| 640x480, 720x480 | 152x168 | 150 / 240 | 330 / 420 |
| 720x720 | 170x187 | 214 / 360 | 507 / 653 |
| 752x560 | 177x195 | 175 / 280 | 385 / 490 |
| 960x720, 1280x720 | 228x252 | 225 / 360 | 495 / 630 |
| 1024x768 | 243x268 | 240 / 384 | 528 / 672 |

### Text and image list (`views/image_list_view.py`) - SPRUCE's game lists

- `text_pad = int(30 * h / 480)`. Line height is `bg-list-s`'s height; rows = `usable_h // line_h`;
  base y = `top_h + 5`.
- Selected row: `bg-list-s` MIDDLE_LEFT at (0, row centre), **cropped** to the image's left edge.
  Text MIDDLE_LEFT at `text_pad` (after the favourite mark `ic-favorite-mark`, +5px), hard-clipped to
  the available width, no ellipsis; the selected row marquees (see Motion).
- Image: the selected entry's box art only, FIT into the image box, MIDDLE_CENTER at `x = w - 10 -
  img_w // 2`, `y = h / 2`.

| Panel | line h | rows | first text centre y | text pad | image centre, box | selection bar width | text clip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 640x480 | 60 | 6 | 95 | 30 | (470, 240) 320x300 | 310 | 250 |
| 720x480 | 60 | 6 | 95 | 30 | (550, 240) 320x300 | 390 | 330 |
| 720x720 | 67 | 8 | 105 | 45 | (530, 360) 360x337 | 350 | 260 |
| 752x560 | 70 | 6 | 110 | 35 | (556, 280) 373x350 | 370 | 300 |
| 960x720 | 90 | 6 | 140 | 45 | (710, 360) 480x450 | 470 | 380 |
| 1024x768 | 96 | 6 | 149 | 48 | (758, 384) 512x480 | 502 | 406 |
| 1280x720 | 90 | 6 | 140 | 45 | (1030, 360) 480x450 | 790 | 700 |

### Text list (`views/text_list_view.py`) - pickers

Same line height, rows and base y; text at x = 20; the selected bar is `bg-list-s` at full width.

### Descriptive list (`views/descriptive_list_view.py`) - Settings and Apps

- Entry size = the selection bar's: `bg-list-l` if any row has an icon or description, else
  `bg-list-s` (`view_creator.py:73-86`). Rows = `usable / entry_h`, rounded up only when the fraction
  is at least 0.80. First row top = `top_h + 5`.
- Selected bar ZOOMed to (w, entry_h) at (0, row_y).
- Icon box `int(entry_w * 0.125)` x `int(entry_h * 0.9)`, FIT, centred at `offX + box_w // 2`, where
  `offX = int(10m)`.
- Title at `offX + box_w + int(10m)`: TOP_LEFT at `row_y + int(15m)` with a description,
  MIDDLE_LEFT at the row's centre without. Description below the title in the `grid3x4` size.
- Value MIDDLE_RIGHT at `w - int(10m)`, formatted `"<    value    >"` (four spaces each side,
  `menus/settings/settings_menu.py:181`). A value longer than 25 characters: unselected rows show 22
  characters and "..."; the selected row marquees (see Motion).

| Panel | `bg-list-l` | rows (l / s) | icon box | icon centre x | text x (icons / none) |
| --- | --- | --- | --- | --- | --- |
| 640x480 | 640x90 | 4 / 6 | 80x81 | 50 | 100 / 20 |
| 720x480 | 720x90 | 4 / 6 | 90x81 | 55 | 110 / 20 |
| 720x720 | 720x101 | 6 / 8 | 90x90 | 56 | 112 / 22 |
| 752x560 | 752x105 | 4 / 6 | 94x94 | 58 | 116 / 22 |
| 960x720 | 960x135 | 4 / 6 | 120x121 | 75 | 150 / 30 |
| 1024x768 | 1024x144 | 4 / 6 | 128x129 | 80 | 160 / 32 |
| 1280x720 | 1280x135 | 4 / 6 | 160x121 | 95 | 190 / 30 |

### Popup (`views/popup_text_list_view.py`)

`bg-pop-menu-4` TOP_LEFT at (0, top_h) over a frozen copy of the screen beneath
(`Display.lock_current_image`, `display.py:426-441`); rows on `bg-list-s2`; text at x =
`int(20m)`. The index is drawn. **The popup keeps the parent screen's title**: it is never given its
own (`view_creator.py:171-178`). Each redraw clears over the frozen copy, so the top bar is drawn
again with its clock and icons, and the bottom bar over the copy's own index or strip - the reference
frames of a popup over a grid and over the Game Switcher show it. On a Miyoo Mini, which lacks popup support
(`miyoo_mini_common.py:959-960`), a popup is a full TEXT_ONLY list instead.

| Panel | panel | row (`bg-list-s2`) | rows | text x |
| --- | --- | --- | --- | --- |
| 640x480, 720x480 | 320x250 | 320x60 | 4 | 20 |
| 720x720 | 359x281 | 357x67 | 4 | 22 |
| 752x560 | 372x291 | 373x69 | 4 | 23 |
| 960x720, 1280x720 | 480x375 | 480x90 | 4 | 30 |
| 1024x768 | 512x400 | 512x96 | 4 | 32 |

### Full-screen grid (`views/full_screen_grid_view.py`) - the Game Switcher

Image area w x int(0.75 h), FIT, TOP_CENTER at (w/2, top_h). The top bar shows the selected game's
name with the icons hidden; the bottom bar shows a strip of every entry's first 10 characters, one-row
grid font, BOTTOM_LEFT at `y = int(h - 10m)` from x = 20 with 20px gaps, the selected entry in the
selected colour (`:231-265`).

### Carousel (`views/carousel_view.py`) - reachable by SELECT on a game list

Odd column count, at least 3; options duplicated until more than 2 x cols. Widths from the primary
width percentage (games 50%, systems 40%) and the sides; images FIT, unselected first, selected last;
the selected title in the bottom bar; the index always shown (`:148-304`).

### Empty view (`views/empty_view.py:18-21`)

Title "No Entries Found" and the same text TOP_CENTER at (w/2, h/2).

## Screens and buttons

**Input.** `Controller.get_input()` waits `1/12`s and returns nothing on a timeout, when views
redraw (this drives the marquees). Held buttons repeat after `turboDelayMs` (250 in spruce's
`App/PyUI/py-ui-config.json`), then every `inputRateLimitMs` (16) (`controller/controller.py:249-336`).
**MENU tapped** is delivered to the screen; **MENU held** past the hold delay opens the Game Switcher
from any screen (`controller.py:320-332`). Every view returns B.

**Lists** wrap on UP/DOWN; L1/R1 page by `rows - 1`; L2/R2 jump to the next first letter
(`views/list_view.py:60-179`).

### Main menu (`menus/main_menu.py`)

- Entries appended as Recents (if `recentsEnabled`), Collections (if `collectionsEnabled`, default
  off), Favorites, Games, Apps, Settings (`:41-116`). `reorder_options` keys on the localised label,
  which never matches the ordering list, so insertion order stands: **Favorites, Games, Apps,
  Settings** in SPRUCE, with **Recents first at 1280x720** (its config sets `recentsEnabled`).
- Title `mainMenuTitle`, "" in SPRUCE.
- A opens the entry; MENU (tap) opens the popup; **B does nothing** (`:236-248`).
- **Popup** (`menus/main_menu_popup.py:43-115`): "Rom Search", "Settings", then "Recents",
  "Favorites", "Collections" for whichever the main menu does not show - in SPRUCE "Rom Search,
  Settings, Recents, Collections". A runs; B or MENU closes.

### Games (`menus/games/`)

- **System select** (`game_system_select_menu.py`): every `Emu/<SYS>/config.json` whose ROM folder
  has a file matching its `extlist` (`games/utils/rom_utils.py:53-86`), minus systems whose
  `requiredfiles` are missing, sorted by `sortOrder` (spruce's `gameSystemSortMode` is SortOrderKey).
  Built once at startup. A opens the system's list; B returns; MENU opens its popup ("$system Game
  Search", "All System Game Search", "Download BoxArt").
- **Game list** (`roms_menu_common.py`): title is the system's label. Folders first, then files, each
  sorted by lower-cased name. Box art from `Roms/<SYS>/Imgs/<name>.png`
  (`games/utils/rom_select_options_builder.py:109`).
  - A launches (PyUI exits and the shell runs the emulator).
  - X opens the game's configuration ("{system} Configuration", `game_config_menu.py`).
  - MENU opens the game popup (`game_select_menu_popup.py:146-285`): "$system Game Search",
    "+/- GameSwitcher", "+/- Favorite", "+/- Collection", "- Recents" (if the game is in Recents),
    "Download BoxArt", "Select BoxArt Download", "Launch Random Game", "Toggle View".
  - SELECT cycles the view: TEXT_AND_IMAGE, GRID, ICON_AND_DESC, CAROUSEL (`game_select_menu_popup.py:63-73`).
  - B returns.
- **Favorites, Recents, Collections** are the same list, titled "Favorites", "Recents", "Collections";
  entries shown as `"Name (FOLDER)"`. Favourites and Recents are newest first
  (`Saves/pyui-favorites.json`, `Saves/pyui-recents.json`, `roms_list_manager.py`).
- **First entry into a system with PNG box art** asks once whether to optimise it
  (`rom_select_options_builder.py:208-236`): "Would you like to optimize boxart? / Originals will be
  converted, be sure to backup! / A = Yes, B = No, X/Y = Never Prompt / (blank) / You can manually do
  this in: / Settings -> Extra Settings -> Optimize BoxArt".

### Apps (`menus/app/app_menu.py`)

`App/*/config.json` (`label`, `icon`, `description`, `devices`), plus PyUI's own "Boxart Scraper" and
"Activity Tracker", sorted by label; ICON_AND_DESC, title "Apps". A launches; B returns; MENU opens
"Hide App" / "Show Hidden Apps".

### Game Switcher (`menus/games/recents_menu_gs.py`)

Opened by holding MENU, or by `App/PyUI/pyui_gs_trigger` on startup (`main_menu.py:165-174`).
Entries from `Saves/gameswitcher.json` (spruce's `gameSwitcherPath`), capped at `gameSwitcherGameCount`
(8), starting at the newest. Images prefer the save-state screenshot
`Saves/states/.gameswitcher/<rom>.state.auto.png` (`miyoo_trim_game_system_utils.py:248-278`); on the
Pocket 1 the reference frames show the box art instead, for a reason not traced. FULLSCREEN_GRID: LEFT/DOWN previous, RIGHT/UP next,
wrapping; L1/R1 +-5; A launches; B closes; X configuration; MENU the game popup.

## Settings (`menus/settings/`)

Every page is ICON_AND_DESC titled "Settings"; A, LEFT, RIGHT, L1 and R1 go to the row; B closes; the
list is rebuilt after each input (`settings_menu.py:28-59`).

**Root** (`basic_settings_menu.py`), in order:

| Row | Value | Buttons | When |
| --- | --- | --- | --- |
| Power Off | - | A: the power-off confirm | always |
| Backlight | 0-10, default 10 | LEFT/L1 -1, RIGHT/R1 +1 | always |
| Volume | 0-20 | LEFT/L1 down, RIGHT/R1 up | `supports_volume` |
| WiFi | the IP address, "Off", "Connecting", "No network selected" or "Error" | LEFT/RIGHT toggle; A: WiFi Configuration | the device has Wi-Fi |
| Bluetooth | On / Off | LEFT/RIGHT toggle; A: Bluetooth | a scanner exists (Flip, TrimUI) |
| Theme | the theme folder, "SPRUCE" | LEFT/RIGHT cycle; A: the theme picker | always |
| Theme Settings, Sound Settings, Additional Settings, Tasks, About this Device | submenus | A | always |
| Reload UI | - | A: restarts PyUI | always |

The index reads 01/11 on a device without Bluetooth and 01/12 with it.

**Power-off confirm** (`device_common.py:35-53`): title "Power"; "Would you like to power down?" at
(w/2, h/2), and at h/2 + 100 "A = Power Down, X = Reboot, B = Cancel" on a device with a reboot
command, "A = Power Down, B = Cancel" otherwise (the A30).

**Sound Settings:** Play Button Press Sound (True/False), Play BGM (True/False), BGM Volume (1-10).

**Theme Settings:** Main Menu Theme Options, System Select Theme Options, Game Select Menu Theme
Options, Fonts, Grid View Theme Options, Top and Bottom Bar Options, Screensaver - each a page of
enabled/disabled, numeric and view-type rows (`menus/settings/theme/`).

**Additional Settings** (`extra_settings_menu.py:94-245`): Display Settings, Animation Settings, Time
Settings, Game System Select Settings, Game Select Settings, Game Switcher Settings, Game Art Display
Settings, Controller Settings, Language Settings, then one page per category in
`Saves/spruce/spruce-config.json` (Battery, System, Button, Emulator, Network, Proxy, LEDs, RGB LED,
RetroAchievements, Audio) that has a row for the device.

**Animation Settings** (`animation_settings_menu.py:14-35`): Animations Enabled (default Enabled),
Animation Speed `[0.5, 1, 1.5, 2, 2.5, 3]` (default 1).

**About this Device** (`about_menu.py`): IP Address, Mac Address, FW Version, and each
`aboutEntries` command's output from `py-ui-config.json`.

## Dialogs

- **Messages** (`display.py:1255-1289`): cleared screen with an empty title, lines word-wrapped past 35
  characters, each TOP_CENTER at w/2 in the list font and colour, line pitch = text height + `int(5 h /
  480)`, the block centred on h/2. No panel, no animation.
- **Yes/no prompt** (`utils/user_prompt.py:10-21`): a message ending "A = Yes, B = No".
- **On-screen keyboard** (`display/on_screen_keyboard.py`): title "Keyboard"; `bg-grid-s` ground; the
  prompt, then the entry on `bg-list-l`; six rows of 13 keys at `w // 13` pitch, keys `w // 16`
  square, only the highlighted key on `bg-btn-01-f`. Keys are in the grid's colours, #7C6F64 and
  #FBF1C7 when lit, as are the prompt and entry. D-pad wraps; L1 shift; R1 caps; A types; B
  deletes, or cancels when empty; START submits.
- **Loading screens.** The skin's `app_loading_*.png` are never drawn by PyUI.

## Motion

PyUI redraws once per input poll (`1/12`s) or on a key press. Every animation is linear.

| What | How | Where |
| --- | --- | --- |
| Screen fade | `fade_transition`, 96ms - **never called** | `display.py:866-930` |
| Grid transition | `animate_transition` - **never called** | `grid_view.py:361-432` |
| List marquee | after 1s on a row, the selected text rotates one character per redraw (about 12/s), padded with at least 8 spaces | `list_view.py:181-187`, `text_utils.py:8-19` |
| Settings value marquee | a value over 25 characters scrolls in a 25-character window, one character per redraw, after 1s | `descriptive_list_view.py:65-71` |
| Carousel slide | `10 // speed` frames (10 at speed 1), each slot interpolating to its neighbour's x and width, no frame pacing; shorter on held moves | `carousel_view.py:546-640` |
| Full-screen grid slide | `0.30 / speed` s (300ms at speed 1), minus 40ms per consecutive held move; old image out, new in, by w (LEFT/RIGHT) or h (UP/DOWN); the old caption fades | `full_screen_grid_view.py:329-389` |
| Volume indicator | shown for 3s after a change | `top_bar.py:128-133, 164-167` |
| Screensaver | after 60s idle (theme default): a clock, date and battery on black; instant | `display/screensaver.py` |

Animation speed is 1 by default, and 2 on the Miyoo Minis (`miyoo_mini_common.py:1015-1016`).
