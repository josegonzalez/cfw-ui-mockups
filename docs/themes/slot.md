# slot

Mockups of [slot](https://github.com/BrandonKowalski/slot), a bespoke GBA-only frontend for the
Anbernic RG SP, written in Rust. Games are shown as a carousel of cartridges; pick one and it is
inserted into the slot, falling to the lip before the mechanism takes it.

- Source repository: `github.com/BrandonKowalski/slot` at `7cfa1ab`
- Detailed spec extracted from source: [`reference/source-notes.md`](slot/reference/source-notes.md)
- What changed in the React port: [`porting/slot.md`](../porting/slot.md)

Implemented at `app/src/themes/slot/`.

This is the smallest configurable surface of any set here and the largest motion problem. It is a
**single-system** frontend - one console, no scraped metadata, no palette - so almost everything
that shapes the other sets is absent. What it has instead is motion that no descriptor format can
express.

## Screens

Seven phases, which are also the seven screens. The primary deliverable is the interactive route;
thirteen statics are provided for handoff, three of them poses of the insert.

| Phase | What it is |
| --- | --- |
| Shelf | the cartridge carousel |
| Inserting | the cart going into the slot; also the loading screen |
| Playing | the panel, with the HUD over it |
| Ejecting | the insert played backwards |
| Save states | the switcher, with a thumbnail per slot |
| Set the clock | first launch only |
| Doze | screen off |

## Geometry

720x480, fixed, with no scale factor: slot targets one device with one output size, so every
number in `layout.ts` is a literal pixel exactly as it is in the source.

| Constant | Value | What it sets |
| --- | --- | --- |
| `CART` | 240x135 | the traced outline's own aspect; three across the row exactly |
| `LABEL` | 9%-91% x 22.8%-86.3% | the paper, inset so the moulded grip shows above it |
| `SHELF.pitch` | 240 | so the neighbours peek in at both edges |
| `SHELF.sideScale` / `sideAlpha` | 0.78 / 0.55 | |
| `SHELF.footY` | 307.5 | carts stand on a row; the foot stays put as one shrinks |
| `MOUTH` | 254x58 | the opening, and the band the bottom of every screen shares |
| `RECESS_H` | 42 | how deep you can see in, and so how much of a seated cart shows |
| `PHOTO` | 240x160 | the GBA's own resolution, which is what a thumbnail is a picture of |

## Motion

**Neither of slot's two motions is a timeline**, which is why both live in `motion.ts` rather than
in the shared animation system. This is the precedent Vitro's backgrounds set: a continuous
integrator has no keyframe to settle to.

**The shelf is a critically damped spring.** `accel = -2w*v - w^2*(x - target)` with `w = 16`,
stepped against real `dt`. It has no duration and no curve, and its path depends on the velocity it
already carries - so the same press from a moving row and a still one produces different motion.
That is the point: "a flick lands on a cart instead of bouncing past and returning."

**The insert is a three-part travel over one progress.** Ease, a linear creep, then ease again, so
the cart falls to the lip, rests on it, and is pushed through. A single ease was tried in the
source and rejected because it "arrives seated without ever having met anything, which is what
makes it read as a card going down a chute". One `seat` value drives six things at once: the cart's
y, the neighbours parting by 130px, the veil, the panel rising, the game rect and the alert fading.

Both settle. The spring's resting state is `scroll === target, vel === 0`; the travel's is
`seat === 0` or `1`. Neither still needs a clock, which is what keeps `animate={false}` honest.

Timings, all from `slot/src/app.rs`: insert 0.73s with a 0.28s tail, seated at 0.45s, eject 0.45s,
power on 0.22s and off 0.16s, HUD 1500ms with a 250ms ramp, undo grace 30s, play-hold 500ms.

## Colour

There is no palette. Four case colours come from `System/theme.txt` if the card carries one -
`housing` `#242429`, `recess` `#1a1a1d`, `opening` `#050508`, `edge` `#4d4d57` - read once at boot,
because "it cannot change while the device is on".

What varies per game is the **cart shell**, keyed on the region-free game code prefix: Ruby
`#c2332e`, Sapphire `#2f5cc0`, Emerald `#249c60`, FireRed `#d85224`, LeafGreen `#63b044`, the GBA
Video family `#c6c6c9`, and `#35353a` for everything else. Exact, then family, then default.

The label's paper is an FNV-1a hash of the title at a fixed saturation and value, so a title gets
the same paper on every boot; its ink flips on that paper's luminance rather than sitting at one
value.

## Fonts

Open Sans (`label.ttf`, OFL), embedded from the source's own assets, at a size fitted per label
between 10px and `LABEL_H / (3 * 1.36)`.

## Input map

| Input (key) | Action |
| --- | --- |
| L / R (Q / W) | browse the shelf |
| Left / Right (arrows) | browse the shelf - a mockup affordance; slot binds the shoulders alone |
| A (Z) | play: runs the insert, and the game arrives when the cart seats |
| B / MENU / START | eject: the same travel backwards, back to the shelf |
| Hold MENU (Esc) | save, eject, back to the carousel |
| Double tap MENU | the save-state switcher |
| SELECT + R1 / L1 | save state / load the newest |
| SELECT + up/down, left/right | brightness, blue light |
| L2 / R2 | rewind, fast forward - held, and R2 latches on a double tap |

The live build closes the loop: **A plays** - the cart falls to the lip, catches, seats, and the
panel strikes - and **B brings it back out** on the same travel reversed, which is why the source
gives the eject the same length. A travel is uninterruptible while it runs, as the cart physically
is.

The spring is the reason to press the shoulders rather than to pose a still: one press eases in,
and two quickly carry velocity into the second so the row keeps moving.

Mockup-only keys below the device: `[` `]` phase, `,` `.` the HUD control, `\` wallpaper.

## Assets

`assets/cart.svg` and `assets/cart_detail.svg` are the source's own traced silhouettes, kept as
path data so the shell colour can be filled through them per cart - which is the same operation the
source performs on a coverage mask. `assets/fonts/label.ttf` is its label font.

The eight HUD glyphs are set in `SymbolsNerdFontMono-Regular.ttf`, the source's own symbol font,
at the source's own codepoints. The **Mono** variant specifically: its fixed advance width keeps the
HUD row from reflowing when the glyph under it changes, which happens whenever volume reaches zero
or fast-forward latches. It is 2.5 MB for eight glyphs, which is most of this theme's asset weight,
and it is loaded only when a slot screen renders.

Box art does not exist in slot - a cart face is a shell colour, a hashed paper and the title - so
nothing here is a placeholder for scraped art. The save-state thumbnails are generated, because
slot's are real screenshots and there is nothing to screenshot.

## Files

| File | Job |
| --- | --- |
| `index.tsx` | the theme root: the cursor, and the spring's integration loop |
| `Interactive.tsx` | the live build's three subsets |
| `routes.tsx` / `manifest.ts` | the 14 routes, and the screen list as plain data |
| `layout.ts` | every constant, from the Rust |
| `motion.ts` | the spring and the travel, with the source's reasoning |
| `library.ts` | the shell table, the sample carts, the phases |
| `art.ts` | the cart face, its label, and the generated thumbnails |
| `views/parts.tsx` | the slot chrome in two halves, text, hints |
| `views/Screens.tsx` | the seven phases |
| `views/Icon.tsx` | the eight HUD glyphs, as codepoints |
| `slot.css` | the font face, the primitives, the panel passes |

## How it is checked

`slot.test.tsx` covers the pure functions - the shell table's three-level lookup, name cleaning,
the label's hash and ink flip, and both motions. The spring has a test for the property that makes
it a spring: that it carries velocity across a target change, which is what a tween cannot do.
`e2e/slot-glyphs.spec.ts` rasterises all eight HUD glyphs and checks none is tofu, because the Mono
font gives `.notdef` the same advance as a real glyph and only three of the eight are posed by a
static. Every screen was also rendered and compared; that pass found four faults, recorded in the
porting notes.
