# Dreamcast BIOS

Mockups of the menu the Sega Dreamcast boots to with no disc in, boot ROM v1.01d, on its 640x480
video output. The main menu's four items over a sky the BIOS renders live; Play with no disc; the
memory card manager; the CD player; Settings and every box it opens; and the clock the BIOS asks
for when its battery has run down. Asked for in issue #14.

- Source: none - the BIOS is closed. Built from the boot ROM itself, which carries the menu's
  textures, its system font and its strings, and from a recording of the menu on a real console
- Everything measured, and where from: [`reference/source-notes.md`](dreamcast-bios/reference/source-notes.md)
- Where the reference material came from: [`reference/README.md`](dreamcast-bios/reference/README.md)
- What changed in the React port: [`porting/dreamcast-bios.md`](../porting/dreamcast-bios.md)

Implemented at `app/src/themes/dreamcast-bios/`. Mode: **reproduce** throughout.

## Screens

The primary deliverable is the interactive route, which opens on the main menu. 20 stills are
provided, each posed by pressing buttons from power-on.

| Screen | Stills |
| --- | --- |
| Main menu | `main`, `main-settings` |
| First boot | `boot-clock` |
| Play | `no-disc` |
| Settings | `settings`, `settings-language`, `settings-clock`, `settings-sound`, `settings-auto-start`, `settings-card-clock`, `settings-cards-set` |
| File | `file-cards`, `file-list`, `file-menu`, `file-all-menu`, `file-delete`, `file-deleted`, `file-destination` |
| Music | `music`, `music-repeat` |

The memory card in controller A holds the nine saves the recording shows, with its block counts;
the other seven sockets are empty. There is no disc in.

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

The 3D models on the main menu - the controller, the memory card, the note and the alarm clock -
are geometry in the ROM, not textures, and are redrawn.

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
| The focused model turns one way and the other | about 1200 ms | 36.0-36.65s |

The sky never stops: screens come and go over it. It is a shader, with the same function drawn on
the CPU at a quarter of the resolution as its fallback; a still draws it at t = 0.

## Colour

One look: the sky from pale cyan to deep blue, the light grey bar, white text with a dark halo,
green option blobs that blink yellow when focused, and each screen's dialogs rimmed in its colour -
magenta for Settings, orange for Play, green for File.

## Fonts

The BIOS system font, decoded from the ROM. Nothing stands in for it.

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

`bios/` and `fonts/` are decoded from the boot ROM; `drawn/` is drawn for the port. Provenance is in
`app/src/themes/dreamcast-bios/assets/SOURCE.md`.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the root: state, the clock that finishes a screen's fade, the sky, the screen and the dialog over it |
| `machine.ts` | the view stack and every button as a pure reducer |
| `layout.ts`, `palette.ts`, `motion.ts` | geometry, colours and durations, each with where it was measured |
| `library.ts`, `strings.ts`, `assets.ts` | the clock, the saves, the ROM's strings and asset lookup |
| `background/` | the sky: `sky.ts` holds the function in TypeScript and GLSL, `index.tsx` the render loop |
| `views/` | `Main`, `NoDisc`, `Settings`, `File`, `Music`, and `parts` |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | the stills and the live build |

No widget from the shared kit is used. The nearest are the list and dialog widgets, but the BIOS's
boxes place their options on blobs at measured positions, with a title that follows the focus; saying
that would mean widening a widget until it stopped saying anything else.

## How it is checked

- `dreamcast-bios.test.tsx` walks the machine through every screen's A and B, the grid, the clock
  editor, deleting a save and the whole card, and the transport's repeat; checks the string escapes
  and the Shift-JIS comments; and renders every still.
- The usual e2e suite captures each still, web and fallback, runs the compositing guard, and holds
  the live build, settled, to the `main` still.
- The stills were compared by eye, side by side with the frames in `reference/frames/`.
