# Elementerial source notes

Exact values extracted from the Elementerial theme source. These are the authoritative spec
for the mockups. File:line references point into the theme repo,
`github.com/mluizvitor/es-theme-elementerial` at commit `e710525` (2025-08-25).

Elementerial is a Batocera-flavoured EmulationStation theme (`formatVersion 7`). It uses
`subset`, `customView`, `menuIcons`, `batteryIndicator`, `controllerActivity`, `storyboard`
and `ifArch`, none of which exist in RetroPie ES or ES-DE.

## Global

Every coordinate is normalized 0-1: x against screen width, y against screen height. Font
sizes are normalized against screen **height** only. Each element has an `origin`, a
normalized anchor point *within the element* - `origin 0.5 0.5` with `pos 0.7 0.25` means
the element's centre sits at 70% across and 25% down.

The three devices mocked here map onto three of the theme's four aspect files, and the
theme's overlay PNGs for each are already the exact device resolution:

| Device | Resolution | Aspect file | Asset set |
| --- | --- | --- | --- |
| `rg35xx` | 640x480 | `settings/display/aspect/4-3.xml` | `assets/ratio43/` (640x480) |
| `rg-cubexx` | 720x720 | `settings/display/aspect/1-1.xml` | `assets/ratio11/` (720x720) |
| `rg351m` | 480x320 | `settings/display/aspect/3-2.xml` | `assets/ratio32/` (480x320) |
| `rg552` | 1920x1152 | `settings/display/aspect/5-3.xml` | `assets/ratio53/` (1920x1152) |

The 1:1 aspect has no `osd-bg.png` of its own and borrows the 4:3 one
(`aspect/1-1.xml:131`).

All eight views and every subset are reproduced; the static pages use each subset's default
(font size medium, status bar complete, background default, video off, grid image
screenshot, icons Square, box art cover, grid direction horizontal), and the interactive
build switches all of them.

### 5:3 differences

The 5:3 aspect is the only one that changes the shape of several views at once:

| | value |
| --- | --- |
| carousel | `size 1.2 1`, **`maxLogoCount 5`**, `logoPos 0.2 0.55` - 2304x1152 at left -192, pitch 460.8, logo 480x288 |
| `systemName` / `systemInfo` | `0.08333 0.325` / `0.08333 0.41` - (160, 374.4) and (160, 472.32) |
| lineSpacing | 1.6, or **1.575** with help prompts - row 76.85 px, still 10 list rows and 7 video rows |
| grid | **`autoLayout 4 2`**, margin `0.025 0.025`, tile padding 8, selector `grid-selector@3.svg` cs 10 - tiles 380x374.4 |
| boxes | **`autoLayout 3 2`**, margin `0.025 0.041667` - tiles 522.7x364.8 |
| elementflix | **`autoLayout 5 1`**, tile padding 4 - tiles 308.5x478.1 |
| `md_rating` | `0.62 0.83125`, size 0.075 |
| battery | `0.93 0.0125`, size 0.0625 = 72 px, **72x72 icons** |
| gridtile caption | `size 0.9 0.18` (all other aspects use 0.225) |

`ratio53/osd-bg.png` is 1920x1080 rather than 1920x1152 - a source mismatch, stretched to
fit like every other scrim.

## Colours (settings/colors/)

Five semantic tokens per scheme. Opacity is an appended 2-hex pair from the percent table in
`variables.xml:38-47` - `percent.90=E6`, `.80=CC`, `.70=B3`, `.60=99`, `.50=80`, `.40=66`,
`.30=4D`, `.20=33`, `.10=1A`, `.5=0D`.

| Token | Use |
| --- | --- |
| `bgColor` | page background, every scrim tint, menu background, carousel background (at 0 alpha) |
| `fgColor` | all body text, list primary and secondary, help text |
| `mainColor` | list selector bar, grid selected tile background, hotkey dot |
| `onMainColor` | text drawn on top of `mainColor` |
| `sectColor` | help icons, rating stars, menu small text and group headers |

### Dark schemes (`settings/colors/<name>/scheme-dark.xml`)

`fgColor` is `FFFFFF` for every dark scheme.

| Scheme | mainColor | onMainColor | bgColor | sectColor |
| --- | --- | --- | --- | --- |
| strawberry | `ED5353` | `FFEBEB` | `1D1616` | `ff8c82` |
| orange | `F37329` | `FFF2EB` | `1D1816` | `ffc27d` |
| banana | `F9C440` | `1D1B16` | `1D1B16` | `fff394` |
| lime | `68B723` | `191D16` | `191D16` | `d1ff82` |
| mint | `28BCA3` | `161D1C` | `161D1C` | `89ffdd` |
| blueberry | `3689E6` | `EBF5FF` | `16191D` | `8cd5ff` |
| grape | `A56DE2` | `F8EFFF` | `19161D` | `e4c6fa` |
| bubblegum | `DE3E80` | `FFEBF4` | `1D1619` | `fe9ab8` |
| cocoa | `8A715E` | `F7F3F0` | `1D1916` | `a3907c` |
| slate | `667885` | `F2F4F7` | `171A1C` | `95a3ab` |
| snes | `BF89F6` | `000000` | `2C2821` | `CCA0F8` |
| gb | `E06C7A` | `000000` | `242628` | `52BF40` |
| pikachu | `628FE9` | `000000` | `211D12` | `FF6678` |
| redBerries | `CC3D49` | `FFFFFF` | `16191D` | `D3A1F7` |

### Light schemes (`settings/colors/<name>/scheme-light.xml`)

| Scheme | fgColor | mainColor | onMainColor | bgColor | sectColor |
| --- | --- | --- | --- | --- | --- |
| strawberry | `1f2428` | `ED5353` | `FFEBEB` | `FFEBEB` | `a10705` |
| orange | `35261d` | `F37329` | `FFF2EB` | `FFF2EB` | `cc3b02` |
| banana | `352e1d` | `F9C440` | `1D1B16` | `FFFDEB` | `d48e15` |
| lime | `26311b` | `68B723` | `191D16` | `F3FFEB` | `3a9104` |
| mint | `1d3531` | `28BCA3` | `161D1C` | `EBFFFC` | `0e9a83` |
| blueberry | `121921` | `3689E6` | `EBF5FF` | `EBF5FF` | `0d52bf` |
| grape | `281d35` | `A56DE2` | `F8EFFF` | `F8EFFF` | `7239b3` |
| bubblegum | `311b24` | `DE3E80` | `FFEBF4` | `FFEBF4` | `bc245d` |
| cocoa | `362d26` | `8A715E` | `F7F3F0` | `F7F3F0` | `57392d` |
| slate | `1f2428` | `667885` | `F2F4F7` | `F2F4F7` | `485a6c` |
| snes | `291d35` | `8B4ACC` | `FFFFFF` | `E8DEC9` | `7332B3` |
| gb | `351d20` | `BD283A` | `FFFFFF` | `C8CCD0` | `1B5412` |
| pikachu | `1f2428` | `1A4DB2` | `FFFFFF` | `FBD051` | `BD283A` |
| redBerries | `351d1f` | `CC3D49` | `FFFFFF` | `EBF5FF` | `7239B3` |

The base palette is elementary OS - strawberry `#ED5353`, orange `#F37329`, banana
`#F9C440`, lime `#68B723`, mint `#28BCA3`, blueberry `#3689E6`, grape `#A56DE2`, bubblegum
`#DE3E80`, cocoa `#8A715E`, slate `#667885` (README.md:24, 60-73).

### Colour bindings (settings/colors/scheme.xml)

| Element | Colour | Line |
| --- | --- | --- |
| `helpsystem` text / icons | `${fgColor}` / `${sectColor}` | 12-13 |
| `background` | `${bgColor}` | 17 |
| `logoText`, `md_name` | `${fgColor}E6`, glow `${bgColor}1A` size 1 | 24-26 |
| `gamelist` selected / selector / primary | `${onMainColor}` / `${mainColor}` / `${fgColor}` | 30-33 |
| `md_rating` filled and unfilled | `${sectColor}` | 37-38 |
| `background_overlay` | `${bgColor}` | 42 |
| grid `gridtile` / `gridtile:selected` | `${fgColor}` / `${onMainColor}` | 96, 100 |
| boxes `gridtile` | `FFFFFF` on `000000CC` | 107-108 |
| carousel | `${bgColor}00` (fully transparent) | 130 |
| `systemName`, `systemInfo` | `${fgColor}E6`, glow `${bgColor}1A` size 1 | 134-142 |
| system `logoText` | `${fgColor}`, glow `${mainColor}1A` size 1 | 154-156 |
| `osdBackground` | `000000` | 163 |
| `clock`, `batteryIndicator` | `FFFFFF` | 170, 174 |
| `controllerActivity` idle / active / hotkey | `${fgColor}4D` / `${mainColor}B3` / `${mainColor}` | 178-180 |

Two colours are deliberately scheme-independent and must stay hardcoded in the mockup: the
boxes caption chip (`FFFFFF` on `000000CC`) and the status bar clock and battery (`FFFFFF`).

## Fonts (variables.xml:32-35)

| Alias | File |
| --- | --- |
| `fontRegular` | `assets/fonts/Inter/Inter-Regular.otf` |
| `fontBold` | `assets/fonts/Inter/Inter-Bold.otf` |
| `fontLight` | `assets/fonts/Inter/Inter-Light.otf` |
| `fontHelper` | `assets/fonts/RobotoCondensed/RobotoCondensed-Regular.ttf` |

Inter is used for everything on screen. Roboto Condensed is used only for the help bar
(`view-general.xml:12`).

### Font size tokens, medium (variables.xml:11-15)

Normalized to screen height, so the pixel value is `token * H`.

| Token | Norm | 640x480 | 720x720 | 480x320 |
| --- | --- | --- | --- | --- |
| H1 | 0.06 | 28.8 | 43.2 | 19.2 |
| H2 | 0.05 | 24.0 | 36.0 | 16.0 |
| H3 | 0.04375 | 21.0 | 31.5 | 14.0 |
| Body | 0.035 | 16.8 | 25.2 | 11.2 |
| Caption | 0.028125 | 13.5 | 20.25 | 9.0 |

Small is H1 0.05625 / H2 0.04375 / H3 0.0375 / Body 0.03 / Caption 0.028125; large is
0.06875 / 0.05625 / 0.046875 / 0.040625 / 0.03125 (variables.xml:18-29). The mockups use
medium.

Note a quirk: the `size` box of `logoText`, `systemName`, `systemInfo` and `md_name` is
hardcoded to the `-medium` token even when small or large is selected
(`view-general.xml:69`, `view-system.xml:32,43`, `view-grid/grid.xml:37,45`); only
`fontSize` swaps.

## Shared elements

`helpsystem` (`view-general.xml:11-15`) - Roboto Condensed, Body size, `origin 0 0.5`,
`pos 0.016666667 0.96`, text `${fgColor}`, glyphs `${sectColor}`.

| Device | x | y |
| --- | --- | --- |
| 640x480 | 10.7 | 460.8 |
| 720x720 | 12.0 | 691.2 |
| 480x320 | 8.0 | 307.2 |

`borderOverlay` (`view-general.xml:17-22`) - full screen, `zIndex 100`, per-aspect
`borders.png`. Black with alpha only in four ~8px anti-aliased rounded corner wedges; it
rounds the screen corners over everything else.

`osdBackground` (`view-system.xml:83-88`, `scheme.xml:163`) - full screen, `zIndex 100`,
tinted `000000`. Top-right scrim behind the clock and battery, max alpha 50%, gone by
y ≈ 0.18.

### Scrim alpha profiles

Every scrim PNG is `#FFFFFF` wherever alpha is above zero, so ES's `texel.rgb * color.rgb`
multiply reduces to "the tint colour at the texture's alpha". Masking a solid fill in CSS
produces mathematically identical pixels. `borders.png` is the exception: black at full
alpha in the corner wedges only.

Measured alpha down the centre column:

| Scrim | 640x480 | 720x720 | 480x320 |
| --- | --- | --- | --- |
| `carousel-background` | 0 to y107, 50% at y173, opaque y238 | 0 to y165, 50% y261, opaque y346 | 0 to y71, 50% y116, opaque y159 |
| `gamelist-basic` | 128 at y0, opaque y156 | 128 at y0, opaque y259 | 128 at y0, opaque y116 |
| `gamelist-video` | see below | see below | see below |
| `osd-bg` | 128 at (639,0), 0 by y95 | borrows the 640x480 asset | 128 at (479,0), 0 by y75 |
| `borders` | corner wedges only | corner wedges only | corner wedges only |

`assets/background.png` is a 4x4 white tile tinted `bgColor`, so it is reproduced as a plain
solid fill rather than an image.

`gamelist-video.png` is **not** a diagonal, despite looking like one at a glance. It is
opaque everywhere except a top-right window - the region `x > Xe and y < Ye` - with an
isotropic feather of uniform radius applied to both edges, which rounds the inner corner.
Tracing the 50% contour on the 640x480 asset gives a straight vertical edge at x=289 down
to y≈130, then a curve closing rightward by y≈197; that curve is the corner rounding.

| Device | 50% vertical edge | 50% horizontal edge | feather radius |
| --- | --- | --- | --- |
| 640x480 | x = 289 (0.452 W) | y = 199 (0.415 H) | ~55 px |
| 720x720 | x = 336 (0.467 W) | y = 288 (0.400 H) | ~95 px |
| 480x320 | x = 225 (0.469 W) | y = 120 (0.375 H) | ~55 px |

`carousel-background.png` and `gamelist-basic.png` are horizontally invariant and could be
written as CSS gradients faithfully. `gamelist-video.png` could not - its alpha behaves like
`max(fx, fy)`, whereas stacking two CSS gradients composites to `1-(1-a)(1-b)`, which
visibly over-darkens the feathered inner corner. Using every scrim as a mask keeps one
mechanism and stays exact.

### Status bar (`view-system.xml:92-108` plus aspect files)

`clock` - `origin 0 0.5`, right-aligned, Body size, `FFFFFF`.

| Device | pos | size | resolved x, y | right edge |
| --- | --- | --- | --- | --- |
| 640x480 | `0 0.041666667` | `0.7625 0` | 0, 20 | 488 |
| 720x720 | `-0.02 0.0375` | `0.84 0` | -14.4, 27 | 590.4 |
| 480x320 | `0 0.0375` | `0.775 0` | 0, 12 | 372 |

`batteryIndicator` - `FFFFFF`. `size` is a single value, the height normalized to screen
height, and it matches the icon set the aspect picks.

| Device | pos | size | resolved | icons |
| --- | --- | --- | --- | --- |
| 640x480 | `0.9 0.008333333` | 0.066667 | 576, 4, 32px | 32x32 |
| 720x720 | `0.86 0.0125` | 0.044444 | 619.2, 9, 32px | 32x32 |
| 480x320 | `0.9125 0.00625` | 0.075 | 438, 2, 24px | 24x24 |

`controllerActivity` - `origin 0 0`, `pos 0.016666 0.025`, `size 0.025`,
`itemSpacing 0.003`, `pin.svg`. Resolves to (10.7, 12) 12px on 640x480, (12, 18) 18px on
720x720, (8, 8) 8px on 480x320.

## System view (view-system.xml + aspect files)

Stack, bottom to top: `background` tiled `bgColor` at `zIndex -50`, `cover` artwork at
`-9`, `carouselVideo` at `-8`, `background_overlay` scrim at `-7`, carousel at `10`,
`systemName` and `systemInfo` at `15`, `osdBackground` and `borderOverlay` at `100`.

`cover` (`view-system.xml:70-78`) - `size 1 0`, `origin 0 0.5`, `pos 0 0.25`. A zero
component means "derive from the image's aspect ratio", so with the 1920x960 (2:1) source
screenshots the height is half the screen width.

| Device | height | vertical span |
| --- | --- | --- |
| 640x480 | 320 | -40 to 280 |
| 720x720 | 360 | 0 to 360 |
| 480x320 | 240 | -40 to 200 |

`carousel` (`view-system.xml:11-19`) - `origin 0.5 0`, `pos 0.5 0`, `logoSize 0.25 0.25`
(normalized to the screen), `logoScale 1.4` on the selected logo, `defaultTransition fade`,
`systemInfoDelay 300`.

| Device | size | box | left | maxLogoCount | logoPos | logo box | spacing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 640x480 | `1.1 1` | 704x480 | -32 | 4 | `0.15 0.6` | 160x120 | 176 |
| 720x720 | `1.2 1` | 864x720 | -72 | 4 | `0.2 0.6` | 180x180 | 216 |
| 480x320 | `1.1 1` | 528x320 | -24 | 4 | `0.15 0.55` | 120x80 | 132 |

`logoPos` is normalized within the carousel box, not the screen, and marks the **top-left**
of the selected logo's cell; the selected logo then scales by `logoScale` about that cell's
centre. Spacing is `carouselWidth / maxLogoCount`. Because the carousel is wider than the
screen the row bleeds off both edges, which is what produces the Android-TV look.

Two independent checks support the top-left reading over a centre reading. On 480x320 the
reference screenshot's selected card measures 168x112 spanning y 160-272, which is exactly a
120x80 cell at y 176 grown 1.4x about its centre. And it is the only reading under which
`systemInfo` does not collide with the logo row on any of the three aspects - a centre
reading puts the 4:3 unselected logo top at 228 against a `systemInfo` bottom of 237.6.

Resolved selected-cell top-lefts, in screen coordinates: (73.6, 288) on 640x480,
(100.8, 432) on 720x720, (55.2, 176) on 480x320.

`logoSize` is a *box*, and the logo SVGs are all 480x320 (3:2), so ES contain-fits into it.
The rendered logo is therefore 160x106.7 on 640x480, 180x120 on 720x720, and exactly 120x80
on 480x320.

`logoScale` is paint-only - it does not change the pitch, so the selected card overlaps both
neighbours by `(logoScale - 1) * logoSize.x / 2`: 32 px on 640x480, 36 px on 720x720, 24 px
on 480x320. It must be drawn above both, which in CSS means an explicit z-index rather than
relying on DOM order.

`systemName` (`view-system.xml:29-38`) - `${system.fullName}`, `origin 0 0`,
`size 0.866667 x H1`, Inter Bold, uppercase, left, `lineSpacing 1`.

`systemInfo` (`view-system.xml:41-49`) - the game count, `origin 0 0`,
`size 0.866667 x Body`, Inter Regular, uppercase, left.

| Device | systemName pos | px | systemInfo pos | px |
| --- | --- | --- | --- | --- |
| 640x480 | `0.08333 0.375` | 53.3, 180 | `0.08333 0.46` | 53.3, 220.8 |
| 720x720 | `0.08333 0.375` | 60, 270 | `0.08333 0.475` | 60, 342 |
| 480x320 | `0.08333 0.325` | 40, 104 | `0.08333 0.41` | 40, 131.2 |

## Gamelist views

Shared across basic, detailed, grid and video (`view-general.xml:26-63`): `background` solid
`bgColor` at `zIndex -10`, `cover_list` artwork at `-5`, `background_overlay` scrim at `-4`,
`logoText` and `gamelist` at `5`.

`cover_list` - `size 1 0`, `origin 0 0.5`, `pos 0 0.225`, `minSize 1 0.45`. `minSize` is
cover-fill, so the image is scaled to cover at least that box and cropped, which is CSS
`object-fit: cover`. With the 2:1 sources the natural height already exceeds the minimum on
all three devices, giving 320px (640x480), 360px (720x720) and 240px (480x320) centred on
0.225 of the height.

`logoText` and `gamelist` for basic, detailed and video (`view-general.xml:66-77`):

| Device | logoText pos | fontSize | gamelist top | horizontalMargin |
| --- | --- | --- | --- | --- |
| 640x480 | 21.3, 48 | 24.0 | 96 | 21.3 |
| 720x720 | 24, 72 | 36.0 | 144 | 24 |
| 480x320 | 16, 32 | 16.0 | 64 | 16 |

`logoText` is `origin 0 0.5`, so its `pos` y is the text's vertical centre.

### Row height

`lineSpacing` multiplies the **font's line height**, not the font size -
`rowHeight = Font::getHeight() * lineSpacing`. Read straight out of the bundled faces'
`head` and `hhea` tables:

| Font | unitsPerEm | ascender | descender | lineGap | line height |
| --- | --- | --- | --- | --- | --- |
| Inter Regular / Bold | 2816 | 2728 | -680 | 0 | 3408 = **1.2102 em** |
| Roboto Condensed Regular | 2048 | 1900 | -500 | 0 | 2400 = **1.1719 em** |

The mockups show the help bar, so the `ifHelpPrompts="true"` variants apply.

| Device | basic/detailed | video | row px (list) | rows | row px (video) | rows |
| --- | --- | --- | --- | --- | --- | --- |
| 640x480 | 1.68 | 1.42125 | 34.16 | 10 | 28.90 | 7 |
| 720x720 | 1.6 | 1.6 | 48.80 | 10 | 48.80 | 7 |
| 480x320 | 1.6 | 1.6 | 21.69 | 10 | 21.69 | 7 |

This is the reading the theme's own numbers confirm: it yields exactly 10 detailed rows and
7 video rows on all three devices, which is why 4:3 carries the otherwise inexplicable
`1.42125` video `lineSpacing`. Multiplying the font size instead gives 12-13 and 8-9 rows,
with no such agreement.

The selector bar is the full row height and spans x 0 to the textlist's `size.x`; it is
**not** inset by `horizontalMargin`. Only the text is inset.

Sources: `aspect/4-3.xml:24-37`, `aspect/1-1.xml:24-29`, `aspect/3-2.xml:24-29`.

### Detailed (view-general.xml:101-128)

`gamelist` is `size 0.466667 0.725` with help prompts - 298.7x348, 336x522 and 224x232. All
`md_*` metadata text and datetimes are `visible=false` (`view-general.xml:89-97`), so the
detailed view shows box art, marquee and rating only. The 1:1 aspect is the exception and
turns the description back on.

| Element | 640x480 | 720x720 | 480x320 |
| --- | --- | --- | --- |
| `md_marquee` centre, max | 469.3, 120; 256x84 | 528, 144; 288x126 | 352, 80; 192x56 |
| `md_image` centre, max | 469.3, 252; 298.7x264 | 528, 306; 336x288 | 352, 168; 224x176 |
| `md_image` roundCorners | 0.05 | 0.02 | 0.05 |
| `md_rating` pos, height | 388.8, 399; 32 | 439.2, 459; 36 | 292.8, 266; 24 |
| `md_description` | hidden | 360, 504; 336x153 | hidden |

`maxSize` is contain - scale to fit inside the box preserving aspect, CSS
`object-fit: contain`. `roundCorners` is normalized to the image's own width.
`md_rating` `size` is the star height; five stars are drawn, so the width is five times it.
The 1:1 `md_image` carries a leftover `backgroundColor ff0000` (`aspect/1-1.xml:51`) that
never shows because the art covers it; the mockup omits it.

### Video (view-general.xml:131-177)

`md_image` and `md_video` share `pos 0.7 0.25`, `origin 0.5 0.5`, `minSize 0.7 0.55` -
cover-fill. `md_video` has `delay 1` and `effect none`. The `gamelist-video.png` scrim sits
at `zIndex 4`, *above* the video, and its diagonal shape is what keeps the left-hand text
readable.

| Element | 640x480 | 720x720 | 480x320 |
| --- | --- | --- | --- |
| `md_marquee` centre, max | 128, 90; 213.3x156 | 144, 135; 240x234 | 96, 60; 160x104 |
| `md_image` / `md_video` centre, min | 448, 120; 448x264 | 504, 180; 504x396 | 336, 80; 336x176 |
| `logoText` pos | 21.3, 192 | 24, 288 | 16, 128 |
| `gamelist` top, size | 216; 640x228 | 324; 720x342 | 144; 480x152 |

`md_rating` is hidden in the video view.

### Grid (view-grid/grid.xml + aspect files)

`gamegrid` is `pos 0 0.2`, `size 1 0.725` with help prompts, `scrollDirection horizontal`,
`scrollLoop false`, `padding 0.066666667 0.025`, `autoLayout 3 2` on all three devices.

| Device | grid top | grid box | padding | margin | tile |
| --- | --- | --- | --- | --- | --- |
| 640x480 | 96 | 640x348 | 42.7, 12 | 21.3, 12 | 170.7x156 |
| 720x720 | 144 | 720x522 | 48, 18 | 24, 18 | 192x234 |
| 480x320 | 64 | 480x232 | 32, 8 | 16, 8 | 128x104 |

Tile size is `(box - 2*padding - (n-1)*margin) / n` per axis.

| Device | tile padding | image radius (norm / sel) | selector | cornerSize | caption size / padding / lineSpacing |
| --- | --- | --- | --- | --- | --- |
| 640x480 | 4, 4 | 0.04 / 0.025 | `grid-selector@2.svg` | 6 6 | `0.9 0.225` / `0.05 0` / 1.15 |
| 720x720 | 4, 4 | 0.03 / 0.02 | `grid-selector@2.svg` | 8 8 | `0.92 0.225` / `0.04 0` / 1.2 |
| 480x320 | 3, 3 | 0.03 / 0.02 | `grid-selector.svg` | 6 6 | `0.92 0.225` / `0.04 0` / 1.15 |

Header: `logoText` at `pos 0.033333 0.078125`, `origin 0 0.5`, H2; `md_name` at
`pos 0.033333 0.14375`, `origin 0 0.5`, Body, and unlike the other gamelist views it is
`visible true` (`grid.xml:48`).

| Device | logoText | md_name |
| --- | --- | --- |
| 640x480 | 21.3, 37.5 | 21.3, 69 |
| 720x720 | 24, 56.25 | 24, 103.5 |
| 480x320 | 16, 25 | 16, 46 |

The selected tile gets `backgroundCornerSize 0.05` and a `${mainColor}` background drawn
behind the art (`grid.xml:56-59`). The ninepatch is a plain white rounded rect, so in CSS it
is a rounded `background: var(--main)` box rather than a real ninepatch. A favourite heart
sits at the tile's top-left, `maxSize 0.25 0.25` of the tile (`grid.xml:61-66`).

### Boxes (view-boxes.xml + aspect files)

Inherits grid, then overrides: `size 1 0.725` with help prompts, `autoLayout 2 2`,
`autoLayoutSelectedZoom 1.075`, `imageSource image`, `selectionMode full`,
`imageSizeMode minSize`.

| Device | margin | tile | image radius (norm / sel) |
| --- | --- | --- | --- |
| 640x480 | 16, 16 | 269.3x154 | 0.025 / 0.01 |
| 720x720 | 24, 36 | 300x225 | 0.015 / 0.01 |
| 480x320 | 16, 16 | 200x100 | 0.025 / 0.025 |

Unselected tiles are tinted `aaaaaaFF` and selected ones `FFFFFFFF`
(`view-boxes.xml:26-27`), which reads as a dim on everything but the selection. The marquee
is centred on each tile at `maxSize 0.65 0.65`, growing to `0.8 0.8` when selected
(`view-boxes.xml:30-40`). The caption is `size 1 0.2` at `pos 0 0.7`, centred, Caption size,
`FFFFFF` on a `000000CC` chip.

`autoLayoutSelectedZoom` scales the selected tile about its own centre and is paint only -
it does not push its neighbours around.

### Basic (view-general.xml:80-85)

The detailed layout with `gamelist` widened to `size 1 0.8`, or `1 0.725` with help prompts,
and no `md_*` elements at all. Same header, same scrim, same row pitch.

### Elementflix (view-elementflix/flix.xml)

A customView inheriting `grid`, then overriding heavily:

| Element | Value |
| --- | --- |
| `gamegrid` | `pos 0 0.475`, `imageSource thumb`, `animateSelection false`, `autoLayoutSelectedZoom 1.075` |
| `md_marquee` | `pos 0.233333333 0.125`, origin `0.5 0.5`, `maxSize 0.4 0.225` |
| `md_image` | `pos 0.7 0.25`, origin `0.5 0.5`, `minSize 0.7 0.55`, zIndex -1 |
| `md_video` | same anchor, `minSize 0.6 0.5`, zIndex 0, `delay 1` |
| `md_description` | **visible**, `pos 0.033333333 0.25`, `size 0.433333333 0.15`, lineSpacing 1.1 |
| `logoText` | origin `0 0.5`, `pos 0.033333333 0.45`, H3 |
| `gridtile` caption | `size 1 0.2`, `pos 0 0.75`, centred, lineSpacing 1.2 |
| corners | `roundCorners 0` and `backgroundCornerSize 0` - square, unlike every other tile view |
| `gridtile.marquee` | `color 00000000` - hidden |
| `gridtile default` | `imageColor FFFFFFFF` - **not** dimmed, unlike boxes |
| caption colour | `${fgColor}CC` unselected, `${fgColor}` selected |
| selected tile background | **`FFFFFF` in dark, `${mainColor}` in light** |

That last row is the only place `settings/colors/dark.xml` and `light.xml` genuinely differ
for any view mocked here; everything else about the two styles is carried by the five token
values.

Two subsets reshape it further. **GridDirection**:

| | horizontal | vertical |
| --- | --- | --- |
| `size` (help prompts on) | `1 0.46` | `1 0.475` |
| `padding` | `0.065 0.0225` | `0.04 0.075` |
| `margin` | `0.016666667 0.025` | `0.016666667 0.025` |
| fades | `fade-hor.png`, `size 0.075 0.525`, origin `0.5 0.5`, at `0.0375 0.7375` and `0.9625 0.7375` rotated 180 | `fade-ver.png`, `size 1 0.075`, at `0 0.475` origin `0 0` and `0 0.95` origin `0 1` rotated 180 |

Both fades are tinted `${bgColor}`. **BoxArtStyle** picks the tile fit:

| Option | `selectionMode` | `imageSizeMode` | CSS |
| --- | --- | --- | --- |
| cover | full | minSize | `object-fit: cover` |
| fit | image | maxSize | `object-fit: contain` |
| stretch | image | size | `object-fit: fill` |

### Grid Game Image (view-grid/grid-*.xml)

| Option | `imageSource` | `selectionMode` | `imageSizeMode` |
| --- | --- | --- | --- |
| screenshot | `image` | full | minSize |
| thumbnail | `thumbnail` | full | minSize |
| marquee | `marquee` | full | maxSize |

### Default icons style

Each scheme ships a `ratio-square.xml` and a `ratio-steam.xml` selecting its no-artwork
tile: `assets/grid/<scheme>.png` (768x768) or `assets/grid-steam/<scheme>.png` (512x768),
plus the matching `folder.png`. The four `extra-*` schemes reuse another scheme's art -
snes uses grape, gb uses strawberry, pikachu uses blueberry, redBerries uses slate.

### Menu (view-menu.xml)

The theme supplies **only** fonts, colours, assets and icons - there is no geometry in the
file, because ES's `MenuComponent` owns the panel's position and size. Panel measurements in
these mockups are therefore an **approximation**; everything below is from the source.

- Fonts: `menutitle` Bold H2, `menutext` Regular Body, `menutextsmall` Light Caption,
  `menugroup` Regular Caption, `menufooter` Bold Caption.
- `menubg` uses `ratioNN/menu.png` (72x72, r≈15) tinted `${bgColor}`, over `shade.png` -
  a flat 60% black scrim across the whole screen.
- `menubutton` `button-normal.svg` / `button-hover.svg` cornerSize 8 8;
  `menuswitch` `switch-on.svg` / `switch-off.svg`.
- Colours (`scheme.xml:62-91`): text `${fgColor}` on a `${mainColor}` selector with
  `${onMainColor}` text, separators `${fgColor}0D`; `menugroup` `${sectColor}` on a
  `${sectColor}1A` band with a `${sectColor}99` separator; `menufooter` `${fgColor}CC`.
- Icons: System cog, Updates update, Controllers gamepad-round, Games gamepad-square,
  UI brush, Sound volume-high, Network wifi-strength-3, Scraper image, Advanced
  library-shelves, Quit exit-to-app, Retroachievements trophy, Kodi kodi, Restart restart,
  Shutdown and FastShutdown power.

### Status Bar and Background style

`statusbar/{complete,clock,battery,hidden}.xml` toggle `clock` and `batteryIndicator`
visibility; `hidden.xml` additionally hides `osdBackground`, the scrim that exists only to
back them.

`background/{default,random,custom}.xml` are multi-path images. ES resolves a multi-path
image to the **last** path that exists, which is why `default.xml` lists `{random:image}`
first and the system backdrop second - the backdrop wins - while `random.xml` reverses them.
`custom.xml` appends `customBackground/<system>.*` and a `blurred/` variant; neither folder
ships with the theme, so a fresh install falls back to the backdrop.

## Transitions

Declared by the theme:

| What | Value | Source |
| --- | --- | --- |
| Extras transition on system change | `defaultTransition fade` | `view-system.xml:14` |
| System info settle | `systemInfoDelay 300` ms | `view-system.xml:15` |
| System artwork fade in | opacity 0 to 1, 0 ms delay, 1000 ms, `easeOut` | `view-system.xml:75-77` |
| Selected logo scale | `logoScale 1.4` | `view-system.xml:17` |
| Grid and boxes selection zoom | `autoLayoutSelectedZoom 1.075` | `view-boxes.xml:17` |
| Gamelist video start | `delay 1` s, `effect none` | `view-general.xml:150,153` |
| Carousel video start | `delay 1.5` s, opacity fade 1000 ms | `background/carousel-video-on.xml` |

CSS translation: `easeOut` maps to `cubic-bezier(0, 0, 0.58, 1)`, ES's `effect none` means
no scale or bounce on appearance, only the opacity change.

### What `defaultTransition` actually controls

`<defaultTransition>fade</defaultTransition>` does **not** fade the carousel. Read from
`batocera-emulationstation`:

- `SystemView.cpp:1001` - `mExtraTransitionType = carousel->getDefaultTransition()`. The
  value governs the **extras** layer, meaning every `extra="true"` element: the background
  artwork and `systemName`.
- `SystemView.cpp:770-794`, the `"fade"` branch of `onCursorChanged`, runs one animation of
  `transitionSpeed` in which `mCamOffset` lerps start to end on `Math::easeOutQuint`, while
  `mExtrasFadeOpacity` lerps 1 to 0 and `mExtrasCamOffset` jumps straight to the target.

So the logo row **slides**, and the previous system's artwork and name fade out on top of
the incoming ones. Duration is `mTransitionSpeed`, which the theme does not set, so it is
`CarouselComponent.cpp:54`'s default of **500 ms**. One step moves the strip by one pitch:
176 px, 216 px and 132 px.

`CarouselComponent.cpp:502-506` makes the logo scale a continuous function of the fractional
camera distance, `clamp(1 + (logoScale-1)*(1-|d|), 1, logoScale) / logoScale`, so cards grow
and shrink smoothly as they cross the focus point rather than snapping.

`CarouselComponent.cpp:508-511` does the same for opacity, using `mMinLogoOpacity` - default
**0.5** (`CarouselComponent.cpp:55`), which the theme does not override. Unfocused logos sit
at 50% opacity and brighten to 100% as they reach focus.

`systemInfo` has no `extra` attribute, so it is not part of that cross-fade. ES animates it
separately (`SystemView.cpp:692-744`): fade out over ~150 ms, swap the text once it is fully
out, then fade in over 300 ms starting at `systemInfoDelay`.

Two layout facts confirmed from the same source rather than inferred:
`CarouselComponent.cpp:448` gives `logoSpacing = mSize.x / mMaxLogoCount`, and
`:460-461` plus `:824-825` put logo *i* at `logoPos.x + (i - camOffset) * pitch` with the
logo's centre offset by half `logoSize` - so `logoPos` is the top-left of the cell and the
scale pivots on its centre.

`grid` has no `autoLayoutSelectedZoom`; only `boxes` sets it (`view-boxes.xml:17`). Grid
selection is the `mainColor` ninepatch appearing behind the tile.

ES's `TextListComponent` has no scroll animation - the selector bar and the list offset both
snap. Do not add easing there.

CSS equivalents used: `Math::easeOutQuint` is `cubic-bezier(0.23, 1, 0.32, 1)`; the
storyboard `mode="easeOut"` (quadratic) is `cubic-bezier(0, 0, 0.58, 1)`.

Still **approximations** - not read from ES source, or mockup-only:

| Behaviour | Approximation | Origin |
| --- | --- | --- |
| Grid horizontal column scroll | 300 ms ease-out translate | ES `ImageGridComponent` |
| Grid and boxes selection settle | 250 ms ease-out | ES `animateSelection` |
| Textlist row scroll | instant, no easing | ES `TextListComponent` snaps |
| View enter and exit | 200 ms cross-fade | mockup only - ES has no runtime view switch |
| Game launch | black cover fade | mockup only |

## Input map and help bar

Elementerial is a theme, not firmware, so the button actions come from EmulationStation
itself. The help bar strings are not in the theme either - ES supplies them - so they are
transcribed verbatim from the reference screenshots, which is the only authority available.

System view (`main-strawberry-dark.png`):

```
[start] MENU   (A) NAVIGATION BAR   (Y) SEARCH/RANDOM   (X) NETPLAY
```

Gamelist views (`gamelist-mint-dark-detailed.png`, `boxes-snes-light.png`, identical):

```
[select] OPTIONS   [start] MENU   (A) BACK   (Y) SEARCH/RANDOM
```

`[start]` and `[select]` render as small pill pictograms rather than lettered circles; A, X
and Y render as filled circles carrying the letter. Circle fill is `${sectColor}`, confirmed
by the salmon glyphs in the strawberry shot and the mint glyphs in the mint shot, matching
`scheme.xml:13`.

| Button | System view | Gamelist views |
| --- | --- | --- |
| D-pad up/down | - | move selection |
| D-pad left/right | previous / next system | move selection in grid and boxes |
| A | navigation bar | back |
| B | enter the system's gamelist | launch the game |
| X | netplay | - |
| Y | search / random | search / random |
| Start | menu | menu |
| Select | - | options |
| L / R | - | page up / page down |

## Image sizing semantics

| Attribute | ES behaviour | Reproduction |
| --- | --- | --- |
| `size w h` | stretch to exactly w x h, aspect not preserved | fixed box |
| `maxSize w h` | contain: scale down to fit, then **the element's box shrinks to the fitted image**, so `origin` and `roundCorners` act on the artwork's own edges | `max-width` / `max-height` with `width: auto`, positioned by anchor with a `translate(-origin%)` - not a fixed box with `object-fit: contain`, which would letterbox and put the rounded corners on empty space |
| `minSize w h` | cover: scale up until both axes are covered, then crop centred | fixed box with `object-fit: cover` |
| a `0` component | derive that axis from the asset's aspect ratio | computed in the resolver |

`cover_list` (`view-general.xml:49-55`) declares both `size 1 0` and `minSize 1 0.45`. ES's
`ImageComponent::applyTheme` is an if/else-if chain ordered `size`, `maxSize`, `minSize`, so
`size` wins and the `minSize` is dead. It makes no visible difference here: the 2:1 source
art already exceeds the floor on all three devices.

## Deviations from source

- The README screenshots are version `1.230514` (May 2023) while the source is from
  2025-08-25, and the per-aspect layout files were only introduced in July 2025
  (`git log settings/display/aspect/3-2.xml`). The mockups follow the **source**, and use
  the screenshots to validate palette, typography, composition and help-bar strings only.
  Diffing the screenshot-era tag against HEAD, these specifically diverged and must not be
  calibrated against the images:
  - `cover_list` was `opacity 0.3`, `origin 0 0`, `pos 0 0` with no scrim at all; it is now
    full-opacity, centred on 0.225, with `gamelist-basic.png` over it. The gamelist
    backdrop in the screenshots is a materially different treatment.
  - The system `cover` anchor moved from `origin 0 0` / `pos 0 0` to `origin 0 0.5` /
    `pos 0 0.25`, lifting the art 40 px at 640x480.
  - `carouselVideo` moved from `zIndex 30` / `delay 1` to `zIndex -8` / `delay 1.5`.
  - Gamelist font sizes were much larger; the 480x320 shot shows a ~27 px row pitch against
    the current source's 21.69.
  - `forceUppercase` on the gamelist title postdates the shots, which show lowercase
    `retroachievements`. The mockups uppercase it, per `view-general.xml:29`.
  - `assets/ratio11` was added in July 2025, so **no reference screenshot of the 720x720
    layout exists at all**. That device is validated by arithmetic only.
- `glowSize 1` with a 10% glow colour renders as a 1px soft halo. CSS `text-shadow` with a
  1px blur is the closest equivalent and is what the mockups use.
- The ninepatch selectors are plain white rounded rectangles, so they are reproduced as CSS
  `border-radius` boxes rather than sliced ninepatches.
- Videos are not bundled with the theme (README.md:37). The video view shows the static
  screenshot in the video's slot, which is what ES does before the delay elapses.
- Only 10 of the theme's 151 system logos and 145 system screenshots are copied here.
