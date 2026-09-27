# Porting notes: TortOS

What the React set does differently from TortOS itself, and why. The set was built from the C
source directly - there was no earlier mockup - so everything here compares against that source
and the ten reference frames in [`themes/tortos/reference/`](../themes/tortos/reference/).

## What the source is

A C launcher on SDL2 for the TrimUI Brick, one 10,753-line `main.c` with helpers beside it. It draws
everything itself with `SDL_RenderGeometry`, a glow texture, TTF text and scanline-filled rounded
rects; there is no theme format. The port reads the layouts, colours, strings and input loops from
that source and records them in [`source-notes.md`](../themes/tortos/reference/source-notes.md).

## Deviations

- **Box art and album covers are TortOS's generated cards.** The reference frames show real covers,
  which this repo does not ship. The generated card is what TortOS itself draws for a game with no
  art, so it is the launcher's own placeholder rather than an invented one.
- **The coverflow is a CSS perspective, not 16 strips.** The source slices each card into strips so
  `SDL_RenderGeometry`'s affine mapping does not shear. A browser's perspective transform is true
  perspective, and a per-card `perspective` of six half-widths with `rotateY` is the source's
  `F / (F + z)` projection exactly. The cube is the same: `translateZ(-R) rotate translateZ(R)`
  under a perspective of 0.85 of the screen.
- **Text widths come from a table.** SDL_ttf measures with the font. The port extracts Josefin's
  advances and GPOS kerning and sums them. The reference frames only measure out with kerning on,
  so it is applied. What hinting does beyond rounding each advance is not reproduced, and widths run
  about 1% wide: Hagane's second achievement is cut at "Potatoe..." where the device cuts at
  "Potatoes,...", and the shelf menus measure 838 where the frame shows 835. The shelf menus use the
  frame's 835 directly; the rule is kept as a test that it is still the same row that sets it.
- **The menu plate eases on a 110ms transition.** The source chases it with two exponential decays
  of 22ms. Colours of the two rows cross over on the same transition rather than by measuring the
  plate's coverage each frame. It snaps where the source snaps: another menu, or a jump past a
  selectable row.
- **The list window does not give.** The source eases a window scroll by up to 0.55 of a row over
  55ms. Rows here move to their new window at once.
- **Sort By cycles its label only.** The sample card has play history for five games and no dates
  added, so re-sorting by play time, last played or recently added would invent an order. Muse's
  Artist and Album orders do reorder the shelf.
- **Additive glow is `mix-blend-mode: plus-lighter`**, which is the source's `SDL_BLENDMODE_ADD`;
  the fallback is a normal blend.
- **The background is the theme root's fill.** Drawn as a full-bleed layer under the content, it is
  the exact shape of fault `e2e/compositing.spec.ts` exists to catch, and the guard caught it; the
  root carries the colour instead, black while a game is paused and near-black otherwise.

## Not reproduced

- **The running game and its paused frame.** Both are the emulator's, not the launcher's. The game
  view is the game's generated card on black, and save slots show the same.
- **The in-game unlock toast.** `notice.c` renders it, but Diatom decides where it goes and that code
  is not in the repo.
- **The boot animation** is an MP4 played by `launch.sh`; **power-off** needs POWER or Auto Off;
  **the launch zoom** only runs when the emulator is started cold. None is reachable from the
  mockup's buttons.
- **The volume and brightness bar** and **the low-battery dot**: F1/F2, the volume rocker and the
  battery are not part of the mockup's key map.
- **Muse does not play.** Nothing advances a track by itself; Now Playing shows where it was left,
  and seeking and changing track move it.

## Faults found by looking

- **Every screen failed the compositing guard** on its first run: the background was a full-bleed
  opaque layer under the content. Moved onto the root.
- **Play Time lost its footer.** Listing every game windowed the panel and pushed both notes off
  the bottom; the source fits the list to what leaves room for them (`menu_list_fit(1, 1, 2)`).
- **Achievement titles cut three characters early** before kerning was applied, which is what showed
  the device shapes with HarfBuzz.
- **Chrono Trigger carried a heart** the reference frame does not; the sample favourites were
  changed to the ones the frames show or do not contradict.
- **Up and down on the confirm panel** moved an unrelated list cursor instead of swapping the
  answer. Caught by the reducer test, fixed before any still was taken.

## Verification

- `tortos.test.tsx`: the reducer through every button each screen names, the motion rules, text
  measurement, the `Coverflow` slot and fit rules, and every still rendered.
- The e2e suite: baselines for every still, web and fallback; the compositing guard; the settle
  pair of the live build and the `systems` still.
- By eye: the systems row, games shelf, Vertical, Cubic, TortOS menu, game details, achievements,
  Muse shelf and Now Playing were each put beside their reference frame. The live build was driven
  through a shelf move, a cube pitch and a cube yaw mid-flight.
- `readme-hare.png` predates the type scale: its rows are 64px apart and its text 43/49 of the
  current size. The `hare` still follows the current source, in which "Transferred" no longer fits
  beside its value and slides.
