# DS Style source notes

Extracted from [FrankieT19/rg-sp-ds-style](https://github.com/FrankieT19/rg-sp-ds-style) at
`2847683`. Every value is cited `source/<file>:<line>` into that commit. Coordinates are DS Style's
own logical pixels on its 240x160 canvas, which the panel shows at 3x; colours are `0xRRGGBB`.

Reference frames rendered by the launcher itself are in [`render/`](render/). They are produced by
[`render-reference.sh`](render-reference.sh) from [`stills.txt`](stills.txt) and
[`fixture.txt`](fixture.txt). Interface strings for all eight languages are in
[`strings.txt`](strings.txt).

## The program

- **What it is.** A Nintendo DS-inspired launcher. It was first a GBA frontend for the EZ-FLASH
  Omega (`about_snake.h:200`), and this is its port to the Anbernic RG SP's stock OS. It launches
  the stock emulators; it runs no game code itself (`dsstyle.c:1-4`).
- **Size and dependencies.** About 2,850 lines of C, plus a vendored `stb_image` for PNG, BMP and
  JPEG (`dsstyle.c:38-43`). There is no SDL. It writes the framebuffer and reads evdev directly
  (`dsstyle.c:248-362, 370-428`).
- **The canvas.** Everything draws into `pixels[240*160]` (`dsstyle.c:45-46, 53`). The frame is
  replicated 3x to the 720x480 panel (`ui.h:369-390`). Artwork, the moving home corners and the
  scrolling title are exceptions: they are sampled at physical pixels, so they move and scale at
  720x480 precision (`ui.h:352-363`, `dsstyle.c:54-58`).
- **The drawing primitives.** There are only six, and there is no blending anywhere:
  - `dot` - one pixel;
  - `rect` - a filled rectangle;
  - `border` - a one-pixel outline;
  - `blit` - an image, keeping pixels whose alpha is over 127;
  - `icon` - as `blit`, and also skipping pure black, which is the colour key of the 16x14 icons;
  - `text`.

  (`dsstyle.c:102-124`.)
- **The frame loop.** It redraws on input, on a hardware change, while the home corners move, every
  16ms while a title scrolls, and otherwise every 60th tick (`dsstyle.c:628`). Presentation
  double-buffers with `FBIOPAN_DISPLAY` and copies only rows that changed (`dsstyle.c:320-362`).
- **Headless rendering.** `--render <bmp>` draws one frame and exits before any display code
  (`dsstyle.c:605`). Other preview flags:
  - `--screen` - `home`, `settings`, `apps`, `list`, `art`, `horizontal`, `vertical`, `volume`,
    `brightness`;
  - `--events <keys>` - `u d l r a b x y`, `m` MENU, `s` SELECT, `t` START, `q` L, `e` R, `1` L2,
    `2` R2;
  - `--demo`, which pins the clock and the battery (`ui.h:116, 143`);
  - `--lcd`.

  (`dsstyle.c:602-605`.)

## Text

- **The font.** An 8x12 bitmap face, `assets/font.bin`: 12 bytes per glyph, most significant bit
  leftmost (`dsstyle.c:120-122`). It holds 128 glyphs, ASCII; the launcher reserves 256
  (`dsstyle.c:60`), so codes 128-255 are blank. Accented letters come from `font-latin.bin`, one
  glyph per entry of `latin_codepoints` (66 of them, `original_layout.h:82`, `dsstyle.c:61, 121`).
  Any other code point draws `?` (`dsstyle.c:108-116, 120`).
- **Advance.** Every glyph draws eight columns and advances six (`dsstyle.c:120-122`), so each
  overlaps its neighbour by two. Text is cut after `max` glyphs, never ellipsised by `text()`
  itself.
- **Dark mode** draws black text white (`dsstyle.c:119`).
- **`centered`** centres by glyph count times six, clamped to the left edge (`ui.h:67-70`).
- **Title cleaning.** `Launcher_CleanTitle` drops the extension and anything in `()` or `[]`, then
  trims trailing spaces. If nothing is left, it keeps the original (`original_text.h:5-62`).
- **Carousel titles.** `Launcher_SplitTitle` wraps into up to three lines:
  - lines one and two take up to 20 characters, line three up to 24;
  - it breaks at the last space more than 8 characters in, and strips leading spaces;
  - when text is left over, the last line is cut to 21 characters with `...` appended.

  (`original_text.h:64-128`.)
- **The home card title.** `Launcher_SplitStartTitle` works the same way with 18 characters per
  line, a break more than 5 characters in, and a 15-character cut. An empty title gives
  "No recent game" (`original_text.h:130-199`).
- **The marquee.** Only the selected list row scrolls, and only when its name is wider than its
  column (`ui.h:249-264`):
  - it holds 333ms, then scrolls at 0.030 logical px per ms (30 px/s);
  - it wraps with a period of `glyphs*6 + 18`;
  - it is sampled per physical pixel, so it moves in thirds of a logical pixel (`ui.h:360-363`);
  - it restarts when the page, the selection or the view changes (`dsstyle.c:589`).

## Palette and themes

- **16 accent themes** (`original_layout.h:81-85`):

  | Name | Accent |
  | --- | --- |
  | Pale Blue | `0x52738c` |
  | Light Blue | `0x299cce` |
  | Blue | `0x005af7` |
  | Dark Blue | `0x000094` |
  | Green | `0x00a539` |
  | Pale Green | `0x4ac67b` |
  | Bright Green | `0x00c600` |
  | Lime | `0x94d600` |
  | Yellow | `0xd6c600` |
  | Red | `0xff0010` |
  | Orange | `0xff9400` |
  | Brown | `0xbd4a00` |
  | Pink | `0xff18a5` |
  | Pale Pink | `0xd673d6` |
  | Magenta | `0xd600ef` |
  | Purple | `0x8c00d6` |

- **What each theme owns.** A title bar, `themes/<id>/<id>.bmp` (240x19), and folder and GBA icons,
  `themes/<id>/icon_folder.bmp` and `icon_gba.bmp` (16x14) (`ui.h:73-80`).
- **What the accent colours.** The selection bar, the home corners, the selected settings value,
  search keys, popup inner borders and progress bars.
- **Dark mode.** It swaps the five backgrounds for `assets/dark/*.bmp` (`ui.h:28`, `dsstyle.c:125`)
  and draws black text white. It also recolours the RESET and POWER greys pair by pair,
  `0,73,121,162,195,211,251` to `123,97,134,93,60,44,4` (`ui.h:31-39`).
- **Fixed greys:**
  - `0x494949` - popup borders (light);
  - `0x7b7b7b` - popup borders (dark);
  - `0x848484` - the grey art border and search field;
  - `0x151515` / `0x0d0d0d` / `0x1e1e1e` / `0xe7e7e7` - dark boxes and the two-row stripes.

## Screens

The title bar is drawn on every screen (`ui.h:137-145`):
- **Bar and text.** The theme bar at (0,0). The username at (3,3), 11 glyphs. It comes from
  `username.txt` and defaults to "DS Style" (`dsstyle.c:71, 138`).
- **Title.** Centred in (73,3,94), cut at 15 characters.
- **Clock.** At (189,3), either `h:mm AM/PM` or `HH:MM:SS`. The default is 12-hour (`dsstyle.c:69`).
  `--demo` shows `12:34 PM`.
- **Counter.** In a browser list other than Apps, `choice/count` is right-aligned to 235 in place of
  the clock.
- **Battery and Wi-Fi.** Drawn on Home and Settings only.
  - The battery is an outline at (171,6,12,7), a nub, and a fill of `level*8/100`, with a
    lightning bolt while charging (`ui.h:114-125`).
  - Wi-Fi is three stepped arcs, drawn only when connected (`ui.h:127-136`).

### Home (`ui_home`, `ui.h:210-224`)

- **Background.** `START.bmp`.
- **The card.** Art at (30,48,56,37). The title, split as above, is centred in (93,y,114) from
  y=49 or 66. The card shows the most recent game, or the favourite when Home source is
  Favourites (`dsstyle.c:173-178`).
- **The buttons.** "Games" in (42,108,60). The second button reads Apps, Favs or Recents, set by
  Home button, in (137,108,60).
- **Reset and power.** At (182,143) and (201,143), 14x14.
- **Cursor targets.** Six (`ui.h:178-189`):

  | Target | Box |
  | --- | --- |
  | Card | 25,43,190,47 |
  | Games | 25,92,95,45 |
  | Second button | 120,92,95,45 |
  | Settings | 111,145,18,11 |
  | Reset | 182,143,14,14 |
  | Power | 201,143,14,14 |

  Each has per-corner alignment corrections copied from the original.
- **The cursor.** Four L-shaped accent brackets, 9x3 and 3x9. On Settings the cursor is a
  23x16 frame instead (`ui.h:198-209`).
- **Cursor motion.** A move glides all four corners over **200ms** on **smoothstep**
  (`t*t*(3-2t)`), at physical-pixel precision. A move during a glide starts from where the corners
  are drawn (`ui.h:190-209`).
- **Navigation** (`dsstyle.c:534-546`):
  - Up and Down move between the rows: card, then buttons, then icons.
  - Left and Right move within a row.
  - Left and Right on the card, and L and R anywhere, cycle through the recent or favourite games.
- **Buttons:**
  - A on the card launches it; A on Games opens the last Games tab; A on the second button opens
    its target.
  - A on Settings opens Settings; A on Reset or Power opens a confirm.
  - SELECT swaps Recents and Favourites for the card.
  - Y opens Favourites, and MENU opens Settings.
  - X does nothing. `extra_action` takes X on every page and acts on it only in the browser and
    Settings (`extra_ui.h:66`), so Home's own X branch (`dsstyle.c:545`) never runs.

### Browser (`ui_browser`, `ui.h:265-310`)

- **Views.** List, List + Art, Horizontal and Vertical (`dsstyle.c:85`). The default is Horizontal
  (`dsstyle.c:75`).
- **When the view is overridden.** Apps and the card list always use List. A list of folders only
  uses List, or List + Art when List folders is "List + Art" (`effective_view`, `ui.h:241`).
- **Backgrounds.** List and List + Art use `SD_LIST.bmp`, Horizontal `SD_HORIZONTAL.bmp`, Vertical
  `SD_VERTICAL.bmp`.
- **List.**
  - 10 rows from y=20, 14 apart.
  - The selected row is an accent bar at (17,y,223,13), with white text.
  - The 16x14 icon is at x=0. The name is at x=17, 37 glyphs with Clean list on and 32 with it
    off. "DIR" or the file size is shown only with Clean list off.
  - Favourites carry ` <3`.
  - The selected name marquees if it is too long.
- **List + Art.** Art at (142, 27|60|92, 90x60), at the top, centre or bottom, right-aligned. It is
  shown only for a folder or for art that is not the built-in system picture (`ui.h:274`). So with
  no scraped art, List + Art draws as List.
- **Horizontal.**
  - The selected art sits in (60,27,120,80).
  - The neighbours sit in (-5, 47|27|67, 60x40) and (185, …), aligned by Horiz. side.
  - The title box is (39,115,162,39), with the split title centred.
  - A heart is drawn at (45,118) for a favourite.
- **Vertical.**
  - The selected art sits in (7,62,84,56).
  - The neighbours sit in (25,24,48x32) and (25,124,48x32), aligned by Vert. side.
  - The title box is (93,62,141,56), and the heart is at (97,64).
- **Art** (`ui.h:146-173`, `artwork.h`):
  - **Where it comes from.** The first match in `Imgs/`, `imgs/`, `images/`, `media/` or next to
    the ROM, as `name.ext.png` or `name.png`. Failing that, `Folder Art/`. Failing that, the
    system's wide picture, `assets/systems/wide/<SYSTEM>.png` (480x320). Failing that,
    `NOTFOUND.png`.
  - **Sizing.** It is sized to the slot's height by its aspect and capped at the slot width. In
    Horizontal with Horiz. fit set to Overlap it may reach 238.
  - **Corners.** Rounded corners inset the rows by 5, 3, 2, 1, 1. They are off, on, or on except
    Home ("No Start", the default).
  - **Border.** A 1px border of Accent, Black, Grey (`0x848484`, the default) or White follows the
    rounded shape. It is never drawn on Home. On side art, Accent draws grey.
  - **GBA-res art.** Samples the art at logical pixels instead of physical ones (`ui.h:161`).
- **Empty lists.** "No favourites", "No recent games" or "No games found", centred per view
  (`ui.h:271`).
- **Buttons** (`dsstyle.c:572-581`):
  - D-pad in Horizontal: Left and Right step by 1, Up and Down by 10.
  - D-pad in any other view: Up and Down step by 1, Left and Right by 10.
  - A opens a folder or launches.
  - B goes up a folder, back to where Recents or Favourites were opened from, or to Home.
  - Y toggles the favourite and shows "Added to favourites" or "Removed from favourites".
  - SELECT cycles the view.
  - START on a system folder opens "Set launch mode": A RetroArch, B Game Rooms.
  - L and R cycle three tabs - Games, Apps and Settings - on every page but Home (`dsstyle.c:533`).
    From Games or a collection, L opens Settings and R opens Apps. That runs before the browser's
    own L and R branch (`dsstyle.c:578-579`), which is therefore never reached.
  - X opens search.
  - MENU opens Settings.
  - L2 opens Recents, R2 opens Favourites.
- **Systems view.** The root lists one folder per system that holds games. Folders show their full
  names ("Game Boy Advance") unless System names is Short (`system_names.h`). An optional Apps
  entry appears at the end (`dsstyle.c:217`). Folder icons come from `assets/icons`, by system
  name and alias (`ui.h:93-113`).

### Search (`extra_state.h:13-53`, `extra_ui.h:50-57`)

- **Opening it.** X opens a keyboard over the list: a box at (8,25,224,128) with an accent border
  and the query field at (14,42,212,16).
- **The keys.** 40 keys, `A-Z 0-9 - ' . space`, 10 to a row, 21 apart, 16 rows apart from (15,63).
  Below them are Delete (15,129,99,16) and Results (120,129,104,16). The selected key is an accent
  block.
- **Typing.** Each key filters live. Matching is case- and accent-insensitive.
- **Scope.** From the Systems root it searches every game on both cards. Anywhere else it searches
  the current list.
- **Leaving it.** Results closes the keyboard, and the title becomes `Search: <query>`. B cancels
  and restores the list.

### Settings (`ui_settings`, `ui.h:225-240`)

- **Layout.**
  - Background `SET.bmp`; Help pages use `SD_LIST.bmp`.
  - Nine rows from y=24, 14 apart. The label is at x=23, 14 glyphs.
  - The value is at x=119, 17 glyphs. The selected row's value sits in an accent box
    (112,y,112,13), with white text.
  - `^` and `v` scroll marks sit at (230,25) and (230,137).
- **Categories** (`ui.h:13`): Browsing, Artwork, Appearance, Startup, Sound, System, Controls,
  Help, About. The first seven show `>` and open a page.
- **Browsing:**

  | Row | Values |
  | --- | --- |
  | View | List, List + Art, Horizontal, Vertical |
  | List folders | Off, List, List + Art |
  | Clean list | On, Off |
  | System names | Full, Short |
  | System icons | Systems, Folders |
  | Apps in Games | Off, On |

- **Artwork:**

  | Row | Values |
  | --- | --- |
  | List artwork | Top, Centre, Bottom |
  | Horiz. side | Centre, Top, Bottom |
  | Horiz. fit | Contain, Overlap |
  | Vert. side | Centre, Left, Right |
  | GBA res. art | Off, On |
  | Art border | Off, Accent, Black, Grey, White |
  | Round corners | Off, Full, No Start |

- **Appearance:**

  | Row | Values |
  | --- | --- |
  | Colour | the 16 themes |
  | Dark mode | Off, On |
  | LCD grid | Off, On |
  | Pixel transp. | Off, On |
  | Clock format | 12 hour, 24 hour |
  | Language | English (UK), Français, Deutsch, Español, Português, Italiano, Nederlands, English (US) |

- **Startup:**

  | Row | Values |
  | --- | --- |
  | Boot to | Home, Games, Recents, Favourites, Last game |
  | Home screen | On, Off |
  | Home source | Recents, Favourites |
  | Quick start | Off, A, B, X, Y, SELECT, L, R |
  | Home button | Apps, Favs, Recents |
  | Autoboot | Off, On |

- **Sound:** UI sounds and Startup sound, each On or Off.
- **System:** Apps, Stock OS, Reboot and Shutdown, each `>`.
- **Controls:** Controller, Reset controls, then the 11 bindable actions with their current button
  (`controller_state.h:7-9`).
- **Help.** Two pages of button, then description. Page 1 covers A, B, X, Y, SELECT, L, R, START
  and MENU; page 2 covers L2, R2, D-pad, VOL, MENU + VOL and START. Left and Right flip the page.
- **About.** Two pages: the credits text, then filter credits (`about_snake.h:199-203`). START opens
  **Snake**:
  - a 20x14 board of 8px cells at (40,33);
  - the snake starts four cells long;
  - it steps every 134ms;
  - its food is seeded from the clock (`about_snake.h:70, 177-180`);
  - the score and best are in the title bar.
- **Buttons** (`dsstyle.c:547-571`):
  - Up and Down move.
  - A enters a category, or cycles a value forward; Left and Right cycle a value either way.
  - B goes back.
  - X shows the row's help box (`extra_ui.h:1-49`).
  - A on a binding waits up to 5s for a new button (`controller_state.h:1`).

### Overlays (`ui.h:311-339`, `extra_ui.h`)

- **Two-choice popups.** "Set launch mode", "Reboot?", "Shutdown?" and "Change favourite?" are
  `adaptive_popup`: a box centred and sized to its lines, 14 apart, with a `0x494949` border
  (`extra_ui.h:85`). A confirms, B cancels.
- **Notices** are the message centred in a box striped by row, `0xffffff` and `0xe7e7e7`.
- **Launching** is a 106x28 striped box at (67,66) reading "Launching" (`ui.h:325`).
- **Volume and brightness.**
  - A 144x30 box at (48,65) with an accent inner border.
  - A pixel-drawn speaker or sun, and a bar at (78,76,103,8) filled in the accent.
  - It closes after 1.4s (`ui.h:311-317`, `dsstyle.c:367`).
- **The help box** wraps its text at 33 glyphs into a 216-wide box (`extra_ui.h:42-49`).
- **The splash.** `SPLASH.png`, shown only when the device boots (`dsstyle.c:611`).

## Filters

- **LCD grid.** A CPU version of the lcd1x intensity equation. For each physical pixel inside its
  3x3 cell, the factor is `gx * gy`, where:
  - `gx = (4 - cos(2π(x+½)/3))/5`
  - `gy = (16 - cos(2π(y+½)/3))/17`

  Every channel is multiplied by that factor and rounded. There is no RGB stripe
  (`ui.h:340-366`).
- **Pixel Transparency.** A CPU port of Matt Akins' slang shader over the finished 720x480 frame,
  with luma, bright-pixel transparency, a polariser, highlights and a one-pixel shadow. It is cached
  per dirty 16x16 tile (`pixel_transparency.h:1-61`).

## Input

- **Bindings.** 11 bindable actions, each on a handheld code (`controller_state.h:7-9`):

  | Action | Button |
  | --- | --- |
  | Accept | A |
  | Back | B |
  | Search / help | X |
  | Favourite | Y |
  | View / source | SELECT |
  | Previous tab | L |
  | Next tab | R |
  | Launch mode | START |
  | Recents | L2 |
  | Favourites | R2 |
  | Settings | MENU |

- **Fixed buttons.** The D-pad is fixed. VOL is volume and MENU + VOL is brightness
  (`dsstyle.c:391-392`).
- **External controllers** have their own table (`controller_state.h:10`).
- **Repeat.** A held direction repeats after 350ms, then every 100ms (`dsstyle.c:414, 426`).
  Face buttons do not repeat.
- **Sounds.** `accept`, `back`, `launch`, `menu`, `move`, `startup` and `tab` WAVs, chosen by the
  button and whether anything changed (`dsstyle.c:591`).

## What the port leaves out

- Launching the stock emulators and Game Rooms, and returning to the stock OS.
- Autoboot and the boot manager.
- Audio.
- Sleep on lid or idle.
- HDMI.
- External-controller discovery.
- Pixel Transparency.

`docs/porting/ds-style.md` records each of these as the port meets it.
