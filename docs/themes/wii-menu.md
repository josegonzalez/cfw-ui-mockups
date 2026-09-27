# Wii Menu

Mockups of the Wii's own menu, System Menu 4.3U, on a 640x480 handheld. Four pages of channels in
a 4x3 grid over a seven-segment clock; channel previews that grow out of their slot; the HOME Menu;
Wii Options and Wii Settings; the SD Card Menu; and the Wii Message Board. Asked for in issue #8.

- Source: none - the System Menu is closed. Built from recordings of the console and from
  [WM4K](https://github.com/Alan-bur/WM4K) at `b04bd27`, a hand-redrawn Dolphin texture pack of 4.3U
- Everything measured, and where from: [`reference/source-notes.md`](wii-menu/reference/source-notes.md)
- Where the reference material came from: [`reference/README.md`](wii-menu/reference/README.md)
- What changed in the React port: [`porting/wii-menu.md`](../porting/wii-menu.md)

Implemented at `app/src/themes/wii-menu/`. Mode: **reproduce** throughout.

## Screens

The primary deliverable is the interactive route, which opens on Health & Safety, as the console
does. 45 stills are provided, each posed by pressing buttons from power-on.

| Screen | Stills |
| --- | --- |
| Health & Safety | `health` |
| Wii Menu | `menu`, `menu-page-2`, `menu-page-4`, `menu-wii-options`, `menu-sd-card`, `menu-message-board` |
| Channel previews | `preview-disc`, `preview-mii`, `preview-photo`, `preview-shop`, `preview-forecast`, `preview-news`, `preview-internet`, `preview-votes`, `preview-cmoc`, `preview-nintendo`, `preview-start` |
| HOME Menu | `home`, `home-channel`, `home-channel-wii-menu` |
| Wii Options | `wii-options`, `data-management` |
| Wii Settings | `settings`, `settings-2`, `settings-3`, `settings-sound`, `settings-screen`, `settings-widescreen`, `settings-tv-resolution`, `settings-burn-in`, `settings-calendar`, `settings-sensor-bar`, `settings-sensor-bar-position`, `settings-update` |
| SD Card Menu | `sd-card-menu`, `sd-about`, `sd-about-2` |
| Wii Message Board | `board`, `board-calendar`, `board-create`, `board-memo`, `board-letter`, `board-address-book`, `board-posted` |

The grid holds the pre-installed and free 4.3U channels: Disc, Mii, Photo, Wii Shop, Forecast,
News, Internet, Everybody Votes, Check Mii Out and Nintendo. Every other slot is empty.

## Geometry

The Wii composes a 608x456 frame and sends it unscaled inside a 640x480 signal, with a black border
of 16 pixels each side and 12 above and below. Both 4:3 recordings show exactly that, and the
RG35XX's panel is that signal, so the port draws the frame 1:1 at (16, 12) and scales nothing.

- **The grid**: 120x90 slots on a 128x96 pitch from (53, 37), the neighbouring pages' edge columns
  showing at either side.
- **The bar**: a cyan edge at y 330 dipping to y 379 round the clock, the Wii and Message Board
  buttons at its ends and the SD Card Menu button beside the Wii button.
- **The preview**: a 585x439 panel at (12, 8) with two 237x63 buttons in its lower band.

## Motion

| What | How |
| --- | --- |
| Health & Safety to the menu | fades to black, 467ms linear; black for 900ms while the menu loads; the menu fades up, 317ms linear |
| Health & Safety prompt | pulses to nothing and back, 950ms a cycle |
| Page turn | the grid slides 512px, 334ms, decelerating |
| Highlight | the slot's cyan rim eases in, 100ms; its name bubble appears 400ms after |
| Page arrows | bob inward two pixels and back, 900ms a cycle, on every screen that has them |
| Grid to preview | the slot grows into the panel while the grid fades to black, 467ms, the banner fading up over the last 133ms |
| Preview to grid | the panel shrinks back into its slot with its banner, the grid fading in behind, 467ms |
| HOME Menu | its bars slide in from the top and bottom while the screen dims, 217ms |
| Wii Options' tiles | grow out of the title tab, 267ms, the second 67ms after the first |
| Choosing a tile | the other fades, 100ms; the chosen one flies into the tab, 200ms; the screen fades to black, 333ms |
| Settings page turn | the page slides out and the next in, 400ms, the arriving page brightening from dim |
| Every other screen change | the new screen fades up, 283ms |
| Empty slots | WM4K's four static frames, cycling |

Each has a resting value, so a still is the live build with motion off. The static rests on its
first frame, the prompt at full strength, the arrows in place and the bubble shown.

## Colour

One look, with nothing to switch between: white ground, light grey bar, cyan edges and focus, grey
clock. The Settings pages keep their own dark ground and lavender focus.

## Fonts

M PLUS 1p, cut to Latin, standing in for the Wii's FOT-Rodin NTLG, which is not free to ship. It was
chosen by setting candidates beside captured text; see the source notes.

## Input map

A handheld has no pointer. The Wii Remote's + Control Pad moves a highlight where the pointer would
rest, and the Remote's other buttons map to the handheld's.

| Button | Wii Menu | Preview | Everywhere else |
| --- | --- | --- | --- |
| D-pad | move the highlight; past the last column turns the page; below the last row drops into the bar | move between Wii Menu and Start | move the focus |
| A | open the channel or the bar button's screen | press the focused button | press |
| B | | Wii Menu | back |
| L / SELECT | - : the previous page | - : the previous channel | the previous page or day, where there is one |
| R / START | + : the next page | + : the next channel | the next page or day |
| MENU | HOME | HOME | HOME |

In the HOME Menu, B and MENU close it, as the HOME button does.

## Assets

WM4K's textures, resampled to the size the System Menu loads them at. The Settings pages are
WM4K's whole-page textures, shown as they are; everything else is composed from the pack's pieces
or drawn. Credits are in `app/src/themes/wii-menu/assets/SOURCE.md`.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the root: state, the clocks that finish the boot, the zoom and a tile's exit, the screen and the HOME Menu over it |
| `machine.ts` | the view stack and every button as a pure reducer |
| `layout.ts`, `palette.ts`, `motion.ts` | geometry, colours and durations, each with where it was measured |
| `library.ts`, `assets.ts` | the channels, the clock and date, and asset lookup |
| `views/` | `Menu`, `Channel`, `Preview`, `Home`, `Health`, `Options`, `Settings`, `Sd`, `Board`, and `parts` |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | the stills and the live build |

No widget from the shared kit is used. The grid is the nearest candidate, `TileGrid`, but the
Wii's grid is a strip of pages with the neighbours' edges showing and a highlight that turns the
page when it runs off the side; saying that would mean widening `TileGrid` until it stopped saying
anything else.

## How it is checked

- `wii-menu.test.tsx` walks the machine: paging, the bar, the zoom, the HOME Menu's buttons, Settings
  choices, the board. It walks every state reachable in Wii Settings and checks WM4K has a frame for
  each, and renders every still.
- The usual e2e suite captures each still, web and fallback, runs the compositing guard, and holds
  the live build, settled, to the `health` still.
- The stills were compared by eye, overlaid on the frames in `reference/frames/`.
