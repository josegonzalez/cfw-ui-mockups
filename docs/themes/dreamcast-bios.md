# Dreamcast BIOS

Mockups of the menu the Sega Dreamcast boots to with no disc in, boot ROM v1.01d, on its 640x480
video output. Power-on; the main menu's four items over a sky the BIOS renders live; Play with no
disc; the memory card manager; the CD player; Settings and every box it opens; and the clock the
BIOS asks for when its battery has run down - with the BIOS's own sounds. Asked for in issue #14.

- Source: none - the BIOS is closed. Built from the boot ROM itself, which carries the menu's
  textures, its system font, its strings and its sounds, and from a recording of the menu on a real
  console
- Everything measured, and where from: [`reference/source-notes.md`](dreamcast-bios/reference/source-notes.md)
- Where the reference material came from: [`reference/README.md`](dreamcast-bios/reference/README.md)
- What changed in the React port: [`porting/dreamcast-bios.md`](../porting/dreamcast-bios.md)

Implemented at `app/src/themes/dreamcast-bios/`. Mode: **reproduce** throughout.

## Screens

The primary deliverable is the interactive route, which opens on the main menu; start it from
Power-on to hear the boot sound. 23 stills are provided, each posed by pressing buttons from
power-on, two of them with an audio CD in the drive.

| Screen | Stills |
| --- | --- |
| Main menu | `main`, `main-settings` |
| Power-on | `boot`, `boot-clock` |
| Play | `no-disc` |
| Settings | `settings`, `settings-language`, `settings-clock`, `settings-sound`, `settings-auto-start`, `settings-card-clock`, `settings-cards-set` |
| File | `file-cards`, `file-list`, `file-menu`, `file-all-menu`, `file-delete`, `file-deleted`, `file-destination` |
| Music | `music`, `music-repeat`, `music-disc`, `music-disc-playing` |

The memory card in controller A holds the nine saves the recording shows, with its block counts;
the other seven sockets are empty. There is no disc in, except in Music's two disc stills, which have
an eight-track audio CD in the drive.

## What comes from the boot ROM

[`extract-assets.py`](dreamcast-bios/reference/extract-assets.py) reads a `dc_boot.bin` the
user supplies, refuses any ROM whose hash it does not know, and writes:

- **The textures.** The ROM stores the menu's textures as PowerVR `PVRT` chunks from `0x0728c0`:
  the top bar's logo, BACK, the CD player's transport icons and its TIME and TRACK labels, two disc
  faces, and a cloud tile - 18 in all, in three data formats (twiddled, VQ and rectangle).
- **The system font.** 12x24 and 24x24 1bpp glyphs from `0x100020`, in the layout KallistiOS's
  `dc/biosfont.h` documents, with the Dreamcast's own icons - the A, B, X and Y buttons the strings
  name. The menu draws its one-pixel strokes emboldened in white over a dark halo, so the script
  rebuilds the font as two faces, the bold glyph and its halo, and the port stacks them.
- **The strings.** The English string table, from `0x323b8`, into
  [`strings-en.txt`](dreamcast-bios/reference/strings-en.txt). Every word on every screen is one
  of these, byte for byte, escapes and all.
- **The sounds.** A package from `0x1a0000` holds the boot sound as a stereo stream of the sound
  chip's 4-bit ADPCM, decoded as it is, and the menu's seven effects as note sequences over a bank
  of tiny looped tones, which [`bios_sound.py`](dreamcast-bios/reference/bios_sound.py) renders
  through a small model of the chip - its envelopes, filter and pan, without its reverb.

- **The models.** The main menu's controller, memory card, note and alarm clock are Sega Ninja
  chunk models in the ROM, mapped as the BIOS runs at `0x8c000000` plus their offset: vertices with
  normals, triangle strips, materials with colour and alpha, and a tree of transformed parts.
  [`bios_models.py`](dreamcast-bios/reference/bios_models.py) finds them through the BIOS's own
  object table at `0x6f3c0`, flattens each into one mesh, and pairs each with the 60-frame motion it
  plays while focused - the controller and clock rock, the memory card turns, the note bobs.
  File's controller, memory card and empty-socket silhouette, and Settings' four row icons, are the
  ROM's models too; the BIOS places those in code, so the port fits each to its measured box. So is
  the CD player's disc: a label quad whose texture's alpha rounds it, an edge, a hub, and a back
  environment-mapped with the ROM's iridescent texture, so the data side shimmers as it turns.

## Geometry

The BIOS draws edge to edge: its sky and top bar reach every edge of the 640x480 frame, so the port
lays out 1:1 in it with nothing inset. Every box is measured from the reference frames.

- **The top bar**: 62 pixels of light grey, the ROM's logo at (30, 29), the clock right-aligned to 612.
- **The main menu**: a model for each item, each with a 114x42 pill below and to its right.
- **Settings**: four 52-pixel rows at y 54, 130, 209 and 286, a slate bar holding the icon and the
  name, right-aligned to 224, and a lilac value field from x 258; the memory-card clock's field sits
  under the fourth.
- **Text**: the font is monospaced on a 12-pixel cell, but the menu squeezes its glyphs to a width
  that depends on where the text is - 12 pixels for a dialog's date, 11 for labels, about 10 for a
  dialog's message. Each is measured from a whole string's span.

## Motion

| Motion | Duration | Where measured |
| --- | --- | --- |
| A screen's contents fade out, over the sky | 100 ms | 36.65-36.75s |
| Only the sky | 150 ms | 36.75-36.9s |
| The next screen fades up | 100 ms | 36.9-37.0s |
| A focused option's blob: yellow, then green | 200 ms each | 37.05-37.85s |
| The focused model's own motion from the ROM, round and round | 60 frames at 60 Hz: 1 s | 34-36s, a cycle a second |
| Power-on: the wordmark written in, then the swirl drawn, then held | 1.5-4s, 4.8-6s, to 9s | 0-9s |
| A stopped disc turns about its upright axis | a turn every 3.2 s | 261-262.7s |
| Playing, it lies back 67 degrees and spins in its own plane | a turn a second | 266-270s |
| It tips over between the two | 0.6 s | 262.8-263.4s |

The sky never stops: screens come and go over it. It is a shader, with the same function drawn on
the CPU at a quarter of the resolution as its fallback; a still draws it at t = 0. The main menu's
models are the same kind of thing - a WebGL scene with a CPU rasteriser of the same scene as its
fallback (`models/`) - and a still draws them at rest, which is frame 0 of every motion.

The models are drawn orthographically, at 11.6 pixels a unit centred on world (0, 1), where the
ROM's own transforms put them over the capture's; lit mostly ambient; and at 0.65 of their
materials' alpha, which the capture's colours against the sky give.

## Colour

One look: the sky from pale cyan to deep blue, the light grey bar, white text with a dark halo,
green option blobs that blink yellow when focused, and each screen's dialogs rimmed in its colour -
magenta for Settings, orange for Play, green for File.

## Fonts

The BIOS system font, decoded from the ROM. Nothing stands in for it.

## Sound

Each press makes the sound the recording's own audio track has it make; a press that changes
nothing is silent.

| Sound | When | Heard at |
| --- | --- | --- |
| `cursor` | the D-pad, and every step of the clock editor | 34.41s, 13.8-28.9s |
| `confirm` | A opening, choosing or dismissing | 36.65s, 40.32s, 56.17s |
| `back` | B, or A on BACK | 52.71s, 141.83s |
| `alert` | a warning box opening: no disc, after Play's confirm; Delete's confirmation | 36.88s, 131.52s |
| `card-clock` | the memory-card clock box opening | 93.45s |
| `boot` | power-on, 0.47s in | 0.47s |

The ROM's two other sequences, `error` and `sequence-4`, are never heard in the recording, so
nothing plays them. Only the live build makes sound; the panel's Sound switch, or `?sound=off`,
mutes it.

## Input map

The Dreamcast pad's buttons are the handheld's: A, B, X, Y, Start and the D-pad, with the analog
triggers as L and R.

| Button | Main menu | Everywhere else |
| --- | --- | --- |
| D-pad | move in the 2x2 grid | move the focus; in the clock editor, left and right pick a field and up and down change it |
| A | open the item | press the focused option, field or button |
| B | | back: close the box, or return to the screen before |
| X / Y | | in the file list, pick saves of one game to act on together |

BACK, drawn on the screens that have one, does what B does.

## Assets

`bios/`, `fonts/`, `sounds/` and `models/` are decoded from the boot ROM; `drawn/` is drawn for the port. Provenance is in
`app/src/themes/dreamcast-bios/assets/SOURCE.md`.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the root: state, the clock that finishes a screen's fade, the sky, the screen and the dialog over it |
| `machine.ts` | the view stack and every button as a pure reducer, and the sound each press makes |
| `layout.ts`, `palette.ts`, `motion.ts` | geometry, colours and durations, each with where it was measured |
| `library.ts`, `strings.ts`, `assets.ts` | the clock, the saves, the ROM's strings and asset lookup |
| `background/` | the sky: `sky.ts` holds the function in TypeScript and GLSL, `index.tsx` the render loop |
| `models/` | the ROM's models: `scene.ts` the projection, transforms, light and motion sampling; `gl.ts` the shader; `raster.ts` the CPU fallback; `MenuModels.tsx` the render loop; `Disc.tsx` the CD player's disc |
| `views/` | `Boot`, `Main`, `NoDisc`, `Settings`, `File`, `Music`, and `parts` |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | the stills and the live build |

No widget from the shared kit is used. The nearest are the list and dialog widgets, but the BIOS's
boxes place their options on blobs at measured positions, with a title that follows the focus; saying
that would mean widening a widget until it stopped saying anything else.

## How it is checked

- `dreamcast-bios.test.tsx` walks the machine through power-on and every screen's A and B, the
  grid, the clock editor, deleting a save and the whole card, and the transport's repeat; checks the
  sound each press makes, the string escapes and the Shift-JIS comments; and renders every still.
- The usual e2e suite captures each still, web and fallback, runs the compositing guard, and holds
  the live build, settled, to the `main` still.
- The stills were compared by eye, side by side with the frames in `reference/frames/`.
