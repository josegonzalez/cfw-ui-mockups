# Porting notes: slot

What the React implementation at `app/src/themes/slot/` does differently from the Rust it
reproduces, and where it is deliberately incomplete.

There was no earlier mockup of this set. It was built from
[`themes/slot/reference/source-notes.md`](../themes/slot/reference/source-notes.md), which was
extracted from the source first, and the source's own comments were the specification for most of
the decisions below - slot documents *why* nearly every constant is what it is, which is unusual
and worth reading before changing any of them.

## What the source is

Seven Rust crates, 20,505 lines, with its own GL compositor. The UI crates emit an ordered
`Vec<Draw>` of four variants and the compositor consumes it in order, so paint order is list order
and nothing re-bases it. That maps onto absolute positioning in document order exactly, which is
why this theme's CSS has no flow layout in it at all.

## Deviations

**The two motions live in the theme, not in `anim/`.** Neither is a timeline: the shelf is a
velocity-carrying integrator with no duration, and the insert is a piecewise function of one
progress driving six things. Widening the descriptor format to hold either would make it stop
meaning anything, so both sit in `motion.ts` - the precedent Vitro's four backgrounds set for the
same reason. **Both still settle**, which is the part that matters: the spring's resting state is
computable without integrating and the travel's is its endpoints, so `animate={false}` draws a
still rather than running a clock to reach one.

**The cart face is an SVG rather than a pixel buffer.** The source rasterises `cart.svg` and
`cart_detail.svg` into coverage masks and writes RGBA through them; here the same two paths are
filled and clipped. Every colour derivation is the source's own arithmetic - the moulded detail at
0.62, the recess walls at 0.55 and 1.45, the label's FNV-1a paper and its luminance-flipped ink.

**The eight HUD glyphs use the source's own font**, `SymbolsNerdFontMono-Regular.ttf`, at the
source's own codepoints. They were first drawn as SVG paths to avoid embedding 2.5 MB for eight
shapes; that was the wrong trade, because the glyphs are the reproduction. The font ships whole -
no subsetter is available here - and it loads only when a slot screen renders.

The Mono variant matters and is not incidental: its fixed advance width keeps the HUD row from
reflowing when the glyph under it changes, which the source says outright and which happens
whenever volume reaches zero or fast-forward latches. It also means a missing glyph cannot be
caught by measuring text, since `.notdef` has the same advance - hence `e2e/slot-glyphs.spec.ts`,
which rasterises all eight and compares each against a codepoint the font certainly lacks.

**The lcd3x mask is much lighter than the source's.** slot applies a 3x3 subpixel texture at the
panel's native pixels. Here the panel is drawn at device pixels and the whole frame is then scaled
up for viewing, so a 3px cell lands several screen pixels wide and stops being a subpixel structure
- at the source's weight it reads as a grid drawn over the picture rather than as an LCD. The
weight in `slot.css` is what reads correctly once scaled, and it is a deviation rather than a
transcription.

**The panel shows a generated picture.** There is no emulator, so the game layer is a deterministic
still. The same still stands in for a save-state thumbnail, which slot captures for real.

**The refusal, the toast and the alert are not wired.** The geometry and timings are in `layout.ts`
and `motion.ts` - including `shakeOffset`, which is the compositor-level shake - but no screen
poses them, because each is a response to a failure the mockup cannot have: a cart that will not
seat, a write that failed. They are left in place rather than deleted so a later pass has the
numbers.

**The clock picker shows a fixed date**, as every other set here shows a fixed clock.

**The pad browses the shelf, which slot does not do.** slot binds the shoulders alone. The arrows
are bound here as well because the viewer bar tells a reader the arrows are the d-pad, and a shelf
that ignores the first thing they try reads as broken rather than as faithful. This is a mockup
affordance in the same class as Vitro's clickable nav pill - `browseStep` names both bindings and
says which is which.

## Not reproduced

**The hinge.** The RG SP is a vertical clamshell. The device registry has no folding shell and
nothing inside `.screen` depends on one, so `rg-sp` is a chin body - the controls sit under the
panel, which is where they are when the device is open.

**The in-game input map.** Chords, double taps and hold-versus-tap are most of how slot is
operated, and all of them are behaviours whose visible result is a HUD appearing or a phase
changing. The live build binds browsing, play and eject; the rest is in the theme page.

**A tap and a hold both start the same insert.** On the device a tap of `A` resumes the last save
state and a 500ms hold starts the cart clean. Both put the same cart into the same slot with the
same travel, and the difference is in what the core loads - which there is no core to do.

**Rewind and fast-forward as motion.** Both are held states over a running game. There is no
running game.

## Faults found by looking

All four were found by rendering the screens and comparing them against the source, and none would
have been caught by a numeric check.

**The side carts were see-through.** The shadow and the face were drawn with the same opacity, so
the ground came through both and a dimmed cart read as a ghost rather than as a cart in shadow -
which is the exact failure the source's `cart_shadow` exists to prevent. Fixed by drawing the
shadow opaque and dimming only the face above it.

**The inserting cart was drawn twice.** The chrome moves the cart between the two halves of the
slot, and the shelf was still drawing it on the row it came from, so two identical carts appeared.
Fixed by giving the shelf the index to skip; there is now a test that no two cart faces on a screen
share a source.

**The label ink was a fixed dark.** The source flips it on the paper's luminance, because "hue
rotation alone puts yellow and blue at very different luminance" - a hashed paper lands on both, so
a fixed ink is unreadable on about half the library.

**The seated still showed no cart.** Posed at `seat = 0.95`, the panel has already struck and
covers everything, so the capture was indistinguishable from Playing. Reposed to 0.64, just seated
and before the strike, which is the moment the still exists to show.

**Found by the settle check, not by looking: the live build opened on a different cart from its still.** The `shelf` still is posed on the
third cart so both neighbours show; the live build opened on the first, so the settle check compared
two different screens and failed. It opens on the third now, from one shared constant. The same fix
keys the stills by slug, since their props only seed state.

One more thing looked wrong and was not: the panel at low power renders as a thin full-width strip
of squeezed picture, which reads at a glance like a small box in the middle of the screen. Probing
the DOM showed 720x25 with the picture filling it, exactly as intended - the power-on squeezes the
rect rather than fading it.
