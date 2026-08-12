# Porting notes: NextUI

What the React implementation at `app/src/themes/nextui/` does differently from the C source it
reproduces, and where it is deliberately incomplete.

Unlike the other four sets, there was no earlier vanilla-JS mockup to compare against: this one was
built from the firmware source directly, with four reference captures from the project's own
documentation as the fidelity gate.

## What the source is

`ui_components/nextui.c` is 366 lines and holds the entire theme: a stadium pill, a tinted sprite
blit, a text-width function, a text box, a button glyph, a hint group, a title, a body-text block,
a label/value row, a marquee and a rounded panel. Every one of the twenty-three views is built from
those eleven primitives, which is why the port is two files of components rather than
twenty-three.

The single most load-bearing thing in it is `ui_components_nextui_text_width`. A selection pill is
`text_width + 48` wide; a hint group is anchored by its own measured total; a value is placed at
`right_edge - value_width`. None of that is a position the layout can state up front.

## Deviations

**Text is measured, not estimated.** `text.ts` measures with a canvas 2D context and caches the
result, mirroring the source's own function rather than assuming an advance ratio. A guessed ratio
gets a screen whose every pill is the wrong width, which is the one thing about this theme a reader
would notice immediately. The first paint measures against the fallback face because a webfont has
not loaded yet, so `useFontReady` discards the cache and re-renders once `document.fonts` reports
BPreplay available. Unit tests run without a canvas and fall back to a ratio; nothing there is
measured against a real glyph anyway.

**Rounded shapes are a border radius.** The source blits `pill_cap_40`, `pill_cap_60`,
`btn_circle_40` and `panel_corner_16` because the RDP has no rounded-rectangle primitive, and
stretches the innermost opaque texture column across the middle so the body and the caps go through
the same blend pipeline - a flat fill quantises differently and makes the caps look translucent by
contrast. None of that survives translation: the caps are half-round, so a stadium is
`border-radius: 999px` and a panel is `border-radius: 16px`. The sprites are not copied into the
repo, since copying them would imply they were used.

One visible consequence: a 52x24 swatch has 16px corners in the source, which overlap vertically
and clip. CSS scales both radii down proportionally instead, to 12. The shapes differ by a couple
of pixels at two corners.

**Icons are masked rather than modulated.** `ui_components_nextui_tinted_sprite_draw` multiplies
white art by a primitive colour. A CSS mask over a solid fill is the same operation and takes the
palette slot the same way, so the eight ledger icons, the cartridge placeholder and the folder
glyph are the source's own PNG and SVG art.

**Box art is generated.** The menu ships none - a real install scrapes it into `.media` beside the
ROMs - so covers are drawn from a hash of the title, deterministically, because a field seeded from
`Math.random` makes every capture differ and every baseline useless. The generated art keeps the
horizontal banding a 16bpp framebuffer produces rather than smoothing it.

**The background image is a subset, not a default.** The reference browser capture was taken with a
`bg.png` in place, which is why its background is dark navy rather than the palette's black. The
menu itself clears to the Background slot and draws nothing else, so that is the default here and
the image is behind a toggle - with the menu's own overlay alpha (`0x60`) over it, which is lighter
than the classic theme's.

**Sample content stands in for a real card.** The ROM titles, the cheat codes, the Controller Pak
notes and the flashcart's answers are invented; every *label* around them is the source's. The load
screen shows Mario Kart 64 with the description and byline from the reference capture.

**The clock is fixed**, as in every other set here: the RTC screen shows a constant timestamp.

## Navigation

Every button the hint bar names does what it says, and the graph is transcribed from each view's
own `menu->next_mode` rather than invented. `nav.ts` holds it as a pure reducer, which is what
makes it testable: `(state, button) -> state` with no React in it.

**Back is a stack.** The source keeps an origin variable per screen - `nextui_origin_mode` in
`settings_editor.c`, `origin_mode` in `nextui_colors.c`, `load_origin_mode` in `load_rom.c` - each
recording the screen its owner was opened from so `B` returns there. Three variables that all say
the same thing are one stack, and the stack gets the cases they exist to handle right for free:
Settings opened from Favorites returns to Favorites, and the colour editor unwinds through the hub
to Settings to wherever Settings came from.

**A folder opens in place.** `push_directory` changes the listing without changing the mode, so
opening a folder must not push a frame - otherwise `B` inside a folder would land on whatever
screen preceded the browser instead of going up a directory.

**Some rows do things rather than going somewhere**, and those are wired too, because their hint
pill says `CHANGE`: the settings toggles flip, the Menu Colors title-pill row toggles, `R` on Menu
Colors resets the palette and the pill to stock, applying a palette recolours the whole app, and
the music player's pill swaps between `PAUSE` and `PLAY`.

**Two labels are computed rather than fixed.** The browser names `OPEN` on a folder and `PLAY` on a
ROM, from `draw_nextui`'s switch on the entry type; the music player's pill follows
`mp3player_is_playing()`.

### What a button cannot do here

`A PLAY` on a ROM shows the staged loading bar and parks there. On hardware the next thing that
happens is the console booting the game, and a mockup has no game to boot - so it draws the last
frame the menu would draw and waits, rather than inventing a return. Any of A, B or R dismisses it.

Context-menu rows that act on the SD card - deleting an entry, writing a collection, formatting a
Controller Pak - open a message box saying they are not available rather than pretending to work.
The rows that lead somewhere (`Show entry properties`, `Datel Code Editor`) navigate normally.

The colour editor's R/G/B channels are not editable. `Left`/`Right` pick a channel and `Up`/`Down`
adjust it in the source; here the screen poses the applied colour and `A` returns. Editing one
channel at a time is the one interaction in the theme whose result is a colour nobody would choose
on purpose, and the palette picker already covers changing the colours.

## Not reproduced

**The classic theme.** `theme_is_nextui()` guards every drawing site, and the other branch is the
menu's original look. It is a different theme, not a variant of this one.

**Fast-scroll and the `N) ` ordering prefix.** Both are input behaviours whose visible result is
the cursor landing somewhere else, which the bound directions already show. `Left`/`Right` do page
the list, since that is a visible jump rather than a speed.

**Submenus inside a context menu.** `Set CIC Type` and its siblings open a nested list in the
source. The rows are present and inert; the nesting is not.

## Faults found by looking

All three were found by rendering the screen and pressing its own buttons, and none would have been
caught by checking numbers.

**The load screen's description overlapped its own title.** The body block is positioned at the
load screen's own `hero_y` of 92, but the `.nx-body` rule that made it absolute had been dropped
during a rewrite of the stylesheet - so the block laid out in flow at the top of the screen, on top
of the title, while every coordinate involved was still correct. Fixed by restoring the rule; the
capture now matches the reference.

**`?still=1` froze the cursor, not just the motion.** The selection index was read through
`animate`, so the harness control that settles the marquee also stopped the screen responding - and
the interaction trace captured five identical frames. Motion and input are different things; the
static routes stay put because they render with `interactive={false}`, which is the mechanism that
was already there.

**Menu Colors printed its palette name in capitals.** The seven slot rows show a stored hex, which
`config.ini` keeps as `RRGGBB` without a hash, so the row values were being uppercased as a group -
which also caught the `Palette` and `Title Pills` rows and turned `Default` into `DEFAULT`. Fixed
by uppercasing the hex where the hex is produced.

## Where the numbers came from

Every constant in `layout.ts` is `NEXTUI_*` from `ui_components/constants.h`, name for name. Both
list-window algorithms are transcribed rather than unified, because they genuinely differ: the file
browser clamps on both sides, so it scrolls back up as soon as the cursor passes the top of the
window, while the palette picker and Collections only ever scroll down. Merging them would have
made the browser stop showing its last page flush with the bottom.

The row counts are computed the way the source computes them rather than stored, which is why
Settings fits seven rows and Collections fits eight: Settings reserves a row's height for the
selected setting's description.
