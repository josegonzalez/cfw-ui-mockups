# Porting notes: DS Style

What the React set does differently from DS Style itself, and why. The set was built from the C
source directly, at `2847683`. The launcher renders headlessly, so the comparison is not against
screenshots: every still is held to a frame the launcher drew itself
([`themes/ds-style/reference/render/`](../themes/ds-style/reference/render/)).

## What the source is

About 2,850 lines of C that write the RG SP's framebuffer and read evdev directly, with no SDL. It
draws into a 240x160 buffer with six primitives and no blending, and shows it at exactly 3x.
Artwork, the moving home cursor and the scrolling title are the exceptions, sampled at the full
720x480. [`source-notes.md`](../themes/ds-style/reference/source-notes.md) records the screens,
dispatch order and values.

## Deviations

- **The clock, battery and Wi-Fi are the reference renderer's `--demo` values**: 12:34 PM, 75%,
  not connected. The launcher reads the real ones every 10s and 2s.
- **Nothing leaves the launcher.**
  - A game or app shows "Launching" for 1.5s and returns, and a game goes to the top of Recents -
    what the launcher does once the emulator exits.
  - Stock OS, Reboot and Shutdown hand the device back, drawn as a black screen, and any button
    starts DS Style again.
  - Autoboot switches without running the boot manager.
- **Snake's food is seeded with a constant.** The source seeds it from the clock, so its reference
  frame's food is somewhere else; the parity check masks those two squares and nothing more.
- **The LCD grid rounds once more.** The source multiplies each channel by the cell's factor and
  rounds once. The port blends a tiled 3x3 cell whose grey is itself rounded to 8 bits, so channels
  can land one level off. The parity check allows exactly that, and only for that still.
- **Volume and brightness** have no key in the harness, so their popups are stills. Their 1.4s
  close runs in the live build.
- **Held directions** repeat at the harness's pace, not the source's 350ms then 100ms.

## Not reproduced

- **Pixel Transparency.** It reads back the finished 720x480 frame for luma, a polariser, highlights
  and a shadow. No DOM layer can do that. The setting still switches, and draws nothing different.
- **Sound**, the startup splash's timing, sleep on lid or idle, HDMI, and external controllers.
- **Scraped art.** The sample library has none, so every picture is the system's built-in one.
  That is also why List + Art draws as List: it shows art only for folders or for art that is not
  built in (`ui.h:274`).

## Faults found by looking

- **The glyphs drew in the wrong place.** Every narrow letter in "DS Style" and "Nintendo" sat one
  to three pixels left. The rebuilt font gave each glyph a left side bearing of 0, and TrueType
  places the outline by it, pulling a glyph whose first lit column is 3 back to 0. Each bearing is
  now the glyph's own left edge.
- **Art would have been a pixel off on most rows.** The source samples top-left with integer
  division, where a browser's nearest-neighbour picks by pixel centre. The art is pre-scaled with
  the source's mapping and drawn 1:1.
- **A still's clock was running.** `DeviceFrame` mounts a disabled input provider for a still, so
  "is there a provider" was true everywhere, and Snake stepped once before its still was captured.
  The parity check caught it: the snake sat one cell right of the launcher's. The input API now says
  whether it is enabled. NeoStation's clocks had the same fault and were only ever slower than the
  capture.
- **My own event strings were wrong four times** while posing the reference frames - Binding, Help
  2, About 2 and Snake each one press short. The frames were checked by eye before any of the port
  was written.
- **The source notes had X on Home opening Recents.** It does nothing: `extra_action` takes X on
  every page first. They also had L and R opening Settings and Apps from a collection, when they are
  a three-tab cycle that runs before the browser's own branch. Both were caught by reading the
  dispatch order again, and the port follows the source.

## Verification

- `ds-style.test.tsx`:
  - the manifest against `stills.txt`, and the library against `fixture.txt`;
  - the title rules;
  - the reducer through Home, the tab cycle, Recents and Favourites, search, launching, favourites,
    binding, Snake and Shutdown;
  - every still rendered.
- `ds-style-reference.spec.ts`: every still against the launcher's own frame, and a test that the
  comparison can fail. The panel's 8px rounded glass is the mockup's bezel and is left out.
- The e2e suite: baselines, web and fallback; the compositing guard; the settle pair of the live
  build and `home`.
- The live build, driven in a browser:
  - the home corners caught mid-glide and landing;
  - the marquee at 1.458s where the source's formula puts it;
  - a launch returning with the game on top of Recents;
  - L2 and R2;
  - Snake stepping every 134ms.
