# Porting notes: SimpleOS

What the React implementation does differently from what it reproduces, and how each difference
was verified. The comparison is against the release trailer, the release zip `20260915` and the
binary's own strings and symbols - there is no earlier mockup and no source code.

## What the source is

A compiled program. Nothing about the UI is readable as code, so the port rests on four kinds of
evidence, in this order of trust: the binary's strings (the exact labels), its symbol table (which
screens and drawing primitives exist), the splash bitmaps (exact pixels), and the trailer
(everything else, measured). Where the trailer and the binary disagree, the binary wins on content
and the trailer on appearance.

## Deviations

**The in-game menu has eight items, not the trailer's seven.** The trailer's build predates
CONTROLS; the release read here has it (`CHANGELOG.txt` 20260914, and `CUR_ITEMS` is eight
pointers). The eight are recentred on the same 56px pitch.

**The design-new top panels.** The trailer shows the RetroAchievements list with nothing on the
bottom panel but rows, and never shows the top panel of any settings screen. Every settings screen
here puts its title, the binary's line describing it, what the highlighted row does, any status,
and its legend on the top panel, on a shortened version of the home card with the legend on the
wash beneath it. The legends run to 38 characters - 608px at 2x - which does not fit the card.

**The left arrow.** The legends read `←→`, and the font table has `→` only. The rebuilt font
mirrors `→`.

**The dark edge on the menu labels** is drawn as a full outline one font pixel wide. The binary
draws it with `Draw_textShadow`; at the trailer's resolution the two cannot be told apart.

**`SAVED` and `LOADED`** sit at the head of the top panel until the next button. Where the binary
puts them and how long they stay are not visible anywhere.

**Controls are global here.** On the device they remap one title.

**Username and Password** show the binary's "Enter user and password" rather than opening the
on-screen keyboard.

**The library is twelve titles and two pages.** The trailer's grid shows three page dots but only
ever two pages; the titles on the third are unknown, so they are not invented and the dots follow
the data.

**The game switcher's panes** show the title under the menu. The trailer shows the other title's
own screens behind the shortened menu, which is what this does.

**The unlock banner is posed**, from the live build's panel or a still. Nothing a player can do in
a mockup earns an achievement.

## Not reproduced

- The on-screen keyboard, the timezone picker and the update progress screen.
- The marquee on long strings (`Draw_textMarquee`, `Draw_textScroll`): the trailer never shows it
  running, and every long title it shows is hard-cut.
- NIGHT brightness and its software veil.
- Touch beyond the boot splash. The device highlights a row on a first tap and confirms on a
  second.
- Real icons: the placeholders are generated. The initial on each is SimpleOS's own fallback
  (`draw_icon_or_letter`), not an invention.

## Faults found by looking

**Moving between two stills kept the first one's state.** The props only seed the reducer, and the
gallery changes the hash without remounting, so the boot still drew the home screen it had been
opened after. Each still is now keyed by its slug. Found in the first round of captures, where the
boot capture was the home screen.

**The X button archived the highlighted title.** It opens the archive. The binary has a screen for
it (`Ui_archive`, "Archived titles", `A  move      B  back`); titles go into the archive from the
in-game menu. Found reading the symbol table after the first build.

**The clock's legend ran off the card.** At 608px it is wider than the 570px card; the design-new
screens now set the legend on the wash under a shortened card.

**The compositing guard never looked at the bottom panel.** `elementsFromPoint` samples only the
viewport, and a two-panel device at native scale is taller than it, so every bottom-panel check
passed on an empty sample. Found because the new per-panel guard test, which injects the fault it
exists for, failed to see it. Each surface is now scrolled into view before it is sampled.

**The shoulders sat over the pad and the faces.** A flanking grip draws L and R as pills at its
top; on the clamshell's base that is where the pad and faces are. They are thin tabs on the base's
top edge now, which is where a DS's shoulders are.

## Verification

Every still was rendered and compared by eye against the trailer frame beside it in
`docs/themes/simpleos/reference/`; the unlock banner and a list were also compared at 1:1. The live
build was driven through boot, home, play, the menu, the switcher, LOAD on another title, HOME,
Options, Network and back, and This game, from the keyboard and by clicking the on-screen buttons.
