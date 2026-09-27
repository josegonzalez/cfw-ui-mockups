# DS Style

Mockups of [DS Style](https://github.com/FrankieT19/rg-sp-ds-style), a Nintendo DS-inspired
launcher first made for the GBA and ported to the Anbernic RG SP's stock OS. It has a home screen of
a recent game, Games and Apps, then lists and carousels of systems and games. Everything is drawn
at the GBA's 240x160 and shown at exactly 3x, in an 8x12 bitmap font.

- Source: `FrankieT19/rg-sp-ds-style` at `2847683`, C writing the framebuffer directly
- Detailed spec extracted from it: [`reference/source-notes.md`](ds-style/reference/source-notes.md)
- Where the reference material came from: [`reference/README.md`](ds-style/reference/README.md)
- What changed in the React port: [`porting/ds-style.md`](../porting/ds-style.md)

Implemented at `app/src/themes/ds-style/`. Mode: **reproduce** throughout.

The launcher can render a frame headlessly, so every still here has a reference frame drawn by the
launcher itself, posed with the same button presses. `e2e/ds-style-reference.spec.ts` holds each
still to its frame pixel for pixel.

## Screens

The primary deliverable is the interactive route, which opens on Home at the source's defaults.
44 stills are provided, one per reference frame.

| Screen | Stills |
| --- | --- |
| Home, with the cursor on each target | `home`, `home-games`, `home-apps`, `home-settings`, `home-power` |
| Systems | `systems` |
| Games in each view | `games` (Horizontal), `games-vertical`, `games-list`, `games-list-art`, `games-marquee` |
| Favourites, Recents, Apps | `favourites`, `recents`, `apps` |
| Search | `search`, `search-results` |
| Popups | `launch-mode`, `confirm-shutdown`, `favourite-added`, `launching`, `volume`, `brightness` |
| Settings and its pages | `settings`, `settings-browsing`, `settings-artwork`, `settings-appearance`, `settings-startup`, `settings-sound`, `settings-system`, `settings-controls` |
| Binding and help | `settings-bind`, `setting-help`, `help`, `help-2` |
| About and Snake | `about`, `about-2`, `snake` |
| Appearance | `dark-home`, `dark-games`, `red`, `bright-green`, `purple`, `gba-art`, `lcd-grid` |

## Geometry

Every coordinate is the source's logical one on its 240x160 canvas. `layout.ts` multiplies by 3,
and the views draw at the RG SP's literal 720x480.

- **Flat UI** - backgrounds, bars, boxes and text - is exact at 3x.
- **Artwork** is sampled per physical pixel, as the source samples it. It is pre-scaled with the
  source's integer mapping for each size a slot can give it, so it is drawn 1:1
  (`docs/themes/ds-style/reference/extract-assets.py`).
- **Rounded corners and borders** are the source's stepped rows, as clip paths on logical pixel
  boundaries.

## Motion

| What | How |
| --- | --- |
| Home cursor | four corners glide 200ms on `smoothstep`, retargeting from where they are drawn |
| Selected title | holds 333ms, then scrolls at 30 logical px/s, repeating every name-plus-three-glyphs |

Nothing else moves. Both come to rest at their target and their start, so a still is the live
build with motion off.

## Colour

16 accent themes, from `original_layout.h:83-85`, each with its own title bar and folder and GBA
icons. There is also a dark mode that swaps the backgrounds and draws black text white. The accent
is the only colour a theme changes.

The **LCD grid** is a multiply of the source's 3x3 intensity cell over the whole screen. It is a
blend, so the fallback render leaves it off. **Pixel Transparency** is not reproduced; see the
porting notes.

## Fonts

DS Style's own 8x12 bitmap face (`assets/font.bin` plus `font-latin.bin`), rebuilt as a TTF with
one square contour per lit pixel. It is drawn at 36px, so one font pixel is three device pixels.
Every glyph advances six pixels while drawing eight, as the source's does.

## Input map

| Button | Home | Lists | Settings |
| --- | --- | --- | --- |
| D-pad | move between the six targets | move; in Horizontal Left/Right by one, Up/Down by ten | move |
| A | act on the target | open or launch | enter, or change |
| B | | back | back |
| X | nothing - the search handler takes it first | search | the row's help |
| Y | Favourites | favourite | |
| SELECT | swap Recents and Favourites for the card | next view | |
| L / R | flip the card's game | the Games, Apps, Settings cycle | the same cycle |
| START | | a system's launch mode | |
| L2 / R2 | Recents / Favourites | Recents / Favourites | Recents / Favourites |
| MENU | Settings | Settings | |

Every button can be rebound in Settings > Controls; the D-pad cannot. The harness gives L2 and R2
the keys `1` and `2`, which is what the source's own desktop preview uses.

## Assets

Prepared from the source's `assets/` by `extract-assets.py`: PNGs with the launcher's hard alpha
edge, and the black colour key already removed from the 16x14 icons. The script also builds the
pre-scaled art and the font, and generates `strings.ts` from `locale.json`. Licences and credits
are in `assets/licenses/`.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the root: state, the source's clocks, and `draw()`'s order |
| `machine.ts` | `action_impl` and `extra_action` as a pure reducer, in their dispatch order |
| `layout.ts`, `palette.ts` | the 3x scale, the accents and fixed colours |
| `text.ts`, `strings.ts` | the title rules, the glyph set and eight languages |
| `library.ts`, `assets.ts` | sample library and asset lookup |
| `views/` | `parts` (the primitives), `Chrome` (title bar and Home), `Browser`, `Settings`, `Overlays` |
| `manifest.ts`, `routes.tsx`, `Interactive.tsx` | the stills and the live build |

No widget from the shared kit is used. The source draws with six primitives - `dot`, `rect`,
`border`, `blit`, `icon` and `text` - and the parity check holds every still to the pixel. A kit
list or carousel would have to be bent until it drew exactly this, and it would stop saying what
it says.

## How it is checked

- `ds-style.test.tsx` holds the manifest and library to the reference renderer's tables. It also
  checks the title rules, the dispatch-order quirks, binding and Snake, and renders every still.
- `ds-style-reference.spec.ts` compares every still with the launcher's own frame, and proves the
  comparison can fail.
- The usual e2e suite captures each still, web and fallback, checks the compositing guard, and
  compares the live build settled with the `home` still.
