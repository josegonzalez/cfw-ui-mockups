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

Timed from a 60fps recording of 4.3 (`v43` in the source notes), which has the frame counts.

| What | How |
| --- | --- |
| Health & Safety | the prompt first shows 1.93s in, then pulses to nothing and back once a second |
| Health & Safety to the menu | fades to black, 400ms; black for 2.4s while the menu loads; the menu fades up, 300ms linear |
| After boot | "Wii Menu" stands in the clock's place, cyan, for 3.67s, then cross-fades to the clock (200ms) |
| Clock | the colon blinks, a second on and a second off |
| Page turn | the grid slides 512px, 333ms, decelerating |
| Highlight | the slot's cyan rim eases in, 100ms; its name bubble appears 367ms after |
| Hover | a bar or preview button grows 8% in 50ms, its rim unchanged |
| Page arrows | bob inward two pixels and back, 900ms a cycle, on every screen that has them |
| Channel icons | each stock icon loops, 6 to 16.7s a cycle - see the source notes |
| Grid to preview | the panel grows out of its slot, 417ms easing in and out, as the grid swells 1.5x towards it and darkens (400ms); the banner's content fades up once it lands (333ms) |
| Preview to grid | the panel shrinks into its slot with its banner (333ms), the grid unswelling and brightening from 167ms in (300ms) |
| Preview step | the next banner's background at once, its content fading up after 333ms (200ms) |
| HOME Menu | its bars slide in from the top and bottom while the screen dims, 217ms |
| Menu to Wii Options or the SD Card Menu | the menu fades to black, 333ms |
| Wii Options | 200ms black, the ground over 500ms, the tiles over 250ms |
| Choosing a tile | it flashes white while the other darkens (167ms), then flies into the title tab (200ms); Wii Settings follows through black (333ms); Data Management grows its name out of the tab (133ms) and fades its tiles up (167ms) |
| Wii Settings | a page fades up from black over 250ms; a page turn slides in 233ms while the arriving page brightens (333ms) |
| SD Card Menu | black 283ms, fades up 283ms, "Loading from the SD Card..." for 1.35s |
| Dialogs | slide up from the bottom edge, decelerating, 233ms, the screen dimming behind |
| Every other screen change | the new screen fades up, 283ms |
| Empty slots | WM4K's four static frames, cycling |

Each has a resting value, so a still is the live build with motion off: the static on its first
frame, the prompt and colon shown, the arrows in place, the bubble shown, every icon loop on the
picture that stands for its channel, and no boot label or loading box.

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
| `index.tsx` | the root: state, the clocks that finish the boot, its label, the zoom, each screen's exit and the SD loading box, the screen and the HOME Menu over it |
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
