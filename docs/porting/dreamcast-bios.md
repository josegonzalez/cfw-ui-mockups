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
pixels. So are its font, its every string, its sounds, and the main menu's 3D models with the
motions they play - the ROM keeps them as Sega Ninja chunk models, and the port draws them as they
are.

## Deviations

- **The models' camera and light are fitted, not read.** The ROM holds the models, their places and
  their motions, but no camera or light the decoder could find: the port views them orthographically,
  which lines them up with the capture, lights them mostly ambient, and draws them at 0.65 of their
  materials' alpha, all fitted to the capture's colours. Translucent faces are depth-tested in draw
  order, where the PowerVR sorts them per pixel, so a model's inner faces can blend a little
  differently.
- **The pills are flat.** The ROM has the main menu's label pills as models too; the port draws them
  as boxes, because they carry the labels, which are the ROM's strings in its font.
- **File's and Settings' models are placed by measurement.** The ROM keeps them at the origin of
  their own space - the BIOS places them in code - so the port fits each to the box the capture puts
  it in. The memory card's screen, where a save's icon shows, is the upper half of its face; the
  icon itself is a placeholder.
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
- **Power-on is approximated.** A red dot writes the wordmark in and traces the swirl; the port
  wipes the wordmark in and grows a drawn swirl from its centre. The wordmark is the ROM's top-bar
  texture darkened and scaled nearly three times, so its edges are softer and more stepped than the
  smooth one the BIOS draws.
- **The menu's sounds are rendered, not recorded.** The ROM holds them as note sequences, which
  `bios_sound.py` plays through a model of the sound chip. It has no reverb, and its filter's cutoff
  is fitted to the recording rather than emulated: the emulator's formula silences the cursor sound
  after 80 ms where the console holds a tail. It reads the sequences' volume, pan and modulation
  controllers by assumption rather than from the sound driver. The boot sound is the ROM's stream,
  decoded as it is.
- **An audio CD wears the ROM's red label.** The recording's disc is a game disc, which carries its
  own label; an audio CD has none, and which of the ROM's two - red and blue, by region - the BIOS
  gives one is not in the recording. The port uses the red, the NTSC console's.
- **A paused disc lies still.** The recording never pauses; the port leaves a paused disc flat,
  not spinning.
- **The visualiser is a reading, not the BIOS's.** The BIOS's follows the music, which the port
  does not have; the port's darkens the screen and turns a haze of the recording's colours round
  the disc, built up over the first seconds of a track.
- **The repeat button shows its mode by its icon.** The port swaps the repeat button's icon for the
  ROM's repeat-one and repeat-all textures. The ROM also has two smaller models wearing those
  (`back_button_a/b`); the recording never changes the repeat mode, so where the BIOS uses them is
  not known.
- **A focused button's green is fitted.** The BIOS sets it in code over the model's own material, so
  the colour and its opacity are fitted to the recording's focused buttons.
- **Only heard sounds play.** The ROM's `error` and `sequence-4` are never heard in the recording, so
  a press that changes nothing is silent rather than guessing at one.
- **A still lets go of WebGL after its one frame.** The sky and the menu models draw a still's
  frame on a canvas that is never shown, copy it onto the 2D canvas that is, and release the
  context (`app/src/render/stillGl.ts`). The views page puts every settings still on one page, and
  past the browser's limit on live contexts the earliest tiles lost their sky and their models
  while the later ones kept them. A live build still draws straight to its GL canvas.

## Not reproduced

- **A game disc.** Play with a disc checks and boots it; the port's Play has none.
- **The music:** the port's audio CD has track lengths and nothing to play.
- **The hidden 3D mode's free camera,** which turns the whole menu in the recording (150-180s). The
  port has the mode's look - the sea, the reflections, the solid models, the visualiser - but not
  the camera.
- **The hidden 3D mode on screens the recording never shows in it.** It shows the mode on the main
  menu and Music only. The port gives every other screen the mode's sea and draws it at the mode's
  smaller size about the screen's middle - the recording's origin for that size is set by the top bar
  those two screens have - and does not reflect their models, whose slates and boxes are flat.
- **The hidden 3D menu** a Puyo Puyo Fever save unlocks (from 146s in the recording), and the
  screensaver after ten minutes.
- **Regions.** The PAL BIOS draws the swirl blue; the port is the NTSC menu the recording shows.

## How it was verified

- `dreamcast-bios.test.tsx` walks the reducer through every screen's buttons and renders every
  still; the e2e suite captures each still in web and fallback mode, runs the compositing guard and
  holds the live build, settled, to the `main` still.
- Which sound each press makes was matched against the recording's own audio: onsets detected in its
  audio track and each identified by correlation with the rendered sequences, at the times the
  theme page lists.
- Every still was rendered and put side by side with its reference frame at 640x480, and corrected
  until they agree: the text's advance and halo, each box's position and colours, the sky's band.
- `extract-assets.py` was rerun against the ROM, and its output compared with the committed files.
