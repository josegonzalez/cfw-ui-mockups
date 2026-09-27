# Wii Menu source notes

The Wii Menu - the System Menu, here version 4.3U - is closed. There is no source to read, so every
value below is measured from a recording of the real console, read from the WM4K texture pack, or
quoted from a published description, and each says which.

## Sources

| Id | What | Used for |
| --- | --- | --- |
| `tv` | [Wii Menu Tour/ Dazzle Test](https://www.youtube.com/watch?v=_tv8xik0484), a capture card at 640x480, 29.94fps, 4:3 | the grid, the bar, the previews, the zoom, the page turn |
| `dolphin` | [Dolphin 5.0-15663 - Wii System Menu](https://www.youtube.com/watch?v=6u1VB2rT2os), 1280x720 at 59.94fps with a 4:3 picture | Health & Safety, the HOME Menu and its timing |
| `setup` | [Nintendo Wii - Initial System Setup and New Menu Tour 2025](https://www.youtube.com/watch?v=KzORmt_gWDA), 1280x720 at 59.94fps, 16:9 | the Settings page turn and cross-fade, the Message Board calendar |
| `showcase` | The WM4K showcase recording linked from the pack's README, 1920x1080, 16:9 | the SD Card Menu, its About dialog, the Message Board, Wii Options |
| `sd-intro` | [PC/ROG Ally - Install The Wii System Menu On Dolphin Emulator](https://www.youtube.com/watch?v=WUJeCy6QP8Q), 16:9 | the SD Card Menu's first-run text |
| `WM4K` | [Alan-bur/WM4K](https://github.com/Alan-bur/WM4K) at `b04bd27`, `0000000100000002/USA/` | every texture the port draws; the Settings pages |
| `wikipedia` | [Wii system software](https://en.wikipedia.org/wiki/Wii_system_software), Wii Menu and Home Menu sections | the grid's size, the HOME Menu's buttons |

Frames were cut from the recordings with `ffmpeg` in a container and placed as the console places
them in its signal (below). Those committed are in `frames/`, named for what they show; the
recordings themselves are not committed.

## The frame

The Wii composes a 608x456 frame. In both 4:3 recordings it sits inside the 640x480 signal unscaled
with a black border: the capture card's picture spans x 14-624 and y 10-465 (`tv`, every frame), and
Dolphin's the same proportion, 918x690 at (178, 15) in its 1280x720 recording. The RG35XX's panel is
640x480, so the port draws the frame 1:1 at (16, 12).

Every position below is a pixel of that 608x456 frame: a `tv` measurement with (14, 10) taken off.

## The Wii Menu

From `tv` 1.0s (`frames/menu.png`), 8.0s (`menu-hover.png`) and 17.5s (`menu-page-2.png`).

- **Grid.** "It has four pages, each with a 4x3 grid, and each displaying the current time and
  date ... users can move channels (except for the Disc Channel) among the menu's 48 customizable
  slots. By pressing the plus and minus buttons on the Wii Remote users can scroll across"
  (`wikipedia`). Slots are 120x90 on a 128x96 pitch; the first is at (53, 37). Tile edges
  measured on the empty page, where each slot's outline is a clean minimum: columns at x 68/185,
  196/313, 324/441, 452/569 and rows at y 48/136, 144/232, 240/328 in the capture.
- **Neighbouring pages.** The next page's first column shows from x 565, the previous page's last
  column up to x 43. Page 1 shows nothing on its left.
- **Page arrows.** Pale cyan, about 26x42, centred at (41, 175) and (570, 175). The right arrow is
  absent on page 4 and the left on page 1.
- **Empty slot.** Light grey with faint static and a faint "Wii" - WM4K's four 128x96 static frames
  (`Wii Menu/tex1_128x96_{131e0a,1cb501,2fc749,876aa5}`).
- **Highlight.** The slot under the pointer gains a cyan outline, and a white bubble with a grey edge
  names it just below and to the right of the slot's corner: (64, 135) for the first slot, 36 high,
  21px grey text.
- **Bar.** A light grey bar whose top edge is a cyan line at y 330 under the buttons, dipping to
  y 379 between about x 150 and 458 to leave the clock on white.
- **Buttons.** The Wii button, a 76px circle with a cyan rim, centred at (73, 385); the Message
  Board button the same at (537, 385); the SD Card Menu button, a small grey SD card at (138, 380),
  32x40.
- **Clock.** Seven-segment digits and AM/PM from WM4K (`Wii Menu/tex1_48x48_*`, `tex1_48x32_*`),
  tinted grey (#8a9094 sampled). "9:12" spans x 271-366, the digits 35px tall, with "PM" to their
  right at x 383-411.
- **Date.** "Fri 2/25", bold grey, centred on the screen at y 402.
- **Hover names.** "Wii Options", "SD Card Menu" and "Wii Message Board" for the three bar buttons
  (`showcase` 8s and 10s).

## The channel preview

From `tv` 23.5s to 76s (`frames/preview-*.png`) and 22.6-23.4s (`zoom-in-a.png`, `zoom-in-b.png`).

- **Panel.** A white panel at (12, 8), 585x439, rounded, on black. Its lower band, from y 340, is
  grey and holds two 237x63 buttons: Wii Menu at x 61 and Start at x 313, both at y 357.
- **Disc Channel with no disc.** A cyan band across the top widening at the right under "Disc
  Channel"; a Wii disc and a GameCube disc side by side; "Please insert a disc."; Start greyed out.
- **Arrows.** The page arrows at the same place as on the grid, over the banner's edges.
- **Zoom in.** The slot grows into the panel while the grid behind darkens to black, 15 frames
  (500ms); then the banner and buttons fade up over 8 frames (267ms).
- **Channel order when stepping.** The arrows step to the previous and next channel in grid order.

## The HOME Menu

From `dolphin` 117s (`frames/home-menu.png`) and 114.5-116.7s.

- **Top bar.** Black, "HOME Menu" in white at the left, a Close button at the right with the HOME
  icon (`Home Menu/tex1_56x56_703bcc`).
- **Bottom bar.** Black, a row of the four controllers' batteries (P1 lit), "Wii Remote Settings"
  below it, and a Wii Remote at the left (`Home Menu/tex1_96x328_{ee403b,c301cc}`).
- **Middle.** Over a game, two large pills, Wii Menu and Reset.
- **Opening.** The bars slide in from the top and bottom while the picture behind dims: 13 frames at
  59.94fps, 217ms.
- **Which buttons.** "Depending on when the Home Menu is accessed, a different number of buttons are
  displayed" (`wikipedia`). Wii Menu "will exit a game or a Wii Menu channel"; Reset "performs a soft
  reset of that particular application".

## Wii Settings

From `WM4K` `Settings/`. The System Menu draws each Settings page to one 608x456 texture, so the
pack redraws each page whole, once per state. Each state was identified by where its lavender
focus fill and its orange "selected" corners fall; the table is in `extract-assets.py`.

| Page | States in the pack |
| --- | --- |
| Wii System Settings 1, 2, 3 | nothing focused, each of four items, Back, the page arrows |
| Sound | each of Mono, Stereo, Surround selected, by each focus |
| Screen | nothing, each of four items, Back |
| Widescreen Settings, TV Resolution, Screen Burn-in Reduction | each option selected, by each focus |
| Calendar, Sensor Bar | nothing, each of two items, Back |
| Sensor Bar Position | each option selected, by each focus |
| Wii System Update | Yes, No |

- **Page turn.** The page slides out and the next slides in, 17 frames at 59.94fps, 283ms (`setup`
  356.8s).
- **Opening a page.** The new page cross-fades in over the last, 17 frames, 283ms (`setup` 351.2s).

## Wii Options, SD Card Menu, Message Board

Only 16:9 recordings of these were found (`showcase`, `setup`), so their positions are not measured
for 4:3; the port keeps what is arranged and how, on the grid and bar it shares with the Wii Menu.

- **Wii Options.** Two tiles, Data Management and Wii Settings, on the Settings ground with "Wii" at
  the top right, and Back (`showcase` 40s). Data Management offers Save Data and Channels.
- **SD Card Menu.** The Wii Menu's grid and bar, dark: empty slots, "1/20" in the dip, "SD Card
  Menu" under it, the Wii button left and a help button right (`showcase` 32s). The help button
  opens "About the SD Card Menu": "On the SD Card Menu, you can temporarily utilize the Wii System
  Memory to launch a channel stored on an SD Card." with Back and Next (`showcase` 34s). The first
  run ends "To view this information again, go to the SD Card Menu and select the button shown
  here." with Back and Close (`sd-intro`).
- **Message Board.** A pale board, arrows either side, and a bar with calendar and new-message
  buttons at the left, the date, and a Wii button at the right (`showcase` 58s). New message offers a
  memo, a letter and the address book (`showcase` 66s). The address book shows "This console's Wii
  Number" (`showcase` 70s). With no Miis registered a letter says "No Miis have been registered.
  Please use the Mii Channel to create a Mii." (`showcase` 84s). The calendar is a month grid with
  today marked (`setup` 184s).

## Health & Safety

From `dolphin` 13s (`frames/health-safety.png`): white bold capitals on black.

- "WARNING-HEALTH AND SAFETY" with a yellow warning sign.
- "BEFORE PLAYING, READ YOUR OPERATIONS / MANUAL FOR IMPORTANT INFORMATION / ABOUT YOUR HEALTH AND
  SAFETY."
- "Also online at" and "www.nintendo.com/healthsafety/" in blue.
- "Press (A) to continue." in grey, which is absent at 1s (`health-safety-early.png`).

## The stock channels

The pre-installed and free 4.3U channels: Disc, Mii, Photo, Wii Shop, Forecast, News, Internet,
Everybody Votes, Check Mii Out and Nintendo. The Disc Channel is fixed in the first slot
(`wikipedia`). Each channel's icon and banner is built from its own WM4K textures
(`Channels/<name>/`); the Forecast and News previews use the text those channels show before their
first download (`tv` 36s, and `UmvT9S39Z_E` for the News Channel's).

## Font

The System Menu's face is FOT-Rodin NTLG, which is not free to ship. WM4K's redrawn font atlases
(`Fonts/`) have no metrics, so they were not rebuilt. The candidates set beside captured text were
M PLUS 1p (Regular and Medium), M PLUS Rounded 1c, M PLUS 2, Zen Kaku Gothic New, Sawarabi Gothic,
IBM Plex Sans JP and Nunito Sans; M PLUS 1p Medium matched "Please insert a disc." and "Wii Menu"
most closely.
