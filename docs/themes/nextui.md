# NextUI

Mockups of the NextUI theme in
[N64FlashcartMenu](https://github.com/Polprzewodnikowy/N64FlashcartMenu), the menu that boots on a
SummerCart64 or 64drive. It is inspired by [NextUI](https://nextui.loveretro.games/), the handheld
custom firmware, and adopts its palette format whole so palettes written for a NextUI device drop
straight in.

- Source repository: `github.com/Polprzewodnikowy/N64FlashcartMenu`
- The theme's own documentation, extracted:
  [`reference/theme-notes.md`](nextui/reference/theme-notes.md)
- What changed in the React port: [`porting/nextui.md`](../porting/nextui.md)

Implemented at `app/src/themes/nextui/`.

This is the only set in the repo that is not a handheld. It draws to a television at a fixed
640x480, which has two consequences worth stating up front: there is no resolve step, because there
is one device and one set of numbers; and there is no button cluster on the frame, because the
buttons are on a controller.

## Screens

The primary deliverable is an interactive route that walks all twenty-three views in any of the
eighteen palettes. Static captures are provided for handoff: one per view, plus five that pose
something a single palette cannot show.

| Group | Views |
| --- | --- |
| Browsing | File browser, Collections, Favorites |
| Settings | Settings, Menu Colors, Palettes, Color editor |
| Loading | Load ROM, Load 64DD disk, Load emulator |
| Information | File, N64, Flashcart, Menu Information, Date-Time Settings |
| Media | Music player, Image viewer, Text viewer, Extract file |
| Tools | Datel Code Editor, Controller Pak Manager, Controller Pak Dump, Note Dump |

Three of the menu's twenty-six views - error, fault and startup - never render this theme and are
absent.

## Geometry

The display is 640x480. The menu never draws into the overscan margin, so the visible area is
576x432 inset at 32,24, and `constants.h` derives everything else from those four numbers.

| Constant | Value | What it sets |
| --- | --- | --- |
| `NEXTUI_PILL_HEIGHT` | 40 | Row height, hint pill height, title slot |
| `NEXTUI_BUTTON_SIZE` | 28 | The circle behind a single-letter glyph |
| `NEXTUI_BUTTON_MARGIN` | 10 | Gap inside a hint pill, and list drop below a title |
| `NEXTUI_BUTTON_PADDING` | 24 | Text inset from the list edge; pill padding |
| `NEXTUI_ROW_COUNT` | 9 | Rows in the untitled file browser |
| `NEXTUI_ART_MAX_WIDTH/HEIGHT` | 288 | The box art slot, right-aligned and vertically centred |
| `NEXTUI_TITLE_MAX_WIDTH` | 326 | So a long title cannot run under the top hint group |

Two row pitches exist. Lists and settings rows are 40px; the Menu Colors hub tightens to 36 so all
nine of its rows fit without scrolling.

**The file browser draws no title.** Its first row starts at the very top of the visible area and
shares that line with the START/SETTINGS pill, which is why the top row alone gets a wider right
margin. Every other list drops one pill height plus a margin to clear its title.

## Theme / config format

Seven colours in a fixed order, in NextUI's own palette format. Built-in palettes are compiled in;
custom ones go in `sd:/menu/palettes/` as `.txt` files:

```text
version=1
name=My Palette
color1=0xFFFFFFFF
color2=0x9B2257FF
color3=0x1E2329FF
color4=0xFFFFFFFF
color5=0x000000FF
color6=0xFFFFFFFF
color7=0x000000FF
```

Colours are `0xRRGGBB` or `0xRRGGBBAA` with the alpha ignored. The seven are also stored
individually in `sd:/menu/config.ini` as `theme_color1` through `theme_color7`, so they can be
hand-edited. `title_pill=1` is an N64FlashcartMenu extension to the format, so a palette written
for a NextUI device cannot carry it - and none of the eighteen built-ins do.

## Palette

The seven slots, and what each one paints:

| Slot | Paints |
| --- | --- |
| Main Color | Selection pill, button circles, progress fills |
| Primary Accent | Chrome pills, the title pill, the folder placeholder tint |
| Secondary Accent | Button glyph letters |
| List Text | Unselected list text |
| List Text (Selected) | Text on the selection pill |
| Hint Text | Hint pill text, screen titles, load-screen icons |
| Background | Screen background when no image is set |

Eighteen palettes ship: `Default` (NextUI stock, a magenta `#9B2257` accent), `MinUI`, the four
Catppuccin variants, and twelve others. Three colours are *not* palette slots and stay literal
because the source keeps them literal: the neutral swatch frame `#606060`, the muted tint
`#A0A0A0`, and the Datel editor's green and red On/Off states.

## Fonts

BPreplay Bold, from `assets/fonts/` in the source repo, at four sizes. The menu loads one font file
per size rather than scaling one face, so the sizes below are the complete set:

| Size | Used for |
| --- | --- |
| 32 | Screen titles, and nothing else |
| 24 | Registered but not drawn by any view this theme touches |
| 20 | List rows, settings rows, hint labels, button glyphs, values |
| 16 | The load screen's ledger and byline, dense body text |

## Input map

| Input (key) | Action |
| --- | --- |
| D-pad up/down (arrows) | Move the selection; wraps at both ends |
| D-pad left/right | Page a list; on the load screen, cycle metadata images |
| A (Z) | Open, play, change a value, apply a palette |
| B (X) | Back, or cancel an edit |
| R (W) | Options; on Menu Colors, reset the colours |
| Z (Q) | Save, licenses, dump a note - per view |
| START (Enter) | Settings, from the browser and the list screens |
| C buttons | Fast-scroll a list; big steps in the colour editor |

The interactive route binds up and down, which is what the theme's own behaviour hangs on: the
selection pill resizes to each label, and the marquee starts and stops with the selection.

Mockup-only keys below the device: `[` `]` view, `,` `.` palette, `\` title pills, `'` background
image.

## Transitions

**The marquee is the only animation in the theme.** A label wider than its slot holds still for 45
frames, scrolls left 2 pixels per frame until its end is flush, holds 45 again, then snaps back and
repeats - no easing anywhere. Because the step is constant rather than the duration, two labels of
different lengths are genuinely out of step with each other, so the cycle is computed from the
overflow rather than shared.

Two things that look like transitions are not. The palette picker's live preview is a re-render:
the whole screen redraws in the highlighted palette as the cursor moves, background colour
included. The load screen's staged progress is I/O scheduling across the first frames, so the
screen appears instantly and the art lands a frame or two later.

## Assets

`assets/fonts/` holds BPreplay Bold and its licence; `assets/icons/` holds the eight ledger icons,
the cartridge placeholder and the folder glyph, all copied from the source repo. They are pure
white art tinted at draw time - the source modulates the texture by a primitive colour - which is
reproduced here as a CSS mask, the same operation.

The pill caps, the button circle and the panel corner are deliberately **not** copied: they are
half-round and quarter-round sprites the source blits because the RDP has no rounded-rectangle
primitive. A border radius says the same thing in one number.

Box art is generated, since the menu ships none - a real install scrapes it into a `.media` folder
beside the ROMs. The generated covers carry the deliberate horizontal banding a 16-bit framebuffer
produces, because that is the most recognisable thing about how this menu looks on hardware.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the theme root: palette, cursor, background and the three hint groups |
| `Interactive.tsx` | the live build's subsets |
| `routes.tsx` / `manifest.ts` | the 29 routes, and the screen list as plain data |
| `library.ts` | the twenty-three views, their hints, and every string the screens draw |
| `palette.ts` | the seven slots and the eighteen palettes |
| `layout.ts` | `constants.h`, and the two list-window algorithms |
| `text.ts` | text measurement, which this theme's geometry is made of |
| `marquee.ts` | the one animation, as timing data |
| `art.ts` / `assets.ts` | generated box art, and bundler-resolved asset paths |
| `views/parts.tsx` | pills, panels, text boxes, button glyphs, hint groups, titles |
| `views/Screens.tsx` | the twelve shapes the twenty-three views draw as |
| `nextui.css` | the font face, the primitives, and nothing that reflows |

## How it is checked

`nextui.test.tsx` covers the pure functions - both list windows, the marquee timing, the palette
format, the view table and the subset cycling - and renders every view and every palette. Every
screen was also rendered and compared against the four reference captures; that pass found two
faults, recorded in the porting notes.
