# SimpleOS

Mockups of [SimpleOS](https://github.com/boorngos/SimpleOS), an overlay on Anbernic's own Linux
that turns the RG DS into a DS-only machine: a grid of games on the bottom panel, the highlighted
title on the top, and a menu inside DraStic that saves, loads and switches between games.

- Source: the release zip, `VERSION` `20260915`, and the release trailer
  (`youtube.com/watch?v=VN8mWzVBWzw`)
- Detailed spec extracted from both: [`reference/source-notes.md`](simpleos/reference/source-notes.md)
- What changed in the React port: [`porting/simpleos.md`](../porting/simpleos.md)

Implemented at `app/src/themes/simpleos/`.

**The first set drawn across two panels**, and the first ported without source: SimpleOS ships as a
compiled program. Its strings, its symbol table and its own 8x8 font were recovered from the
binary; layout and colour were measured off the trailer. The RG DS is a new device for it - see
[`devices.md`](../devices.md).

Mode: **reproduce** for everything the trailer shows, **design-new** for the top panel of the
screens it does not.

## Screens

The primary deliverable is the interactive route, which opens on the boot splash and is driven
from there. Twenty stills are provided for handoff.

| Screen | Top panel | Bottom panel | Trailer |
| --- | --- | --- | --- |
| Boot | the logo splash | the warning splash | yes |
| Home | the highlighted title: icon, name, legend, date | the 3x2 grid, paged | yes |
| Archive | title and legend | archived titles | no |
| Options, Network, Update, Game settings, Power, This game, Controls, Video | title, description, legend | a settings list | RetroAchievements only |
| RetroAchievements | title and legend | its list | yes |
| Clock | the draft date and time | the five fields | no |
| In game | the game | the game | yes |
| Quick menu | the game, with its title and `<  >` | the menu over the game | yes |
| Game switcher | another title and `<  >` | `LOAD / ARCHIVE / HOME` | yes |
| Unlock | the RetroAchievements banner over the game | the game | yes |

## Geometry

Two 640x480 panels, drawn through `Panels`. SimpleOS targets one device at one size, so every
number in `layout.ts` is a literal pixel, measured off the trailer and snapped to the font's 8px
cell where it is text.

| Constant | Value | What it sets |
| --- | --- | --- |
| `TOP.header` | 640x38 | the `SIMPLE OS` title bar |
| `TOP.card` | 35,60 570x393 | the white card on the top panel |
| `TOP.titleChars` | 33 | the hard cut on the highlighted title |
| `GRID_METRICS` | 3x2, 180x165 tiles, 192x189 pitch | the home grid |
| `TILE.captionChars` | 20 | the hard cut on a tile's caption |
| `LIST` | 592x46 rows, 53px pitch | every settings list |
| `MENU` | 56px pitch, 50px cursor box | the in-game menu |
| `TOAST` | 44,11 550x84 | the unlock banner |

## Motion

None. The trailer, checked at 30fps, moves every cursor, flips every page and opens and closes
every menu on a single frame, and the binary has no easing or timeline code. `animate={false}`
therefore changes nothing, and the settle invariant holds trivially. The binary does have a text
marquee (`Draw_textMarquee`), which the trailer never shows running; see the porting notes.

## Colour

One fixed look, compiled into the binary rather than read from a palette file. Every value in
`palette.ts` is sampled from the trailer or read off the splash bitmaps.

| Token | Value | Used for |
| --- | --- | --- |
| `header` | `#2e6cc9` | the title bar |
| `topBgFrom` / `topBgTo` | `#e6faff` / `#fffff9` | the top panel's wash |
| `gridBgFrom` / `gridBgTo` | `#e4f9ff` / `#fffff5` | the grid's wash |
| `tileSelected` / `tileSelectedBorder` | `#ffffc2` / `#f2cd52` | the cursor tile |
| `rowSelected` | `#ffffc5` | the cursor row |
| `text` / `legend` / `accent` | `#1f2529` / `#6f7882` / `#2e62b8` | text, legends, the date and titles |
| `toastHead` / `toastIcon` | `#306ecd` / `#227ef2` | the unlock banner |

## Fonts

One: `SimpleOS 8x8`, the binary's own `FONT8X8` table rebuilt as a TrueType face
(`assets/fonts/SimpleOS8x8.ttf`), drawn at 8, 16 and 24px - SimpleOS's 1x, 2x and 3x. Text is
positioned by character count, not by CSS centring: the face is fixed-width with a one-em advance,
so a string's width is its length times its size.

## Input map

| Button | Home | Lists | Clock | In game | Quick menu |
| --- | --- | --- | --- | --- | --- |
| D-pad | move, row-major across pages | up/down move, wrapping; left/right cycle a shader | left/right field, up/down value | the game's | up/down move; left/right change title |
| A | play | per the legend | save | the game's | confirm |
| B | - | back | cancel | the game's | resume |
| X | archive | add an input on Controls | - | the game's | - |
| START | options | - | - | the game's | - |
| SELECT | clock | - | - | the game's | - |
| MENU | game config | - | - | open the menu | resume |

The boot splash continues on a tap of the bottom panel, as on the device, and on A or START.

## Assets

| Asset | From |
| --- | --- |
| `assets/splash/logo.png`, `logo2.png` | `simpleos/system/splash/logo.bmp`, `logo2.bmp`, converted to PNG |
| `assets/fonts/SimpleOS8x8.ttf` | the binary's `FONT8X8`, rebuilt |

Game icons and game screens are generated stand-ins. The real icons are the games' own banner art.

## Files

```
app/src/themes/simpleos/
  machine.ts     the whole of SimpleOS's behaviour, as a pure reducer
  library.ts     the sample library and the binary's strings
  layout.ts      literal pixels, measured
  palette.ts     sampled colours
  index.tsx      the root: holds the state, draws the view
  Interactive.tsx  the live build's panel: starting screen and the unlock banner
  views/         Boot, Home, Settings, ClockView, InGame, and their shared parts
```

## How it is checked

- `simpleos.test.tsx` drives the reducer through every button each legend names, and renders every
  still to check both panels draw.
- The e2e gates run on every still. The compositing guard checks each panel as its own surface.
- Stills are compared against the frames in `reference/`.
