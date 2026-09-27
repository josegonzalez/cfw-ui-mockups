# Framework registry

Candidate frameworks for implementing the mockups in this repo for real, and what each one
would have to gain first. This file plays the same role for implementation targets that
[`devices.md`](devices.md) plays for hardware.

Assessed on UI capability only. Each framework's device and CFW binding is recorded under
"What it is" as a porting concern, not weighted as a blocker.

Two skills keep this current: `/assess-launcher <cfw-slug>` when a mockup set is added, and
`/assess-framework <repo>` when a candidate framework is added.

## Verdict

**Neither [Apostrophe](https://github.com/Helaas/Apostrophe) nor
[gabagool](https://github.com/BrandonKowalski/gabagool) can carry these screens today, and
the blocker is architectural rather than a list of absent features.**

Both are libraries of blocking, full-screen modal screens for NextUI utility paks. Every
widget runs its own event loop and returns a result struct when the user completes an action
or presses back. Apostrophe's README states the model outright (`README.md:154`); gabagool's
`router` runs screens to completion in sequence (`pkg/gabagool/router/router.go:76-99`).

The consequence is that neither can compose two widgets onto one screen. A system carousel
plus a game grid plus a video preview plus a status bar cannot coexist, because whichever one
you call owns the frame until it returns. Reaching past the widget layer to the drawing
primitives means using roughly a third of either library and writing the rest.

Apostrophe describes itself as a C port whose structure was directly informed by gabagool's
framework design (`README.md:7`), and ships a migration guide for moving between them
(`docs/PORTING_FROM_GABAGOOL.md`). The two share that model, the six-fixed-font-tier text
layer, the small flat colour theme, and the absence of a grid, a carousel, an animation
system and video. They are close to one assessment rather than two.

**NextUI is the exception that shows the shape of the problem.** Its browser is a list, a
right-hand art panel and a footer, and gabagool's `List` already draws all three; both frameworks'
theme structs match its seven palette slots exactly. What still fails is composition in the small -
its context menu draws over a browser that stays visible, and both frameworks' selection dialogs
clear the frame first.

## What each is

| | Apostrophe | gabagool |
| --- | --- | --- |
| Self-description | "A header-only C UI toolkit for building graphical tools (Paks) on retro gaming handhelds running NextUI" (`README.md:3`) | "A Go-based UI library for building graphical interfaces on retro gaming handhelds that support SDL2" (`README.md:7`) |
| Language | C99, header-only (2 headers) | Go 1.24, module `/v2` |
| Build | GNU Make, Docker cross-compile | `go build`, Docker cross-compile |
| Backend | SDL2 `SDL_Renderer` 2D | SDL2 `SDL_Renderer` 2D |
| Dependencies | SDL2, SDL2_ttf, SDL2_image; libcurl optional, downloads only | SDL2, SDL2_image, SDL2_ttf, SDL2_gfx; `oksvg`, `go-evdev`, `go-i18n`, `toml` |
| Size | 9,882 lines | 13,505 lines |
| Widgets | 13 modal entry points | ~12 modal screens |
| Licence | MIT | MIT |
| Devices | TrimUI Smart Pro, Smart Brick, Smart Pro S, Miyoo Flip | adds `h700` (RG35XX H / Plus) |

Neither ships SDL_mixer, libmpv or ffmpeg. Both read their palette by shelling out to
NextUI's `nextval.elf` and parsing its JSON, so theme ingestion is NextUI-shaped: Apostrophe
at `include/apostrophe.h:1081-1109`, gabagool at `pkg/gabagool/platform/nextui/theming.go:88-113`.

Device coverage is partial rather than absent. The Elementerial and Vitro Launcher sets target
devices neither framework supports, so for those two the binding is a porting concern on top of
the capability gaps. PlayStation X changes that: it targets the **TrimUI Smart Pro**, which
Apostrophe supports directly, and the **RG35XX**, whose H / Plus variants gabagool supports via
`h700`. For that set the device binding is not the obstacle - the UI capabilities below are.

Either way this is a porting concern rather than a capability gap, and neither could be dropped
onto an RG35XX running muOS without work below the UI layer.

## What they do provide

The part worth harvesting, and the reason neither is a bad project:

- **A good handheld input layer, in both.** Virtual buttons decoupled from hardware, several
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

| Requirement | Apostrophe | gabagool |
| --- | --- | --- |
| Compose widgets on one screen | no - each widget owns the event loop | no - same |
| Grid view | absent (only a 5x5 colour picker) | absent |
| Carousel | `ap_selection` is a row of static text pills | absent |
| Horizontal auto-flow container | absent | absent |
| Animation system, easing, timeline | none - `ap__lerpf`/`ap__clampf` and four hand-rolled linear animations | none - one per-frame lerp on detail scroll |
| Named easing curves | zero occurrences | zero occurrences |
| Event-driven animation (enter / next / prev / exit) | absent | absent |
| Looping or ping-pong tracks | absent | absent |
| Screen transitions | fullscreen black fade only (`ap_fade_draw`) | router hard-cuts |
| Render to texture | `SDL_SetRenderTarget` never called | internal only - rotation canvas and an AA-shape cache |
| Smooth list scrolling | rows jump; only the highlight pill lerps 50 ms | index jump |
| Video playback | absent | absent |
| Data-driven theme or layout format | 7 colours + 2 paths, no layout format | 7 colours + 2 paths, no layout format |
| Image fit modes | stretch only - `ap_draw_image(tex, x, y, w, h)` | aspect-fit only, hardcoded |
| Public alpha or tint on images | no - tint is internal to the NextUI spritesheet | no - `SetColorMod` never called |
| Reflection and saturation filters | absent | absent |
| Clip / scissor | yes, 12 sites | `SetClipRect` never called |
| Arbitrary font sizes and families | 6 fixed tiers, one family, forced bold; accepts a caller's `TTF_Font*` | 6 fixed tiers, one typeface, no public arbitrary-size open |
| Font line-height metrics | not exposed | not exposed |
| SVG | no | `oksvg`, but only inside `ProcessMessage` |
| WebP | no - `IMG_INIT_PNG \| IMG_INIT_JPG` | effectively no - see below |
| Animated GIF | `IMG_LoadAnimation` never referenced | absent |
| Gradients, blur, drop shadow, general nine-patch | none | none |
| Rounded corners | yes | yes, via SDL2_gfx |
| Text wrap and ellipsis | both | wrap yes, ellipsis is truncation plus marquee |
| Physics-based motion (a spring carrying velocity across a target change) | absent - `spring` and `velocity` zero-hit | absent - same |
| Composite a foreign framebuffer (a frame the UI does not produce, with a post pass over it) | absent - `emulator`, `libretro` and `frame_texture` zero-hit | absent - same |
| Two output panels, one application across both | no - one global window and renderer (`apostrophe.h:4680, 4699`) | no - one window on display 0 (`window.go:34, 83`) |
| Touch input | absent - `FINGERDOWN`, `TouchFinger`, `MOUSEBUTTONDOWN` zero-hit | absent - same |
| Per-texture scale mode (nearest for pixel art) | no - bilinear hinted globally (`apostrophe.h:4696`); `SetTextureScaleMode` zero-hit | no - `SetTextureScaleMode` zero-hit; SDL's default nearest for everything |

Two details worth recording:

- gabagool's WebP support is nominal. `img.INIT_PNG | img.INIT_JPG | img.INIT_TIF |
  img.INIT_WEBP` is OR'd into `sdl.Init()` at `pkg/gabagool/internal/sdl.go:16`, which takes
  `SDL_INIT_*` flags, not image flags. The real `img.Init` calls are PNG at
  `internal/window.go:169` and PNG plus JPG at `process_message.go:85`.
- gabagool does call `SetRenderTarget`, but only in `internal/` - the rotation canvas
  (`window.go:152, 235, 252`) and a cached anti-aliased shape helper
  (`helpers.go:394-418`). Neither is reachable as a general offscreen-compositing facility.

### Performance

Both have a text and texture story that an art-heavy launcher would hit immediately:

- Apostrophe's `ap_draw_text` creates and destroys a surface **and** a texture on every call,
  every frame (`apostrophe.h:2488-2504`). There is no glyph atlas; the only cache is an
  opt-in 8-entry LRU you populate yourself.
- gabagool's texture cache holds 5 entries (`internal/texture_cache.go`, used by `List` for
  box art), and its word-fit measurement allocates and frees an SDL surface per candidate
  line (`internal/helpers.go:48-54`).

## Per-mockup-set gaps

### Elementerial

Full spec: [`themes/elementerial/reference/source-notes.md`](themes/elementerial/reference/source-notes.md).

Missing from both frameworks:

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

Maps today: the detailed gamelist is close to a one-dimensional list with art for the focused
item, which is the one shape both frameworks already have.

### PlayStation X

Full spec: [`themes/playstation-x/reference/source-notes.md`](themes/playstation-x/reference/source-notes.md).

Missing from both frameworks:

- **An event-driven animation format.** The theme declares 385 `<animation>` tags in 211
  `<storyboard>` blocks, keyed to five named events - `open`, `activateNext`, `activatePrev`,
  `deactivateNext`, `deactivatePrev` - so every element has up to five distinct motions
  selected by cursor direction. Neither framework has animation events at all: `storyboard`,
  `activateNext` and `deactivatePrev` are zero-hit in both, and the only `deactivate` in
  either is the input-combo API (`apostrophe/docs/API.md:584`).
- **Three transform channels animating concurrently on one element.**
  `_theme_options/animated-list.xml:124-126` runs `scale`, `offsetX` and `offsetY` together;
  `animated-systems.xml:95-97` runs `scale`, `x` and `y`. A tween system that owns one
  property per element cannot express it, and neither framework has a tween system - `ease`,
  `bezier` and `elastic` are all zero-hit.
- **A finite track and an infinite track on the same property at once.** `marco-activo`'s
  opacity carries a 500 ms one-shot fade *and* a forever `1 <-> 0.3` ping-pong at
  `begin=1000`. `autoreverse`, `yoyo` and `iterations` are zero-hit in both.
- **Storyboard-level repeat** - a whole group looping as a unit, 16 blocks in the theme. The
  top bar's two info panels swap on a single 5350 ms cycle (`top-info.xml:115-130`).
- **`bump`, an overshoot curve.** All 13 uses are `scale 0.94 -> 1.0`, so the value exceeds
  its target before settling. Neither framework has any named curve.
- **`from`-only animations**, which animate from a given value to the element's *authored*
  value (`animated-systems.xml:41`, `carousel-ps4.xml:54`). The end value is only known after
  layout resolves, so animation construction has to run after layout, not before it.
- **A data-driven predicate layer.** ~30 `<subset>` groups, resolved **last match wins**, over
  two predicate kinds that resolve at different times: `ifSubset` / `aspect-ratio` /
  `tinyScreen` per device, and `if=` over `{system.theme}` / `{system.name}` plus `<visible>`
  over `{game:*}` per selected item. Both frameworks carry 7-8 flat colours and compiled-in
  integers; neither has a layout format.
- **`imagegrid` semantics**: `autoLayout` cols x rows, `autoLayoutSelectedZoom` where the cell
  is sized for the zoomed tile, `centerSelection`, `scrollLoop`, and a grid wider than the
  screen anchored off-screen left. `autoLayout`, `GridView` and `carousel` are all zero-hit.
- **A horizontal auto-flow container.** Every metadata row is a `<stackpanel>` with a
  `separator`, flowing a mix of text, flags, icon-font glyphs and pulsing badges.
  `stackpanel`, `hbox` and `flowlayout` are zero-hit in both.
- **`reflexion`** - a mirrored, fading reflection under each carousel tile
  (`carousel.xml`, `0.2 0` unselected, `0.25 0` selected). Zero-hit in both.
- **`saturation` 0** - the PS3 carousel desaturates its icon set (`carousel-ps3.xml`). No
  colour-matrix or saturation filter in either.
- **A horizontal gradient fill**, used for the bottom accent rule, whose two stops are
  per-system (`_theme_inc/infos/psx.xml` is `F2001A` to `00AD9E`). `gradient` is zero-hit.
- **A 1 px text glow on nearly every string** (`glowColor 00000035`, `glowSize 1`,
  `glowOffset 3 2`). Both frameworks' `glow` / `outline` hits are anti-aliasing comments
  (`gabagool/pkg/gabagool/internal/helpers.go:334-373`).
- **Auto-scrolling body text** - vertical, with `autoScrollDelay` 7000-10000 ms and
  `autoScrollSpeed` 45-60, distinct from the 2000 ms `singleLineScroll` title marquee.
  Apostrophe has a ping-pong marquee; neither has the delayed vertical scroll.
- **`roundCorners` as a fraction of the element** (0.15), not a pixel radius - so the radius
  tracks the tile as the carousel size subset changes.
- **`ninepatch animateColor` with `animateColorTime` 500 ms** - the selected grid tile's edge
  colour tweens rather than cutting.

Maps today: the detailed view is a text list with art for the focused item, the shape both
frameworks already have; PS5 Style's scrollbar has a direct equivalent in Apostrophe's public
`ap_draw_scrollbar` (`include/apostrophe.h:582`), though gabagool's is inline in
`help_overlay.go:122-129` rather than reusable; the help bar maps to both footer hint rows;
and the theme-options menu is an options list in either.

### Vitro Launcher

Full spec: [`themes/vitrolauncher/reference/source-notes.md`](themes/vitrolauncher/reference/source-notes.md).

Missing from both frameworks:

- **A continuously animated procedural background** - a GLSL fragment shader, a 70-mote
  additive particle system, or a low-resolution Bayer-dithered cloud scene. Both frameworks
  are 2D `SDL_Renderer` with no shader path, and Apostrophe is built around a dirty-frame
  idle loop that a never-static screen defeats.
- **Backdrop blur of that live background** behind five separate pill shapes, which needs
  render-to-texture plus a separable blur plus stadium masking, every frame.
- Multi-layer box shadows including two insets, and a drop shadow on an alpha silhouette.
- A 3-slice glass PNG stretched to many different widths (218 px nav pill, 70 px bubble,
  560 px settings row, page arrows).
- Image recolouring filters, used to flip white glyphs to near-black on the light scheme.
- **A carousel tile that animates its own layout box** - width, height and corner radius
  together - so the whole row's positions move during the animation.
- A paged grid whose geometry changes with a setting (7x3 or 5x2), rebuilt with focus
  preserved.
- A sliding nav indicator with a 150 ms hold delay before it moves.
- **Two-second hold gestures with cancel-on-release at a different duration** (2000 ms in,
  400 ms out), one of them behind a three-button chord. Both frameworks have chord detection
  and press timestamps, so this is buildable, but neither provides it.
- A two-half-circle colour dot, and inline glyph images flowed into a text line.
- Live re-theming that reconfigures the background system and rebuilds two screens from
  inside the settings screen itself.

Maps today: the Settings screen fits `ap_options_list` / `OptionsList` closely, apart from
the glass and the colour dot.

### NextUI

Full spec: [`themes/nextui/reference/source-notes.md`](themes/nextui/reference/source-notes.md).

This is the closest fit in the registry, and not by coincidence: both frameworks are toolkits for
NextUI paks, and this set is a theme reproducing NextUI's look on a Nintendo 64. They are drawing
the same firmware. The gaps are correspondingly small and specific.

Missing from both frameworks:

- **Overlays that draw over the screen they were opened from.** `ui_components_context_menu_draw`
  and `ui_components_messagebox_draw` are called after the view's own draw, so the browser stays
  visible behind the menu. Both frameworks' equivalents are blocking modal screens that clear the
  frame first - Apostrophe's `ap_selection` opens its render block with `ap_draw_background()`,
  gabagool's `SelectionMessage` with `renderer.Clear()`
  (`pkg/gabagool/selection_message.go:187-188`). This is the modal-composition blocker in its
  mildest form: here it costs the backdrop, not the screen.
- **Image tinting.** `ui_components_nextui_tinted_sprite_draw` modulates white art by a palette
  colour, which is how the eight ledger icons, the cartridge placeholder and the folder glyph take
  the theme. `SetColorMod` is zero-hit in both.
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
- **`Z` and `C` buttons**, which the hint bars name and neither framework's button enum has.

Maps today, and more of it than for any other set:

- **The theme struct is a slot-for-slot match.** NextUI's seven colours are Apostrophe's
  `highlight` / `accent` / `button_label` / `text` / `highlighted_text` / `hint` / `background`
  (`include/apostrophe.h:244-254`) and gabagool's identically-named seven
  (`pkg/gabagool/internal/theming.go:10-20`), in the same order, with the same meanings, plus the
  background-image path the theme also supports. Theming is a hard gap for the other three sets and
  a complete match here.
- **Both list widgets already draw the label-hugging selection pill** that is this theme's
  signature: `pill_target_w = tw + pill_pad * 2` (`include/apostrophe_widgets.h:809-812`) and
  `pillWidth := Min32(maxPillWidth, measureText(font, itemText)+pillPadding)`
  (`pkg/gabagool/list.go:795`).
- **gabagool's `List` is close to the file browser outright** - hugging pill, plus contain-fit box
  art for the highlighted row anchored right and vertically centred.
- Rounded-rect and pill primitives in both (`ap_draw_pill`, `include/apostrophe.h:571`;
  `DrawRoundedRect`, `pkg/gabagool/list.go:803`), so the stadium and the 16 px panel need no
  nine-patch - even though the source blits `pill_cap_40` and `panel_corner_16` because the RDP has
  neither.
- Text measurement and ellipsis in both, which is what this theme's geometry is made of:
  `ap_measure_text` and `ap_measure_text_ellipsized` (`include/apostrophe.h:578-579`).
- The footer model - a left group and a right-aligned group of button-plus-label items - is the
  same idea, differing only in pill granularity.
- `ap_options_list` / `OptionList` is the settings screen minus the inner pill.
- **Nothing here is blocked on a degradable effect.** The theme declares none: all 28 of its
  fallback baselines are byte-identical to its normal ones, so blur, shaders and masks - which
  block Vitro and Elementerial - are simply not in play.

### slot

Full spec: [`themes/slot/reference/source-notes.md`](themes/slot/reference/source-notes.md).

> Assessed from the Rust source before the mockup set existed. The set has since been built
> (`app/src/themes/slot/`), and [`porting/slot.md`](porting/slot.md) records what it deviates on -
> notably the lcd3x mask, which is a *degraded* effect here rather than a missing one.

The odd one out in two ways. It is a **single-system** frontend - GBA only, one console, no
per-system anything - so the metadata and theming pressure that shapes the other four sets is
absent: no palette, no scraped art, and a theme file (`System/theme.txt`) that addresses four
colours of case and nothing else.
And it composes its chrome **around a live emulator frame**, which none of the other sets do.

Missing from both frameworks:

- **A spring.** The shelf is a critically damped integrator, `accel = -2w*v - w^2*(x - target)` with
  w = 16, stepped against real `dt` every frame (`crates/slot-ui/src/shelf.rs:168-170`). It has no
  duration and no curve - the same input from a moving row and a still one produces different
  paths, which is the point ("a flick lands on a cart instead of bouncing past"). `spring` and
  `velocity` are zero-hit in both, and the only `dt`-carrying call in either is Apostrophe's
  `ap_text_scroll_update(..., uint32_t dt_ms)` (`include/apostrophe.h:594`), a hand-rolled scroll
  rather than an integrator. Everything else in both is `t = (now - start) / DURATION`, which
  cannot carry velocity across a target change.
- **A piecewise travel over one progress.** The insert is ease, then a linear creep, then ease
  again - `CATCH_IN` 0.42, `CATCH_OUT` 0.62, `CREEP` 0.03 - so the cart falls to the lip, rests on
  it, and is pushed through (`crates/slot-ui/src/slot_chrome.rs:322-338`). The source records that
  a single ease was tried and rejected because it "arrives seated without ever having met
  anything". Neither framework has named curves at all, let alone a segmented one.
- **Smootherstep** (`u^3(u(6u - 15) + 10)`), chosen for zero velocity at both ends so the halves
  meet the catch without a step in speed. Zero-hit in both.
- **One progress driving six things at once.** A single `seat` moves the cart, parts the
  neighbours by 130 px, veils the layer behind, raises the panel, squeezes the game rect and fades
  the alert (`slot_chrome.rs:120-140`). Both frameworks animate at most one property of one widget.
- **A foreign frame inside the draw list.** `Draw::Game` is a marker carrying no geometry, because
  the pass owns its own rect - the power-on squeezes it - and `Draw::Shot` puts a 240x160 still
  through the same pass so it wears the same mask at the same scale
  (`crates/slot-gfx/src/draw.rs:26-34`). `emulator`, `libretro` and `frame_texture` are zero-hit in
  both; neither has any concept of compositing a framebuffer it does not own.
- **A post-processing pass over that frame**: an `lcd3x` 3x3 subpixel mask, a blue-light grade
  ramping toward `[1.0, 0.82, 0.62]` in nine steps, the power squeeze, and a compositor-level shake
  for the refusal (6 px at 14 Hz). No shader path in either framework.
- **Per-item alpha in the draw list.** `Draw::Tex` carries its own alpha, which is how the side
  carts sit at 0.55 and the wallpaper scrim at 0.62. Apostrophe's only alpha is internal to
  `ap_fade_draw`; gabagool has one `SetAlphaMod` site.
- **SVG rasterised into the cart face.** It is `cart.svg` plus `cart_detail.svg` through `resvg`.
  Apostrophe has no SVG; gabagool has `oksvg` but only inside `ProcessMessage`
  (`pkg/gabagool/process_message.go:406`).
- **An ordered draw list as the API.** slot's UI crates emit `Vec<Draw>` and the compositor
  consumes it in order, so paint order is list order and nothing re-bases it. Both frameworks are
  widget-call APIs where the widget owns the frame.

Maps today, and more than the shape of the set suggests: its gesture layer is the one part both
frameworks already cover well - chords are `ap_register_chord` (`include/apostrophe.h:548`) and
`RegisterChord` (`pkg/gabagool/combo.go:60`), and slot leans on chords, double taps and
hold-versus-tap throughout. The save-state switcher is a horizontal row of thumbnails with a fixed
three-key legend, which is gabagool's `List` with images or Apostrophe's `ap_selection`; the clock
picker is a five-field editor that `ap_options_list` / `OptionList` covers; and the HUD plate is a
rounded rect with an icon and a bar, which both draw natively.

### SimpleOS

Full spec: [`themes/simpleos/reference/source-notes.md`](themes/simpleos/reference/source-notes.md).

> Assessed from the release binary, its strings and symbols, and the trailer - SimpleOS ships no
> source. Built as `app/src/themes/simpleos/`; [`porting/simpleos.md`](porting/simpleos.md) records
> the deviations. Checked against Apostrophe at `5ed3f74` and gabagool at `895f493`.

The first set drawn across **two panels**, and otherwise the plainest in the registry. It has no
motion at all, checked at 30fps and confirmed by a binary with no easing or timeline code. It has no
theming and no degradable effect: all 20 of its fallback baselines are byte-identical to its normal
ones. It draws with SDL2's 2D renderer using fills, rounded rects, an 8x8 bitmap font and icon
textures, and nothing else. So its gaps are about the device, not the drawing.

Missing from both frameworks:

- **Two panels, one application.** SimpleOS drives a window and renderer per panel (`Video_top`,
  `Video_bot`; `SIMPLEOS_OUT_TOP` / `SIMPLEOS_OUT_BOT`), and the panels are one screen: the bottom
  panel's cursor decides what the top one draws. Apostrophe holds one window and one renderer in a
  global (`include/apostrophe.h:4680, 4699`); gabagool opens one window on display 0
  (`pkg/gabagool/internal/window.go:34, 83`). `GetNumVideoDisplays` is zero-hit in both. This is the
  modal-composition blocker doubled: a widget owns the frame, and this screen is two frames at once.
- **Chrome over a frame the UI does not produce.** The in-game menu is drawn straight over DraStic's
  output with no scrim, and the RetroAchievements banner over the game's top panel - the "composite
  a foreign framebuffer" row, absent in both, as for slot.
- **Touch.** The boot screen continues on a tap of the bottom panel. Menus highlight on a first tap
  and confirm on a second (`CHANGELOG.txt` 20260914), with a `*Hit` function per screen in the
  binary (`Ui_homeHit`, `Ui_menuHit`, `Ui_optionsHit`). `FINGERDOWN`, `TouchFinger` and
  `MOUSEBUTTONDOWN` are zero-hit in both. The only `touch` in either is a shell `touch /tmp/poweroff`
  (`include/apostrophe.h:4427`, `pkg/gabagool/init.go:109`).
- **A paged 3x2 grid** with the highlighted title's detail on the other panel - the grid row,
  absent in both.
- **A bitmap font at integer scales.** Every string is the binary's `FONT8X8` at 1x, 2x or 3x,
  blitted with `Draw_pixel`. Both frameworks draw text only through SDL_ttf
  (`TTF_RenderUTF8_Blended`, `include/apostrophe.h:2669`; `pkg/gabagool/internal/text_cache.go:58`).
  Apostrophe's `SDL_RenderDrawPoint` calls are its anti-aliased circle
  (`include/apostrophe.h:2508-2535`), not a glyph blitter. A TTF rebuilt from the table works at
  exact multiples of 8px, which is how this port draws it, but Apostrophe loads its own fonts bold
  (`include/apostrophe.h:1415`), which smears a pixel face. It would have to be opened by the caller
  and handed to `ap_draw_text` directly. gabagool has no public way to open an arbitrary face.
- **Nearest-neighbour scaling for the icons.** Each title's 32x32 banner icon is scaled per texture
  (`SDL_SetTextureScaleMode` is among the binary's imports). Apostrophe hints bilinear filtering
  globally (`include/apostrophe.h:4696`), and `SetTextureScaleMode` is zero-hit in both. gabagool
  therefore inherits SDL's default nearest filter for every texture, with no way to vary it.
- **Text with a dark edge.** The in-game menu and its title are drawn with `Draw_textShadow`,
  straight over the game. `shadow`, `outline` and `stroke` are zero-hit in Apostrophe; gabagool's
  four hits are anti-aliasing comments (`pkg/gabagool/internal/helpers.go:334, 364, 372-373`).

Maps today, and the whole animation half of the matrix costs nothing here. This is the first set
that asks for no tween, curve, timeline or effect, and Apostrophe's 50 ms pill lerp is the only
motion either framework would have to turn off, as for NextUI. Beyond that:

- Every settings screen - Options, Network, Game settings, This game with its `GLOBAL` / `ON` /
  `OFF` cycling, Power, Video - is `ap_options_list` / `OptionList`: label left, value right, values
  cycled in place.
- `ap_draw_text_clipped` (`include/apostrophe.h:595`) is SimpleOS's own `draw_text_clipped`: a hard
  cut at a width with no ellipsis, which is how every long title here ends.
- The on-screen keyboard SimpleOS uses for Wi-Fi and RetroAchievements credentials is `ap_keyboard`
  (`include/apostrophe_widgets.h:186`) or gabagool's `Keyboard` (`pkg/gabagool/keyboard.go:715`).
- Controls' bind-and-add remapping is close to gabagool's input-capture wizard
  (`pkg/gabagool/internal/input_capture.go`).
- Held-button repeat and chords - MENU+L1 brightness, the Anbernic-key shortcuts - are both
  frameworks' input layers, as for slot.
- The cards, tiles and rows are rounded rects, which both draw natively.

## What a port would have to add

Common to both, and in rough dependency order:

1. A compositor or scene layer that lets widgets coexist on one screen, replacing the
   blocking-modal model.
2. A time-based tween system with named easing curves - at minimum easeOutQuint, easeOut,
   exponential ease-out, linear, smoothstep and smootherstep - supporting per-property durations,
   per-property delays, concurrent tracks, and restart-on-event. Alongside it, a **velocity-carrying
   integrator**: slot's shelf is a critically damped spring with no duration at all, and a tween
   system cannot express one.
3. Render-to-texture as a public facility, for screen transitions and blur.
4. Image fit modes (contain with box-shrink-to-image, cover with centre crop, stretch,
   derive-one-axis-from-aspect) with public alpha and tint.
5. Arbitrary font sizes and families, with the face's line metrics exposed.
6. A grid and a carousel.
7. A data-driven theme and layout format, rather than 7 or 8 colours and compiled-in integer
   literals.
8. A video decode path.

That is a new rendering, layout and animation layer. What is worth taking from these projects
under their MIT licences is the input abstraction, the resolution scaling helpers and the text
primitives.
