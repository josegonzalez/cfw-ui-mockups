# Porting notes: NeoStation

What the React set does differently from NeoStation itself, and why. The set was built from the
Flutter source directly - there was no earlier mockup - so everything here compares against that
source at `d9bece5` and the ten website frames in
[`themes/neostation/reference/`](../themes/neostation/reference/).

## What the source is

A Flutter app in Dart, laid out with flutter_screenutil on a 640x480 design size and scaled to the
screen. It draws with Material widgets and a handful of its own - NeoGlass, the header's tab pill,
`GamepadControl` - in 14 built-in colour themes, and branches on the platform it runs on. There is
no layout format to read; the port reads the widget trees, sizes, colours, strings and gamepad
layers and records them in [`source-notes.md`](../themes/neostation/reference/source-notes.md).

## Deviations

- **The website frames are an older build.** The current source is followed wherever they differ,
  and the frames are matched for look and colour. What changed since: the LB and RB glyphs sat
  inside the tab pill and there was no notification bell; the games list had a rail of round action
  buttons left of the sidebar, since moved to the details card's footer and the Y menu; the details
  card drew the title large over the fanart; the scraper's stat cards had a fill the current
  `cardColor` at 0.25 does not give; the NeoSync dashboard was a different layout.
- **Which device took the frames is an assumption.** They are 1920x1080 with the header's 32-unit
  tab slot 96px wide, so three device px per unit, which is a 640x360 logical screen at pixel ratio
  3. They show a battery, so a handheld rather than a TV. The Odin 2 Mini has that screen; nothing
  in the frames names it.
- **Text on the Odin is at 0.85.** Every label in the frames measures 0.85 of what its box predicts
  while the boxes match exactly, which is Android's Small font size. The Odin's text sizes carry
  that scale; the rg40xx is Linux and has no such setting.
- **Art is generated.** Box art, fanart, screenshots, wheels and achievement badges are
  deterministic stand-ins (`art.ts`), and system cards are what the source draws with no art pack
  installed: the system's colours and its logo. The frames show downloaded NeoAssets packs.
- **The clock and battery are fixed** at 4:50 and 30%, from `site-03.webp`, so a still is the same
  picture every time.
- **Nothing leaves the app.** Folder pickers, Android settings, All Files Access, the launcher
  chooser, links and launching an Android app all open something outside NeoStation; those rows do
  nothing, and a launched game shows the launch dialog's "Game executing" state. Confirm Exit is
  drawn as the black screen left behind, and any button starts the app again.
- **The wizard's outside steps succeed at once.** Grant Access grants, Select Folder picks, the
  ES-DE import reports the sample library, and the art pack catalogue is the offline one - empty, so
  the step says it could not be reached and finishes. The rg40xx's user-data folder assumes the
  AppImage branch run as root, `/root/.neostation/user-data`.
- **Text fields are not editable.** The source opens the operating system's keyboard. Fields are
  drawn at rest, a form's submit reports the source's empty-field error, and Game Settings' fields
  show being edited and walk to Save.
- **Italic and bold are synthesised** from Anta's one upright face, as Flutter does.
- **The splash's cross-fade is a fade-in.** `AnimatedSwitcher` fades the splash out as the library
  fades in; the library fades in over 400ms and the splash goes at once.
- **A carousel wrap slides** across the list where the source jumps.
- **A long title in the selected row rests at its start** rather than scrolling.

## Not reproduced

- **Video.** The media tab shows the screenshot, as the source does before its three-second delay.
- **Shaders.** The music card, its visualizer and GIF backgrounds.
- **Sounds, touch and the back-swipe zone.**
- **The secondary screen** of dual-screen Android devices, and the wizard's accessibility row that
  only appears with one.
- **Downloaded art packs and custom theme import.**
- **The startup loading and storage error screens**, and the Systems tab's loading and empty states
  (`GridLoadingState`, `GridEmptyState`, `InitialSetupWidget`). The wizard's scan always finds the
  sample library.
- **Select chords.** Select + A scrapes and Select + Y opens the random game dialog in the source;
  the harness's key map has no chords, and both are reached from the Y menu instead.
- **The letter jump.** Holding up or down past 1200ms jumps by letter in the source; the harness's
  held keys only repeat.
- **Collections.** "New collection..." reports the collection it made, but the Collections card and
  browser are not drawn.

## Faults found by looking

- **Every label was 15% too large on the Odin.** The boxes matched the frames and the text did not,
  which is what showed the frames were taken at the Small font size.
- **Icons drew as empty boxes** when a font face registration was lost in a reformat. Every string
  replacement since is asserted rather than trusted.
- **The Cancel Subscription dialog had invented text.** Replaced with the source's own string.
- **Italic labels were upright.** The theme had turned font synthesis off to keep bold honest,
  which also stopped the oblique the source draws for "Estimated time left", "OK" and "Idle".
- **Settings' menu did not follow its cursor on the Odin.** Eight rows overflow the 360-unit
  canvas, and Exit sat off the bottom; the source centres the cursor row.
- **The NeoSync plan list did not keep the focused plan in view.**
- **The rg40xx had an Android apps still.** The apps grid is Android's only; stills now name the
  devices they exist on.
- **The plan said Fullscreen appears on neither device.** The source draws it on Windows, Linux and
  macOS, so the rg40xx has it.
- **Stepping through stills kept the last one's theme**, so a still reached after the Horizon
  scraper opened in Horizon rather than as posed.
- **The launch and wizard stills failed the compositing guard, correctly.** The launch dialog
  covered the games list with a page-coloured sheet where the source takes the list's content
  down, and the wizard was drawn over the whole app where the source shows it instead of the app.
  Confirm Exit's black screen had the same shape. All three now draw nothing underneath. The
  settings dialogs also tripped it, faithfully - they are 89% of a 640x480 screen - and are now
  declared as dialogs, which the guard exempts only while they are inset on every side.
- **Every button glyph was black in the fallback render.** The tint had been treated as a web-only
  mask and fell back to the raw image. `Image.asset(color:)` is a tint - a colour mod over a white
  glyph in a simple renderer - so it now draws the same in both modes. The glyphs are small enough
  to sit inside the baselines' 0.2% tolerance, so the fallback suite passed either way; the
  baselines were rewritten rather than trusted.
- **The settle pair disagreed about one run in ten under load.** The tinted glyphs are CSS masks,
  which the e2e helper did not wait for, and one landing after the first paint re-rastered its
  tiles with the blurred shadows a level or two off. The helper now waits for images CSS draws too.
- **The grid's moves were first written from the frames**, and one test expected the wrong target.
  Both were rewritten to the source's `_navDelta` and `_navHoriz`.

## Verification

- `neostation.test.tsx`: the units against flutter_screenutil on both devices, the 14 palettes, the
  system order and the Recent card's block, every grid move, the reducer through every button each
  screen names, each tab, Settings on both platforms, the wizard on both platforms, the scan splash,
  text measurement, and every still rendered on each device it exists on.
- The e2e suite: baselines for every still, web and fallback; the compositing guard; the settle
  pair of the live build and the `systems` still.
- By eye: every still on both devices. `systems-year`, `systems-carousel`, `games`, `game-info`,
  `game-achievements`, the four themed game lists and `scraper-running` were put beside their
  frames. The live build was pressed through the wizard to the library on both platforms, and the
  scan splash through to the systems.
