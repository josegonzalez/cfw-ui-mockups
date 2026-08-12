# slot source notes

Exact values extracted from slot (`github.com/BrandonKowalski/slot` at `7cfa1ab`), a bespoke
GBA-only frontend for the Anbernic RG SP, written in Rust. These are the authoritative spec for the
mockups. File:line references point into the source repo, under `crates/`.

**No mockup set has been built from these notes yet.** They exist so the framework assessment in
[`frameworks.md`](../../../frameworks.md) has a spec to work from; there is no
`app/src/themes/slot/`, no baselines and no porting notes, and nothing here has been checked
against a rendered screen.

## Global

- **Output: 720x480**, fixed (`slot-gfx/src/surface.rs:4-5`). Everything below is a literal pixel
  in that space. The window scales by an integer factor on a desktop host and letterboxes on the
  panel (`surface.rs:37-54`), so there is no responsive layout.
- **The device is the Anbernic RG SP** (`README.md:3`), which is not in
  [`devices.md`](../../../devices.md). Its panel matches the RG34XX's 720x480 already in the
  registry.
- **Everything is one draw list.** UI code emits a `Vec<Draw>` of four variants and the compositor
  consumes it in order (`slot-gfx/src/draw.rs:10-34`):

  | Variant | Carries |
  | --- | --- |
  | `Rect` | x, y, w, h, RGBA |
  | `Tex` | x, y, w, h, `TexId`, alpha |
  | `Game` | a marker, no geometry - the pass owns its own rect because the power-on squeezes it |
  | `Shot` | a 240x160 still through the game pass, so it wears the same mask at the same scale |

  **Paint order is list order.** There is no z index, no container, and nothing that re-bases
  depth. `TexId` is opaque - UI code never sees a GL name.
- **One shader program for the whole chrome**: a rect is a textured quad sampling a white texel,
  so a draw list never changes program mid-list (`draw.rs:36-38`).

## Phases (`slot/src/app.rs:96-128`)

Seven, and they are the screen inventory:

| Phase | What it is |
| --- | --- |
| `SetClock` | first launch only, ahead of the shelf |
| `Shelf` | the cartridge carousel |
| `Inserting` | the cart going into the slot, carrying `t`, `core_ready`, `resumed`, `clean` |
| `Playing` | the game, with the HUD over it |
| `Ejecting` | the insert played backwards |
| `Polaroids` | the save-state switcher |
| `Doze` | screen off, cart possibly still in |

`Inserting` doubles as the loading screen: "the animation is where the core load hides, so a slow
load extends it and a load that is already done still waits it out" (`app.rs:18-20`).

## Timings (`slot/src/app.rs:15-80`)

Every one carries its rationale in the source, which is worth reading before changing any of them.

| Constant | Value | What it is |
| --- | --- | --- |
| `INSERT_S` | 0.73 s | the whole insert; a floor, not a delay |
| `INSERT_HOLD_S` | 0.28 s | the tail spent on a cart that has already landed, so the game does not read as a cut |
| `SEATED_AT` | 0.45 s | `INSERT_S - INSERT_HOLD_S`; where the cart meets the contacts, and what it clicks on |
| `EJECT_S` | 0.45 s | the same as `SEATED_AT` - the eject is the insert backwards, deliberately the same length |
| `EJECT_HOLD_S` | 0.35 s | between the picture going out and the cart moving, so it does not start over the last of the audio |
| `POWER_ON_S` | 0.22 s | the panel striking once the cart is home |
| `POWER_OFF_S` | 0.16 s | going out, quicker than coming up |
| `REFUSAL_MS` | 300 ms | a cart that will not seat |
| `HUD_MS` | 1500 ms | the HUD window, of which the last `FADE_MS` 250 ms ramps out |
| `UNDO_GRACE_MS` | 30 s | how long an undo stays offered in the switcher |
| `PLAY_HOLD_MS` | 500 ms | A held on the shelf means "start clean" rather than "resume" |
| `REPEAT_DELAY_MS` / `REPEAT_MS` | 400 / 110 ms | shelf auto-repeat |

## Animation

Two kinds, and neither is a keyframed track.

### The shelf is a critically damped spring (`slot-ui/src/shelf.rs:168-170`)

```rust
let accel = -2.0 * OMEGA * self.vel - OMEGA * OMEGA * (self.scroll - self.scroll_target());
self.vel += accel * dt;
self.scroll += self.vel * dt;
```

`OMEGA = 16.0`, integrated per frame against real `dt`. Critically damped on purpose, "so a flick
lands on a cart instead of bouncing past and returning" (`shelf.rs:16-17`). There is no duration
and no curve: the motion is a function of the current velocity and the distance left, so the same
input from a moving row and a still one produces different paths.

**This has no resting value that can be computed without integrating.** A still can be drawn at
`scroll == scroll_target()` and `vel == 0`, which is the settled state, but any frame mid-flick is
reachable only by running the integrator.

### The insert is a three-part travel over one progress (`slot-ui/src/slot_chrome.rs:322-338`)

```rust
fn travel(seat: f32) -> f32 {
    if seat < CATCH_IN      { CATCH_AT * ease(seat / CATCH_IN) }
    else if seat < CATCH_OUT { CATCH_AT + CREEP * (seat - CATCH_IN) / (CATCH_OUT - CATCH_IN) }
    else                     { let caught = CATCH_AT + CREEP;
                               caught + (1.0 - caught) * ease((seat - CATCH_OUT) / (1.0 - CATCH_OUT)) }
}
fn ease(u: f32) -> f32 { u * u * u * (u * (u * 6.0 - 15.0) + 10.0) }  // smootherstep
```

`CATCH_IN = 0.42`, `CATCH_OUT = 0.62`, `CREEP = 0.03`, and `CATCH_AT` is derived from the geometry
as `(LIP_Y - CART_H - REST_Y) / (SEATED_Y - REST_Y)`. The cart falls to the lip, rests on it, then
is pushed through and settles. The source is explicit that a single ease was tried and rejected:
it "arrives seated without ever having met anything, which is what makes it read as a card going
down a chute" (`slot_chrome.rs:320-322`).

Smootherstep is chosen for zero velocity at both ends "so the two halves of the travel meet the
catch without a step in speed" (`slot_chrome.rs:335-336`).

**One progress drives every part of the screen at once**: the cart's y, the neighbours parting by
`PART = 130.0`, the veil `dim`, the panel `screen`, and the alert's fade. `SlotChrome` is that
progress plus five derived values (`slot_chrome.rs:120-140`).

## Layout

### The cart (`slot-ui/src/cart.rs`)

| Constant | Value |
| --- | --- |
| `CART_W` / `CART_H` | 240 / 135 |
| `LABEL_X/Y/W/H` | from `label_panel(CART_W, CART_H)`, a `const fn` |
| `PAD` | 10 |
| `MAX_LINES` | 3 |
| `MAX_PX` | `LABEL_H / (3 * 1.36)` |
| `MIN_PX` | 10.0 |
| `RIM` / `BEVEL` | 4 / 3 |

The face is built from two SVGs, `cart.svg` and `cart_detail.svg`, rasterised through `resvg`.
Label text is fitted by shrinking to fit, down to `MIN_PX`.

### The shelf (`slot-ui/src/shelf.rs:12-30`)

| Constant | Value | Note |
| --- | --- | --- |
| `PITCH` | 240.0 | wider than a cart so neighbours peek in; 286 clipped the side carts |
| `SIDE_SCALE` | 0.78 | |
| `SIDE_ALPHA` | 0.55 | |
| `FOOT_Y` | `(480 + 135) / 2` | carts stand on the row - the foot stays put as a cart shrinks |
| `SLOTS` | 3 | either side; two reach the edges, the third covers spring lag |

### The slot chrome (`slot-ui/src/slot_chrome.rs`)

| Constant | Value |
| --- | --- |
| `MOUTH_W` / `MOUTH_H` | `CART_W + 14` = 254 / 58 |
| `BAND_Y` | `480 - MOUTH_H` = 422 |
| `LIP_H` | 2.0 |
| `SLIT_H` | 9.0 |
| `BAY_W` | `MOUTH_W + 18` = 272 |
| `RECESS_H` | 42.0 |
| `SCOOP_W` | `MOUTH_W * 0.88` |
| `RIM_W` | 2.0 |
| `REST_Y` | `(480 - 135) / 2` |
| `SEATED_Y` | `BAY_Y + 4` |
| `ALERT_PX` | 44.0 |

The empty slot is drawn on the shelf too, "so the cart you pick has a visible place to go, and so
the bottom of the screen is the same object on every screen" (`slot_chrome.rs:312-314`). It is
drawn in two halves, back then front, because "the recess is a hole in the front pieces, so a slot
drawn from the front alone is a hole onto the backdrop rather than an opening in a device".

### The switcher (`slot-ui/src/polaroids.rs`)

`PHOTO_W` / `PHOTO_H` 240 / 160 - the GBA's own resolution. `DOT` 6.0 with `DOT_GAP` 10.0 and
`DOT_DIM` 0.35; `MARGIN` 16.0; blank slot fill `#3a3a3e`. Legend is fixed:
`[("B", "Back"), ("Y", "Delete"), ("A", "Load")]`, plus `X` for undo inside the grace window.

### The HUD (`slot-ui/src/hud.rs`)

`PLATE_H` 40.0, `HUD_ICON_PX` 18.0, ink `#f5f2ef`, `ICON_GAP` 10.0, `BADGE_MARGIN` 12.0. The bar is
`BAR_W` 320.0 x `BAR_H` 6.0 on a track of `rgba(1,1,1,0.18)`. Four kinds: `Brightness`, `BlueLight`,
`Volume`, `Rewind` - the last showing history remaining rather than a level.

The plate exists because "the bar has no backing of its own, so over a bright frame a white fill on
a translucent white track vanishes", and it is shared with the refusal and the switcher's two
plates "so everything that ever sits on top of a picture reads as one system" (`hud.rs:16-20`).

### Hints and plates (`slot-ui/src/plate.rs`)

`HINT_H` 24, `CAP` 20, `CAP_PAD` 4, `CAP_MAX_W` 64.0, `HINT_GAP` 14.0, `CAP_GAP` 5, `EDGE` 2,
`LABEL_MAX_W` 140.0, `TITLE_W` 360, `TITLE_H` 24. Ink `#f6f4ef`, cap ink `#1a1917`. Sizes: key 14,
label 16 (min 10), title 20 (min 12).

### Footer (`slot-ui/src/footer.rs`)

`BRAND = "SLOT."`, `FOOTER_MARGIN` 24.0, drawn centred in the mouth band.

### Toast and refusal

Toast 220x22 at 16 px (min 12). Refusal is a shake: `SHAKE_PX` 6.0 at `SHAKE_HZ` 14.0 over
`REFUSAL_MS` 300, applied by the compositor via `set_shake` rather than by moving a draw.

## Colour and theming

There is **no palette and no theme format**. Colours are literals at their use sites:

| Where | Value |
| --- | --- |
| Backdrop clear | `#0f0f12` (`[0.06, 0.06, 0.07, 1.0]`) |
| Ink | `#f6f4ef`; HUD ink `#f5f2ef` |
| Cap ink | `#1a1917` |
| Halo | `#08080a`, `HALO_PX` 1 |
| Blank photo | `#3a3a3e` |
| Wallpaper scrim | 0.62 (`backdrop.rs:11`) |

**What varies per game is the cart shell** (`slot-ui/src/shell.rs`), keyed on the region-free game
code prefix:

| Code | Colour | Game |
| --- | --- | --- |
| `AXV` | `#c2332e` | Pokemon Ruby |
| `AXP` | `#2f5cc0` | Pokemon Sapphire |
| `BPE` | `#249c60` | Pokemon Emerald |
| `BPR` | `#d85224` | Pokemon FireRed |
| `BPG` | `#63b044` | Pokemon LeafGreen |
| `M*` | `#c6c6c9` | the Game Boy Advance Video family, by first letter |
| default | `#35353a` | |

Lookup is exact, then family, then default, and that order is the escape hatch for a wrongly
coloured family member. A `Translucent` finish exists in the enum and no shipping row uses it.

**A wallpaper is a user PNG**, cover-cropped to the panel with the scrim over it, and absent
entirely when the card carries none - "the clear colour is already the ground" (`backdrop.rs:18-20`).

## Fonts

Two, both embedded: `label.ttf` (OFL) for everything, and `SymbolsNerdFontMono-Regular.ttf` for the
eight HUD icons. Rasterised with `fontdue`; text is fitted by shrinking within a min/max range
rather than by a size table (`slot-ui/src/text.rs:23`).

The icon set is fixed at eight: `Volume`, `VolumeMuted`, `Brightness`, `BlueLight`, `FastForward`,
`FastForwardLatched`, `Rewind`, `Alert` (`slot-ui/src/icon.rs:13-22`).

## Post-processing

The game layer goes through a GL pass that the chrome does not:

- **`lcd3x`** - a 3x3 subpixel mask, `BRIGHTEN_SCANLINES` 16.0 and `BRIGHTEN_LCD` 4.0
  (`slot-gfx/src/lcd3x.rs:3-4`), built as a 3x3 RGBA texture.
- **`grade`** - a blue-light warmth ramp toward `WARMEST = [1.0, 0.82, 0.62]` in
  `BLUE_LIGHT_MAX` 9 steps (`slot-gfx/src/grade.rs:3-9`).
- **`set_power(t)`** - the panel strike, which squeezes the game rect rather than fading it.
- **`set_shake(dx)`** - the refusal, applied at the compositor.

A saved thumbnail is drawn back through the same pass, "since a saved shot is a picture of this
panel at exactly the scale the mask is built for" (`slot-gfx/src/pipeline.rs:94-97`).

## Input

From `README.md:11-31`. Two maps, one per context.

On the shelf: `L` / `R` browse, `A` plays. A short tap of `A` resumes the last state; holding `A`
past `PLAY_HOLD_MS` starts the game clean.

In game:

| Input | Action |
| --- | --- |
| Hold `MENU` | save state, eject, back to the carousel |
| Double tap `MENU` | the save-state switcher |
| `SELECT` + `R1` / `L1` | save state / load the newest |
| `SELECT` + up/down | brightness |
| `SELECT` + left/right | blue light |
| `L2` | rewind while held |
| `R2` | fast forward while held; double tap latches it |
| `VOL+` / `VOL-` | volume; both together mutes, remembering the level |

Chords, double taps and hold-versus-tap are all load-bearing, and auto-repeat lives in the shelf
rather than in the gesture layer "so nothing in game starts auto firing" (`shelf.rs:42-44`).

## Data model

Per cart: the game code (four characters, three matched), a display name cleaned by `clean_label`,
a label colour, and a face texture. Per save state: a 240x160 thumbnail and a slot index. There is
no scraped metadata, no box art and no per-system anything - it is one system by design.

## What has no equivalent here yet

- The **RG SP** is not in [`devices.md`](../../../devices.md).
- A **spring** is not expressible in this repo's animation descriptors, which are timelines of
  `channel, from, to, begin, duration, easing` (see [`animation.md`](../../../animation.md)).
- **Smootherstep** is not in the easing registry.
- A **piecewise travel over one progress** - ease, linear creep, ease - is not one descriptor.
