# Elementerial

Mockups of **Elementerial**, an EmulationStation theme by mluizvitor, built from scratch
around Android TV's interface with Material Design principles and the elementary OS colour
palette. It is a Batocera-flavoured EmulationStation theme (`formatVersion 7`), the kind
shipped by AmberELEC, ArkOS, Knulli and RetroBat.

- Source repository: `github.com/mluizvitor/es-theme-elementerial` at commit `e710525`
- Detailed spec extracted from source: [`reference/source-notes.md`](elementerial/reference/source-notes.md)
- Reference screenshots from the theme's README: [`reference/`](elementerial/reference/)
- What changed in the React port: [`porting/elementerial.md`](../porting/elementerial.md)

Implemented at `app/src/themes/elementerial/`.

This is the first EmulationStation theme in the repo, so it also establishes how ES's
normalized-coordinate theming model maps onto this repo's native-pixel rule. That mapping
lives in `layout.ts` and is the only genuinely new machinery here.

## Screens

Every one of the theme's views is published on every device it supports: four devices x
(one interactive build carrying all eight views and every subset + eight static snapshots)
= 36 routes. A static route is the same component with `animate={false}`, so motion settles
to its resting values rather than playing - there is no second implementation to drift.

| Screen | Route (same slug under each device) |
| --- | --- |
| Interactive, all views and subsets | `#elementerial/<device>/interactive` |
| System carousel | `#elementerial/<device>/system` |
| Basic gamelist | `#elementerial/<device>/gamelist-basic` |
| Detailed gamelist | `#elementerial/<device>/gamelist-detailed` |
| Video gamelist | `#elementerial/<device>/gamelist-video` |
| Grid | `#elementerial/<device>/grid` |
| Boxes | `#elementerial/<device>/boxes` |
| Elementflix | `#elementerial/<device>/elementflix` |
| Menu | `#elementerial/<device>/menu` |

The slugs are the theme's own view names.

Each static screen carries its own scheme, style and system - the same ones the original
static pages booted with. Fourteen schemes in two styles is most of what this theme is, and
showing every screen in the same colours would hide it.

The four devices cover all four of the theme's aspect variants, and its overlay PNGs for
each are already the exact device resolution, so nothing is resampled:

| Device | Resolution | Aspect | Theme aspect file | Asset set |
| --- | --- | --- | --- | --- |
| `rg35xx` | 640x480 | 4:3 | `settings/display/aspect/4-3.xml` | `assets/ratio43/` |
| `rg-cubexx` | 720x720 | 1:1 | `settings/display/aspect/1-1.xml` | `assets/ratio11/` |
| `rg351m` | 480x320 | 3:2 | `settings/display/aspect/3-2.xml` | `assets/ratio32/` |
| `rg552` | 1920x1152 | 5:3 | `settings/display/aspect/5-3.xml` | `assets/ratio53/` |

Menu panel geometry is the one thing not transcribed from the theme: `view-menu.xml`
supplies fonts, colours, the panel background, the button and switch artwork and the icon
set, but the panel's position and size belong to EmulationStation's `MenuComponent`. Those
measurements are an approximation, flagged in `layout.ts` and in `views/MenuView.tsx`.

## Theme and config format

Elementerial is configured through EmulationStation **subsets** declared in `theme.xml` and
in the view files - user-selectable options surfaced under Theme Configuration. Every one is
reproduced and switchable from the chrome strip below the interactive build; the static
pages use each subset's default.

| Subset | Declared in | Options |
| --- | --- | --- |
| Color scheme | `theme.xml:12-27` | 14 schemes |
| Style | `settings/colors/<scheme>/main.xml` | dark, light |
| Font Size | `theme.xml:30-34` | small, medium, large |
| Screen ratio | `view-general.xml:180-189` | 4:3, 3:2, 5:3, 1:1 - one per device |
| Status Bar | `theme.xml:50-55` | clock+battery, clock, battery, hidden |
| Background style | `theme.xml:43-47` | default, random, custom |
| Video on carousel | `theme.xml:37-40` | disabled, enabled |
| Grid Game Image | `view-grid/grid.xml:10-14` | screenshot, thumbnail, marquee |
| Default icons style | `view-grid/grid.xml:17-20` | Square, Steam |
| Box art style | `view-elementflix/flix.xml:10-14` | cover, fit, stretch |
| Grid direction | `view-elementflix/flix.xml:17-20` | horizontal, vertical |

Two notes on how these resolve. **Background style** works by path precedence: ES takes the
last path in a multi-path image that actually exists, so `default` lands on the theme's
system backdrop and `random` on a random game screenshot. `custom` prefers a
`customBackground/` folder that no fresh install ships, so it falls back to the backdrop -
which is what the mockup reproduces rather than inventing a custom image.

**Grid Game Image** and **Box art style** both resolve to an ES `imageSizeMode`, which maps
directly onto a CSS `object-fit`: `minSize` is cover, `maxSize` is contain, `size` is fill.

Design tokens live in `variables.xml`; per-view layout in `settings/display/`; colour
bindings in `settings/colors/scheme.xml`; the 28 palettes in
`settings/colors/<scheme>/scheme-{dark,light}.xml`.

Two conventions matter when reading the source. Every coordinate is normalized 0-1 - x
against screen width, y against screen height, font sizes against height only - with an
`origin` anchor point inside the element. And opacity is expressed by appending a two-hex
alpha pair from a percent table, so `${fgColor}${percent.90}` means "foreground at 90%".

## Palette

Five semantic tokens per scheme. `bgColor` fills the page and tints every scrim; `fgColor`
is body text; `mainColor` is the list selector and the grid's selected tile; `onMainColor`
is text drawn on `mainColor`; `sectColor` is help icons and rating stars.

Dark schemes all use `FFFFFF` for `fgColor`.

| Scheme | main | onMain | bg | sect |
| --- | --- | --- | --- | --- |
| Strawberry | `ED5353` | `FFEBEB` | `1D1616` | `ff8c82` |
| Orange | `F37329` | `FFF2EB` | `1D1816` | `ffc27d` |
| Banana | `F9C440` | `1D1B16` | `1D1B16` | `fff394` |
| Lime | `68B723` | `191D16` | `191D16` | `d1ff82` |
| Mint | `28BCA3` | `161D1C` | `161D1C` | `89ffdd` |
| Blueberry | `3689E6` | `EBF5FF` | `16191D` | `8cd5ff` |
| Grape | `A56DE2` | `F8EFFF` | `19161D` | `e4c6fa` |
| Bubblegum | `DE3E80` | `FFEBF4` | `1D1619` | `fe9ab8` |
| Cocoa | `8A715E` | `F7F3F0` | `1D1916` | `a3907c` |
| Slate | `667885` | `F2F4F7` | `171A1C` | `95a3ab` |
| Snes Scheme | `BF89F6` | `000000` | `2C2821` | `CCA0F8` |
| Game Boy Scheme | `E06C7A` | `000000` | `242628` | `52BF40` |
| Pikachu Edition | `628FE9` | `000000` | `211D12` | `FF6678` |
| Red Berries | `CC3D49` | `FFFFFF` | `16191D` | `D3A1F7` |

Light schemes in the same order:

| Scheme | fg | main | onMain | bg | sect |
| --- | --- | --- | --- | --- | --- |
| Strawberry | `1f2428` | `ED5353` | `FFEBEB` | `FFEBEB` | `a10705` |
| Orange | `35261d` | `F37329` | `FFF2EB` | `FFF2EB` | `cc3b02` |
| Banana | `352e1d` | `F9C440` | `1D1B16` | `FFFDEB` | `d48e15` |
| Lime | `26311b` | `68B723` | `191D16` | `F3FFEB` | `3a9104` |
| Mint | `1d3531` | `28BCA3` | `161D1C` | `EBFFFC` | `0e9a83` |
| Blueberry | `121921` | `3689E6` | `EBF5FF` | `EBF5FF` | `0d52bf` |
| Grape | `281d35` | `A56DE2` | `F8EFFF` | `F8EFFF` | `7239b3` |
| Bubblegum | `311b24` | `DE3E80` | `FFEBF4` | `FFEBF4` | `bc245d` |
| Cocoa | `362d26` | `8A715E` | `F7F3F0` | `F7F3F0` | `57392d` |
| Slate | `1f2428` | `667885` | `F2F4F7` | `F2F4F7` | `485a6c` |
| Snes Scheme | `291d35` | `8B4ACC` | `FFFFFF` | `E8DEC9` | `7332B3` |
| Game Boy Scheme | `351d20` | `BD283A` | `FFFFFF` | `C8CCD0` | `1B5412` |
| Pikachu Edition | `1f2428` | `1A4DB2` | `FFFFFF` | `FBD051` | `BD283A` |
| Red Berries | `351d1f` | `CC3D49` | `FFFFFF` | `EBF5FF` | `7239B3` |

Two colours are deliberately scheme-independent in the source and stay hardcoded: the boxes
caption is white on `000000CC`, and the clock and battery are always `FFFFFF`.

Worth knowing when reading the source: `settings/colors/dark.xml` and `light.xml` differ
only in menu text-field artwork and an elementflix selected-tile colour, both out of scope
here. For the five views mocked, the entire visible difference between dark and light is the
five token values.

## Fonts

Inter for everything on screen, Roboto Condensed for the help bar only. Both are copied from
the theme's own `assets/fonts/`.

Sizes are normalized to screen height, so they differ per device. The medium set:

| Token | Normalized | 640x480 | 720x720 | 480x320 | 1920x1152 |
| --- | --- | --- | --- | --- | --- |
| H1 - system name | 0.06 | 28.8 | 43.2 | 19.2 | 69.12 |
| H2 - gamelist title | 0.05 | 24.0 | 36.0 | 16.0 | 57.6 |
| H3 - elementflix title | 0.04375 | 21.0 | 31.5 | 14.0 | 50.4 |
| Body - list rows, help bar, clock | 0.035 | 16.8 | 25.2 | 11.2 | 40.32 |
| Caption - tile captions, description | 0.028125 | 13.5 | 20.25 | 9.0 | 32.4 |

`lineSpacing` multiplies the **font's line height**, not the font size - Inter's is 1.2102 em
and Roboto Condensed's 1.1719 em, read from their `head` and `hhea` tables. That is the
reading the theme's own numbers confirm: it produces exactly 10 detailed rows and 7 video
rows on all three devices, which is why 4:3 carries the otherwise inexplicable `1.42125`
video `lineSpacing`.

## Input map

Elementerial is a theme, not firmware, so these come from EmulationStation. The help-bar
strings are ES's too and are transcribed from the reference screenshots.

| Input (key) | System view | Gamelist views |
| --- | --- | --- |
| D-pad up/down | previous / next system | move the cursor |
| D-pad left/right | previous / next system | page the list, step a grid column |
| A (`Z`) | navigation bar | back to the system view |
| B (`X`) | enter the gamelist | launch the game |
| X (`A`) | netplay | - |
| Y (`S`) | search / random | search / random |
| Start (`Enter`) | opens the menu | opens the menu |
| Select (`Right Shift`) | - | options |
| L / R (`Q` / `W`) | - | page up / page down |

Grid, boxes and elementflix lay out along their scroll axis, so a horizontal grid is
column-major (up/down walk a column, left/right step one) and elementflix set to vertical is
the transpose.

The on-screen buttons in the device frame dispatch the same actions.

The interactive build adds mockup-only keys, deliberately chosen outside that map so they
can never be mistaken for a device button: `[` `]` cycle the view, `,` `.` cycle the colour
scheme, `\` toggles dark/light, `-` `=` change the font size, `/` changes system and `'`
flips the grid direction. The same controls appear as a strip below the device frame. They
live in `Interactive.tsx` rather than in the theme, so a static screen and the live build
pass the theme exactly the same props. Elementerial's real switcher is EmulationStation's
Theme Configuration menu, which is out of scope, so none of this is drawn inside the screen.

## Assets

Copied verbatim from the theme: Inter and Roboto Condensed, the per-aspect scrim, border and
menu-panel overlays, the grid selector SVGs, the elementflix edge fades, star and favourite
icons, the battery and wifi glyphs, the fourteen menu icons plus the switch and button
artwork, both no-artwork placeholder sets (`grid/` square and `grid-steam/` 2:3), and ten
system logos and backdrops - `nes`, `snes`, `gb`, `gbc`, `gba`, `genesis`, `psx`, `n64`,
`arcade`, `dreamcast`. The other 141 logos and 135 backdrops are not copied.

The theme ships no per-game artwork and no videos, so game screenshots and marquees are
generated as SVG data URIs in `views.js`, drawn in the theme's own accent gradient. They
read the live scheme, so they re-tint with it. The thumbnail and marquee grid modes reuse
those stand-ins, since the mockup has only one class of generated art.

Everything the theme tints at runtime is drawn as a mask over a flat fill: the three
`bgColor` scrims per aspect, the elementflix edge fades, the menu icons and the rating stars.
The overlay PNGs are white wherever alpha is above zero and EmulationStation draws them as
`texel.rgb * color.rgb`, so masking a solid fill reproduces the exact pixels and re-tints for
free when the scheme changes. `borders.png` and `osd-bg.png` need no tint - the theme draws
them at `000000` and the PNGs are already black - so they are drawn as plain images.

The original had to inline all of those as base64, because Chrome treats every `file://` URL
as a unique origin and CORS-blocks `mask-image` across them. Served over HTTP the real files
work, so they are resolved like every other asset and the generated stylesheet is gone.

## Files

Under `app/src/themes/elementerial/`:

- `index.tsx` - the theme root: resolves the layout, owns the cursors, routes input, picks a view
- `Interactive.tsx` - the live build's subsets and the mockup-only keys that cycle them
- `layout.ts` - the normalized ES spec, per-aspect overrides, and the resolver that turns them into literal px
- `palette.ts` - the 14 schemes x dark/light, the alpha table, and the custom properties they emit
- `library.ts` - the sample systems and games, generated from the original's own data
- `art.ts` - the generated screenshot, marquee and star artwork, as SVG data URIs
- `assets.ts` - every asset lookup, resolved through Vite's glob import so a missing file is a build error
- `elementerial.css` - fonts, motion variables, and the decorative styling the widgets do not own
- `views/` - one module per view, plus `Chrome.tsx` for the hint bar, clock, status glyphs and overlays
- `manifest.ts` / `routes.tsx` - what screens exist, and how each is mounted

The widgets these views are built from live in `app/src/widgets/`; see
[the widget catalogue](../widgets/README.md).

## Conventions and gotchas

- The frame's own 8px screen radius is switched off in `elementerial.css` so `borders.png`
  is the sole corner authority, as it is in the real theme.
- `.el-root` overrides `.screen`'s `image-rendering: pixelated`. Elementerial is a smooth
  Material theme with gradient SVG logos and downscaled photographs; pixelating it would be
  actively wrong.
- `.el-root` also declares `isolation: isolate`, and that is load-bearing. The theme's own
  z-order runs from -9 to 100, mirroring the engine's, and the root paints an opaque
  `bgColor` fill. Without a stacking context every negative layer escapes to the nearest
  ancestor that has one and paints behind that fill, which hides the artwork and every scrim
  on every view while leaving all their geometry correct.
- The 1:1 aspect has no `osd-bg.png` of its own and borrows the 4:3 one, stretched
  (`aspect/1-1.xml:131`). That is reproduced rather than fixed.
- The 1:1 aspect is also the only one that re-lays-out the detailed view and turns
  `md_description` back on.
- The README screenshots are from May 2023 while the per-aspect layout files are from July
  2025. They disagree on gamelist row pitch, the gamelist backdrop treatment and the system
  cover anchor. These mockups follow the source;
  [`reference/source-notes.md`](elementerial/reference/source-notes.md) lists every divergence. No
  screenshot of the 720x720 layout exists at all, so that device is validated by arithmetic.
