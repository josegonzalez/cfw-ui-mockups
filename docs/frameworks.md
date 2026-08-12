# Framework registry

Candidate frameworks for implementing the mockups in this repo for real, and what each one
would have to gain first. This file plays the same role for implementation targets that
[`devices.md`](devices.md) plays for hardware.

Assessed on UI capability only. Each framework's device and CFW binding is recorded under
"What each is" as a porting concern, not weighted as a blocker. One entry is a firmware rather
than a toolkit; that is recorded there too, and it is compared on the UI layer its paks link
against.

Two skills keep this current: `/assess-launcher <cfw-slug>` when a mockup set is added, and
`/assess-framework <repo>` when a candidate framework is added.

## Verdict

**The blocker is the wrappers, not the platform.**

[NextUI](https://github.com/LoveRetro/NextUI)'s own UI layer is caller-driven immediate-mode
blitting: `GFX_startFrame()`, a sequence of `GFX_blit*` calls into an `SDL_Surface*` you own, then
`GFX_flip(screen)` (`workspace/all/common/api.h:338-339`, driven that way by its own launcher at
`workspace/all/nextui/nextui.c:2327-2328, 3275`). Composing a carousel, a grid and a status bar on
one screen is what NextUI does every frame. It also carries three things the settled requirement
list asks for and its wrappers lack: **five fixed compositing layers** with absolute indices no
container re-bases (`api.h:671-672`), **public tint and alpha** (`api.c:1699-1742`), and **four
image fit modes** (`api.h:378-384`).

[Apostrophe](https://github.com/Helaas/Apostrophe) and
[gabagool](https://github.com/BrandonKowalski/gabagool) wrap that in a blocking, full-screen modal
model: every widget runs its own event loop and returns a result struct when the user completes an
action or presses back. Apostrophe's README states the model outright (`README.md:154`); gabagool's
`router` runs screens to completion in sequence (`pkg/gabagool/router/router.go:76-99`). The
consequence is that neither can compose two widgets onto one screen - whichever one you call owns
the frame until it returns - and reaching past the widget layer to the drawing primitives means
using roughly a third of either library and writing the rest. **That is their design choice, not an
inherited limit.**

Apostrophe describes itself as a C port whose structure was directly informed by gabagool's
framework design (`README.md:7`), and ships a migration guide for moving between them
(`docs/PORTING_FROM_GABAGOOL.md`). The two share that model, the six-fixed-font-tier text
layer, the small flat colour theme, and the absence of a grid, a carousel, an animation
system and video. They are close to one assessment rather than two.

**What fails on all three is motion.** NextUI's animation is a blocking playback loop -
`for (frame = 0; frame <= total_frames; ++frame) { ...; PLAT_GPU_Flip(); }`, interpolating x, y and
opacity linearly (`workspace/all/common/generic_video.c:1213-1241`). There is no timeline, no
easing (`ease*`, `bezier` and `tween` are zero-hit across 51,197 lines), no way to compose
independent channels on one element, and **no way to evaluate a track at t=0** - the only route to
a resting value is to play the animation to its end. Every screen in this repo exists in a settled
form, so that last point alone rules out drawing a still.

One naming collision to hold in mind: **NextUI is both a framework in this registry and a mockup
set in this repo** - the firmware, and the N64FlashcartMenu theme that reproduces its look. Below,
an unqualified "NextUI" is the framework; the set is named "the NextUI set" or reached through
[its own gap section](#nextui-1).

That set is the closest fit of the five, against all three entries: its browser is a list, a
right-hand art panel and a footer, and every theme struct here matches its seven palette slots
because they all descend from the same seven.

## What each is

**NextUI is not the same kind of thing as the other two.** It is a firmware, and its UI layer is
the library its paks link against; Apostrophe and gabagool are toolkits you build a pak *with*.
They are compared here on UI capability because that layer is what a port would sit on.

| | NextUI | Apostrophe | gabagool |
| --- | --- | --- | --- |
| Self-description | "A CFW based of MinUI with a rebuild emulation engine and tons of added features for the TrimUI Brick and Smart Pro" (`README.md:32`) | "A header-only C UI toolkit for building graphical tools (Paks) on retro gaming handhelds running NextUI" (`README.md:3`) | "A Go-based UI library for building graphical interfaces on retro gaming handhelds that support SDL2" (`README.md:7`) |
| What it is | a firmware; `workspace/all/common/api.{c,h}` is the UI layer paks link against | a pak toolkit | a pak toolkit |
| Language | C | C99, header-only (2 headers) | Go 1.24, module `/v2` |
| Build | GNU Make, Docker cross-compile | GNU Make, Docker cross-compile | `go build`, Docker cross-compile |
| Backend | SDL2 surfaces for UI; GLES2 for the emulator path | SDL2 `SDL_Renderer` 2D | SDL2 `SDL_Renderer` 2D |
| Dependencies | SDL2, SDL2_ttf, SDL2_image, OpenGL ES2, pthread, libsamplerate | SDL2, SDL2_ttf, SDL2_image; libcurl optional, downloads only | SDL2, SDL2_image, SDL2_ttf, SDL2_gfx; `oksvg`, `go-evdev`, `go-i18n`, `toml` |
| Size | 51,197 lines total; 5,722 in `api.{c,h}` | 9,882 lines | 13,505 lines |
| Widgets | none - drawing primitives only | 13 modal entry points | ~12 modal screens |
| Licence | **GPL-3.0**, transition underway (README, issue #765) | MIT | MIT |
| Devices | TrimUI Brick, Smart Pro (`tg5040`, `tg5050`), plus a desktop target | TrimUI Smart Pro, Smart Brick, Smart Pro S, Miyoo Flip | adds `h700` (RG35XX H / Plus) |

**The licence difference is not a footnote.** Both toolkits are MIT, so anything worth harvesting
from them can be lifted into a port under almost any terms. NextUI is GPL-3.0, so linking a port
against `api.c` makes that port GPL-3.0 too. Harvesting an idea is free; harvesting the code is
not.

None of the three ships libmpv or ffmpeg. The two toolkits read their palette by shelling out to
NextUI's own `nextval.elf` and parsing its JSON, so their theme ingestion is NextUI-shaped by
construction: Apostrophe at `include/apostrophe.h:1081-1109`, gabagool at
`pkg/gabagool/platform/nextui/theming.go:88-113`. NextUI holds the same seven values directly
(`workspace/all/common/config.h:8-14`), which is what they are reading.

Device coverage is partial rather than absent. The Elementerial and Vitro Launcher sets target
devices none of the three supports, so for those two the binding is a porting concern on top of
the capability gaps. PlayStation X changes that: it targets the **TrimUI Smart Pro**, which both
NextUI (`tg5040`) and Apostrophe support directly, and the **RG35XX**, whose H / Plus variants
gabagool supports via `h700`. For that set the device binding is not the obstacle - the UI
capabilities below are.

Either way this is a porting concern rather than a capability gap, and none of the three could be
dropped onto an RG35XX running muOS without work below the UI layer.

## What they do provide

The part worth harvesting, and the reason none of the three is a bad project. **Check the licence
before taking code**: the two toolkits are MIT, NextUI is GPL-3.0 with a transition underway, so
from NextUI the design is free to copy and the source is not.

From NextUI:

- **The drawing model itself.** `GFX_startFrame()` / `GFX_blit*` / `GFX_flip(screen)` is the shape
  a portable widget kit wants: the caller owns the surface and the call order, so paint order is a
  total order the caller reasons about locally. This repo's four fidelity faults were all elements
  painted in the wrong order, and none of them is expressible in this model.
- **Five compositing layers with absolute indices** (`api.h:671-672`) - a depth model that no
  container re-bases, which is exactly the requirement `docs/widgets/README.md` names.
- **Tinted asset blitting** (`api.c:1699-1742`), which is how one white sprite set serves every
  palette, and how the seven-slot theme reaches the icons.
- **Four fit modes in the drawing layer** rather than at the call site (`api.h:378-384`).

From the two toolkits:

- **A good handheld input layer, in both of them.** Virtual buttons decoupled from hardware, several
  input backends (SDL GameController, raw joystick, device-specific scancodes), D-pad
  auto-repeat with fresh-versus-repeat distinction, analog deadzones, and chord and sequence
  detection. gabagool adds JSON remapping and an input-capture wizard
  (`pkg/gabagool/internal/input_mapper.go`, `input_capture.go`); Apostrophe adds a dedicated
  power-button thread (`ap_set_power_handler`).
- **Resolution scaling helpers** off a 1024 px reference width, damped above 1x, in both
  (`apostrophe.h:1240`, `internal/fonts.go:61-71`).
- **Anti-aliased rounded rects and pills** without SDL2_gfx (`apostrophe.h:2312-2432`).
- **Text primitives**: word wrap, UTF-8-safe ellipsis, ping-pong marquee, measurement.
- **Apostrophe's dirty-frame present loop** (`apostrophe.h:2274`), which idles at near-zero
  CPU. Good for battery, and a constraint for anything continuously animated.
- **gabagool's display-rotation canvas** (`internal/window.go:144-154, 232-255`), which
  renders into an intermediate texture and rotates it at present time.

## Capability matrix

Every "absent" or "none" below is a verified zero-hit check against the source, not an
inference from the docs.

| Requirement | NextUI | Apostrophe | gabagool |
| --- | --- | --- | --- |
| Compose widgets on one screen | **yes** - the caller drives the frame | no - each widget owns the event loop | no - same |
| Grid view | absent - all 15 `grid` hits are CRT scalers and overlay shaders | absent (only a 5x5 colour picker) | absent |
| Carousel | absent | `ap_selection` is a row of static text pills | absent |
| Horizontal auto-flow container | absent | absent | absent |
| Animation system, easing, timeline | three blocking playback helpers, linear only, no timeline | none - `ap__lerpf`/`ap__clampf` and four hand-rolled linear animations | none - one per-frame lerp on detail scroll |
| Named easing curves | zero occurrences | zero occurrences | zero occurrences |
| Event-driven animation (enter / next / prev / exit) | absent | absent | absent |
| Looping or ping-pong tracks | absent | absent | absent |
| Screen transitions | `GFX_animateSurface` slide and fade, blocking | fullscreen black fade only (`ap_fade_draw`) | router hard-cuts |
| Render to texture | **yes** - 29 sites, five layer targets | `SDL_SetRenderTarget` never called | internal only - rotation canvas and an AA-shape cache |
| Smooth list scrolling | `GFX_animateSurface` between positions | rows jump; only the highlight pill lerps 50 ms | index jump |
| Video playback | absent - `mpv` / `ffmpeg` / `YUV` / `libav` all zero | absent | absent |
| Data-driven theme or layout format | 7 colours, no layout format | 7 colours + 2 paths, no layout format | 7 colours + 2 paths, no layout format |
| Image fit modes | **four** - scaled, stretch, aspect-fit, fill | stretch only - `ap_draw_image(tex, x, y, w, h)` | aspect-fit only, hardcoded |
| Public alpha or tint on images | **yes** - `GFX_blitSurfaceColor` / `GFX_blitAssetColor` | no - tint is internal to the NextUI spritesheet | no - `SetColorMod` never called |
| Reflection and saturation filters | absent | absent | absent |
| Clip / scissor | no scissor API; each blit is bounded by its dst rect | yes, 12 sites | `SetClipRect` never called |
| Arbitrary font sizes and families | 5 fixed tiers (16/14/12/10/7 x `SCALE1`), one family | 6 fixed tiers, one family, forced bold; accepts a caller's `TTF_Font*` | 6 fixed tiers, one typeface, no public arbitrary-size open |
| Font line-height metrics | `GFX_getTextHeight` exposed | not exposed | not exposed |
| SVG | no | no | `oksvg`, but only inside `ProcessMessage` |
| WebP | no - `IMG_Init(IMG_INIT_PNG)`, one site | no - `IMG_INIT_PNG \| IMG_INIT_JPG` | effectively no - see below |
| Animated GIF | no | `IMG_LoadAnimation` never referenced | absent |
| Gradients, blur, drop shadow, general nine-patch | none - pill assets only | none | none |
| Rounded corners | via pill assets | yes | yes, via SDL2_gfx |
| Text wrap and ellipsis | both - `GFX_wrapText`, `GFX_truncateText` | both | wrap yes, ellipsis is truncation plus marquee |
| Depth model | **five fixed layers**, absolute indices, no re-basing (`api.h:671-672`) | paint order only | paint order only |
| Fragment shader path | GLES2, user-loadable `.glsl`, **but emulator-only** - see below | absent | absent |

Three details worth recording:

- **NextUI's shader path does not reach the UI.** `PLAT_updateShader(i, filename, ...)` loads a
  user `.glsl` from `SHADERS_FOLDER/glsl` into one of `MAXSHADERS` passes
  (`workspace/all/common/generic_video.c:722-750`), and the pipeline runs inside `PLAT_GL_Swap`
  (`generic_video.c:1991-2220`). **Only the emulator calls it** (`workspace/all/minarch/ma_video.c:644`).
  The launcher and every pak draw through `GFX_flip` / `GFX_flipHidden`, which take the
  `SDL_Renderer` path and never touch a shader. So the capability exists in the engine and is not
  reachable from the UI layer without restructuring which flip path the UI uses.
- gabagool's WebP support is nominal. `img.INIT_PNG | img.INIT_JPG | img.INIT_TIF |
  img.INIT_WEBP` is OR'd into `sdl.Init()` at `pkg/gabagool/internal/sdl.go:16`, which takes
  `SDL_INIT_*` flags, not image flags. The real `img.Init` calls are PNG at
  `internal/window.go:169` and PNG plus JPG at `process_message.go:85`.
- gabagool does call `SetRenderTarget`, but only in `internal/` - the rotation canvas
  (`window.go:152, 235, 252`) and a cached anti-aliased shape helper
  (`helpers.go:394-418`). Neither is reachable as a general offscreen-compositing facility.

### Performance

All three have a text and texture story that an art-heavy launcher would hit immediately.

NextUI rasterises through `TTF_RenderUTF8*` at 10 sites in `api.c` with no glyph atlas, but it
blits into a persistent surface rather than rebuilding a texture per call, and it runs its frame
preparation on a background thread (`generic_video.c:1908`, `prepareFrameThread`). Its five layer
targets are allocated once at init rather than per draw.

The two toolkits:

- Apostrophe's `ap_draw_text` creates and destroys a surface **and** a texture on every call,
  every frame (`apostrophe.h:2488-2504`). There is no glyph atlas; the only cache is an
  opt-in 8-entry LRU you populate yourself.
- gabagool's texture cache holds 5 entries (`internal/texture_cache.go`, used by `List` for
  box art), and its word-fit measurement allocates and frees an SDL surface per candidate
  line (`internal/helpers.go:48-54`).

## Per-mockup-set gaps

### Elementerial

Full spec: [`themes/elementerial/reference/source-notes.md`](themes/elementerial/reference/source-notes.md).

Missing from all three:

- **The ES carousel.** Per-logo continuous scale (1.0 to 1.4) and opacity (0.5 to 1.0) as a
  function of fractional camera distance, so every logo interpolates independently each
  frame, not just the selected one.
- **Three concurrent animation tracks per cursor move**: a 500 ms easeOutQuint strip slide, a
  500 ms extras cross-fade, and a 150 / 300 / 300 ms `systemInfo` fade-swap-fade, plus a
  restarting 1000 ms artwork storyboard on top.
- **Two live copies of the same element cross-fading** against each other (`cover` and
  `coverOut`, `systemName` and `systemNameOut`), with the outgoing copy above the incoming.
- **Five full-screen per-pixel alpha-mask scrims**, three tinted by the live palette. One of
  them, `gamelist-video.png`, has alpha behaving like `max(fx, fy)` and cannot be decomposed
  into stacked gradients, which composite to `1-(1-a)(1-b)` and over-darken the feathered
  corner. It needs the real alpha texture or a `max()`-combining shader.
- **A column-major horizontally scrolling grid**, and the boxes view with 1.075 selection
  zoom and `aaaaaa`-to-`FFFFFF` image tinting.
- **ES `maxSize` semantics** - contain-fit where the element's box shrinks to the fitted
  image, so the anchor and corner radius act on the artwork's own edges. Not
  `object-fit: contain`, and it needs image dimensions at layout time.
- **Fractional row pitch derived from the font's own line height**, not its point size:
  34.16 / 28.90 / 48.80 / 21.69 px across the three devices. Requires the face's ascender,
  descender and lineGap.
- **28 live-switchable palettes** with the alpha-suffix convention, plus three per-aspect
  layouts that genuinely restructure views rather than scaling them.
- Gradient-filled SVG logos, WebP backdrops, a 1 px text glow, and a five-star rating.
- **Video in the game list** - cover-cropped, delayed 1 s, drawn under a per-pixel alpha
  scrim and under the text list.

**NextUI closes three of these and no more.** Its tint (`GFX_blitSurfaceColor`) covers the
palette-tinted scrims' colouring, though not their per-pixel alpha masks; its four fit modes cover
the `maxSize` contain-fit everywhere except the box-shrink-to-image part, which still needs image
dimensions at layout time; and its five layers give the two cross-fading copies somewhere to sit.
The 500 ms easeOutQuint strip slide, the three concurrent tracks per cursor move and the video
remain out of reach, because its animation is a blocking linear playback loop.

Maps today: the detailed gamelist is close to a one-dimensional list with art for the focused
item, which is the one shape all three already have.

### PlayStation X

Full spec: [`themes/playstation-x/reference/source-notes.md`](themes/playstation-x/reference/source-notes.md).

Missing from all three:

- **An event-driven animation format.** The theme declares 385 `<animation>` tags in 211
  `<storyboard>` blocks, keyed to five named events - `open`, `activateNext`, `activatePrev`,
  `deactivateNext`, `deactivatePrev` - so every element has up to five distinct motions
  selected by cursor direction. None of the three has animation events: `storyboard`,
  `activateNext` and `deactivatePrev` are zero-hit in all three, and the only `deactivate` in any
  of them is Apostrophe's input-combo API (`apostrophe/docs/API.md:584`).
- **Three transform channels animating concurrently on one element.**
  `_theme_options/animated-list.xml:124-126` runs `scale`, `offsetX` and `offsetY` together;
  `animated-systems.xml:95-97` runs `scale`, `x` and `y`. A tween system that owns one
  property per element cannot express it, and none of the three has a tween system - `ease`,
  `bezier` and `elastic` are zero-hit in all three. NextUI's `PLAT_animateSurface` moves x, y and
  opacity together but bakes them into one call rather than exposing them as channels.
- **A finite track and an infinite track on the same property at once.** `marco-activo`'s
  opacity carries a 500 ms one-shot fade *and* a forever `1 <-> 0.3` ping-pong at
  `begin=1000`. `autoreverse`, `yoyo` and `iterations` are zero-hit in all three.
- **Storyboard-level repeat** - a whole group looping as a unit, 16 blocks in the theme. The
  top bar's two info panels swap on a single 5350 ms cycle (`top-info.xml:115-130`).
- **`bump`, an overshoot curve.** All 13 uses are `scale 0.94 -> 1.0`, so the value exceeds
  its target before settling. None of the three has a named curve; all interpolation in all three
  is linear.
- **`from`-only animations**, which animate from a given value to the element's *authored*
  value (`animated-systems.xml:41`, `carousel-ps4.xml:54`). The end value is only known after
  layout resolves, so animation construction has to run after layout, not before it.
- **A data-driven predicate layer.** ~30 `<subset>` groups, resolved **last match wins**, over
  two predicate kinds that resolve at different times: `ifSubset` / `aspect-ratio` /
  `tinyScreen` per device, and `if=` over `{system.theme}` / `{system.name}` plus `<visible>`
  over `{game:*}` per selected item. Both frameworks carry 7-8 flat colours and compiled-in
  integers, and NextUI seven colours; none has a layout format.
- **`imagegrid` semantics**: `autoLayout` cols x rows, `autoLayoutSelectedZoom` where the cell
  is sized for the zoomed tile, `centerSelection`, `scrollLoop`, and a grid wider than the
  screen anchored off-screen left. `autoLayout`, `GridView` and `carousel` are all zero-hit.
- **A horizontal auto-flow container.** Every metadata row is a `<stackpanel>` with a
  `separator`, flowing a mix of text, flags, icon-font glyphs and pulsing badges.
  `stackpanel`, `hbox` and `flowlayout` are zero-hit in all three.
- **`reflexion`** - a mirrored, fading reflection under each carousel tile
  (`carousel.xml`, `0.2 0` unselected, `0.25 0` selected). Zero-hit in all three.
- **`saturation` 0** - the PS3 carousel desaturates its icon set (`carousel-ps3.xml`). No
  colour-matrix or saturation filter in either.
- **A horizontal gradient fill**, used for the bottom accent rule, whose two stops are
  per-system (`_theme_inc/infos/psx.xml` is `F2001A` to `00AD9E`). `gradient` is zero-hit.
- **A 1 px text glow on nearly every string** (`glowColor 00000035`, `glowSize 1`,
  `glowOffset 3 2`). Both frameworks' `glow` / `outline` hits are anti-aliasing comments
  (`gabagool/pkg/gabagool/internal/helpers.go:334-373`).
- **Auto-scrolling body text** - vertical, with `autoScrollDelay` 7000-10000 ms and
  `autoScrollSpeed` 45-60, distinct from the 2000 ms `singleLineScroll` title marquee.
  Apostrophe has a ping-pong marquee and NextUI a continuously wrapping one at a fixed 2 px a frame
  (`generic_video.c:1290-1330`); none has the delayed vertical scroll, and none lets the caller set
  the speed.
- **`roundCorners` as a fraction of the element** (0.15), not a pixel radius - so the radius
  tracks the tile as the carousel size subset changes.
- **`ninepatch animateColor` with `animateColorTime` 500 ms** - the selected grid tile's edge
  colour tweens rather than cutting.

**NextUI removes the composition blocker and none of the rest.** This is the set that most needs a
timeline, and its 385 animation tags across 211 storyboards - five named events per element, three
transform channels composing on one element, a finite and an infinite track on one property,
`bump`'s overshoot, `from`-only tracks resolved after layout - all land on the one thing NextUI has
no shape for. Its `PLAT_animateSurface` moves one surface between two positions, linearly, blocking
the frame while it does.

Maps today: the detailed view is a text list with art for the focused item, the shape all three
already have; PS5 Style's scrollbar has a direct equivalent in Apostrophe's public
`ap_draw_scrollbar` (`include/apostrophe.h:582`), though gabagool's is inline in
`help_overlay.go:122-129` rather than reusable; the help bar maps to all three footer hint rows;
and the theme-options menu is an options list in any of them.

### Vitro Launcher

Full spec: [`themes/vitrolauncher/reference/source-notes.md`](themes/vitrolauncher/reference/source-notes.md).

Missing from all three:

- **A continuously animated procedural background** - a GLSL fragment shader, a 70-mote
  additive particle system, or a low-resolution Bayer-dithered cloud scene. Both frameworks
  are 2D `SDL_Renderer` with no shader path, and Apostrophe is built around a dirty-frame
  idle loop that a never-static screen defeats.
- **Backdrop blur of that live background** behind five separate pill shapes, which needs
  render-to-texture plus a separable blur plus stadium masking, every frame.
- Multi-layer box shadows including two insets, and a drop shadow on an alpha silhouette.
- A 3-slice glass PNG stretched to many different widths (218 px nav pill, 70 px bubble,
  560 px settings row, page arrows).
- Image recolouring filters, used to flip white glyphs to near-black on the light scheme - though
  NextUI's `GFX_blitAssetColor` covers this one.
- **A carousel tile that animates its own layout box** - width, height and corner radius
  together - so the whole row's positions move during the animation.
- A paged grid whose geometry changes with a setting (7x3 or 5x2), rebuilt with focus
  preserved.
- A sliding nav indicator with a 150 ms hold delay before it moves.
- **Two-second hold gestures with cancel-on-release at a different duration** (2000 ms in,
  400 ms out), one of them behind a three-button chord. Both frameworks have chord detection
  and press timestamps, and NextUI has `PAD_isPressed` / `PAD_justRepeated` plus a `PAD_tappedMenu`
  special case (`api.h:535-539`), so this is buildable on all three - but none provides it.
- A two-half-circle colour dot, and inline glyph images flowed into a text line.
- Live re-theming that reconfigures the background system and rebuilds two screens from
  inside the settings screen itself.

**NextUI's shader path does not help here**, which is the finding worth recording: it is a real
GLES2 pipeline with user-loadable `.glsl`, and it is wired to the emulator's frame presentation
only (`workspace/all/minarch/ma_video.c:644` is its sole caller). A pak drawing UI goes through
`GFX_flip`, which never reaches it. The waves background is therefore *missing* rather than
degraded on all three. What NextUI does bring is render-to-texture as a real facility, which is
the first half of what backdrop blur needs - the separable blur pass is still absent.

Maps today: the Settings screen fits `ap_options_list` / `OptionsList` closely, apart from
the glass and the colour dot.

### NextUI

Full spec: [`themes/nextui/reference/source-notes.md`](themes/nextui/reference/source-notes.md).

This is the closest fit in the registry, and not by coincidence: this set is a theme reproducing
NextUI's look on a Nintendo 64, and the other two entries are toolkits for NextUI paks. All three
are drawing the same firmware. The gaps are correspondingly small and specific.

**Against NextUI itself, most of them disappear.** Its seven `THEME_COLOR*_255` slots
(`workspace/all/common/config.h:8-14`) are where both toolkits copied their palette from, so the
match is the original rather than a resemblance. Tint covers the ten icons the toolkits cannot
draw; `GFX_scrollTextSurface` is a marquee, though not this one's; `GFX_blitPill` and
`GFX_getButtonWidth` are the hint chrome; `GFX_wrapText` and `GFX_truncateText` are the text model. What is left is the overlay
composition - `ui_components_context_menu_draw` paints over a browser that stays visible, which
NextUI's five layers do support - and the fact that this theme wants literal 640x480 pixels while
NextUI scales everything through `SCALE1`.

**Against NextUI, then, only two things are genuinely missing**: a way to opt out of `SCALE1` so
the theme's literal geometry survives, and the marquee's cycle. NextUI scrolls continuously at 2 px
a frame through a doubled-text texture and wraps at the loop point, so there is no pause and no
visible restart (`generic_video.c:1290-1330`); the N64 theme holds 45 frames, scrolls to the end,
holds 45 again and snaps back. Same speed, different rhythm. Everything else below is a gap in the
toolkits rather than in the platform they wrap - which is the clearest illustration in this
registry of what those wrappers give away.

Missing from the two toolkits:

- **Overlays that draw over the screen they were opened from.** `ui_components_context_menu_draw`
  and `ui_components_messagebox_draw` are called after the view's own draw, so the browser stays
  visible behind the menu. Both frameworks' equivalents are blocking modal screens that clear the
  frame first - Apostrophe's `ap_selection` opens its render block with `ap_draw_background()`,
  gabagool's `SelectionMessage` with `renderer.Clear()`
  (`pkg/gabagool/selection_message.go:187-188`). This is the modal-composition blocker in its
  mildest form: here it costs the backdrop, not the screen.
- **Image tinting.** `ui_components_nextui_tinted_sprite_draw` modulates white art by a palette
  colour, which is how the eight ledger icons, the cartridge placeholder and the folder glyph take
  the theme. `SetSurfaceColorMod` and `SetTextureColorMod` are zero-hit in both toolkits; NextUI's
  own `GFX_blitAssetColor` is exactly this operation on exactly these seven slots.
- **One accent pill per hint.** `hint_group_draw_at` draws a separate stadium per hint with an 8 px
  gap. Both frameworks draw one continuous pill around a whole group - Apostrophe at
  `include/apostrophe.h:3257, 3279`, gabagool's `renderGroupAsContinuousPill` at
  `pkg/gabagool/footer.go:132, 140`.
- **Two stacked pills on a selected settings row** - a full-width accent pill with a main-colour
  pill hugging the label on top of it. `ap_options_list` draws one full-width pill
  (`include/apostrophe_widgets.h:1301`); that pairing is what makes a NextUI settings list read
  differently from its file list despite both being 40 px rows.
- **A hold-scroll-hold-snap marquee.** The source holds 45 frames, scrolls left 2 px per frame,
  holds 45, then assigns the offset straight back to zero. Apostrophe's `ap_text_scroll` is
  ping-pong - it carries a `direction` field and reverses at each end
  (`include/apostrophe.h:263-269`) - and gabagool's is truncation plus marquee.
- **A caller-set art box.** gabagool's `List` already contain-fits the highlighted row's art and
  right-anchors it vertically centred (`pkg/gabagool/list.go:934-957`), which is the exact shape,
  but its maximum is a hardcoded `screenWidth/3` x `screenHeight/2` and its inset a literal 20 px.
  The theme's is 288x288 against the overscan edge. Apostrophe's list image is a 24 px in-row icon
  (`include/apostrophe_widgets.h:585, 911`), not a panel.
- **A selection pill that does not animate.** `AP__PILL_ANIM_MS 50.0f /* ~3 frames at 60fps,
  matching NextUI */` lerps the pill's width and y between rows
  (`include/apostrophe_widgets.h:501, 833`). This theme snaps. It is the only entry in this
  registry where a framework does *more* motion than a set wants, and the only one where the fix is
  to turn something off.
- **Literal pixel geometry.** Both frameworks scale fonts and metrics off a reference width -
  Apostrophe's font bump against a 320x240 logical reference (`include/apostrophe.h:124-126`),
  gabagool's `GetScaleFactor`. A console has exactly one output size, so this set's four font sizes
  are 32 / 24 / 20 / 16 px and every coordinate is a literal. The scaling apparatus is not a gap,
  but it is dead weight, and the tier bases (24 / 16 / 14 / 12 / 10 / 7) do not land on the four
  the theme names.
- **`Z` and `C` buttons**, which the hint bars name and no button enum in this registry has -
  NextUI's is the fullest at 30 ids (`workspace/all/common/defines.h`, `BTN_ID_*`) and still stops
  at L1-L4 / R1-R4, because none of these targets an N64 controller.

Maps today, and more of it than for any other set:

- **The theme struct is a slot-for-slot match.** NextUI's seven colours are Apostrophe's
  `highlight` / `accent` / `button_label` / `text` / `highlighted_text` / `hint` / `background`
  (`include/apostrophe.h:244-254`) and gabagool's identically-named seven
  (`pkg/gabagool/internal/theming.go:10-20`), in the same order, with the same meanings, plus the
  background-image path the theme also supports. Theming is a hard gap for the other three sets and
  a complete match here.
- **Both toolkits already draw the label-hugging selection pill** that is this theme's
  signature: `pill_target_w = tw + pill_pad * 2` (`include/apostrophe_widgets.h:809-812`) and
  `pillWidth := Min32(maxPillWidth, measureText(font, itemText)+pillPadding)`
  (`pkg/gabagool/list.go:795`).
- **gabagool's `List` is close to the file browser outright** - hugging pill, plus contain-fit box
  art for the highlighted row anchored right and vertically centred.
- Rounded-rect and pill primitives in all three (`GFX_blitPill`, `api.h:391`; `ap_draw_pill`,
  `include/apostrophe.h:571`; `DrawRoundedRect`, `pkg/gabagool/list.go:803`), so the stadium and
  the 16 px panel need no nine-patch - even though the source blits `pill_cap_40` and
  `panel_corner_16` because the RDP has neither.
- Text measurement and ellipsis in all three, which is what this theme's geometry is made of:
  `GFX_getTextWidth` and `GFX_truncateText` (`api.h:356, 360`), `ap_measure_text` and
  `ap_measure_text_ellipsized` (`include/apostrophe.h:578-579`).
- The footer model - a left group and a right-aligned group of button-plus-label items - is the
  same idea, differing only in pill granularity.
- `ap_options_list` / `OptionList` is the settings screen minus the inner pill.
- **Nothing here is blocked on a degradable effect.** The theme declares none: all 28 of its
  fallback baselines are byte-identical to its normal ones, so blur, shaders and masks - which
  block Vitro and Elementerial - are simply not in play.

## What a port would have to add

The list is shorter than it was, because NextUI already answers four of it. In rough dependency
order, and marked with who still needs each:

1. **A time-based tween system with named easing curves** - at minimum easeOutQuint, easeOut,
   exponential ease-out, linear and smoothstep - supporting per-property durations and delays,
   concurrent channels composing on one element, restart-on-event, and **a resting value
   evaluable without playing the track**. *All three.* This is now the single largest gap: NextUI
   animates by blocking the frame until the motion finishes, so a still cannot be drawn at all.
2. A compositor or scene layer that lets widgets coexist on one screen. *The two toolkits.*
   NextUI's caller-driven blitting already is one.
3. Render-to-texture as a public facility, for screen transitions and blur. *The two toolkits.*
   NextUI has it, across five layer targets.
4. Image fit modes (contain with box-shrink-to-image, cover with centre crop, stretch,
   derive-one-axis-from-aspect) with public alpha and tint. *The two toolkits.* NextUI has four
   fits plus tint; only box-shrink-to-image is missing, and it needs image dimensions at layout
   time rather than a new primitive.
5. Arbitrary font sizes and families, with the face's line metrics exposed. *All three* - five or
   six fixed tiers and one family everywhere.
6. A grid and a carousel. *All three.*
7. A data-driven theme and layout format, rather than seven colours and compiled-in integer
   literals. *All three.*
8. A fragment-shader path reachable from the UI layer. *All three* - NextUI has the pipeline but
   wires it to the emulator's presentation only.
9. A video decode path. *All three.*

That is still a new layout and animation layer, but no longer a new rendering layer: NextUI's
drawing model, depth model, tint and fit modes are the shape a portable widget kit wants. The
obstacle to reusing them directly is the licence, not the design - which makes NextUI the best
reference and the two MIT toolkits the better source of liftable code, for the input abstraction,
the resolution scaling helpers and the text primitives.
