# Porting notes: Dreamcast BIOS

What the React set does differently from the Dreamcast's own menu, and why. There is no source: the
set was built from the boot ROM - its textures, font and strings - and from a recording of the menu
on a real console, and every still was compared with the frames in
[`themes/dreamcast-bios/reference/frames/`](../themes/dreamcast-bios/reference/frames/).

## What the reference is

Boot ROM v1.01d (MPR-21931, MPR-21933), which dreamcast.wiki lists for Japan, the US and PAL, and
a recording of the menu on a real console set to English, `c69qVhS_WOU`, which walks every screen
in the order the stills follow. The US manual (pages 9-24) fills in what each screen's controls do.
[`source-notes.md`](../themes/dreamcast-bios/reference/source-notes.md) records every value and
where it came from.

The issue asked whether the textures could be extracted from the BIOS file. They can: the ROM
keeps them as ordinary PowerVR texture chunks, and the port's `bios/` directory is that ROM's own
pixels. So are its font and its every string. What cannot be extracted as a picture is the menu's
3D models, which are geometry.

## Deviations

- **The main menu's models are drawn.** The controller, memory card, note and alarm clock are 3D
  models the BIOS lights and turns; the port draws each as a flat SVG, a little see-through as the
  real ones are, and approximates the focused model's turn by narrowing it.
- **The sky is procedural.** The BIOS renders its sky and the swirl of cloud below the menu in 3D.
  The port draws a flat reading of what that produces - gradient, drifting clouds, a turning disc of
  cloud - as a shader. The ROM's own 64x64 cloud texture is decoded but not used: tiled flat, it
  reads as a pattern rather than a sky.
- **Save icons are placeholders.** A save's icon is the game's art, stored on the memory card. The
  nine saves carry the recording's names, block counts and dates, and a two-colour icon each.
- **The clock does not tick.** It is fixed at the recording's 07/21/2021 19:42.
- **Language changes the setting only.** The port carries the English string table; choosing
  another language shows its name in Settings but leaves the menu in English.
- **Settings' memory-card clock is always set.** Select says every card was set, as the recording
  shows; the port's card has no clock of its own to fail on.
- **How a focused empty socket looks is a guess.** The recording only ever focuses A-1, which holds
  a card; the port brightens an empty socket's outline when it is focused.
- **Copy stops at the destination picker.** There is one card, so there is nowhere to copy to.

## Not reproduced

- **The boot animation.** The swirl drawing itself and the wordmark rising (1-9s) are not built;
  the live build opens on the main menu, and on the first-boot clock from its own still.
- **A disc.** Play with a disc checks and boots it, and Music with an audio CD spins the disc and
  runs a visualiser. The port has no disc; the ROM's two disc textures are decoded but not drawn.
- **The hidden 3D menu** a Puyo Puyo Fever save unlocks (from 146s in the recording), and the
  screensaver after ten minutes.
- **Regions.** The PAL BIOS draws the swirl blue; the port is the NTSC menu the recording shows.

## How it was verified

- `dreamcast-bios.test.tsx` walks the reducer through every screen's buttons and renders every
  still; the e2e suite captures each still in web and fallback mode, runs the compositing guard and
  holds the live build, settled, to the `main` still.
- Every still was rendered and put side by side with its reference frame at 640x480, and corrected
  until they agree: the text's advance and halo, each box's position and colours, the sky's band.
- `extract-assets.py` was rerun against the ROM, and its output compared with the committed files.
