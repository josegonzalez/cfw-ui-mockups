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
| Italic, and a regular weight beside bold | no - `TTF_STYLE_ITALIC` zero-hit; every font set bold at load (`apostrophe.h:1415`) | no - `italic` zero-hit; embedded Bold faces, no style call |
| Low-resolution canvas shown at an integer scale | no - `SDL_RenderSetLogicalSize` is the panel's own size (`apostrophe.h:4717`); `RenderSetIntegerScale` zero-hit | no - `SetLogicalSize` is the panel's own size (`internal/window.go:105-115`); same |
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
| Textured geometry (arbitrary vertex quads, for per-card perspective) | absent - `RenderGeometry`, `Vertex` and `RenderCopyEx` zero-hit | absent - `RenderGeometry` and `Vertex` zero-hit; `CopyEx` only rotates the internal display canvas (`internal/window.go:247`) |
| Additive blending | absent - `BLENDMODE_BLEND` and `NONE` only | absent - same |
| Hold versus tap on one button (a timed hold opening something else) | absent - the only press timing is the power key's long press, in its own thread (`include/apostrophe.h:4406-4425`) | absent - the only hold is `InputCapture`'s, for binding a button (`pkg/gabagool/input_capture.go:36`) |
| Procedural background drawn every frame (a fragment shader, or a streaming texture for a CPU-drawn fallback) | absent - `shader` and `SDL_GL` zero-hit bar a demo string (`examples/demo/main.c:1286`); `TEXTUREACCESS_STREAMING`, `UpdateTexture` and `LockTexture` zero-hit | absent - `shader` and `SDL_GL` zero-hit; `TEXTUREACCESS_STREAMING`, `UpdateTexture` and `LockTexture` zero-hit |
| Text drawn to a width other than its own (a horizontal squeeze) | not by `ap_draw_text`, which copies at the surface's size (`include/apostrophe.h:2675`); a caller can stretch its own texture with `ap_draw_image` (600) | no - the string texture is `RenderTextCached` in `internal/` (`internal/text_cache.go:42`), not public |
| Colour runs inside one string | absent - `markup`, rich text and colour runs zero-hit | absent - same |
| Sound effects (a short clip played on a press) | absent - `Mix_`, `SDL_mixer`, `OpenAudio` and `AudioStream` zero-hit | absent - the same four zero-hit; `INIT_AUDIO` is started and unused (`internal/sdl.go:15`) |

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

### TortOS

Full spec: [`themes/tortos/reference/source-notes.md`](themes/tortos/reference/source-notes.md).

> Assessed from the C source, `ericreinsmidt/TortOS` at `v1.0-3-g9b9c342`. Built as
> `app/src/themes/tortos/`; [`porting/tortos.md`](porting/tortos.md) records the deviations.
> Checked against Apostrophe at `5ed3f74` and gabagool at `895f493`.

The closest of any set to what these frameworks are: a C launcher on SDL2, SDL_ttf and
SDL_image, one font, one flat palette, and most of its screens a list in a panel over the
shelf. What separates it is the shelf itself, which is drawn with textured geometry rather than
copied rects. It also has motion on almost everything the player touches.

Missing from both frameworks:

- **Textured geometry.** Every coverflow card is 16 strips through `SDL_RenderGeometry`, projected
  per card by `F / (F + z)` with `F` six half-widths (`src/coverflow.c:451-621`). The cube turns
  two whole screens as 32 strips each (`cube_face`, 736). `RenderGeometry`, `Vertex` and
  `RenderCopyEx` are zero-hit in both, so neither can even rotate a texture, let alone yaw one.
- **A coverflow.** Seven cards, drawn far to near, with scale and alpha falling to a side value
  one step out, three fit rules (contain, equal area, wide area), and reflections from where the
  art's opaque pixels stop down to a shared floor (`draw_card`, 485). This is the carousel row,
  absent in gabagool and a row of text pills in Apostrophe. The reflection row is absent in both.
- **Two whole screens rendered offscreen and composited in 3D.** The cube draws each face into a
  full-screen target (`face_tex`, `src/main.c:492`). Apostrophe never calls `SetRenderTarget`.
  gabagool calls it only for its rotation canvas and an anti-aliased shape cache
  (`internal/window.go:152`, `internal/helpers.go:394`).
- **Additive blending.** Every glow - the bottom wash, the light behind the focused card, the
  halo round each panel - is one texture tinted with `SetTextureColorMod`/`AlphaMod` and drawn with
  `SDL_BLENDMODE_ADD` (`src/ui.c:63-86, 370-385`). Both frameworks use only `BLEND` and `NONE`
  (`include/apostrophe.h:719, 4716`; `internal/helpers.go:410, 421`). `SetColorMod` is zero-hit
  in both.
- **A retargetable tween.** Each shelf move is a fixed-duration tween that restarts from wherever
  the cards are drawn when a press arrives. A Cubic shelf also chases, never more than a step
  behind. A move past eight cards is an accelerating departure that cuts to its destination
  (`cf_set_cursor_dir`, `src/coverflow.c:234-327`). Three curves are named: ease-out cubic,
  smoothstep and ease-in cubic. Named curves are zero-hit in both.
- **Exponential chases.** The background tint, `1 - e^(-9 dt)` landing within 12 per channel
  (`tick_tint`, `src/main.c:3154`), and the menu plate, two chained decays at 22ms (3780-3861).
  Apostrophe's 50ms linear pill lerp is the nearest thing in either framework.
- **Concurrent tracks on one interaction.** One press moves the shelf, the rail marker and the
  tint together. Stood on end, it also crossfades the system's name on the move's linear clock
  (`cf_label`, 329). Both frameworks animate at most one property of one widget.
- **A panel over a live shelf.** Every menu draws the shelf, a dim and then its panel, and the
  tint keeps moving behind the panel while it is open (`menu_run_body`, `src/main.c:4554-4562`).
  This is the composition blocker in its smallest form.
- **Arbitrary sizes of one face.** Josefin Sans opens at 60, 49, 55, 37, 71 and 560
  (`src/ui.c:35-42, 797`). Both frameworks fix six tiers.

Maps today:

- Most of the screen count. Wi-Fi, Bluetooth, Play Time, About, Controls, the system menu, game
  details and the in-game menu are label-left, value-right lists with values cycled in place. That
  is `ap_options_list` (`include/apostrophe_widgets.h:170`) or gabagool's `OptionList`. The forget
  prompt is `ap_confirmation` (213) or `confirmation_message.go`.
- The sign-in and Wi-Fi password keyboard is `ap_keyboard` (`apostrophe_widgets.h:186`) or
  `Keyboard` (`pkg/gabagool/keyboard.go:715`). TortOS's is ten keys by four rows with shift and
  symbol layers, which both cover.
- Both frameworks have a ping-pong marquee with a pause at each end: `ap_text_scroll_update`
  (`include/apostrophe.h:3094`) and `listController.updateScrollData`
  (`pkg/gabagool/list.go:1035`). TortOS's is 70px/s with 1.4s and 0.9s holds and faded edges.
  Apostrophe's steps a fixed pixel per update, so it would need timing by `dt`.
- "..." truncation is `ap_draw_text_ellipsized` (`apostrophe_widgets.h:1377`) or gabagool's
  `list.go:1132`, both using three full stops as TortOS does. Rounded rects, the panel's border
  and the plate are native in both.
- Held-button repeat (300ms, then 90ms) is both frameworks' input layer. TortOS has no chords to
  ask for.

### NeoStation

Full spec: [`themes/neostation/reference/source-notes.md`](themes/neostation/reference/source-notes.md).

> Assessed from the Flutter source, `misobadev/neostation-frontend` at `d9bece5`. Built as
> `app/src/themes/neostation/`; [`porting/neostation.md`](porting/neostation.md) records the
> deviations. Checked against Apostrophe at `5ed3f74` and gabagool at `895f493`.

The first set written against a retained-mode toolkit. Everything is laid out in units of a 640x480
design size and scaled to the screen, in one face at dozens of sizes, in 14 switchable Material
colour schemes. Its screens are the tab bar floating over a tab's content, with a dialog, menu or
panel over both. So it asks for the composition model first and a drawing layer second. It is
also the only set with italic text.

Missing from both frameworks:

- **A header over every tab, and dialogs over a live screen.** The header floats over the tab
  content (`lib/screens/app_screen.dart:713-736`). Every dialog is `showDialog` over the screen
  behind it, with a black 0.54 barrier. The Options menu is anchored to its card, with a submenu
  beside it. This is the modal-composition blocker: both frameworks clear the frame for each
  screen.
- **A tab bar.** A glass pill of icon tabs with a highlight that slides 160ms `easeInOut`, cycled by
  the bumpers across whichever tabs Settings leaves visible (`lib/widgets/header.dart:365, 605`).
  The `tab` and `Tab` hits in both are tables (`include/apostrophe_widgets.h:285-288`,
  `pkg/gabagool/detail.go:205`). Neither has one.
- **A grid with a spanning cell.** The Recent card fills the top-left 3x2 block of the systems grid,
  and moves step off it by its edge. A focus box slides between cards 256ms `fastOutSlowIn`
  (`my_systems_grid.dart:1311`). This is the grid row; the only grid in either is the colour
  picker's (`pkg/gabagool/color_picker.go:16-17`).
- **A carousel with depth.** `NativeCarousel` falls off in scale and opacity per page from the
  centre, 0.6 at the centre losing 1.0 per page to a floor of 0.1 (`lib/widgets/native_carousel.dart:19-32`),
  with a chip bar under it. This is the carousel row, absent in gabagool and a row of text pills in
  Apostrophe.
- **Cubic Bézier curves and concurrent tracks.** The source's curves are Flutter's: `easeOutQuart`,
  `fastOutSlowIn` (`Cubic(0.4, 0, 0.2, 1)`), `easeInOutCubic` and `easeOutCubic`, among others.
  `bezier` and `cubic` are zero-hit in both. The grid's focus box moves and resizes on one clock,
  and a carousel page moves and fades on one. Both frameworks animate at most one property of one
  widget.
- **Arbitrary sizes and an icon font.** Anta opens at every `.r` size the source names, times the
  device's text scale. The icons are Material Symbols drawn by codepoint at 12 to 48 units. Both
  frameworks fix six tiers.
- **Italic.** The scraper's estimate, its thread states and its idle slots are `FontStyle.italic`
  (`scraping_content.dart:294, 518, 532`), synthesised from Anta's one upright face. `italic` and
  `TTF_STYLE_ITALIC` are zero-hit in both. Apostrophe sets every font bold at load
  (`include/apostrophe.h:1415`), and gabagool embeds Bold faces with no style call
  (`pkg/gabagool/internal/fonts_nextui.go:7-10`). So neither can draw a regular weight beside a
  bold one either.
- **Tinted glyphs.** Every button glyph, system logo and bumper is a monochrome image drawn in a
  theme colour (`Image.asset(color:)`, `lib/widgets/core_footer.dart:203-205`). `SetColorMod` is
  zero-hit in both. Apostrophe's `SetTextureAlphaMod` calls are its own status sprites only
  (`include/apostrophe.h:2559, 2625, 4039, 4182`).
- **A theme that is a colour scheme.** 14 built-in themes, each a Material `ColorScheme` of some
  thirty roles plus a corner-radius tier, switched at runtime from Settings (`lib/themes/*_theme.dart`).
  Both frameworks' themes are NextUI's seven colours.
- **Shadows and gradients.** `BoxShadow` sits under every pill (`core_footer.dart:176`). A
  `LinearGradient` fades the fanart into the list (`lib/screens/game_screen/my_games_list.dart:975`),
  and 16 files draw one. `shadow` and `gradient` are zero-hit in both.
- **WebP.** All 111 system logos are `.webp` (`assets/images/logos/`). Apostrophe initialises PNG
  and JPG only, and gabagool's `INIT_WEBP` is the nominal flag recorded above.
- **Clipped scrolling panes.** The games list, the details card, dropdowns and the settings pages
  each scroll inside a clip. Apostrophe clips (the Clip / scissor row); `SetClipRect` is zero-hit in
  gabagool.

The glass is not on this list: NeoGlass's blur is off by default and draws a flat tint without it
(`lib/widgets/neo_glass.dart:119-120`), and its rim is web-only here. Video, the music card's
shaders and downloaded art packs are not reproduced, so they are not asked for.

Maps today:

- The header's clock and battery are both frameworks' status bars. Apostrophe draws a battery
  sprite (`ap_draw_status_bar`, `include/apostrophe.h:4213`). gabagool has a 12- or 24-hour clock
  (`pkg/gabagool/status_bar.go:12-17`), which is NeoStation's "Use 12-Hour Clock".
- Every footer of button hints is `ap_draw_footer` (`include/apostrophe.h:3322`) or gabagool's
  `FooterHelpItem`. Every confirm - Logout, Delete, Confirm Exit - is `ap_confirmation`
  (`include/apostrophe_widgets.h:213`) or `ConfirmationMessage`
  (`pkg/gabagool/confirmation_message.go:63`).
- The scan bar, the storage meters and the scraper's stat bars are `ap_draw_progress_bar`
  (`include/apostrophe.h:3073`). gabagool draws one only inside its download screen
  (`pkg/gabagool/download.go:119-143`).
- Settings' toggle and value rows are `ap_options_list` or `OptionsList`
  (`pkg/gabagool/option_list.go:254`). Game info's metadata and description are the shape of
  gabagool's `DetailScreen` sections (`pkg/gabagool/detail.go:164-182`).
- Pills, rounded rects and the step indicator's circles are native in both (`ap_draw_pill`,
  `ap_draw_circle`, `include/apostrophe.h:2610, 2658`).
- Held-button repeat is both frameworks' input layer: Apostrophe's 300ms then 100ms
  (`include/apostrophe.h:133-134`) against the source's 300ms then 80ms. Select + A and Select + Y
  are chords, which both detect (`AP_COMBO_CHORD`, `include/apostrophe.h:342`;
  `pkg/gabagool/combo.go:14`).
- Text is measured to lay out the header, and wrapped and ellipsised in every panel, which both
  frameworks' text primitives do.

### DS Style

Full spec: [`themes/ds-style/reference/source-notes.md`](themes/ds-style/reference/source-notes.md).

> Assessed from the C source, `FrankieT19/rg-sp-ds-style` at `2847683`. Built as
> `app/src/themes/ds-style/`; [`porting/ds-style.md`](porting/ds-style.md) records the deviations,
> and every still matches a frame the launcher rendered itself. Checked against Apostrophe at
> `5ed3f74` and gabagool at `895f493`.

The smallest drawing vocabulary in the registry: six primitives, no blending, one bitmap font and
one canvas of 240x160 shown at exactly 3x. It does not even use SDL, writing the framebuffer
directly. What it asks of a framework is therefore less about effects than about owning the pixels:
a low-resolution canvas, exact nearest-neighbour art, and a bitmap face. It also needs popups over
a live list, which is the composition blocker again.

Missing from both frameworks:

- **A low-resolution canvas at an integer scale.** Everything is laid out on 240x160 and shown at
  3x (`source/dsstyle.c:45-46`, `ui.h:369-390`). Both frameworks set the renderer's logical size to
  the panel's own (`include/apostrophe.h:4717`, `pkg/gabagool/internal/window.go:105-115`), and
  `RenderSetIntegerScale` is zero-hit in both. They lay out against a 1024px reference width instead
  - a different, damped scale. A port would draw at 3x literally or render to a small target, and
  Apostrophe has no render target.
- **Popups, a keyboard and a cursor over a live screen.** The Home cursor's corners are drawn over
  Home. Notices, confirms, "Launching" and the search keyboard are drawn over the list they belong
  to, which stays visible around them (`ui.h:319-338`, `extra_ui.h:50-57`). This is the composition
  blocker; both frameworks' confirmation and keyboard screens clear the frame.
- **Art sampled per physical pixel, nearest, top-left.** Artwork is scaled with integer division
  at 720x480 (`ui.h:352-358`), so a 480x320 picture in a 120x80 slot is crisp and exact. Apostrophe
  hints bilinear filtering globally (`include/apostrophe.h:4696`), which softens every picture;
  `SetTextureScaleMode` is zero-hit in both. gabagool's default nearest is right in kind, but only
  as SDL's default, with no way to choose it per texture.
- **A bitmap font on a six-pixel advance.** Every glyph is 8x12, drawn eight columns wide and
  advanced six (`dsstyle.c:118-124`), and anything outside ASCII and 66 Latin letters is `?`. Both
  frameworks draw text only through SDL_ttf. A rebuilt TTF works, as in this port - once each
  glyph's side bearing is its own left edge. Apostrophe loads its fonts bold
  (`include/apostrophe.h:1415`), which smears a pixel face, and gabagool has no public way to open
  one (as for SimpleOS).
- **A retargetable glide on a named curve.** The Home cursor's four corners move 200ms on
  smoothstep and set off again from where they are drawn when a press arrives mid-glide
  (`ui.h:190-209`). Named curves are zero-hit in both, as for TortOS.
- **A wrapping marquee.** The chosen title holds 333ms, then scrolls at 30 logical px/s and wraps
  round, repeating every name-plus-three-glyphs, sampled per physical pixel (`ui.h:249-264`). Both
  frameworks' marquees are ping-pong (`ap_text_scroll_update`, `include/apostrophe.h:3094`;
  `pkg/gabagool/list.go:1035`).
- **A theme that is a set of images.** Each of 16 accent themes brings its own title bar and folder
  and GBA icons, and dark mode swaps all five backgrounds (`original_layout.h:81-85`, `ui.h:28, 73-80`).
  Both frameworks' themes are NextUI's seven colours.

Not on this list:
- **Colour keys.** The 16x14 icons use pure black as a colour key (`dsstyle.c:107`), and
  `SetColorKey` is zero-hit in both. A port can bake the key into the images, as this one does.
- **The LCD grid.** It is a per-pixel multiply over the frame (`ui.h:340-366`), and `BLENDMODE_MOD`
  and `MUL` are zero-hit in both. But the port declares it web-only, with the fallback off.
- **Pixel Transparency.** The port does not reproduce it.

Maps today:

- **Settings.** Every page is label-left, value-right rows cycled in place, which is
  `ap_options_list` or gabagool's `OptionsList` (`pkg/gabagool/option_list.go:254`).
- **Confirms.** Reboot, Shutdown and the launch-mode choice are two-answer confirms:
  `ap_confirmation` (`include/apostrophe_widgets.h:213`) or `ConfirmationMessage`
  (`pkg/gabagool/confirmation_message.go:63`).
- **The search keyboard** is a 40-key grid with Delete and Results, the shape of `ap_keyboard`
  (`include/apostrophe_widgets.h:186`) or gabagool's `Keyboard` (`pkg/gabagool/keyboard.go:715`).
- **Rebinding.** Settings > Controls rebinds every button by capturing the next press. That is
  gabagool's input-capture wizard and JSON remapping (`pkg/gabagool/input_capture.go:171`,
  `internal/input_mapper.go:18`).
- **Languages.** DS Style ships eight and switches at runtime. gabagool has go-i18n with
  `SetLanguage` and `GetString` (`pkg/gabagool/i18n/i18n.go:61, 78`); Apostrophe has no localisation
  (`locale` and `i18n` zero-hit).
- **Text.**
  - Every string is hard-cut after a glyph count, never ellipsised, which is
    `ap_draw_text_clipped` (`include/apostrophe.h:595`).
  - The help boxes are word-wrapped at 33 glyphs, which both frameworks' wrap does.
  - The scrolling title is clipped to its column: Apostrophe clips, gabagool does not.
- **Input.** Held-direction repeat (350ms, then 100ms) and the MENU + VOL chord are both frameworks'
  input layers.

### Wii Menu

Full spec: [`themes/wii-menu/reference/source-notes.md`](themes/wii-menu/reference/source-notes.md).

> Assessed from recordings of System Menu 4.3U and the WM4K texture pack - the Wii Menu is closed.
> Built as `app/src/themes/wii-menu/`; [`porting/wii-menu.md`](porting/wii-menu.md) records the
> deviations. Checked against Apostrophe at `5ed3f74` and gabagool at `895f493`.

The screens are simple to draw - flat fills, pills, textures, one family of text - but nearly every
one is one thing moving over another: a preview growing out of a grid slot, a HOME Menu sliding over
whatever is showing, a page of channels sliding past its neighbours. The composition blocker and the
missing animation system are most of the gap.

Missing from both frameworks:

- **A paged grid that slides.** Four pages of 4x3 slots side by side, the neighbouring pages' edge
  columns showing, sliding 512px in 333ms. Grid and tween are both absent.
- **A panel that grows out of a slot.** The preview scales from the 120x90 slot to 585x439 while the
  grid behind swells towards the slot and fades to black, then reverses on Wii Menu. That is a composed panel drawn scaled, which needs
  render to texture: Apostrophe never calls `SetRenderTarget`, and gabagool only internally. The
  panel also clips its banner to rounded corners; `RenderSetClipRect` is rectangular in Apostrophe
  and zero-hit in gabagool, and a rounded clip is zero-hit in both.
- **Overlays over a live screen.** The HOME Menu over the Wii Menu or a running channel, the name
  bubble over the grid, the SD Card Menu's About dialog and "No Miis have been registered" over
  their screens. The dim itself is no gap - both fill with alpha (`ap_fade_draw`,
  `include/apostrophe.h:712`; `pkg/gabagool/list.go:191`) - but keeping anything drawn beneath it
  is the composition blocker.
- **Motion on named curves, several tracks at once, many looping.** The HOME Menu's bars slide in
  217ms while the screen dims, Settings pages slide 233ms while the arriving page brightens, a
  chosen tile flashes and flies into the title tab, dialogs slide up from the bottom edge. Every
  stock channel's icon loops on its own 6-17s cycle of cross-fades and slides - the Disc Channel's
  turning edge-on and back - alongside the page arrows' bob, the clock's blinking colon, the empty
  slots' static and the Health & Safety prompt. Named curves and looping tracks are zero-hit in
  both.
- **Text from 10px to 38px in three weights**, one family. Both have six fixed tiers, and Apostrophe
  loads every face bold.

Not on this list:
- **The Settings pages.** Each is one whole image per state, so a port shows an image. They are WebP
  here; Apostrophe initialises PNG and JPEG only (`include/apostrophe.h:4556`), so a port would ship
  PNG.
- **The bar's curved edge and the gradients.** Bezier and polygon fills are zero-hit in both, but
  both can be images.
- **Tinted textures.** The clock, mail icon and Nintendo Channel name are tinted in the images.

Maps today:

- **Screen changes from black.** Every screen but the preview fades up from black, which is
  `ap_fade_begin_in` and `ap_fade_draw` (`include/apostrophe.h:691, 712`) - linear, where the port
  eases out. gabagool's router hard-cuts.
- **Settings lists.** Four items and Back is `ap_list` (`include/apostrophe_widgets.h:117`) or
  gabagool's `List` (`pkg/gabagool/list.go:149`).
- **Pick-one pages.** Sound, TV Resolution and the rest choose one of two or three, the shape of
  `ap_selection` (`include/apostrophe_widgets.h:228`) or `SelectionMessage`
  (`pkg/gabagool/selection_message.go:66`), though the Wii shows them full-screen with Back and
  Confirm.
- **Yes and No.** Wii System Update is `ap_confirmation` (`include/apostrophe_widgets.h:213`) or
  `ConfirmationMessage` (`pkg/gabagool/confirmation_message.go:63`).
- **Input.** D-pad focus and the shoulder buttons are both frameworks' input layers.

### spruceOS

Full spec: [`themes/spruceos/reference/source-notes.md`](themes/spruceos/reference/source-notes.md).

> Assessed from spruceOS at `2b7bc4a79` - its launcher PyUI, Python on the same SDL2 renderer both
> frameworks use. Built as `app/src/themes/spruceos/`; [`porting/spruceos.md`](porting/spruceos.md)
> records the deviations. Checked against Apostrophe at `5ed3f74` and gabagool at `895f493`.

The closest set yet to what the frameworks already are: an SDL2 launcher on the same devices -
the TrimUI Smart Pro and Brick, the Miyoo Flip - drawn from flat images and one family of text, with
little motion. The gap is the layout it takes from its theme on seven panels, two grids, and popups
over a frozen screen.

Missing from both frameworks:

- **Layout from the theme's images, per panel.** SPRUCE ships a config, a skin and icons for each of
  seven panels from 640x480 to 1280x720, and PyUI sizes everything from them: a row is as tall as
  `bg-list-s.png`, the top bar as tall as `bg-title.png`, fonts from 18 to 40px. Both frameworks take
  seven colours and two paths and no layout (see the matrix), and six fixed font tiers.
- **Grids.** The main menu is one row of icons that wraps as a ring; Games and a game list's grid
  view are two rows with a selection image behind the focus. Grid is absent in both.
- **Popups over a frozen screen.** MENU opens a list over a copy of the screen beneath, with the bars
  redrawn over it. Each framework's widget owns the whole screen and its event loop, which is the
  composition blocker.
- **A MENU hold as well as a tap.** A tap opens the popup; held past 300ms, the Game Switcher opens
  from any screen. Apostrophe's only press timing is the power key's long press in its own thread
  (`include/apostrophe.h:4406-4425`); gabagool's only hold is `InputCapture`'s, for binding a button
  (`pkg/gabagool/input_capture.go:36`).
- **Fit and centre-crop.** Box art is fitted to its box, and a game grid's cells centre-crop it;
  Apostrophe stretches (`ap_draw_image`, `include/apostrophe.h:600`) and gabagool fits with no
  option, and `zoom`, `cover` and `crop` are zero-hit in both. The selection bar is drawn cropped to
  where the picture starts, which `ap_draw_image` has no source rectangle for.
- **Two slides.** The Game Switcher slides its pictures a screen's width or height in 300ms, and the
  carousel view slides each slot to its neighbour's place and size; there is no tween in either.
- **PyUI's marquee.** The focused name rotates a character per redraw after a second. gabagool
  scrolls long list text by pixels with a pause at the ends (`pkg/gabagool/list.go:41-42, 75-76`),
  which is a marquee but not this one; `marquee` is zero-hit in Apostrophe.

Not on this list:

- **The top bar.** A clock, battery and Wi-Fi are `ap_status_bar_opts` (`include/apostrophe.h:306-311`)
  and gabagool's `StatusBarOptions` (`pkg/gabagool/status_bar.go:53`), though SPRUCE draws its own
  icons and puts the title between them.
- **The bottom bar.** SPRUCE's hint glyphs are transparent, so it is a plain strip.

Maps today:

- **Settings.** A label with a value cycled by LEFT and RIGHT is `ap_options_list`
  (`include/apostrophe_widgets.h:170`) or `OptionsList` (`pkg/gabagool/option_list.go:254`).
- **Rom Search.** The keyboard is `ap_keyboard` (`include/apostrophe_widgets.h:186`) or `Keyboard`
  (`pkg/gabagool/keyboard.go:715`).
- **The power prompt.** `ap_confirmation` (`include/apostrophe_widgets.h:213`) or
  `ConfirmationMessage` (`pkg/gabagool/confirmation_message.go:63`).
- **Plain lists.** Apps without their icons, and Tasks, are `ap_list` (`include/apostrophe_widgets.h:117`)
  or `List` (`pkg/gabagool/list.go:149`).
- **Input.** D-pad focus, shoulders paging and held-button repeat are both frameworks' input layers.

### Dreamcast BIOS

Full spec: [`themes/dreamcast-bios/reference/source-notes.md`](themes/dreamcast-bios/reference/source-notes.md).

> Assessed from boot ROM v1.01d - its textures, font and strings - and a recording of the menu on a
> real console; the BIOS is closed. Built as `app/src/themes/dreamcast-bios/`;
> [`porting/dreamcast-bios.md`](porting/dreamcast-bios.md) records the deviations. Checked against
> Apostrophe at `5ed3f74` and gabagool at `30cf8cf`.

A console menu at 640x480 with one look and no theming. Its screens are flat boxes, blobs and one
bitmap font, but none is ever drawn alone: every screen sits over a sky that never stops, fades out
to it and back, and its dialogs stack one over another over the screen that opened them. So the gap
is a render loop and the composition blocker first, and a text layer second.

Missing from both frameworks:

- **A background that never stops, under everything.** The sky is a live procedural function -
  gradient, drifting cloud, a turning disc of cloud - drawn every frame as a GLSL shader, with the
  same function on the CPU at a quarter of the resolution, smoothed up, as its declared fallback
  (`background/sky.ts`, `background/index.tsx`). Neither framework has a shader path: `shader`,
  `GLSL` and `SDL_GL` are zero-hit in both, bar a demo string in Apostrophe
  (`examples/demo/main.c:1286`). Neither has a streaming texture to upload the fallback into -
  `TEXTUREACCESS_STREAMING`, `UpdateTexture` and `LockTexture` are zero-hit in both - so a port
  would create a texture from a surface every frame, as `ap_draw_text` already does for each string
  (`include/apostrophe.h:2666-2682`). The upscale wants smoothing: Apostrophe hints bilinear globally
  (`include/apostrophe.h:4695`), and gabagool's default nearest would show the quarter-resolution
  pixels. As for Vitro Launcher, a screen that is never static defeats Apostrophe's dirty-frame idle
  loop.
- **Screens and dialogs over it, stacked.** Every screen is drawn over the sky, and each box opens
  over the screen that asked, which stays drawn: the Language box over Settings' rows, "Set all
  memory cards to / Date/Time of main console." over the memory-card clock box over Settings, "File
  was deleted." over the file list. The root draws every open box, oldest first (`index.tsx`). Both
  frameworks' screens clear the frame first - Apostrophe's `ap_confirmation` and `ap_selection`
  open their render with `ap_draw_background()` (`include/apostrophe_widgets.h:2525, 2615`),
  gabagool's with `renderer.Clear()` (`pkg/gabagool/selection_message.go:187-188`,
  `confirmation_message.go:186`, `list.go:188`). This is the composition blocker, three deep.
- **A fade to the sky rather than to black.** Leaving a screen, its contents fade out over the sky
  in 100ms, the sky shows alone for 150ms, and the next screen fades up in 100ms; a dialog fades up
  in 100ms. All are linear. The contents are translucent - the Settings rows at 0.72, the dialogs at
  0.9, the models at 0.65 of their materials' alpha - so a screen has to fade as one composed layer, not element by element,
  and the opacities nest: a blinking blob inside a dialog fading up inside a screen fading out.
  Apostrophe's `ap_fade_draw` fills black over the frame (`include/apostrophe.h:712-721`);
  gabagool's router hard-cuts, and `fade` is zero-hit in it. A layer's alpha needs render to texture
  and `SetAlphaMod`: Apostrophe has neither, and gabagool has both only inside `internal/`
  (`internal/helpers.go:382, 410`).
- **Looping tracks with a resting value.** A focused option's blob blinks yellow over green, 200ms
  each, forever - a step, not a fade (`BLINK`, `motion.ts`). The focused main-menu model plays its
  own motion from the ROM, 60 keys a second, round and round. A still rests with the blob yellow
  and every model at frame 0. The only blinks in either
  framework are the keyboards' 500ms carets, hand-rolled inside the widget
  (`include/apostrophe_widgets.h:1727-1732`; `pkg/gabagool/keyboard.go:75-76, 164`). Named curves and
  looping tracks are zero-hit in both.
- **Text squeezed to a width, in two stacked faces.** The system font is 1bpp on a 12-pixel cell,
  rebuilt as two TTF faces - an emboldened fill and a halo a pixel wider - drawn one over the other.
  Each run is squeezed horizontally to an advance that depends on where it is: 12, 11, 10.25 or 10
  pixels a glyph (`ADVANCE`, `views/parts.tsx`). Apostrophe's `ap_draw_text` copies at the surface's
  own size (`include/apostrophe.h:2675`), so a caller would render the string itself and stretch it
  with `ap_draw_image(tex, x, y, w, h)` (600). gabagool's string texture comes from
  `RenderTextCached` in `internal/` (`internal/text_cache.go:42`), which is not public. Apostrophe
  also loads every face bold (`include/apostrophe.h:1415`), which would thicken the already
  emboldened fill; as for SimpleOS, the caller would have to open it.
- **Colour and icon runs inside one string.** The ROM's strings switch to yellow and back with
  `\x16` / `\x17`, and name the pad's buttons with `\x01 n` icon glyphs, mid-line: "Select file(s)
  and press Ⓐ Button." Both frameworks draw a string in one colour; `markup`, rich text and colour
  runs are zero-hit in both. The icons are glyphs in the same face, so only the colour change needs
  support.
- **A grid.** The file list is an 8x3 grid of saves with ALL above it and BACK below, the card
  picker is four ports of two sockets, and the main menu is 2x2. Grid is absent in both.
- **3D models, lit, translucent and moving.** The main menu's four models are the ROM's own meshes -
  656 vertices for the controller - drawn with depth, per-vertex light and alpha, the focused one
  following its 60-frame motion of position, rotation and scale (`models/`). The CD player's disc is
  textured as well, its back environment-mapped, and it turns and tips while it plays. Both frameworks draw
  only rectangles and textures: `RenderGeometry` and `Vertex` are zero-hit in both (the textured
  geometry row above), and neither has a depth buffer (`DEPTH_TEST`, `zbuffer` and `depth_buffer`
  are zero-hit in both). A port could pre-render each model's 60
  frames as sprites - 240 images - trading memory for the missing path.
- **Sound.** The BIOS sounds every press - the cursor, confirm, back, an alert as a warning opens -
  and plays an eight-second boot sound at power-on, all decoded or rendered from its ROM into 16-bit
  WAVs (`assets/sounds/`). Neither framework plays audio: `Mix_`, `SDL_mixer`, `OpenAudio` and
  `AudioStream` are zero-hit in both. gabagool starts SDL's audio subsystem
  (`pkg/gabagool/internal/sdl.go:15`) and never uses it.

Not on this list:

- **The models that do not move.** File's controller and memory cards and Settings' icons are the
  ROM's models as well, but drawn at rest: each is one static picture a port would ship as PNG,
  so they need none of the path the main menu's moving models do.
- **The blobs and lozenges.** A 46x36 ellipse, and Music's radial-gradient lozenges. `ellipse` and
  `radial` are zero-hit in both, but both can be images.
- **Theming.** One look; nothing is switchable.

Maps today:

- **The Yes/No box.** Delete opens on No, which is `ap_confirmation`
  (`include/apostrophe_widgets.h:213`) or `ConfirmationMessage`
  (`pkg/gabagool/confirmation_message.go:63`), minus the list behind it.
- **Pick-one boxes.** Language, Sound, Auto start and the file menu's Copy / Delete / Cancel choose
  one of a short list, the shape of `ap_selection` (`include/apostrophe_widgets.h:228`) or
  `SelectionMessage` (`pkg/gabagool/selection_message.go:66`). The BIOS, though, places each option
  on a blob at a measured position, with a title that follows the focus.
- **Picking saves together.** X and Y mark saves of one game to act on together. Both lists have a
  multi-select mode - Apostrophe's `multi_select` (`include/apostrophe_widgets.h:87`), gabagool's
  `MultiSelectButton` (`pkg/gabagool/list.go:45`) - though as a list with checkboxes, not a grid.
- **Pills and rounded boxes.** The main menu's 114x42 pills are `ap_draw_pill`
  (`include/apostrophe.h:591`), and the dialogs, fields and card box are rounded rects in both.
- **PNG.** Every ROM texture is extracted as PNG, which both load (`include/apostrophe.h:4557`;
  `pkg/gabagool/internal/window.go:169`).
- **Input.** D-pad, A, B, X and Y are in both enums (`AP_BTN_X` / `AP_BTN_Y`,
  `include/apostrophe.h:181-182`; `VirtualButtonX` / `VirtualButtonY`,
  `pkg/gabagool/constants/constants.go:78-79`). There are no chords or holds to ask for.

## What a port would have to add

Common to both, and in rough dependency order:

1. A compositor or scene layer that lets widgets coexist on one screen, replacing the
   blocking-modal model.
2. A time-based tween system with named easing curves - at minimum easeOutQuint, easeOut,
   exponential ease-out, linear, smoothstep and smootherstep, and cubic Béziers for Flutter's curves
   such as `fastOutSlowIn` - supporting per-property durations, per-property delays, concurrent
   tracks, and restart-on-event. Alongside it, a **velocity-carrying
   integrator**: slot's shelf is a critically damped spring with no duration at all, and a tween
   system cannot express one.
3. Render-to-texture as a public facility, for screen transitions, blur and TortOS's cube,
   with textured geometry and additive blending beside it - and a low-resolution canvas shown at an
   integer scale, for DS Style's 240x160 at 3x.
4. Image fit modes (contain with box-shrink-to-image, cover with centre crop, stretch,
   derive-one-axis-from-aspect) with public alpha and tint.
5. Arbitrary font sizes and families, with the face's line metrics exposed, and italic and regular
   as well as bold.
6. A grid and a carousel.
7. A data-driven theme and layout format, rather than 7 or 8 colours and compiled-in integer
   literals.
8. A video decode path.
9. A timed hold as its own input, distinct from a tap on the same button, for spruceOS's MENU.

That is a new rendering, layout and animation layer. What is worth taking from these projects
under their MIT licences is the input abstraction, the resolution scaling helpers and the text
primitives.
