# Porting notes: Wii Menu

What the React set does differently from the Wii Menu itself, and why. There is no source: the set
was built from recordings of the console and from the WM4K texture pack, and every still was compared
with the reference frames in [`themes/wii-menu/reference/frames/`](../themes/wii-menu/reference/frames/).

## What the reference is

The System Menu 4.3U, as two 4:3 recordings show it (a capture card, and Dolphin), with three 16:9
recordings for the screens those two never open. WM4K supplies the textures: the pack is Dolphin's
replacement set for 4.3U, so every texture it redraws is one the System Menu loads, named with the
size it loads it at. [`source-notes.md`](../themes/wii-menu/reference/source-notes.md) records every
value and where it came from.

## Deviations

- **There is no pointer.** The Wii Menu is driven by pointing the Wii Remote; a handheld has only
  the + Control Pad's equivalent. The highlight - the cyan outline and name bubble the pointer
  raises - stands for it, and the D-pad moves it. The pointer itself is not drawn.
- **Buttons that are pointer targets are reached another way.**
  - The page arrows on the grid and in the preview are - and + on the Wii Remote; here L / SELECT
    and R / START.
  - Running off the grid's last column turns the page; running below it drops into the bar.
  - The Settings pages' arrows are Left / Right. Their frames' arrow-hover states are unused.
- **The HOME Menu over the Wii Menu has no Wii Menu or Reset button.** Both act on a running title
  (Wikipedia, "Wii system software"), and no recording found shows the HOME Menu opened from the
  menu itself. Over a running channel it has both.
- **A running channel is its banner on black.** The port has no channels to run. Start shows the
  channel's banner so that the HOME Menu can be opened over a title, with Wii Menu and Reset.
- **Banners and icons are assembled.** Each channel's banner and icon are its own files on the
  console, animated. The port composes a still of each from that channel's WM4K pieces, its real
  title and its real text; the Forecast and News previews show what those channels show before
  their first download.
- **The clock and date are fixed** at the capture's 9:12 PM, Friday 2/25.
- **The Message Board's Mail button carries no count.** A console fresh from setup has no mail.
- **Font.** M PLUS 1p stands in for FOT-Rodin NTLG, and also for the serif face the System Menu
  sets its dialogs in (the SD Card Menu's About dialog, "No Miis have been registered").
- **Three screens are arranged, not measured.** Wii Options, the SD Card Menu and the Message Board
  appear only in 16:9 recordings, so their 4:3 positions are derived: they sit on the Wii Menu's own
  grid and bar, and on the Settings pages' ground and Back button.
- **The zoom's grid does not swell.** As the preview opens, the real grid behind it scales up
  towards the slot while it darkens; here it only darkens.
- **Closing the HOME Menu is immediate.** Its opening was measured; its closing was not.
- **Leaving a tile screen by Back** fades straight to the screen behind; the recording shows only a
  tile being chosen.
- **The Health & Safety prompt shows at once.** On the console it appears after a few seconds.
- **Motion is timed from System Menu 1.0.** The only 60fps recording that shows most transitions
  (`v1` in the source notes) is of 1.0, not 4.3. Where a 4.3 recording also shows a transition - the
  zoom, the arrows' bob - the two agree to within its frame.
- **Wii Options' tiles grow in whenever it opens.** The recording shows a tile screen's tiles growing
  out of its title tab when returning to one; the port plays it on the way in from the menu too.
- **The SD Card Menu's About dialog has two pages.** The first is the one its help button opens;
  the second is the one the first-run introduction ends on.
- **The Wii Number is made up**, so no still carries a real console's.

## Not reproduced

- **Settings pages the pack does not redraw whole.** WM4K covers Sound, Screen, Widescreen
  Settings, TV Resolution, Screen Burn-in Reduction, Calendar, Sensor Bar, Sensor Bar Position and
  Wii System Update as whole frames in every state; those open. Console Nickname, Parental
  Controls, Internet, WiiConnect24, Language, Country, Format Wii System Memory, Screen Position,
  Date, Time and Sensitivity do not.
- **Data Management's Save Data and Channels.**
- **Wii Remote Settings** in the HOME Menu, which is focusable but opens nothing.
- **Writing a memo, letters, and registering an address.** There is no keyboard; a posted memo is
  blank.
- **The system update itself.** Yes and No both go back.
- **Moving channels**, discs, an inserted SD card, and sound.

## How it was verified

- **The Wii Menu** laid over `frames/menu-hover.png` at 640x480: the slots, the neighbouring
  columns, the bubble, the bar's edge and dip, the three buttons, the clock and the date coincide.
- **The Disc Channel preview** laid over `frames/preview-disc.png`: the panel, the two buttons, the
  discs and the text coincide; the panel's corners are a rounded rectangle where the console's
  bulge like a television's.
- **Every other still** looked at beside its frame, or beside its 16:9 frame for the three arranged
  screens.
- **The live build** driven with the keyboard through the boot, the highlight, a page turn, a zoom
  in and out, the HOME Menu, Wii Options and a Settings page turn, with frames captured
  mid-transition and the arrows' offset sampled through a cycle.
- **Every transition's timing** held to the frame counts in the source notes' Motion table.
- **Every reachable Settings state has its frame**, checked by walking the machine in
  `wii-menu.test.tsx`.
